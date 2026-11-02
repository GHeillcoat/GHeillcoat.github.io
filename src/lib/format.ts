const DIGITS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

/** 2025 -> 二〇二五 */
export function chineseYear(year: number): string {
  return String(year)
    .split('')
    .map((d) => DIGITS[Number(d)])
    .join('');
}

/** 1..12 -> 一月 ... 十二月 */
export function chineseMonth(month: number): string {
  const table = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
  return `${table[month] ?? month}月`;
}

/** 1..31 -> 一日 ... 三十一日（二十/三十 用 廿/卅 更古雅） */
export function chineseDay(day: number): string {
  if (day <= 10) return `${DIGITS[day]}日`;
  if (day < 20) return `十${DIGITS[day % 10]}日`;
  if (day === 20) return '廿日';
  if (day === 30) return '卅日';
  if (day < 30) return `廿${DIGITS[day % 10]}日`;
  return `三十${DIGITS[day % 10]}日`;
}

/** 二〇二五年十月二十三日 */
export function formatDateZh(date: Date): string {
  return `${chineseYear(date.getFullYear())}年${chineseMonth(date.getMonth() + 1)}${chineseDay(date.getDate())}`;
}

/** 2025.10.23 */
export function formatDateShort(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

export function isoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 字数：中文按字计，西文按词计 */
export function countWords(text: string): number {
  const plain = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .trim();
  const cjk = (plain.match(/[\u3400-\u9fff\u3040-\u30ff]/g) || []).length;
  const latin = (plain.replace(/[\u3400-\u9fff\u3040-\u30ff]/g, ' ').match(/[A-Za-z0-9][A-Za-z0-9'’\-]*/g) || [])
    .length;
  return cjk + latin;
}

/** 阅读时长（分钟） */
export function readingTime(text: string, lang: 'zh' | 'en' = 'zh'): number {
  const words = countWords(text);
  const perMinute = lang === 'zh' ? 320 : 220;
  return Math.max(1, Math.round(words / perMinute));
}

/** 「10 分钟」这样的单行文案 */
export function readingLabel(text: string, lang: 'zh' | 'en' = 'zh'): string {
  return `约 ${readingTime(text, lang)} 分钟`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/**
 * 从正文里取摘要：
 * - 支持 Hexo 的 `<!-- more -->` 截断标记；
 * - 去掉代码块、图片、双链语法、HTML 标签，尽量得到干净的纯文本。
 */
export function excerptFromBody(body: string | undefined, length = 120): string {
  if (!body) return '';
  const moreIndex = body.indexOf('<!-- more -->');
  const raw = moreIndex >= 0 ? body.slice(0, moreIndex) : body;
  return raw
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!?\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]/g, (_m, target, alias) => alias || target)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*`~$_{}[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, length);
}

/** #ff0000 -> rgba */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

/** 稳定短哈希，用于批注 id */
export function shortHash(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
