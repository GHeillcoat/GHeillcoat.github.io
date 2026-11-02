/**
 * 标签在 URL 里的形式。
 *
 * 笔记里会出现 `AI/Agent`、`基础 历史` 这类标签：直接塞进路由会多出一层路径，
 * 所以统一转成一段 slug（斜杠和空格换成连字符），页面上仍显示原始标签。
 * 中文保持原样，`#索引` 这类链接不变。
 */
export function tagSlug(tag: string): string {
  return String(tag)
    .trim()
    .replace(/[\\/]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[?#%'"<>|]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
