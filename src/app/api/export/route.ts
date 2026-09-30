import { getDb } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { TRACKS, type Library } from "@/lib/books";

export async function GET() {
  await requireSession();
  const res = await getDb().execute(
    `SELECT s.read_at, s.minutes, b.title, b.author, b.library, b.category
     FROM sessions s JOIN books b ON b.id = s.book_id
     ORDER BY s.read_at`,
  );

  const header = ["read_at", "minutes", "title", "author", "track", "category"];
  const lines = res.rows.map((r) =>
    [
      r.read_at,
      r.minutes,
      r.title,
      r.author,
      TRACKS[String(r.library) as Library].label,
      r.category,
    ]
      .map(csvCell)
      .join(","),
  );
  const csv = [header.join(","), ...lines].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reading-log-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
