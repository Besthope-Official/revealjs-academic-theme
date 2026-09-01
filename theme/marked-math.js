/**
 * marked extensions that shield math from the markdown lexer.
 *
 * Why: reveal.js renders markdown with marked, then hands the DOM to KaTeX
 * auto-render. marked mangles math before KaTeX ever sees it:
 *   - `\\` row separators collapse to `\` (backslash-escape rule)
 *   - blank lines inside `$$ ... $$` split the block into multiple <p>,
 *     so auto-render can no longer pair the delimiters
 *   - `\[` / `\(` delimiters collapse to `[` / `(`
 *
 * These tokenizers capture math spans verbatim and re-emit them as single
 * escaped text nodes (delimiters intact), so RevealMath.KaTeX auto-render
 * picks them up untouched.
 *
 * Wired in via Reveal config:
 *   Reveal.initialize({ markdown: { extensions: window.RevealMarkedMath } })
 */
(function (global) {
    'use strict';

    var escapeHtml = function (s) {
        return s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    };

    // Redundant inner delimiters (e.g. `$$ \[ ... \] $$` pasted from
    // LaTeX-flavored sources) are stripped so KaTeX never sees them.
    var stripInnerDelims = function (text) {
        var t = text.replace(/^\s+|\s+$/g, '');
        if (t.slice(0, 2) === '\\[' && t.slice(-2) === '\\]') return t.slice(2, -2);
        if (t.slice(0, 2) === '\\(' && t.slice(-2) === '\\)') return t.slice(2, -2);
        return text;
    };

    // Own element => one clean text node for auto-render; class is a CSS hook.
    // `$`/`$$` are re-emitted so auto-render stays the render stage (KaTeX is
    // loaded from CDN and is not yet available when marked parses).
    var render = function (token, blockLevel) {
        var d = token.display ? '$$' : '$';
        var tag = token.display && blockLevel ? 'div' : 'span';
        return '<' + tag + ' class="math-' + (token.display ? 'block' : 'inline') + '">'
            + d + escapeHtml(stripInnerDelims(token.text)) + d + '</' + tag + '>';
    };

    var atLineStart = /^ {0,3}(\$\$|\\\[)/m;

    /**
     * Block-level `$$ ... $$` and `\[ ... \]`, possibly spanning many lines
     * (blank lines allowed). Only opened at the start of a line (up to 3
     * spaces of indentation) and closed where the delimiter ends its line,
     * so trailing prose and later paragraphs are never swallowed:
     *
     *   $$
     *   \begin{aligned}
     *   a &= b \\
     *   c &= d
     *   \end{aligned}
     *   $$
     */
    var mathBlock = {
        name: 'mathBlock',
        level: 'block',
        start: function (src) {
            var m = atLineStart.exec(src);
            return m ? m.index + m[0].length - m[1].length : undefined;
        },
        tokenizer: function (src) {
            var open = src.slice(0, 2) === '$$' ? '$$' : src.slice(0, 2) === '\\[' ? '\\[' : null;
            if (!open) return;
            var close = open === '$$' ? '$$' : '\\]';
            var closeLen = close.length;
            // earliest closing delimiter that sits at end of its line
            var from = open.length, idx;
            while ((idx = src.indexOf(close, from)) !== -1) {
                if (/^[ \t]*(\n|$)/.test(src.slice(idx + closeLen))) {
                    return {
                        type: 'mathBlock',
                        raw: src.slice(0, idx + closeLen),
                        text: src.slice(open.length, idx).replace(/^\n+|\n+$/g, ''),
                        display: true
                    };
                }
                from = idx + closeLen;
            }
        },
        renderer: function (token) { return render(token, true); }
    };

    /**
     * Inline `$ ... $`, `$$ ... $$` and `\( ... \)` within a paragraph.
     * `$$` is tried first so display math is not misread as two `$` pairs;
     * the multi-line `[\s\S]` variants also rescue `$$` / `\(...\)` math
     * that opens mid-paragraph, where block tokenizers never fire.
     *
     * After a closing `$`/`$$`, whitespace, punctuation (incl. CJK) or
     * end-of-line is required — heuristic adopted from
     * marked-katex-extension; rejects prose like `$5 与 $10` / `$x$得证`.
     */
    var mathInline = {
        name: 'mathInline',
        level: 'inline',
        start: function (src) {
            var best = -1;
            [src.indexOf('$$'), src.indexOf('$'), src.indexOf('\\(')].forEach(function (n) {
                if (n !== -1 && (best === -1 || n < best)) best = n;
            });
            return best;
        },
        tokenizer: function (src) {
            var m =
                /^\$\$([\s\S]+?)\$\$(?=[\s?!.,:？！。，：]|$)/.exec(src) ||
                /^\\\(([\s\S]+?)\\\)/.exec(src) ||
                /^\$((?:\\.|[^\n\\$])+?)\$(?=[\s?!.,:？！。，：]|$)/.exec(src);
            if (m && m[1].trim()) {
                return {
                    type: 'mathInline',
                    raw: m[0],
                    text: m[1],
                    display: m[0].slice(0, 2) === '$$'
                };
            }
        },
        renderer: function (token) { return render(token, false); }
    };

    global.RevealMarkedMath = [mathBlock, mathInline];
})(typeof window !== 'undefined' ? window : globalThis);
