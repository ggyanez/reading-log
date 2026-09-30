import "server-only";
import { getDb } from "./db";
import { requireSession } from "./session";
import type { Book, Library, Session } from "./books";

type Row = Record<string, unknown>;

export const DEFAULT_STEP_MINUTES = 5;
const DEFAULT_MINUTES = 30;

const BOOK_COLUMNS = `
  b.id, b.library, b.title, b.author, b.category, b.status, b.rating,
  b.notion_url, b.removed_at,
  COALESCE(SUM(s.minutes), 0) AS total_minutes,
  COUNT(s.id) AS session_count,
  MIN(s.read_at) AS first_read_at,
  MAX(s.read_at) AS last_read_at`;

function toBook(r: Row): Book {
  return {
    id: String(r.id),
    library: String(r.library) as Library,
    title: String(r.title),
    author: nullableString(r.author),
    category: nullableString(r.category),
    status: nullableString(r.status),
    rating: nullableString(r.rating),
    notionUrl: String(r.notion_url),
    removedAt: nullableString(r.removed_at),
    totalMinutes: Number(r.total_minutes),
    sessionCount: Number(r.session_count),
    firstReadAt: nullableString(r.first_read_at),
    lastReadAt: nullableString(r.last_read_at),
  };
}

function toSession(r: Row): Session {
  return {
    id: Number(r.id),
    bookId: String(r.book_id),
    minutes: Number(r.minutes),
    readAt: String(r.read_at),
  };
}

function nullableString(v: unknown): string | null {
  return v === null || v === undefined || v === "" ? null : String(v);
}

/**
 * Every book, with its reading totals. Books removed from Notion are only
 * included when they have sessions — without any, there's nothing to show.
 */
export async function getBooks(): Promise<Book[]> {
  await requireSession();
  const res = await getDb().execute(
    `SELECT ${BOOK_COLUMNS}
     FROM books b LEFT JOIN sessions s ON s.book_id = b.id
     GROUP BY b.id
     HAVING b.removed_at IS NULL OR COUNT(s.id) > 0
     ORDER BY b.title COLLATE NOCASE`,
  );
  return res.rows.map((r) => toBook(r as Row));
}

export async function getBook(id: string): Promise<{ book: Book; sessions: Session[] } | null> {
  await requireSession();
  const db = getDb();
  const [bookRes, sessionsRes] = await Promise.all([
    db.execute({
      sql: `SELECT ${BOOK_COLUMNS}
            FROM books b LEFT JOIN sessions s ON s.book_id = b.id
            WHERE b.id = ? GROUP BY b.id`,
      args: [id],
    }),
    db.execute({
      sql: "SELECT id, book_id, minutes, read_at FROM sessions WHERE book_id = ? ORDER BY read_at DESC",
      args: [id],
    }),
  ]);
  if (bookRes.rows.length === 0) return null;
  return {
    book: toBook(bookRes.rows[0] as Row),
    sessions: sessionsRes.rows.map((r) => toSession(r as Row)),
  };
}

export type RecentSession = Session & { title: string; library: Library };

export async function getRecentSessions(limit: number): Promise<RecentSession[]> {
  await requireSession();
  const res = await getDb().execute({
    sql: `SELECT s.id, s.book_id, s.minutes, s.read_at, b.title, b.library
          FROM sessions s JOIN books b ON b.id = s.book_id
          ORDER BY s.created_at DESC LIMIT ?`,
    args: [limit],
  });
  return res.rows.map((r) => ({
    ...toSession(r as Row),
    title: String((r as Row).title),
    library: String((r as Row).library) as Library,
  }));
}

/** Minutes of the most recently logged session — the stepper starts there. */
export async function getLastMinutes(): Promise<number> {
  await requireSession();
  const res = await getDb().execute(
    "SELECT minutes FROM sessions ORDER BY created_at DESC LIMIT 1",
  );
  return res.rows.length ? Number((res.rows[0] as Row).minutes) : DEFAULT_MINUTES;
}

export type StatsSession = { minutes: number; readAt: string; library: Library };

export async function getStatsSessions(): Promise<StatsSession[]> {
  await requireSession();
  const res = await getDb().execute(
    `SELECT s.minutes, s.read_at, b.library
     FROM sessions s JOIN books b ON b.id = s.book_id
     ORDER BY s.read_at`,
  );
  return res.rows.map((r) => ({
    minutes: Number((r as Row).minutes),
    readAt: String((r as Row).read_at),
    library: String((r as Row).library) as Library,
  }));
}

export type Settings = { stepMinutes: number; lastSyncAt: string | null };

export async function getSettings(): Promise<Settings> {
  await requireSession();
  const res = await getDb().execute("SELECT key, value FROM settings");
  const map = new Map(res.rows.map((r) => [String((r as Row).key), String((r as Row).value)]));
  return {
    stepMinutes: Number(map.get("step_minutes") ?? DEFAULT_STEP_MINUTES),
    lastSyncAt: map.get("last_sync_at") ?? null,
  };
}
