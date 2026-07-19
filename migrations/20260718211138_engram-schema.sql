-- Engram cloud sync schema: mirrors the local concept_graph.json so memory
-- survives machine loss and can be shared across agents/devices.
-- Private by default: RLS enabled with no anon policies (deny-all);
-- the sync script authenticates with the admin API key (bypasses RLS).

CREATE TABLE engram_files (
  id integer PRIMARY KEY,
  name text NOT NULL UNIQUE
);

CREATE TABLE engram_concepts (
  name text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  df integer NOT NULL DEFAULT 0,
  first_seen text,
  last_seen text,
  hub boolean NOT NULL DEFAULT false,
  generality real NOT NULL DEFAULT 0,
  parents jsonb NOT NULL DEFAULT '[]'::jsonb,
  next jsonb NOT NULL DEFAULT '[]'::jsonb,
  pointers jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX engram_concepts_last_seen ON engram_concepts (last_seen DESC);
CREATE INDEX engram_concepts_generality ON engram_concepts (generality DESC);

CREATE TABLE engram_edges (
  a text NOT NULL,
  b text NOT NULL,
  w_raw real NOT NULL,
  last_seen text,
  PRIMARY KEY (a, b)
);

CREATE INDEX engram_edges_b ON engram_edges (b);

CREATE TABLE engram_meta (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE engram_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE engram_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE engram_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE engram_meta ENABLE ROW LEVEL SECURITY;
