# Media Databank — MCP server (OPTIONAL)

This is an **optional** Model Context Protocol (MCP) server that lets you manage
your Media Databank collection through Claude (e.g. add a rare item that TMDB
doesn't have, bulk-edit, etc.).

**You do not need this to use the portal.** The web app works fully on its own.
Set it up only if you want Claude to read/write your collection directly.

## How it works

```
Claude  ──(MCP, stdio)──►  this server  ──(HTTPS + x-api-key)──►  /api/admin/* of the portal
```

The portal's admin API is **disabled by default**. It activates only when you
set `ADMIN_API_KEY` in the portal's `.env`.

## Enable it

1. **Generate a key** and add it to the portal `.env`:
   ```
   ADMIN_API_KEY=<long-random-string>
   ```
   (e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   Restart the portal.

2. **Install this server** (separate from the main app):
   ```bash
   cd mcp
   npm install
   ```

3. **Register it with Claude** (Claude Desktop / Claude Code MCP config):
   ```json
   {
     "mcpServers": {
       "media-databank": {
         "command": "node",
         "args": ["/absolute/path/to/mcp/server.mjs"],
         "env": {
           "MEDIA_API_URL": "https://media.kondev.app",
           "MEDIA_API_KEY": "<same value as ADMIN_API_KEY>"
         }
       }
     }
   }
   ```
   For local testing use `MEDIA_API_URL=http://localhost:3100`.

## Tools exposed

| Tool | Purpose |
| --- | --- |
| `search_tmdb` | Search TMDB by title |
| `list_media` | List / search items in your collection |
| `import_tmdb` | Import a movie/series from TMDB |
| `add_media` | Manually add an item (when TMDB lacks it) |
| `edit_media` | Edit an existing item by id |
| `delete_media` | Delete an item by id |

## Disable it

Remove (or blank) `ADMIN_API_KEY` from the portal `.env` and restart — the
admin API returns 404 again, and the MCP tools stop working. The portal itself
is unaffected.
