# revealjs-academic-theme

[中文](/README.md) | English

## Introduction

An out-of-the-box reveal.js academic theme.

Features:

- **Academic theme**: LaTeX Beamer style title blocks, automatic footer, KaTeX formulas (enhanced parsing), adaptive image resizing, night-owl code highlighting
- **Simplified configuration**: a convention for producing and organizing content, with quick deployment to dist

## Quick Start

```bash
pnpm install       # install revealjs
pnpm dev           # go to http://localhost:4173/example to see a live demo
```

## Theme Configuration

Put the logo you want to display (e.g., your school emblem) under assets, with separate flat and normal styles; a transparent background is recommended.

## Frontmatter Configuration

Each md page can be individually configured with frontmatter to control its main title, institute, and author.

```yaml
title: theme demo
institute: 羽丘女子学园
author: Besthope
```

## Demo

[Live demo on Github Page](https://Besthope-Official.github.io/revealjs-academic-theme/example)

PPT title & auto-generated footer

![Title](./images/image.png)

Multi-level headings

![Multi-level headings](./images/image-1.png)

Code

![Code](./images/image-2.png)

Formulas

![Formula](./images/image-3.png)

Images

![Images](./images/image-4.png)
