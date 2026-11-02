/**
 * 导入笔记（vault 集合）的知识图谱与反向链接。
 *
 * 447 篇笔记的图只算一次：Astro 构建时所有页面共享模块实例；
 * dev 下不缓存，改完内容刷新即可看到。
 */
import { getCollection } from 'astro:content';
import { buildGraph, type GraphData } from './graph';

export const vaultUrl = (id: string) => `/vault/${id.split('/').map(encodeURIComponent).join('/')}`;

let cache: GraphData | null = null;

export async function getVaultGraph(): Promise<GraphData> {
  if (!import.meta.env.DEV && cache) return cache;
  const entries = await getCollection('vault', (entry) => !entry.data.draft);
  const graph = buildGraph(entries, vaultUrl);
  if (!import.meta.env.DEV) cache = graph;
  return graph;
}
