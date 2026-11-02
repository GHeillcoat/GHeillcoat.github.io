/**
 * 批注的本地存储。
 *
 * 唯一的真相来源是 `localStorage['ink:notes:v1']`（Note[]）。
 * 读写都带降级：隐私模式 / 配额满 / 内容损坏时，页面照常阅读，只是不留下批注。
 */

import { shortHash } from '../../lib/format';

export interface Note {
  /** 短哈希，见 shortHash() */
  id: string;
  /** 文章 id */
  slug: string;
  /** 文章标题（冗余保存，便于批注页展示） */
  title: string;
  /** 文章 url */
  url: string;
  /** 被选中的原文 */
  text: string;
  /** 用户写的批注 */
  note: string;
  /** 原文前 24 个字符，用于定位 */
  prefix: string;
  /** 原文后 24 个字符 */
  suffix: string;
  createdAt: number;
  updatedAt: number;
}

export const NOTES_KEY = 'ink:notes:v1';

let cachedStorage: Storage | null | undefined;

function getStorage(): Storage | null {
  if (cachedStorage !== undefined) return cachedStorage;
  try {
    const storage = window.localStorage;
    const probe = 'ink:probe';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    cachedStorage = storage;
  } catch {
    cachedStorage = null;
  }
  return cachedStorage;
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asTime(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function coerce(value: unknown): Note | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== 'string' || !raw.id) return null;
  if (typeof raw.slug !== 'string' || !raw.slug) return null;
  if (typeof raw.text !== 'string') return null;
  const createdAt = asTime(raw.createdAt, Date.now());
  return {
    id: raw.id,
    slug: raw.slug,
    title: asText(raw.title),
    url: asText(raw.url),
    text: raw.text,
    note: asText(raw.note),
    prefix: asText(raw.prefix),
    suffix: asText(raw.suffix),
    createdAt,
    updatedAt: asTime(raw.updatedAt, createdAt),
  };
}

export function loadNotes(): Note[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(NOTES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(coerce)
      .filter((note): note is Note => note !== null)
      .sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return [];
  }
}

function writeNotes(notes: Note[]): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(NOTES_KEY, JSON.stringify(notes));
    return true;
  } catch {
    return false;
  }
}

export function notesForSlug(slug: string): Note[] {
  return loadNotes().filter((note) => note.slug === slug);
}

export function findNote(id: string): Note | null {
  return loadNotes().find((note) => note.id === id) ?? null;
}

function uniqueId(slug: string, text: string): string {
  const seed = `${slug}|${text}|${Date.now()}|${Math.random()}`;
  return shortHash(seed);
}

export interface NoteDraft {
  slug: string;
  title: string;
  url: string;
  text: string;
  note: string;
  prefix?: string;
  suffix?: string;
}

export function addNote(draft: NoteDraft): Note | null {
  const notes = loadNotes();
  const now = Date.now();
  const note: Note = {
    id: uniqueId(draft.slug, draft.text),
    slug: draft.slug,
    title: draft.title,
    url: draft.url,
    text: draft.text,
    note: draft.note,
    prefix: draft.prefix ?? '',
    suffix: draft.suffix ?? '',
    createdAt: now,
    updatedAt: now,
  };
  notes.push(note);
  return writeNotes(notes) ? note : null;
}

export function updateNote(id: string, patch: Partial<Pick<Note, 'note' | 'updatedAt'>>): boolean {
  const notes = loadNotes();
  const index = notes.findIndex((note) => note.id === id);
  if (index === -1) return false;
  const current = notes[index];
  if (!current) return false;
  notes[index] = { ...current, ...patch, updatedAt: patch.updatedAt ?? Date.now() };
  return writeNotes(notes);
}

export function deleteNote(id: string): boolean {
  const notes = loadNotes().filter((note) => note.id !== id);
  return writeNotes(notes);
}

export function clearNotes(): boolean {
  return writeNotes([]);
}

/** 其它标签页改了批注时同步一次（同一标签页内由调用方自行重绘） */
export function onNotesChange(handler: () => void): () => void {
  const listener = (event: StorageEvent) => {
    if (event.key !== null && event.key !== NOTES_KEY) return;
    handler();
  };
  window.addEventListener('storage', listener);
  return () => window.removeEventListener('storage', listener);
}
