import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * 元数据兼容层：
 *   Obsidian properties / Hexo frontmatter 都能直接写，站点内部统一归一成
 *   pubDate / updatedDate / tags / category 这一套字段。
 *
 *   日期：pubDate | date | created | created_at
 *   更新：updatedDate | updated | modified | lastmod
 *   标签：tags | tag（字符串或数组，逗号/顿号分隔也行）
 *   分类：category | categories
 *   草稿：draft: true 或 publish: false
 *   其他：aliases（双链别名）、cssclasses、permalink
 */
const listLike = z.union([z.string(), z.array(z.string())]);

function toList(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap((item) => toList(item));
  return String(value)
    .split(/[,，、]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function firstDate(...values: unknown[]): Date | undefined {
  for (const value of values) {
    if (value == null || value === '') continue;
    const date = value instanceof Date ? value : new Date(String(value));
    if (!Number.isNaN(date.valueOf())) return date;
  }
  return undefined;
}

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        /** Obsidian 别名：[[别名]] 也能链接到这篇 */
        aliases: z.array(z.string()).default([]),
        alias: listLike.optional(),
        subtitle: z.string().optional(),
        description: z.string().default(''),
        /** 日期：Hexo 用 date，Obsidian 常用 created */
        pubDate: z.coerce.date().optional(),
        date: z.coerce.date().optional(),
        created: z.coerce.date().optional(),
        created_at: z.coerce.date().optional(),
        updatedDate: z.coerce.date().optional(),
        updated: z.coerce.date().optional(),
        modified: z.coerce.date().optional(),
        lastmod: z.coerce.date().optional(),
        tags: listLike.default([]),
        tag: listLike.optional(),
        categories: listLike.optional(),
        category: z.string().optional(),
        /** 题图：可以是 /images/... 静态路径，也可以是相对文章导入的图片 */
        cover: z.union([z.string(), image()]).optional(),
        /** 首页精选 */
        featured: z.boolean().default(false),
        draft: z.boolean().default(false),
        /** Hexo 风格：publish: false 等同于草稿 */
        publish: z.boolean().optional(),
        /** Obsidian 的 cssclasses，目前只做透传 */
        cssclasses: listLike.default([]),
        permalink: z.string().optional(),
        /** 预计阅读时间的计算基数：true 表示按中文字数估算 */
        lang: z.enum(['zh', 'en']).default('zh'),
      })
      .transform((data) => {
        const published =
          firstDate(data.pubDate, data.date, data.created, data.created_at) ??
          new Date('1970-01-01T00:00:00Z');
        const updated = firstDate(data.updatedDate, data.updated, data.modified, data.lastmod);
        const tags = [...new Set([...toList(data.tags), ...toList(data.tag)])];
        const categories = [...toList(data.categories), ...(data.category ? [data.category] : [])];

        return {
          ...data,
          pubDate: published,
          updatedDate: updated,
          tags,
          category: data.category ?? categories[0] ?? '随笔',
          draft: data.draft || data.publish === false,
        };
      }),
});

export const collections = { posts };
