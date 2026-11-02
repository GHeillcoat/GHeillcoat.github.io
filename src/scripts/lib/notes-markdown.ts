/**
 * 批注的 Markdown 形态：单篇导出与全集导出共用同一套规矩。
 */

import { formatDateShort } from '../../lib/format';
import type { Note } from './notes-store';

/** 2025.10.12 14:20 */
export function formatStamp(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${formatDateShort(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 逐行加引用符号，空行写成单个 `>`，保持 Markdown 引用块连续 */
function blockquote(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => (line.trim() ? `> ${line}` : '>'))
    .join('\n');
}

export function noteBlock(note: Note): string {
  const quote = blockquote(note.text);
  const body = blockquote(`批注：${note.note || '（未写正文）'}`);
  return `${quote}\n>\n${body}\n> — ${formatStamp(note.createdAt)}`;
}

/** 当前文章的批注导出（`批注-{title}.md`） */
export function articleNotesMarkdown(title: string, notes: Note[]): string {
  const blocks = notes.map(noteBlock);
  return `${[`# 《${title}》的批注`, ...blocks].join('\n\n')}\n\n---\n`;
}

export interface ArchiveGroup {
  title: string;
  url: string;
  notes: Note[];
}

/** `/notes` 页的「导出全部」（`批注全集.md`） */
export function allNotesMarkdown(groups: ArchiveGroup[]): string {
  const total = groups.reduce((sum, group) => sum + group.notes.length, 0);
  const parts: string[] = [
    '# 批注全集',
    `> 共 ${total} 条批注 · ${groups.length} 篇文章`,
    `> 导出于 ${formatStamp(Date.now())}`,
    '---',
  ];
  for (const group of groups) {
    parts.push(
      `## 《${group.title}》`,
      `链接：${group.url}`,
      group.notes.map(noteBlock).join('\n\n'),
    );
  }
  return `${parts.join('\n\n')}\n`;
}
