import "server-only";
import type { Library } from "./books";

// Read-only: the app never writes to Notion.
const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2025-09-03";

export type NotionBook = {
  id: string;
  library: Library;
  title: string;
  author: string | null;
  category: string | null;
  status: string | null;
  rating: string | null;
  notionUrl: string;
  editedAt: string;
};

type NotionPage = {
  id: string;
  url: string;
  last_edited_time: string;
  in_trash?: boolean;
  archived?: boolean;
  properties: Record<string, NotionProperty>;
};

type NotionProperty = {
  type: string;
  title?: { plain_text: string }[];
  rich_text?: { plain_text: string }[];
  select?: { name: string } | null;
  status?: { name: string } | null;
};

function dataSources(): { library: Library; id: string }[] {
  const general = process.env.NOTION_DATA_SOURCE_GENERAL;
  const informatica = process.env.NOTION_DATA_SOURCE_INFORMATICA;
  if (!general || !informatica) {
    throw new Error("Missing NOTION_DATA_SOURCE_GENERAL / NOTION_DATA_SOURCE_INFORMATICA");
  }
  return [
    { library: "general", id: general },
    { library: "informatica", id: informatica },
  ];
}

/** Every book in both databases. Throws if any request fails — a partial list must never reach the sync. */
export async function fetchAllBooks(): Promise<NotionBook[]> {
  const perSource = await Promise.all(
    dataSources().map(async ({ library, id }) => {
      const pages = await queryAll(id);
      return pages.filter((p) => !p.in_trash && !p.archived).map((p) => toBook(p, library));
    }),
  );
  return perSource.flat();
}

async function queryAll(dataSourceId: string): Promise<NotionPage[]> {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error("Missing NOTION_TOKEN");

  const pages: NotionPage[] = [];
  let cursor: string | undefined;
  do {
    const res = await fetch(`${NOTION_API}/data_sources/${dataSourceId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ page_size: 100, start_cursor: cursor }),
      cache: "no-store",
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Notion ${res.status}: ${detail.slice(0, 200)}`);
    }
    const json = (await res.json()) as {
      results: NotionPage[];
      has_more: boolean;
      next_cursor: string | null;
    };
    pages.push(...json.results);
    cursor = json.has_more && json.next_cursor ? json.next_cursor : undefined;
  } while (cursor);
  return pages;
}

function toBook(page: NotionPage, library: Library): NotionBook {
  const p = page.properties;
  return {
    id: page.id,
    library,
    title: plainText(p["Nombre"]?.title) || "Sin título",
    author: plainText(p["Autor"]?.rich_text) || null,
    category: p["Categoría"]?.select?.name ?? null,
    status: p["Estado de lectura"]?.status?.name ?? null,
    rating: p["Rating"]?.select?.name ?? null,
    notionUrl: page.url,
    editedAt: page.last_edited_time,
  };
}

function plainText(parts: { plain_text: string }[] | undefined): string {
  return (parts ?? []).map((t) => t.plain_text).join("").trim();
}
