import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { unified } from '@astrojs/markdown-remark';
import { rehypeMermaid } from './src/lib/rehype-mermaid.mjs';
import { rehypeCallouts } from './src/lib/rehype-callouts.mjs';
import { rehypeWikiLinks } from './src/lib/rehype-wikilinks.mjs';
import { rehypeObsidianExtras } from './src/lib/rehype-obsidian.mjs';
import { remarkInlineFootnotes } from './src/lib/remark-inline-footnotes.mjs';
import { inkPaper, inkNight } from './src/lib/shiki-themes.mjs';

export default defineConfig({
  // GitHub Pages 用户站点（仓库名必须是 GHeillcoat.github.io）；本地/自定义域名可用 SITE_URL 覆盖
  site: process.env.SITE_URL ?? 'https://gheillcoat.github.io',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  markdown: {
    shikiConfig: {
      themes: { light: inkPaper, dark: inkNight },
      wrap: true,
      defaultColor: false,
    },
    processor: unified({
      gfm: true,
      smartypants: true,
      remarkPlugins: [remarkGfm, remarkMath, remarkInlineFootnotes],
      rehypePlugins: [
        rehypeSlug,
        rehypeCallouts,
        rehypeWikiLinks,
        rehypeMermaid,
        [
          rehypeKatex,
          {
            strict: false,
            trust: true,
            output: 'html',
            macros: {
              '\\RR': '\\mathbb{R}',
              '\\NN': '\\mathbb{N}',
              '\\ZZ': '\\mathbb{Z}',
              '\\dd': '\\mathrm{d}',
            },
          },
        ],
        [
          rehypeAutolinkHeadings,
          {
            behavior: 'append',
            properties: {
              className: ['heading-anchor'],
              ariaHidden: 'true',
              tabIndex: -1,
            },
            content: {
              type: 'element',
              tagName: 'span',
              properties: { className: ['anchor-mark'] },
              // 不写文本：避免 § 被 Astro 的标题提取带进 TOC，视觉上的 § 由 CSS ::after 提供
              children: [],
            },
          },
        ],
        rehypeObsidianExtras,
      ],
    }),
  },
  integrations: [mdx(), sitemap()],
  vite: {
    build: { cssMinify: 'lightningcss' },
    server: {
      // 截图、临时下载、编辑器临时目录不要触发 HMR（曾因 EBUSY 让 dev server 退出）
      watch: {
        ignored: ['**/.tmp/**', '**/.shots/**', '**/.chrome-profile/**', '**/.edge-profile/**', '**/*.tmpdir/**', '**/*.crdownload'],
      },
    },
  },
});

