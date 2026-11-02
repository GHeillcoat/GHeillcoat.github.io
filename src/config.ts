/**
 * 站点配置：标题、导航、作者信息都在这里改。
 */
export const site = {
  title: '墨痕',
  latin: 'inkwell',
  tagline: '字里行间，墨迹未干',
  description: '一座古典淡雅的私人书房：读书札记、技术随笔与随手写下的想法，支持 LaTeX、Mermaid 与完整的 Markdown。',
  author: {
    name: '墨痕',
    bio: '读书，写字，偶尔写一点代码。',
  },
  nav: [
    { label: '文章', href: '/posts', key: 'posts' },
    { label: '图谱', href: '/graph', key: 'graph' },
    { label: '归档', href: '/archive', key: 'archive' },
    { label: '标签', href: '/tags', key: 'tags' },
    { label: '批注', href: '/notes', key: 'notes' },
    { label: '关于', href: '/about', key: 'about' },
  ],
  /** 页脚站点地图 */
  footerLinks: [
    { label: '图谱', href: '/graph' },
    { label: '归档', href: '/archive' },
    { label: '标签', href: '/tags' },
    { label: '批注', href: '/notes' },
    { label: '关于', href: '/about' },
  ],
  locale: 'zh-CN',
  /** 每页文章数 */
  pageSize: 8,
};

export type NavItem = (typeof site.nav)[number];
