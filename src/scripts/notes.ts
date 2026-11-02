/**
 * 批注系统（文章页）。
 *
 * 一条链：划词工具条 → 编辑器 → localStorage → 正文高亮 → 右侧面板 → 单篇导出。
 * 所有用户文本都用 textContent 写入；高亮定位用「前后文 + 原文」在正文的纯文本索引里找，
 * 找不到就退化成首次出现，再找不到就只留面板（原文可能已被改写）。
 */

import {
  clamp,
  copyText,
  download,
  normalizeSpace,
  prefersReducedMotion,
  qs,
  qsa,
  safeFilename,
  toast,
} from './lib/dom';
import { registerOverlay } from './lib/overlay';
import { onScroll } from './lib/scroll';
import {
  addNote,
  deleteNote,
  findNote,
  notesForSlug,
  onNotesChange,
  updateNote,
  type Note,
} from './lib/notes-store';
import { articleNotesMarkdown, formatStamp } from './lib/notes-markdown';

/** 允许被 <mark> 包裹的块级容器：跨块选区会按块拆成多个高亮，避免把 <p> 塞进行内元素 */
const BLOCK_SELECTOR =
  'p, li, blockquote, td, th, dt, dd, h1, h2, h3, h4, h5, h6, figcaption, pre, div';

/** 不参与高亮包裹的区域 */
const SKIP_SELECTOR =
  'pre, code, a, mark, script, style, .mermaid-block, .katex, svg, .heading-anchor';

interface PageContext {
  slug: string;
  title: string;
  url: string;
}

interface SelectionContext {
  text: string;
  prefix: string;
  suffix: string;
  rect: DOMRect;
}

interface CharSpan {
  node: Text;
  start: number;
  end: number;
  locked: boolean;
}

interface TextIndex {
  text: string;
  spans: CharSpan[];
}

let page: PageContext | null = null;
let prose: HTMLElement | null = null;

let toolbar: HTMLElement | null = null;
let editor: HTMLElement | null = null;
let editorQuote: HTMLElement | null = null;
let editorInput: HTMLTextAreaElement | null = null;
let editorDelete: HTMLButtonElement | null = null;

let panelList: HTMLElement | null = null;
let countEl: HTMLElement | null = null;
let countInlineEl: HTMLElement | null = null;
let badgeEl: HTMLElement | null = null;
let emptyEl: HTMLElement | null = null;
let exportBtn: HTMLElement | null = null;

let selectionCtx: SelectionContext | null = null;
let editorMode: 'create' | 'edit' = 'create';
let editingId: string | null = null;
let activeId: string | null = null;
let syncQueued = false;

/* — 选区 ————————————————————————————————— */

function contextBefore(range: Range, root: HTMLElement, length = 24): string {
  try {
    const before = document.createRange();
    before.setStart(root, 0);
    before.setEnd(range.startContainer, range.startOffset);
    return before.toString().replace(/\s+/g, ' ').slice(-length);
  } catch {
    return '';
  }
}

function contextAfter(range: Range, root: HTMLElement, length = 24): string {
  try {
    const after = document.createRange();
    after.setStart(range.endContainer, range.endOffset);
    after.setEnd(root, root.childNodes.length);
    return after.toString().replace(/\s+/g, ' ').slice(0, length);
  } catch {
    return '';
  }
}

function selectionRect(range: Range): DOMRect {
  const rects = Array.from(range.getClientRects()).filter(
    (rect) => rect.width > 0 || rect.height > 0,
  );
  const first = rects[0];
  if (first) return new DOMRect(first.left, first.top, first.width, first.height);
  return range.getBoundingClientRect();
}

function readSelection(): SelectionContext | null {
  if (!prose) return null;
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!prose.contains(range.commonAncestorContainer)) return null;
  const text = normalizeSpace(selection.toString());
  if (text.length < 2) return null;
  return {
    text,
    prefix: contextBefore(range, prose),
    suffix: contextAfter(range, prose),
    rect: selectionRect(range),
  };
}

function hideToolbar(): void {
  if (toolbar && !toolbar.hidden) toolbar.hidden = true;
}

function clearSelection(): void {
  const selection = window.getSelection();
  if (selection && !selection.isCollapsed) selection.removeAllRanges();
  hideToolbar();
}

function showToolbar(rect: DOMRect): void {
  if (!toolbar) return;
  toolbar.hidden = false;
  const width = toolbar.offsetWidth;
  const height = toolbar.offsetHeight;
  const margin = 10;
  const left = clamp(
    rect.left + rect.width / 2 - width / 2,
    margin,
    Math.max(margin, window.innerWidth - width - margin),
  );
  let top = rect.top - height - 10;
  if (top < margin) top = Math.min(rect.bottom + 10, window.innerHeight - height - margin);
  toolbar.style.left = `${Math.round(left)}px`;
  toolbar.style.top = `${Math.round(Math.max(margin, top))}px`;
}

function syncToolbar(): void {
  if (editor && !editor.hidden) {
    hideToolbar();
    return;
  }
  const found = readSelection();
  if (!found) {
    hideToolbar();
    return;
  }
  selectionCtx = found;
  showToolbar(found.rect);
}

/* — 编辑器 ——————————————————————————————— */

function isEditorOpen(): boolean {
  return !!editor && !editor.hidden;
}

function positionEditor(anchor: DOMRect | null): void {
  if (!editor) return;
  const width = editor.offsetWidth;
  const height = editor.offsetHeight;
  const margin = 12;
  const viewWidth = window.innerWidth;
  const viewHeight = window.innerHeight;

  let left: number;
  let top: number;
  if (anchor) {
    left = anchor.left + anchor.width / 2 - width / 2;
    top = anchor.bottom + 10;
    if (top + height > viewHeight - margin) top = Math.max(margin, anchor.top - height - 10);
  } else {
    left = (viewWidth - width) / 2;
    top = (viewHeight - height) / 2;
  }
  left = clamp(left, margin, Math.max(margin, viewWidth - width - margin));
  top = clamp(top, margin, Math.max(margin, viewHeight - height - margin));
  editor.style.left = `${Math.round(left)}px`;
  editor.style.top = `${Math.round(top)}px`;
}

function openEditorForCreate(context: SelectionContext): void {
  if (!editor || !editorInput || !editorQuote) return;
  editorMode = 'create';
  editingId = null;
  editorQuote.textContent = context.text;
  editorInput.value = '';
  if (editorDelete) editorDelete.hidden = true;
  editor.hidden = false;
  positionEditor(context.rect);
  editorInput.focus({ preventScroll: true });
  hideToolbar();
}

function openEditorForNote(id: string, anchor?: DOMRect | null): void {
  if (!editor || !editorInput || !editorQuote) return;
  const note = findNote(id);
  if (!note) return;
  editorMode = 'edit';
  editingId = note.id;
  editorQuote.textContent = note.text;
  editorInput.value = note.note;
  if (editorDelete) editorDelete.hidden = false;
  editor.hidden = false;
  positionEditor(anchor ?? null);
  editorInput.focus({ preventScroll: true });
  try {
    const end = editorInput.value.length;
    editorInput.setSelectionRange(end, end);
  } catch {
    /* 忽略 */
  }
  hideToolbar();
  setActive(note.id, true);
}

function closeEditor(): void {
  if (!editor) return;
  editor.hidden = true;
  editorMode = 'create';
  editingId = null;
  if (editorInput) editorInput.value = '';
  if (editorDelete) editorDelete.hidden = true;
}

function saveEditor(): void {
  if (!page) return;
  const value = (editorInput?.value ?? '').trim();

  if (editorMode === 'edit' && editingId) {
    const id = editingId;
    updateNote(id, { note: value, updatedAt: Date.now() });
    closeEditor();
    clearSelection();
    renderHighlights();
    renderPanel();
    setActive(id, true);
    toast('已更新');
    return;
  }

  const context = selectionCtx;
  if (!context) {
    closeEditor();
    return;
  }
  const created = addNote({
    slug: page.slug,
    title: page.title,
    url: page.url,
    text: context.text,
    note: value,
    prefix: context.prefix,
    suffix: context.suffix,
  });
  closeEditor();
  clearSelection();
  selectionCtx = null;
  if (!created) {
    toast('未能保存，浏览器存储不可用');
    return;
  }
  renderHighlights();
  renderPanel();
  setActive(created.id, true);
  toast('已记下');
}

function truncate(text: string, length: number): string {
  const flat = normalizeSpace(text);
  return flat.length > length ? `${flat.slice(0, length)}…` : flat;
}

function removeNoteById(id: string, ask = true): void {
  const note = findNote(id);
  if (!note) return;
  if (ask) {
    const ok = window.confirm(`删除这条批注？\n\n「${truncate(note.text, 40)}」`);
    if (!ok) return;
  }
  deleteNote(id);
  closeEditor();
  clearSelection();
  if (activeId === id) activeId = null;
  renderHighlights();
  renderPanel();
  toast('已删除');
}

/* — 高亮 ————————————————————————————————— */

function buildIndex(root: HTMLElement): TextIndex {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const spans: CharSpan[] = [];
  let text = '';
  let node = walker.nextNode();
  while (node) {
    const textNode = node as Text;
    const value = textNode.nodeValue ?? '';
    if (value) {
      const parent = textNode.parentElement;
      const locked = !parent || !!parent.closest(SKIP_SELECTOR);
      let index = 0;
      while (index < value.length) {
        const char = value[index] ?? '';
        if (/\s/.test(char)) {
          let end = index + 1;
          while (end < value.length && /\s/.test(value[end] ?? '')) end += 1;
          text += ' ';
          spans.push({ node: textNode, start: index, end, locked });
          index = end;
        } else {
          text += char;
          spans.push({ node: textNode, start: index, end: index + 1, locked });
          index += 1;
        }
      }
    }
    node = walker.nextNode();
  }
  return { text, spans };
}

function isFree(index: TextIndex, start: number, end: number): boolean {
  if (start < 0 || end > index.spans.length || end <= start) return false;
  for (let i = start; i < end; i += 1) {
    if (index.spans[i]?.locked) return false;
  }
  return true;
}

function locate(index: TextIndex, note: Pick<Note, 'text' | 'prefix' | 'suffix'>): number {
  const needle = normalizeSpace(note.text);
  if (!needle) return -1;

  const prefix = (note.prefix ?? '').replace(/\s+/g, ' ');
  const suffix = (note.suffix ?? '').replace(/\s+/g, ' ');
  const candidates: { haystack: string; offset: number }[] = [];
  if (prefix || suffix) candidates.push({ haystack: `${prefix}${needle}${suffix}`, offset: prefix.length });
  candidates.push({ haystack: needle, offset: 0 });

  for (const candidate of candidates) {
    if (candidate.haystack.length < needle.length) continue;
    let from = 0;
    while (from <= index.text.length - candidate.haystack.length) {
      const at = index.text.indexOf(candidate.haystack, from);
      if (at === -1) break;
      const start = at + candidate.offset;
      if (isFree(index, start, start + needle.length)) return start;
      from = at + 1;
    }
  }
  return -1;
}

function blockOf(span: CharSpan, root: HTMLElement): Element {
  return span.node.parentElement?.closest(BLOCK_SELECTOR) ?? root;
}

function wrapRange(
  index: TextIndex,
  from: number,
  to: number,
  noteId: string,
): HTMLElement | null {
  const first = index.spans[from];
  const last = index.spans[to - 1];
  if (!first || !last) return null;
  const range = document.createRange();
  try {
    range.setStart(first.node, first.start);
    range.setEnd(last.node, last.end);
  } catch {
    return null;
  }
  const mark = document.createElement('mark');
  mark.className = 'hl';
  mark.dataset.noteId = noteId;
  mark.setAttribute('data-has-note', '');
  try {
    const fragment = range.extractContents();
    mark.appendChild(fragment);
    range.insertNode(mark);
  } catch {
    return null;
  }
  return mark;
}

function wrapNote(note: Note): void {
  if (!prose) return;
  const index = buildIndex(prose);
  const needle = normalizeSpace(note.text);
  if (!needle) return;
  const start = locate(index, note);
  if (start < 0) return;

  const segments: { from: number; to: number }[] = [];
  let current: { from: number; to: number } | null = null;
  let currentBlock: Element | null = null;

  for (let i = start; i < start + needle.length; i += 1) {
    const span = index.spans[i];
    if (!span) break;
    const block = blockOf(span, prose);
    if (!current || block !== currentBlock) {
      if (current) segments.push(current);
      current = { from: i, to: i + 1 };
      currentBlock = block;
    } else {
      current.to = i + 1;
    }
  }
  if (current) segments.push(current);

  for (const segment of segments) wrapRange(index, segment.from, segment.to, note.id);
}

function clearHighlights(): void {
  if (!prose) return;
  const marks = qsa<HTMLElement>('mark.hl', prose);
  if (!marks.length) return;
  const parents = new Set<Element>();
  for (const mark of marks) {
    const parent = mark.parentNode;
    if (!parent) continue;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    if (parent.nodeType === Node.ELEMENT_NODE) parents.add(parent as Element);
  }
  for (const parent of parents) parent.normalize();
}

function applyActive(id: string | null): void {
  if (prose) {
    for (const mark of qsa<HTMLElement>('mark.hl', prose)) {
      mark.toggleAttribute('data-active', !!id && mark.dataset.noteId === id);
    }
  }
  if (panelList) {
    for (const item of qsa<HTMLElement>('.note-item', panelList)) {
      item.toggleAttribute('data-active', !!id && item.dataset.noteId === id);
    }
  }
}

function setActive(id: string | null, scrollPanel = false): void {
  activeId = id;
  applyActive(id);
  if (!id || !scrollPanel || !panelList) return;
  const item = qsa<HTMLElement>('.note-item', panelList).find(
    (element) => element.dataset.noteId === id,
  );
  item?.scrollIntoView({ block: 'nearest' });
}

function renderHighlights(): void {
  if (!prose || !page) return;
  clearHighlights();
  for (const note of notesForSlug(page.slug)) wrapNote(note);
  if (activeId) applyActive(activeId);
}

/* — 面板 ————————————————————————————————— */

function makeAction(label: string, attribute: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.setAttribute(attribute, '');
  return button;
}

function buildNoteItem(note: Note): HTMLLIElement {
  const item = document.createElement('li');
  item.className = 'note-item';
  item.dataset.noteId = note.id;

  const quote = document.createElement('p');
  quote.className = 'note-quote';
  quote.textContent = note.text;
  item.appendChild(quote);

  if (note.note) {
    const body = document.createElement('p');
    body.className = 'note-body';
    body.textContent = note.note;
    item.appendChild(body);
  }

  const foot = document.createElement('div');
  foot.className = 'note-foot';
  const time = document.createElement('span');
  time.textContent = formatStamp(note.createdAt);
  const links = document.createElement('div');
  links.className = 'note-links';
  links.append(
    makeAction('定位', 'data-note-jump'),
    makeAction('编辑', 'data-note-edit'),
    makeAction('删除', 'data-note-delete'),
  );
  foot.append(time, links);
  item.appendChild(foot);
  return item;
}

function renderPanel(): void {
  if (!page) return;
  const notes = notesForSlug(page.slug);

  if (panelList) {
    panelList.textContent = '';
    for (const note of notes) panelList.appendChild(buildNoteItem(note));
    panelList.hidden = notes.length === 0;
  }

  const total = String(notes.length);
  if (countEl) countEl.textContent = total;
  if (countInlineEl) countInlineEl.textContent = total;
  if (badgeEl) {
    badgeEl.textContent = total;
    badgeEl.hidden = notes.length === 0;
  }
  if (emptyEl) emptyEl.hidden = notes.length > 0;
  if (exportBtn) exportBtn.toggleAttribute('disabled', notes.length === 0);
  if (activeId && !notes.some((note) => note.id === activeId)) activeId = null;
}

function jumpToNote(id: string): void {
  if (!prose) return;
  const mark = qsa<HTMLElement>('mark.hl', prose).find(
    (element) => element.dataset.noteId === id,
  );
  if (!mark) {
    toast('原文位置已变动');
    return;
  }
  setActive(id, true);
  const top = mark.getBoundingClientRect().top + window.scrollY - 140;
  try {
    window.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  } catch {
    window.scrollTo(0, Math.max(0, top));
  }
}

/* — 导出 ————————————————————————————————— */

function exportCurrentArticle(): void {
  if (!page) return;
  const notes = notesForSlug(page.slug);
  if (!notes.length) {
    toast('还没有批注');
    return;
  }
  download(
    `${safeFilename(`批注-${page.title}`)}.md`,
    articleNotesMarkdown(page.title, notes),
  );
  toast('已导出');
}

function buildQuote(text: string): string {
  if (!page) return text;
  const quoted = text
    .split(/\r?\n/)
    .map((line) => (line ? `> ${line}` : '>'))
    .join('\n');
  return `${quoted}\n>\n> —— 《${page.title}》 ${page.url}`;
}

/* — 初始化 ——————————————————————————————— */

export function initNotes(): void {
  const article = qs<HTMLElement>('article[data-post]');
  if (!article) return;
  prose = qs<HTMLElement>('[data-prose]', article) ?? qs<HTMLElement>('[data-prose]');
  if (!prose) return;

  page = {
    slug: article.dataset.slug ?? window.location.pathname,
    title: article.dataset.title ?? document.title,
    url: article.dataset.url ?? window.location.href,
  };

  toolbar = qs('[data-selection-toolbar]');
  editor = qs('[data-note-editor]');
  editorQuote = qs('[data-note-editor-quote]');
  editorInput = qs<HTMLTextAreaElement>('[data-note-editor-input]');
  editorDelete = qs<HTMLButtonElement>('[data-note-editor-delete]');

  panelList = qs('[data-notes-list]');
  countEl = qs('[data-notes-count]');
  countInlineEl = qs('[data-notes-count-inline]');
  badgeEl = qs('[data-notes-badge]');
  emptyEl = qs('[data-notes-empty]');
  exportBtn = qs('[data-notes-export]');

  /* 划词 */
  document.addEventListener('selectionchange', () => {
    if (syncQueued) return;
    syncQueued = true;
    window.requestAnimationFrame(() => {
      syncQueued = false;
      syncToolbar();
    });
  });

  onScroll(() => hideToolbar());

  document.addEventListener(
    'pointerdown',
    (event) => {
      if (!isEditorOpen()) return;
      const target = event.target as Element | null;
      if (!target) return;
      if (target.closest('[data-note-editor]')) return;
      if (target.closest('mark.hl')) return;
      if (target.closest('[data-notes-panel]')) return;
      if (target.closest('[data-selection-toolbar]')) return;
      closeEditor();
    },
    true,
  );

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (toolbar && !toolbar.hidden) hideToolbar();
  });

  /* 工具条 */
  if (toolbar) {
    // 保住选区：按下按钮时不让浏览器把选区收掉
    toolbar.addEventListener('mousedown', (event) => event.preventDefault());
    toolbar.addEventListener('click', async (event) => {
      const button = (event.target as Element | null)?.closest<HTMLElement>('[data-sel-action]');
      if (!button) return;
      const action = button.dataset.selAction;
      const context = selectionCtx;
      if (!context) return;

      if (action === 'note') {
        openEditorForCreate(context);
        return;
      }
      if (action === 'copy') {
        const ok = await copyText(context.text);
        toast(ok ? '已复制' : '复制失败');
        hideToolbar();
        return;
      }
      if (action === 'quote') {
        const ok = await copyText(buildQuote(context.text));
        toast(ok ? '已复制引用' : '复制失败');
        hideToolbar();
      }
    });

    registerOverlay({
      name: 'selection-toolbar',
      z: 130,
      isOpen: () => !!toolbar && !toolbar.hidden,
      close: hideToolbar,
    });
  }

  /* 编辑器 */
  if (editor) {
    qs('[data-note-editor-save]')?.addEventListener('click', () => saveEditor());
    qs('[data-note-editor-cancel]')?.addEventListener('click', () => {
      closeEditor();
      clearSelection();
      // 取消创建时把待保存选区丢掉
      selectionCtx = null;
    });
    editorDelete?.addEventListener('click', () => {
      if (editingId) removeNoteById(editingId);
    });
    editorInput?.addEventListener('keydown', (event) => {
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key === 'Enter') {
        event.preventDefault();
        saveEditor();
      }
    });
    registerOverlay({
      name: 'note-editor',
      z: 135,
      isOpen: () => !!editor && !editor.hidden,
      close: () => {
        closeEditor();
        clearSelection();
      },
    });
  }

  /* 正文高亮点击 */
  prose.addEventListener('click', (event) => {
    const mark = (event.target as Element | null)?.closest<HTMLElement>('mark.hl');
    if (!mark) return;
    const id = mark.dataset.noteId;
    if (!id) return;
    openEditorForNote(id, mark.getBoundingClientRect());
  });

  /* 面板操作 */
  panelList?.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    const item = target?.closest<HTMLElement>('.note-item');
    const id = item?.dataset.noteId;
    if (!item || !id) return;

    if (target?.closest('[data-note-delete]')) {
      removeNoteById(id);
      return;
    }
    if (target?.closest('[data-note-jump]')) {
      jumpToNote(id);
      return;
    }
    openEditorForNote(id);
  });

  exportBtn?.addEventListener('click', () => exportCurrentArticle());

  /* 跨标签页同步 */
  onNotesChange(() => {
    renderHighlights();
    renderPanel();
  });

  /* 首屏 */
  renderHighlights();
  renderPanel();
  consumeFocusRequest();
}

function consumeFocusRequest(): void {
  try {
    const id = sessionStorage.getItem('ink:notes:focus');
    if (!id) return;
    sessionStorage.removeItem('ink:notes:focus');
    window.requestAnimationFrame(() => {
      if (!page) return;
      const exists = qsa<HTMLElement>('mark.hl', prose ?? document.body).some(
        (element) => element.dataset.noteId === id,
      );
      if (exists) jumpToNote(id);
    });
  } catch {
    /* 忽略 */
  }
}
