import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      description: z.string().default(''),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      category: z.string().default('随笔'),
      /** 题图：可以是 /images/... 静态路径，也可以是相对文章导入的图片 */
      cover: z.union([z.string(), image()]).optional(),
      /** 首页精选 */
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
      /** 预计阅读时间的计算基数：true 表示按中文字数估算 */
      lang: z.enum(['zh', 'en']).default('zh'),
    }),
});

export const collections = { posts };
