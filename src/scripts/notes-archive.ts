/**
 * `/notes` 批注页：所有批注按文章分组，支持单条定位/删除、全部导出与清空。
 * 数据同样只从 localStorage 读，分组标题等元信息取自 `data-post-map`（构建时注入）。
 */

import { download, qs, toast } from './lib/dom';
import {
  clearNotes,
  deleteNote,
  loadNotes,
  onNotesChange,
  type Note,
} from './lib/notes-store';
import { allNotesMarkdown, formatStamp, type ArchiveGroup } from './lib/notes-markdown';

interface PostMeta {
  title?: string;
  category?: string;
  date?: string;
  url?: string;
}

type PostMap = Record<string, PostMeta>;

/**
 * 批注里存的是构建时的绝对地址（`Astro.site`）。
 * 本地预览 / dev 下站点域名对不上，硬跳会跑到外网去，所以跨源时退化成同源的 pathname。
 */
function postHref(rawUrl: string): string {
  try {
    const target = new URL(rawUrl, window.location.origin);
    if (target.origin === window.location.origin) return target.href;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return rawUrl;
  }
}

function readPostMap(): PostMap {
  const script = qs<HTMLScriptElement>('script[data-post-map]');
  if (!script?.textContent) return {};
  try {
    const parsed: unknown = JSON.parse(script.textContent);
    return parsed && typeof parsed === 'object' ? (parsed as PostMap) : {};
  } catch {
    return {};
  }
}

interface LocalGroup extends ArchiveGroup {
  slug: string;
  meta: PostMeta;
}

function groupNotes(notes: Note[], postMap: PostMap): LocalGroup[] {
  const buckets = new Map<string, Note[]>();
  for (const note of notes) {
    const bucket = buckets.get(note.slug);
    if (bucket) bucket.push(note);
    else buckets.set(note.slug, [note]);
  }

  const groups: LocalGroup[] = [];
  for (const [slug, bucket] of buckets) {
    const meta = postMap[slug] ?? {};
    const sorted = [...bucket].sort((a, b) => a.createdAt - b.createdAt);
    groups.push({
      slug,
      meta,
      title: meta.title || sorted[0]?.title || slug,
      url: meta.url || sorted[0]?.url || `/posts/${slug}`,
      notes: sorted,
    });
  }

  const latest = (group: LocalGroup) =>
    group.notes.reduce((max, note) => Math.max(max, note.updatedAt || note.createdAt), 0);

  return groups.sort((a, b) => latest(b) - latest(a));
}

export function initNotesArchive(): void {
  const container = qs('[data-notes-archive]');
  if (!container) return;

  const postMap = readPostMap();
  const totalEl = qs('[data-notes-total]');
  const emptyEl = qs('[data-notes-archive-empty]');
  const exportAllBtn = qs<HTMLButtonElement>('[data-notes-export-all]');
  const clearBtn = qs<HTMLButtonElement>('[data-notes-clear]');

  const render = () => {
    const notes = loadNotes();
    const groups = groupNotes(notes, postMap);

    container.textContent = '';
    container.hidden = groups.length === 0;
    if (emptyEl) emptyEl.hidden = groups.length > 0;

    for (const group of groups) container.appendChild(buildGroup(group));

    const total = notes.length;
    if (totalEl) {
      totalEl.textContent =
        total === 0 ? '还没有批注' : `${total} 条批注 · ${groups.length} 篇文章`;
    }
    if (exportAllBtn) exportAllBtn.disabled = total === 0;
    if (clearBtn) clearBtn.disabled = total === 0;
  };

  const buildGroup = (group: LocalGroup): HTMLElement => {
    const section = document.createElement('section');
    section.className = 'notes-archive-group';

    const head = document.createElement('header');
    head.className = 'notes-archive-head';

    const link = document.createElement('a');
    link.className = 'notes-archive-title';
    link.href = group.url;
    link.textContent = `《${group.title}》`;

    const meta = document.createElement('div');
    meta.className = 'notes-archive-meta';
    const parts = [group.meta.category, group.meta.date, `${group.notes.length} 条`].filter(
      (part): part is string => !!part,
    );
    for (const part of parts) {
      const span = document.createElement('span');
      span.textContent = part;
      meta.appendChild(span);
    }

    head.append(link, meta);
    section.appendChild(head);

    const list = document.createElement('ul');
    list.className = 'notes-archive-list';
    list.setAttribute('role', 'list');

    for (const note of group.notes) {
      const item = document.createElement('li');
      item.className = 'notes-archive-item';
      item.dataset.noteId = note.id;

      const quote = document.createElement('p');
      quote.className = 'notes-archive-quote';
      quote.textContent = note.text;
      item.appendChild(quote);

      if (note.note) {
        const body = document.createElement('p');
        body.className = 'notes-archive-body';
        body.textContent = note.note;
        item.appendChild(body);
      }

      const foot = document.createElement('div');
      foot.className = 'notes-archive-foot';
      const time = document.createElement('span');
      time.textContent = formatStamp(note.createdAt);
      const jump = document.createElement('button');
      jump.type = 'button';
      jump.textContent = '定位';
      jump.setAttribute('data-note-jump', '');
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '删除';
      remove.setAttribute('data-note-delete', '');
      foot.append(time, jump, remove);
      item.appendChild(foot);

      list.appendChild(item);
    }

    section.appendChild(list);
    return section;
  };

  container.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    const item = target?.closest<HTMLElement>('[data-note-id]');
    const id = item?.dataset.noteId;
    if (!item || !id) return;

    const note = loadNotes().find((entry) => entry.id === id);
    if (!note) return;

    if (target?.closest('[data-note-delete]')) {
      const ok = window.confirm('删除这条批注？');
      if (!ok) return;
      deleteNote(id);
      render();
      toast('已删除');
      return;
    }

    if (target?.closest('[data-note-jump]')) {
      // 让文章页接管「定位」：跳过去后闪一下那条高亮
      try {
        sessionStorage.setItem('ink:notes:focus', id);
      } catch {
        /* 忽略 */
      }
      window.location.assign(postHref(note.url || `/posts/${note.slug}`));
    }
  });

  exportAllBtn?.addEventListener('click', () => {
    const notes = loadNotes();
    if (!notes.length) {
      toast('还没有批注');
      return;
    }
    const groups = groupNotes(notes, postMap);
    download('批注全集.md', allNotesMarkdown(groups));
    toast('已导出');
  });

  clearBtn?.addEventListener('click', () => {
    const notes = loadNotes();
    if (!notes.length) return;
    const ok = window.confirm(`清空全部 ${notes.length} 条批注？此操作不可撤销。`);
    if (!ok) return;
    clearNotes();
    render();
    toast('已清空');
  });

  onNotesChange(render);
  render();
}
