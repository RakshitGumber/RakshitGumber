# Backend

Minimal Elysia API powered by Bun.

```sh
bun install
bun run dev
```

The server listens on `http://localhost:3000` by default. Set `PORT` to override it.

## Endpoints

- `GET /` — service name and status
- `GET /health` — health status

Run `bun run check` to type-check the backend.
