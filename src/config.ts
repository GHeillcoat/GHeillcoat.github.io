/**
 * 站点配置：标题、导航、作者信息都在这里改。
 */
export const site = {
  /** 网名 / 站名 */
  title: 'Auntilz',
  /** 中文小字（印章旁的落款） */
  latin: '墨痕',
  /** 印章里的字：一个字母或汉字都行 */
  seal: 'A',
  /** 名字的递归解释：Auntilz → Until No Task Is Left Zero */
  motto: 'Until No Task Is Left Zero',
  tagline: '从 A 到 Z，直到没有一件事被剩下',
  description:
    'Auntilz 的私人书房：读书札记、技术随笔与随手写下的想法，支持 Obsidian 双链、LaTeX、Mermaid 与完整的 Markdown。',
  author: {
    name: 'Auntilz',
    bio: '读书，写字，偶尔写一点代码。',
    github: 'https://github.com/GHeillcoat',
    githubName: 'GHeillcoat',
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


