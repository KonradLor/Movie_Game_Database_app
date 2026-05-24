#!/usr/bin/env node
// PASIRENKAMAS (optional) MCP serveris Media Databank valdymui per Claude.
// Pagrindine aplikacija veikia ir BE sito - tai tik papildomas irankis.
//
// Veikia tik jei portalo .env faile nustatytas ADMIN_API_KEY ir cia jis perduotas.
// Aplinkos kintamieji:
//   MEDIA_API_URL  - portalo adresas (pvz. https://media.kondev.app arba http://localhost:3100)
//   MEDIA_API_KEY  - tas pats raktas kaip portalo ADMIN_API_KEY
//
// Registracija Claude konfiguracijoje (pavyzdys mcp/README.md).

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API = (process.env.MEDIA_API_URL || "http://localhost:3100").replace(/\/$/, "");
const KEY = process.env.MEDIA_API_KEY || "";

async function api(path, method = "GET", body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "x-api-key": KEY,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  return { status: res.status, data: parsed };
}

function result(obj) {
  return { content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] };
}

const server = new McpServer({ name: "media-databank", version: "1.0.0" });

server.tool(
  "search_tmdb",
  "Ieskoti filmu/serialu TMDB duomenu bazeje pagal pavadinima.",
  { query: z.string().describe("Paieskos tekstas (pavadinimas)") },
  async ({ query }) => result(await api(`/api/admin/search?q=${encodeURIComponent(query)}`))
);

server.tool(
  "list_media",
  "Isvardinti/ieskoti irasus portalo kolekcijoje.",
  {
    query: z.string().optional().describe("Pavadinimo filtras"),
    type: z.enum(["MOVIE", "SERIES", "ANIME", "DOCUMENTARY", "GAME"]).optional(),
  },
  async ({ query, type }) => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (type) p.set("type", type);
    return result(await api(`/api/admin/media?${p.toString()}`));
  }
);

server.tool(
  "import_tmdb",
  "Importuoti filma/seriala is TMDB i kolekcija (write-through cache).",
  {
    tmdbId: z.number().describe("TMDB id"),
    tmdbType: z.enum(["movie", "tv"]),
    type: z.enum(["MOVIE", "SERIES", "ANIME", "DOCUMENTARY", "GAME"]).optional(),
  },
  async ({ tmdbId, tmdbType, type }) =>
    result(await api(`/api/admin/media`, "POST", { tmdbId, tmdbType, type }))
);

server.tool(
  "add_media",
  "Rankiniu budu prideti irasa (kai TMDB neturi). Pateik bent title ir type.",
  {
    title: z.string(),
    type: z.enum(["MOVIE", "SERIES", "ANIME", "DOCUMENTARY", "GAME"]),
    year: z.number().optional(),
    durationMin: z.number().optional(),
    description: z.string().optional(),
    posterUrl: z.string().optional(),
    rating: z.number().min(1).max(5).optional(),
    opinion: z.string().optional(),
    watchCount: z.number().optional(),
    visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]).optional(),
    tags: z.array(z.string()).optional(),
  },
  async (fields) => result(await api(`/api/admin/media`, "POST", fields))
);

server.tool(
  "edit_media",
  "Redaguoti esama irasa pagal id. Pateik tik keiciamus laukus.",
  {
    id: z.string(),
    title: z.string().optional(),
    type: z.enum(["MOVIE", "SERIES", "ANIME", "DOCUMENTARY", "GAME"]).optional(),
    year: z.number().nullable().optional(),
    durationMin: z.number().nullable().optional(),
    description: z.string().nullable().optional(),
    posterUrl: z.string().nullable().optional(),
    rating: z.number().min(1).max(5).nullable().optional(),
    opinion: z.string().nullable().optional(),
    watchCount: z.number().optional(),
    visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]).optional(),
    tags: z.array(z.string()).optional(),
  },
  async ({ id, ...fields }) =>
    result(await api(`/api/admin/media/${id}`, "PATCH", fields))
);

server.tool(
  "delete_media",
  "Istrinti irasa pagal id.",
  { id: z.string() },
  async ({ id }) => result(await api(`/api/admin/media/${id}`, "DELETE"))
);

const transport = new StdioServerTransport();
await server.connect(transport);
