# XYZ Tech Club Platform

Full-stack club management platform for handling authentication, membership applications, members, events, notices, payments, testimonials, committee sessions, and contact messages.

This repository contains the **backend API**. The frontend connects to this service through the exposed REST endpoints and Better Auth routes.

## Overview

The project is designed as a club portal for students and administrators.

### Frontend responsibilities

- Public website pages for home, about, committee, testimonials, notices, and events
- Authentication screens for sign up, sign in, email verification, and password reset
- User dashboard for profile management, membership application, event registration, testimonials, and contact messages
- Admin dashboard for reviewing applications, managing users, publishing notices, managing committee sessions, and verifying event payments

### Backend responsibilities

- Session-based authentication with `better-auth`
- Role-based access control for `SUPER_ADMIN`, `ADMIN`, `EVENT_MANAGER`, `MEMBER`, and `USER`
- Membership application review flow with approval and rejection support
- Member profile and account profile management
- Event management, registration, and payment verification flow
- Notice publishing for different audience groups
- Site settings management for homepage, about page, FAQs, impact stats, committee members, and testimonials
- Contact message submission and admin review
- Image upload support with Multer + Cloudinary
- Email workflows for verification, reset password, application updates, and payment receipts

## Tech Stack

### Frontend

- Any SPA or SSR client can consume this API
- Expected to use the backend base URL in its environment configuration
- Uses cookie-based authenticated requests with `credentials: include`

### Backend

- Node.js 22
- Express 5
- TypeScript
- PostgreSQL
- Prisma
- Better Auth
- Zod
- Nodemailer
- Cloudinary
- Stripe

## Project Structure

```text
server_Club/
|-- prisma/
|   |-- migrations/
|   |-- schema/
|   `-- seed.ts
|-- src/
|   |-- config/
|   |-- lib/
|   |-- middlewares/
|   |-- modules/
|   |-- routes/
|   |-- templates/
|   |-- utils/
|   |-- app.ts
|   `-- server.ts
|-- .env.example
|-- package.json
|-- render.yaml
`-- README.md
```

## Main Backend Modules

- `auth` - register, login, logout, session, email verification, password reset, Google auth support
- `account` - logged-in user profile read and update
- `applications` - membership application create, list, details, review
- `members` - member listing, details, profile updates
- `events` - public event listing, event CRUD, registration, payment-failed reporting
- `registrations` - registration list, cancel, payment verification
- `notices` - notice CRUD with audience targeting
- `dashboard` - admin and member dashboard data
- `settings` - public site settings and admin upsert
- `uploads` - authenticated image upload
- `users` - admin user management and role updates
- `testimonials` - public testimonials, user submissions, admin review
- `committee` - public committee data and super admin committee management
- `contacts` - message submission, user history, admin review
- `payments` - Stripe webhook handling

## API Base URL

Local backend base URL:

```text
http://localhost:5000/api/v1
```

Auth base path:

```text
http://localhost:5000/api/v1/auth
```

## Important Routes

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/session`

### Account and membership

- `GET /api/v1/account/profile`
- `PATCH /api/v1/account/profile`
- `POST /api/v1/applications`
- `GET /api/v1/applications`
- `GET /api/v1/applications/:id`
- `PATCH /api/v1/applications/:id/review`
- `GET /api/v1/members`
- `GET /api/v1/members/:id`
- `PATCH /api/v1/members/:id`

### Events and registrations

- `GET /api/v1/events`
- `GET /api/v1/events/:id`
- `POST /api/v1/events`
- `PATCH /api/v1/events/:id`
- `DELETE /api/v1/events/:id`
- `POST /api/v1/events/:id/register`
- `POST /api/v1/events/:id/payment-failed`
- `GET /api/v1/registrations`
- `PATCH /api/v1/registrations/:id/verify-payment`
- `PATCH /api/v1/registrations/:id/cancel`

### Content and admin

- `GET /api/v1/notices`
- `POST /api/v1/notices`
- `PATCH /api/v1/notices/:id`
- `DELETE /api/v1/notices/:id`
- `GET /api/v1/dashboard/admin`
- `GET /api/v1/dashboard/member`
- `GET /api/v1/settings`
- `PUT /api/v1/settings`
- `POST /api/v1/uploads/image`
- `GET /api/v1/users`
- `PATCH /api/v1/users/:id/role`

### Public-facing content

- `GET /api/v1/testimonials`
- `GET /api/v1/committee/public`

### Communication

- `POST /api/v1/contacts`
- `GET /api/v1/contacts/mine`
- `GET /api/v1/contacts/admin`
- `PATCH /api/v1/contacts/:id/review`

### Payments

- `POST /api/v1/payments/stripe/webhook`

## Authentication and Roles

The backend uses `better-auth` with cookie-based sessions.

### Supported roles

- `SUPER_ADMIN`
- `ADMIN`
- `EVENT_MANAGER`
- `MEMBER`
- `USER`

### Auth features

- Email and password authentication
- Email verification
- Password reset by email
- Optional Google sign-in when Google credentials are configured
- Secure cookies in production
- Trusted frontend origins through `CLIENT_URL` and `CLIENT_URLS`

## Frontend Integration Notes

To connect the frontend with this backend:

- Point frontend API calls to the backend base URL
- Send authenticated requests with cookies enabled
- Make sure the frontend origin is included in backend `CLIENT_URL` or `CLIENT_URLS`
- Use the backend auth endpoints directly for session-based login flow
- Handle email verification redirect through the frontend route `/verify-email?status=success`

This backend already expects a frontend client URL and uses it in:

- CORS allow-list
- Better Auth trusted origins
- Email verification callback URLs

## Environment Variables

Use `.env.example` as the starting point.

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
CLIENT_URLS=http://localhost:3000,https://xyztechclub.vercel.app
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/club_management
BETTER_AUTH_SECRET=replace-with-a-strong-secret
BETTER_AUTH_URL=http://localhost:5000
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Local Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Create `.env` from `.env.example` and set your values.

### 3. Generate Prisma client

```bash
pnpm run generate
```

### 4. Run database migrations

```bash
pnpm run migrate
```

### 5. Seed demo data

```bash
pnpm run seed
```

### 6. Start the backend

```bash
pnpm run dev
```

## Available Scripts

- `pnpm run dev` - run in watch mode
- `pnpm run start:dev` - run once with `tsx`
- `pnpm run build` - generate Prisma client and build with `tsup`
- `pnpm run start` - run compiled server
- `pnpm run typecheck` - TypeScript check
- `pnpm run lint` - ESLint
- `pnpm run lint:fix` - ESLint auto fix
- `pnpm run format` - Prettier write
- `pnpm run format:check` - Prettier check
- `pnpm run check` - typecheck + lint + format check
- `pnpm run migrate` - Prisma migrate dev
- `pnpm run migrate:deploy` - Prisma migrate deploy
- `pnpm run migrate:reset` - reset database
- `pnpm run db:push` - push schema
- `pnpm run db:pull` - pull schema
- `pnpm run db:seed` - seed database
- `pnpm run studio` - open Prisma Studio
- `pnpm run stripe:webhook` - forward Stripe webhook to local backend

## Seed Data

The seed script prepares:

- One super admin
- Additional admins and event managers
- Members, applicants, and general users
- Site settings content for homepage and about page
- Notices
- Events
- Committee sessions and assignments
- Testimonials
- Contact messages

Default seeded admin credentials:

```text
Email: admin@club.com
Password: Admin12345
```

These can be overridden through seed environment variables.

## Security and Platform Behavior

- `helmet` for security headers
- `express-rate-limit` on API requests
- CORS restricted to configured frontend origins
- Zod validation for body and query validation
- Central error handling
- Role-protected routes
- HTTP-only cookies in production mode

## Deployment

The repository includes `render.yaml` for backend deployment on Render.

### Build command

```bash
pnpm run build
```

### Start command

```bash
pnpm run migrate:deploy && pnpm start
```

### Current deployment expectation

- Backend can be deployed on Render
- Frontend can be deployed separately, such as on Vercel
- Production frontend domain must be added to `CLIENT_URL` or `CLIENT_URLS`

## Root Response

The server root returns a simple success response:

```text
GET /
```

Response includes:

- server status
- current environment
- uptime

## Summary

This project is a full-stack club management platform where:

- the **frontend** handles the user experience for public pages, dashboards, and admin panels
- the **backend** in this repository handles authentication, business logic, database access, email, uploads, and payments

If you also keep the frontend in a separate repository, this README can serve as the shared backend reference for both sides.
