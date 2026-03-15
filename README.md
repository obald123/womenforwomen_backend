# Women Backend API

Production-ready backend for Women for Women Rwanda. Built with Express, TypeScript, Prisma, PostgreSQL.

## Features
- JWT auth (access + refresh)
- Content modules: Articles, Events, Gallery, Team, Newsletter
- Public read endpoints (published only)
- Local file uploads (stored in /uploads)
- Nodemailer email templates
- Zod validation, Helmet, CORS, rate limiting
- Winston logging
- Local in-memory cache for public endpoints

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
```

3. Generate Prisma client and migrate:
```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Seed initial admin user:
```bash
npm run seed
```

5. Run dev server:
```bash
npm run dev
```

## File uploads
Images are stored locally in the `uploads/` folder and served at `http://localhost:4000/uploads/...`.

## API
- Health: `GET /health`
- Auth: `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`
- Admin CRUD: `/api/articles`, `/api/events`, `/api/gallery`, `/api/team`
- Newsletter: `/api/newsletter/subscribers`, `/api/newsletter/campaigns`, `/api/newsletter/send/:id`
- Public: `/api/public/articles`, `/api/public/events`, `/api/public/gallery`, `/api/public/team`

## Notes
- No Redis or Docker used.
- Data cache is local in-memory and resets on restart.
- Uploads are stored locally in `uploads/`.