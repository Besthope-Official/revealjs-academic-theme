# revealjs-academic-theme

## 介绍

开箱即用的 reveal.js 学术主题

特性:

- **学术主题**: LaTeX Beamer 风格标题块、自动页脚、KaTeX 公式、图片自适应尺寸、night-owl 代码高亮
- **简化配置**: 约定了一套内容生产与组织方式、快速产出 dist 部署

## 快速开始

```bash
pnpm install       # install revealjs
pnpm dev           # http://localhost:4173
```

## 内容组织

```
markdown/
├── index.md
├── os/
│   ├── index.md
│   ├── lec1.md
│   └── lec1.assets/
└── ...
```

### Front-matter

```yml
---
title: 你的标题        # 必填：标题页 / 页脚 / <title>
author: 你的名字       # 可选：页脚右侧
---
```

### 分页

```markdown
<!-- slide -->    水平翻页
<!-- vslide -->   垂直翻页（同级内容下钻）
```

### 图片

图片放在与 md 文件同名的 `.assets/` 目录（仓库自带的 `.vscode/settings.json` 已配置 VS Code 原生粘贴：在 md 里直接 Ctrl+V 截图或拖入图片，会自动存入该目录并插入相对链接）。无需手动指定尺寸：

- 一页只有一张独立成段的图片时，自动等比缩放至填满剩余空间（自动居中）
- 一页多图、图文混排等情况下自动封顶不溢出，默认居中
- 不希望某页/某图被拉伸时，给对应 `section` 或 `img` 加 `nostretch` class；markdown 里推荐用 div 包裹（div 与内容之间需空行分隔）：

```markdown
<div class="nostretch">

![描述](xxx.assets/pic.png)

</div>
```

## 演示

PPT 标题 & 自动生成脚注

![标题](./images/image.png)

多级标题

![多级标题](./images/image-1.png)

正文效果

![正文效果](./images/image-2.png)
