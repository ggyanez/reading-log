"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { requireSession } from "@/lib/session";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  expectedSessionToken,
  isValidPassword,
} from "@/lib/auth";
import { fetchAllBooks } from "@/lib/notion";

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

// ---------- auth ----------

export async function login(_prev: string | null, formData: FormData): Promise<string | null> {
  const password = String(formData.get("password") ?? "");
  if (!isValidPassword(password)) {
    // Slows down guessing; there's no rate limiting beyond this.
    await new Promise((r) => setTimeout(r, 800));
    return "Contraseña incorrecta";
  }
  (await cookies()).set(SESSION_COOKIE, await expectedSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/");
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

// ---------- sessions ----------

type SessionInput = { bookId: string; minutes: number; readAt: string };

function validate(input: SessionInput): string | null {
  if (!Number.isInteger(input.minutes) || input.minutes <= 0 || input.minutes > 24 * 60) {
    return "Minutos inválidos";
  }
  const readAt = new Date(input.readAt);
  if (Number.isNaN(readAt.getTime())) return "Fecha inválida";
  // A little slack for clock drift between the phone and the server.
  if (readAt.getTime() > Date.now() + 5 * 60 * 1000) return "La fecha está en el futuro";
  return null;
}

export async function logSession(input: SessionInput): Promise<ActionResult<{ id: number }>> {
  await requireSession();
  const error = validate(input);
  if (error) return { ok: false, error };

  const now = new Date().toISOString();
  const res = await getDb().execute({
    sql: `INSERT INTO sessions (book_id, minutes, read_at, created_at, updated_at)
          SELECT id, ?, ?, ?, ? FROM books WHERE id = ?
          RETURNING id`,
    args: [input.minutes, new Date(input.readAt).toISOString(), now, now, input.bookId],
  });
  if (res.rows.length === 0) return { ok: false, error: "No existe ese libro" };

  revalidatePath("/", "layout");
  return { ok: true, data: { id: Number(res.rows[0].id) } };
}

export async function updateSession(
  id: number,
  input: Omit<SessionInput, "bookId">,
): Promise<ActionResult> {
  await requireSession();
  const error = validate({ ...input, bookId: "" });
  if (error) return { ok: false, error };

  await getDb().execute({
    sql: "UPDATE sessions SET minutes = ?, read_at = ?, updated_at = ? WHERE id = ?",
    args: [input.minutes, new Date(input.readAt).toISOString(), new Date().toISOString(), id],
  });
  revalidatePath("/", "layout");
  return { ok: true, data: null };
}

export async function deleteSession(id: number): Promise<ActionResult> {
  await requireSession();
  await getDb().execute({ sql: "DELETE FROM sessions WHERE id = ?", args: [id] });
  revalidatePath("/", "layout");
  return { ok: true, data: null };
}

// ---------- settings ----------

export async function setStepMinutes(step: number): Promise<ActionResult> {
  await requireSession();
  if (![5, 10, 15].includes(step)) return { ok: false, error: "Paso inválido" };
  await getDb().execute({
    sql: `INSERT INTO settings (key, value) VALUES ('step_minutes', ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    args: [String(step)],
  });
  revalidatePath("/", "layout");
  return { ok: true, data: null };
}

export async function syncNotion(): Promise<ActionResult<{ books: number; removed: number }>> {
  await requireSession();
  let books;
  try {
    books = await fetchAllBooks();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al leer Notion" };
  }

  // One transaction: upsert everything seen in this sync, then mark as
  // removed whatever this sync didn't touch.
  const syncedAt = new Date().toISOString();
  const db = getDb();
  const results = await db.batch(
    [
      ...books.map((b) => ({
        sql: `INSERT INTO books (id, library, title, author, category, status, rating,
                                 notion_url, notion_edited_at, removed_at, synced_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
              ON CONFLICT(id) DO UPDATE SET
                library = excluded.library, title = excluded.title,
                author = excluded.author, category = excluded.category,
                status = excluded.status, rating = excluded.rating,
                notion_url = excluded.notion_url,
                notion_edited_at = excluded.notion_edited_at,
                removed_at = NULL, synced_at = excluded.synced_at`,
        args: [
          b.id, b.library, b.title, b.author, b.category, b.status, b.rating,
          b.notionUrl, b.editedAt, syncedAt,
        ],
      })),
      {
        sql: "UPDATE books SET removed_at = ? WHERE removed_at IS NULL AND synced_at <> ?",
        args: [syncedAt, syncedAt],
      },
      {
        sql: `INSERT INTO settings (key, value) VALUES ('last_sync_at', ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        args: [syncedAt],
      },
    ],
    "write",
  );

  revalidatePath("/", "layout");
  return {
    ok: true,
    data: { books: books.length, removed: results[books.length].rowsAffected },
  };
}
