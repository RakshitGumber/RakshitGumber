import { Elysia } from 'elysia'

const port = Number(Bun.env.PORT ?? 3000)

export const app = new Elysia()
  .get('/', () => ({ name: 'portfolio-api', status: 'ok' }))
  .get('/health', () => ({ status: 'ok' }))
  .listen(port)

console.log(`Backend running at http://localhost:${app.server?.port}`)
