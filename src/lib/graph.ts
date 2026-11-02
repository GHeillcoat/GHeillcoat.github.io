/**
 * 知识图谱数据（构建期生成）。
 *
 * 节点 = 文章，边 = 正文里的 [[双链]]。
 * 同时给出反向链接 / 出链，供文章页的「关联」区块使用。
 * 只在构建期运行（页面 frontmatter），不会进浏览器 bundle。
 */
import type { CollectionEntry } from 'astro:content';
import { resolveTargets } from './vault.mjs';

export interface GraphNode {
  id: string;
  title: string;
  category: string;
  tags: string[];
  url: string;
  excerpt: string;
  degree: number;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  backlinks: Record<string, string[]>;
  outlinks: Record<string, string[]>;
}

type Post = CollectionEntry<'posts'>;

function excerptOf(post: Post): string {
  const description = post.data.description?.trim();
  if (description) return description.slice(0, 80);
  const body = (post.body ?? '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!?\[\[[^\]]+\]\]/g, '')
    .replace(/[#>*`~$_{}[\]()!]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return body.slice(0, 80);
}

export function buildGraph(posts: Post[]): GraphData {
  const sorted = [...posts].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
  const nodes: GraphNode[] = sorted.map((post) => ({
    id: post.id,
    title: post.data.title,
    category: post.data.category,
    tags: post.data.tags,
    url: `/posts/${post.id}`,
    excerpt: excerptOf(post),
    degree: 0,
  }));

  const ids = new Set(nodes.map((node) => node.id));
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  const backlinks: Record<string, string[]> = {};
  const outlinks: Record<string, string[]> = {};

  for (const post of sorted) {
    const targets = resolveTargets(post.body ?? '').filter((id) => id !== post.id && ids.has(id));
    outlinks[post.id] = targets;
    for (const target of targets) {
      const key = `${post.id}→${target}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ source: post.id, target });
      (backlinks[target] ??= []).push(post.id);
    }
  }

  const degree = new Map<string, number>();
  for (const edge of edges) {
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
  }
  for (const node of nodes) {
    node.degree = degree.get(node.id) ?? 0;
    backlinks[node.id] ??= [];
    outlinks[node.id] ??= [];
  }

  return { nodes, edges, backlinks, outlinks };
}

/** 以某篇文章为中心的子图（一跳邻居） */
export function localGraph(graph: GraphData, id: string): GraphData {
  const ids = new Set<string>([id]);
  for (const edge of graph.edges) {
    if (edge.source === id) ids.add(edge.target);
    if (edge.target === id) ids.add(edge.source);
  }
  const nodes = graph.nodes.filter((node) => ids.has(node.id));
  const edges = graph.edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target));
  const backlinks: Record<string, string[]> = {};
  const outlinks: Record<string, string[]> = {};
  for (const node of nodes) {
    backlinks[node.id] = (graph.backlinks[node.id] ?? []).filter((from) => ids.has(from));
    outlinks[node.id] = (graph.outlinks[node.id] ?? []).filter((to) => ids.has(to));
  }
  return { nodes, edges, backlinks, outlinks };
}

export function relationNodes(graph: GraphData, id: string): { backlinks: GraphNode[]; outlinks: GraphNode[] } {
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const pick = (list: string[]) => list.map((item) => byId.get(item)).filter((node): node is GraphNode => Boolean(node));
  return {
    backlinks: pick(graph.backlinks[id] ?? []),
    outlinks: pick(graph.outlinks[id] ?? []),
  };
}
