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
import { inkPaper, inkNight } from './src/lib/shiki-themes.mjs';

export default defineConfig({
  site: 'https://inkwell.example.com',
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
      remarkPlugins: [remarkGfm, remarkMath],
      rehypePlugins: [
        rehypeSlug,
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
              children: [{ type: 'text', value: '§' }],
            },
          },
        ],
      ],
    }),
  },
  integrations: [mdx(), sitemap()],
  vite: {
    build: { cssMinify: 'lightningcss' },
  },
});
