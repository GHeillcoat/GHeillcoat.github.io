/**
 * 站点知识图谱的统一入口。
 *
 * 455 篇文章的图只算一次：Astro 构建时所有页面共享模块实例。
 * dev 下不缓存（改完内容刷新即可看到），prod 下缓存一次。
 */
import { getCollection } from 'astro:content';
import { buildGraph, type GraphData } from './graph';

let cache: GraphData | null = null;

export async function getSiteGraph(): Promise<GraphData> {
  if (!import.meta.env.DEV && cache) return cache;
  const entries = await getCollection('posts', (entry) => !entry.data.draft);
  const graph = buildGraph(entries);
  if (!import.meta.env.DEV) cache = graph;
  return graph;
}
