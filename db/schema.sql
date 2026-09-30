-- Local copy of the books in the two Notion databases. Notion is the source
-- of truth: this table is only written by the sync, never edited by hand.
CREATE TABLE IF NOT EXISTS books (
  id               TEXT PRIMARY KEY,      -- Notion page id
  library          TEXT NOT NULL,         -- 'general' (personal) | 'informatica' (career)
  title            TEXT NOT NULL,
  author           TEXT,
  category         TEXT,                  -- free text, as it comes from Notion
  status           TEXT,                  -- 'Leyendo', 'En Cola', 'Leído', ...
  rating           TEXT,
  notion_url       TEXT NOT NULL,
  notion_edited_at TEXT NOT NULL,
  -- Set when a sync no longer finds the page in Notion. The row is kept so
  -- its sessions don't lose their book; the Biblioteca shows it dimmed.
  removed_at       TEXT,
  synced_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id    TEXT NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
  minutes    INTEGER NOT NULL CHECK (minutes > 0),
  -- When the reading ended (it's logged afterwards). Editable; defaults to
  -- the moment of logging. All timestamps are ISO-8601 UTC strings.
  read_at    TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_read_at ON sessions(read_at);
CREATE INDEX IF NOT EXISTS idx_sessions_book_read_at ON sessions(book_id, read_at);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
