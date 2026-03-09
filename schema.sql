-- schema.sql
CREATE TABLE IF NOT EXISTS memos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    createdAt INTEGER NOT NULL,
    displayOrder INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_memos_displayOrder ON memos(displayOrder);
