# Production Deployment

NovaFXM has two deployable apps:

- Frontend: Next.js app from the project root
- Backend: Express API and WebSocket server from `server/`

## Required Environment

Frontend:

```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
```

Backend:

```env
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-domain.com
DB_HOST=your-mysql-host
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=trading_platform
JWT_SECRET=replace-with-a-long-random-secret
```

Use a long random `JWT_SECRET` in production and keep `.env` files out of source control.

## Option 1: Docker Compose on a VPS

1. Copy `.env.production.example` and `server/.env.production.example`, then set real values.
2. Create a root `.env` for Compose:

```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
CORS_ORIGIN=https://your-domain.com
DB_NAME=trading_platform
DB_USER=novafxm
DB_PASSWORD=change-me
MYSQL_ROOT_PASSWORD=change-me-too
JWT_SECRET=replace-with-a-long-random-secret
```

3. Build and start:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

4. Verify:

```bash
curl http://localhost:3001/health
curl http://localhost:3000
```

Put a reverse proxy such as Nginx, Caddy, or your cloud load balancer in front of both services and terminate HTTPS there.

## Option 2: Managed Hosting

Frontend:

- Deploy the root app to Vercel, Netlify, or any Node-capable host.
- Set `NEXT_PUBLIC_API_URL` to the public backend URL ending in `/api`.
- Build command: `npm run build`
- Start command: `npm start`

Backend:

- Deploy `server/` to Render, Railway, Fly.io, or a VPS.
- Use a managed MySQL database.
- Set the backend environment variables listed above.
- Start command: `npm start`
- Health check path: `/health`

## Production Checks

- `npm run lint`
- `npm run build`
- `node --check server/server.js`
- Confirm `https://api.your-domain.com/api/health` returns `{"status":"OK",...}`.
- Confirm the frontend can register, log in, and open the WebSocket price feed.
