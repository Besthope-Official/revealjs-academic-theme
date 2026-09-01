/*!
 * fit-images — auto-stretch for reveal.js decks
 *
 * Quarto-style `auto-stretch`: when a slide contains exactly one image,
 * it is promoted to a direct child of the section and given the `r-stretch`
 * class, so reveal.js core scales it into the remaining slide space with
 * the aspect ratio preserved (see `layoutSlideContents` in reveal.js).
 *
 * Skipped when:
 *   - the slide or the image has the `nostretch` class (opt-out)
 *   - the slide has more than one image (multi-image pages use the CSS cap
 *     plus the footer-aware `capToFooter` shrink pass below)
 *   - the image is inline among text, wrapped in a link or a fragment,
 *     or already has an explicit height / stretch class
 *
 * Must be registered AFTER RevealMarkdown: core initializes plugins
 * serially and awaits each init promise, so by the time this runs all
 * slides are converted from markdown.
 *
 * Pass 2 (`capToFooter`): the per-image CSS cap is footer-blind and
 * sibling-blind — two stacked images each under the cap still overflow
 * into the global footer. After core's layout, every markdown-structure
 * image is measured against the footer's top edge and the overflow is
 * shrunk away with one uniform factor across the slide's images.
 */
(function (global) {
	'use strict';

	var STRETCH = 'r-stretch';
	var OPT_OUT = 'nostretch';

	function hasStretchClass(el) {
		return el.classList.contains(STRETCH) || el.classList.contains('stretch');
	}

	// Images inside fragments/links/nested opt-out wrappers must keep their size
	function hasSpecialAncestor(image, slide) {
		var el = image.parentElement;
		while (el && el !== slide) {
			if (el.classList.contains('fragment') ||
				el.classList.contains(OPT_OUT) ||
				el.tagName === 'A') {
				return true;
			}
			el = el.parentElement;
		}
		return false;
	}

	function autoStretch(slide) {
		if (slide.classList.contains(OPT_OUT)) return;

		// Speaker notes must not count towards the image budget
		var images = Array.prototype.filter.call(
			slide.querySelectorAll('img'),
			function (img) { return !img.closest('aside'); }
		);
		if (images.length !== 1) return;
		var image = images[0];

		if (image.classList.contains(OPT_OUT) || hasStretchClass(image)) return;
		if (image.hasAttribute('height')) return;
		if (/height\s*:/.test(image.getAttribute('style') || '')) return;
		if (hasSpecialAncestor(image, slide)) return;

		// Top-level element (direct child of the slide) holding the image.
		// Only stretch known markdown structures; raw custom HTML stays as-is.
		var top = image;
		while (top.parentElement && top.parentElement !== slide) top = top.parentElement;
		if (top !== image && top.tagName !== 'P' && top.tagName !== 'FIGURE') return;
		// Inline image mixed with text — leave it alone
		if (top.tagName === 'P' && top.childNodes.length > 1) return;

		image.classList.add(STRETCH);

		// Unwrap: core sizes `section > .r-stretch` direct children only
		if (top !== image) {
			slide.insertBefore(image, top);
			if (!top.textContent.trim()) top.remove();
		}
		// Late-loading images are re-fitted by the global capture-phase
		// load listener registered in init().
	}

	/*
	 * CSS `:only-child` counts only elements, so a paragraph mixing
	 * an image with surrounding text would also match slides.css's 
	 * standalone-image rules and drop its left padding. Tag the real 
	 * image-only paragraphs here; the CSS targets the class.
	 */
	function tagImageOnly(slide) {
		Array.prototype.forEach.call(slide.querySelectorAll('p'), function (p) {
			var img = p.querySelector('img');
			if (!img || p.textContent.trim()) return;
			if (img.parentElement !== p || p.children.length !== 1) return;
			p.classList.add('image-only');
		});
	}

	/*
	 * Core sizes .r-stretch against the full slide height, but the global
	 * footer overlays the bottom of the slide — a stretched image would
	 * end up underneath it. Core's layout runs first (ready/resize), this
	 * second pass shrinks any stretched image that crosses the footer's
	 * top edge, preserving the aspect ratio.
	 */
	function refitAboveFooter() {
		var footer = global.document.querySelector('.footer-container');
		var footerH = footer ? footer.offsetHeight : 0;
		if (!footerH) return;

		var slideH = reveal.getConfig().height;
		var limit = slideH - footerH;

		reveal.getSlides().forEach(function (slide) {
			var img = slide.querySelector(':scope > img.r-stretch');
			if (!img) return;

			var h = parseFloat(img.style.height);
			if (!h) return; // not sized yet — the load handler fits it later

			var overflow = img.offsetTop + h - limit;
			if (overflow <= 0.5) return; // clear of the footer already

			var factor = (h - overflow) / h;
			img.style.width = (parseFloat(img.style.width) * factor) + 'px';
			img.style.height = (h - overflow) + 'px';
		});
	}

	/*
	 * Markdown-structure images eligible for the footer cap: everything
	 * the markdown plugin generated itself (loose <p>/<figure> wrappers),
	 * minus explicit author sizes and already-stretched images. Custom
	 * HTML wrappers (div, li, …) keep their own layout.
	 */
	function cappableImages(slide) {
		return Array.prototype.filter.call(
			slide.querySelectorAll('img'),
			function (img) {
				if (img.closest('aside')) return false;
				if (img.classList.contains(STRETCH)) return false;
				if (img.hasAttribute('height')) return false;
				if (/height\s*:/.test(img.getAttribute('style') || '')) return false;
				var top = img;
				while (top.parentElement && top.parentElement !== slide) top = top.parentElement;
				return top.tagName === 'P' || top.tagName === 'FIGURE';
			}
		);
	}

	/*
	 * Second pass for non-stretched images: the per-image CSS cap (80% of
	 * slide height) ignores siblings, so stacked multi-image pages still
	 * overflow into the global footer. Measure against the footer's top
	 * edge and remove the overflow by shrinking every eligible image with
	 * one uniform factor, keeping them visually consistent.
	 */
	var CAPPED = 'data-fit-capped';
	var MIN_FACTOR = 0.2; // floor — remaining overflow is the author's problem

	function capToFooter() {
		var footer = global.document.querySelector('.footer-container');
		var footerH = footer ? footer.offsetHeight : 0;
		if (!footerH) return;
		var limit = reveal.getConfig().height - footerH;

		reveal.getSlides().forEach(function (slide) {
			var images = cappableImages(slide);
			if (!images.length) return;

			// Drop the previous pass' inline sizes so measurements are fresh
			images.forEach(function (img) {
				if (img.hasAttribute(CAPPED)) {
					img.style.width = '';
					img.style.height = '';
					img.removeAttribute(CAPPED);
				}
			});

			var slideRect = slide.getBoundingClientRect();
			var scale = slideRect.width / (reveal.getConfig().width || 1);
			if (!scale) return; // slide not rendered (hidden) yet

			// rect → deck coordinates (960x720 canvas); layout values are
			// unaffected by the presentation-level scale transform
			function measure(img) {
				var r = img.getBoundingClientRect();
				return {
					bottom: (r.bottom - slideRect.top) / scale,
					w: r.width / scale,
					h: r.height / scale
				};
			}

			var metrics = images.map(measure);

			var excess = 0;
			metrics.forEach(function (m) { excess = Math.max(excess, m.bottom - limit); });
			if (excess <= 0.5) return;

			var totalH = 0;
			metrics.forEach(function (m) { totalH += m.h; });
			if (!totalH) return;

			var factor = Math.max(MIN_FACTOR, 1 - excess / totalH);
			images.forEach(function (img, i) {
				img.style.width = (metrics[i].w * factor) + 'px';
				img.style.height = (metrics[i].h * factor) + 'px';
				img.setAttribute(CAPPED, '');
			});
		});
	}

	var reveal = null;

	var Plugin = {
		id: 'fit-images',
		init: function (revealInstance) {
			reveal = revealInstance;
			reveal.getSlides().forEach(autoStretch);
			reveal.getSlides().forEach(tagImageOnly);
			// Re-fit after core has sized the images (ready), after every
			// window resize where core re-runs its own (footer-blind) math,
			// and whenever another slide becomes visible (hidden slides
			// measure as zero-size).
			var refitAll = function () {
				reveal.layout();
				refitAboveFooter();
				capToFooter();
			};
			reveal.on('ready', refitAll);
			reveal.on('resize', refitAll);
			reveal.on('slidechanged', refitAll);
			// Late-loading images invalidate both passes. Resource load
			// events don't bubble, hence capture phase on document.
			global.document.addEventListener('load', function (event) {
				if (event.target && event.target.tagName === 'IMG') refitAll();
			}, true);
		}
	};

	global.RevealFitImages = Plugin;
})(typeof window !== 'undefined' ? window : this);
