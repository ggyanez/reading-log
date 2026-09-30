// Shared by server and client code: no imports from the data layer.

export type Library = "general" | "informatica";

// Each Notion database is one reading track.
export const TRACKS: Record<Library, { label: string }> = {
  informatica: { label: "Carrera" },
  general: { label: "Personal" },
};

export const READING_STATUS = "Leyendo";

// Biblioteca group order: what you're reading or about to read first, then
// finished books, then everything you don't own yet. Statuses not listed
// here (added later in Notion) go last, alphabetically.
export const STATUS_ORDER = [
  "Leyendo",
  "En Cola",
  "Listo para empezar",
  "Leído",
  "Procesado",
  "Encargado",
  "En carrito",
  "Lista de deseos",
  "Lista de deseos (Meli)",
  "Lista de deseos (Miami)",
  "Pospuesto/Descartado",
];

// Groups that start expanded in the Biblioteca; the rest start collapsed.
export const OPEN_STATUSES = new Set(["Leyendo", "En Cola", "Listo para empezar"]);

export type Book = {
  id: string;
  library: Library;
  title: string;
  author: string | null;
  category: string | null;
  status: string | null;
  rating: string | null;
  notionUrl: string;
  removedAt: string | null;
  totalMinutes: number;
  sessionCount: number;
  firstReadAt: string | null;
  lastReadAt: string | null;
};

export type Session = {
  id: number;
  bookId: string;
  minutes: number;
  readAt: string;
};

export function statusRank(status: string | null): number {
  const i = STATUS_ORDER.indexOf(status ?? "");
  return i === -1 ? STATUS_ORDER.length : i;
}
