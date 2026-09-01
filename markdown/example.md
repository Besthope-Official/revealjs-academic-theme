---
title: theme demo
institute: 羽丘女子学园
author: Besthope
---

# 这是一页幻灯片

## 二级标题

### 三级标题

#### 四级标题

- 学术排版：左侧色块标题
- **加粗**、*斜体*、行内代码 `code`、~~删除~~、<u>下划线</u>
  - list item 1 very looooooooooooooooooooooooong 
    - nested

<!-- vslide -->

# 代码高亮

- night-owl theme
- copycode plugin, 右上角可复制 snippet

```c []
float Q_rsqrt(float number)
{
    long i;
    float x2, y;
    const float threehalfs = 1.5F;

    x2 = number * 0.5F;
    y = number;
    i = * ( long * ) &y;                       // evil floating point bit level hacking
    i = 0x5f3759df - (i >> 1);                 // what the fuck?
    y = * ( float * ) &i;
    y = y * (threehalfs - ( x2 * y * y ) );    // 1st iteration
    y = y * (threehalfs - ( x2 * y * y ) );    // 2nd iteration, this can be removed

    return y;
}
```

<!-- vslide -->

# 长代码块

```latex [9-12|34-37|44-45]
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% Welcome to Overleaf --- just edit your LaTeX on the left,
% and we'll compile it for you on the right. If you open the
% 'Share' menu, you can invite other users to edit at the same
% time. See www.overleaf.com/learn for more info. Enjoy!
%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\documentclass[17pt]{beamer}
\usepackage{tikz}
\usetheme{Madrid}
\usecolortheme{beaver}
\title[About Beamer] %optional
{Madrid theme + beaver}
\subtitle{Demonstrating larger fonts}
\author[Arthur, Doe] % (optional)
{A.~B.~Arthur\inst{1} \and J.~Doe\inst{2}}

\institute[VFU] % (optional)
{
  \inst{1}%
  Faculty of Physics\\
  Very Famous University
  \and
  \inst{2}%
  Faculty of Chemistry\\
  Very Famous University
}

\date[VLC 2021] % (optional)
{Very Large Conference, April 2021}

% Use a simple TikZ graphic to show where the logo is positioned
\logo{\begin{tikzpicture}
\filldraw[color=red!50, fill=red!25, very thick](0,0) circle (0.5);
\node[draw,color=white] at (0,0) {LOGO HERE};
\end{tikzpicture}}
\begin{document}
\frame{\titlepage}
%Highlighting text
\begin{frame}
\frametitle{Demonstrating large fonts}

In this slide, some important text will be
\alert{highlighted} because it's important.
Please, don't abuse it.

\begin{block}{Remark}
Sample text
\end{block}

\end{frame}
\end{document}
```

<!-- vslide -->

# 数学公式（KaTeX）

- reveal js 的 markdown plugin 利用 marked 解析 markdown，marked 对公式里的部分标签会同样转换成 md 语义的标签
  - 例如反斜杠转义：`\\` → `\`，`**` 会被解析成 `<em>` 等
  - 这会导致跨行公式无法显示
- 这是 marked 的预期语义，本 theme 实现了一个 extension 来解决这个问题

$$
\mathcal{M} = \left[
\begin{array}{c|c|c}
    \dfrac{\partial^2 \mathcal{L}}{\partial \theta_i \partial \theta_j} & \nabla_{\theta} \mathcal{L}(\theta) & \mathbf{0}_{n \times m} \\ \hline
    \mathbf{H}_{k+1} \left( \mathbf{I} - \mathbf{K}_{k} \mathbf{H}_{k} \right)^{-1} & \displaystyle \int_{0}^{\infty} e^{-\mathbf{A}t} \mathbf{B} \mathbf{B}^{\top} e^{-\mathbf{A}^{\top}t} dt & \boldsymbol{\Sigma}_{\eta} \\ \hline
    \left[ \begin{array}{cc} \alpha & \beta \\ \gamma & \delta \end{array} \right] & \mathbf{x}_{k|k-1}^{\top} \mathbf{P}^{-1} \mathbf{x}_{k|k-1} & \left\lVert \mathbf{r} \right\rVert_{\infty}
\end{array}
\right]
$$

<!-- vslide -->

# 表格

| 概念              | 说明           |
| ----------------- | -------------- |
| `<!-- slide -->`  | 水平翻页分隔符 |
| `<!-- vslide -->` | 垂直翻页分隔符 |
| `lec1.assets/`    | 本堂课图片目录 |

<!-- slide -->

# 图片

- 图片放在与本文件同名的 `example.assets/` 目录
  - theme 提供 VS Code 设置，在 md 文档内原生粘贴，自动存入该目录
- theme 实现的 auto-stretch 插件自适应 resize
- 独立成段的单图默认自动填满剩余空间
  - 外链图片同样生效，下面的图片原尺寸为 `240x240`

![random image](https://picsum.photos/seed/lec/240/240)

<!-- vslide -->

# 关闭单图拉伸

- 对于不期望拉伸放大的场景（例如小尺寸图片），可用 `nostretch` 的 class 标记
  - 只在压到 footer 时被缩小，fit-within
  - fit-within 不对 div block 应用，建议使用 reveal js 支持的 `<!-- .element -->`

![small image](https://picsum.photos/seed/small/240/240) <!-- .element: class="nostretch" -->

<!-- vslide -->

# 多图：并排

- 两张图写进同一段落即可并排
- 用 `<img>` 的 `width` 控制占比，合计留出间隙
- 多图页不做自动拉伸，仅按 80% 页高封顶

<img src="example.assets/placeholder-a.png" width="47%"> <img src="example.assets/placeholder-b.png" width="47%">

<!-- vslide -->

# 多图：竖排

各自独立成段，等比缩放、自动居中：

![placeholder A](example.assets/placeholder-a.png)

![placeholder B](example.assets/placeholder-b.png)

<!-- vslide -->

# 图文混排

- 行内小图随文字排版
- 显式 `height` 后不被当作独立图片处理

嵌入型 <img src="example.assets/placeholder-a.png" height="48"> 缩略图可直接嵌进句子中间

<!-- vslide -->

# 自定义布局

自定义 div 布局，例如绘制一个 2x2 的 grid:

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; justify-items: center;">
    <img src="example.assets/placeholder-a.png" style="width: 80%; margin: 0;">
    <img src="example.assets/placeholder-b.png" style="width: 80%; margin: 0;">
    <img src="example.assets/placeholder-b.png" style="width: 80%; margin: 0;">
    <img src="example.assets/placeholder-a.png" style="width: 80%; margin: 0;">
</div>

<!-- slide -->

# 目录与跳转

| 所在页面 | markdown        | dist 路由     |
| -------- | --------------- | ------------- |
| `/`      | `index.md`      | `/` 站点首页  |
| `/`      | `demo/index.md` | `/demo/`      |
| `/`      | `demo/lec1.md`  | `/demo/lec1/` |
| `/demo/` | `lec1.md`       | `/demo/lec1/` |
| `/demo/` | `../index.md`   | `/`           |

- 深跳到某页：追加 reveal 位置串 `#/横/竖`（0 起始，`slide` 计横页、`vslide` 计竖页）
  - 如 `../demo/lec1/#/2/1`
  - 如有动画，还可以再追加，表示是第几个 key frame

试一试：[go to another lec](../demo/)

<!-- slide -->

# 引用与提示

> 我是来亲手结束这个乐队的。

> reveal.js is an open source HTML presentation framework. It's a tool that enables anyone with a web browser to create fully-featured and beautiful presentations for free.
>
> Presentations made with reveal.js are built on open web technologies. That means anything you can do on the web, you can do in your presentation. Change styles with CSS, include an external web page using an `<iframe>` or add your own custom behavior using our JavaScript API.
