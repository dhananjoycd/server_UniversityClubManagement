# Backend Architecture Blueprint

## 1️⃣ Project Setup (Foundation)

### Stack

- **Node.js**
- **Express.js**
- **TypeScript**
- **PostgreSQL**
- **Prisma ORM**

### Core Tools

- dotenv
- better-auth
- cors
- cookie-parser
- zod
- nodemailer
- cloudinary

### Dev Tools

- eslint
- prettier
- ts-node-dev / tsx

---

## 2️⃣ Clean Folder Structure (Production Style)

```txtbackend/
├─ prisma/
│  ├─ migrations/
│  └─ schema.prisma
│
├─ src/
│  ├─ server.ts
│  ├─ app.ts
│  │
│  ├─ config/
│  │  ├─ env.ts
│  │  ├─ db.ts
│  │  ├─ betterAuth.ts
│  │  ├─ stripe.ts
│  │  ├─ cloudinary.ts
│  │  └─ multer.ts
│  │
│  ├─ middlewares/
│  │  ├─ auth.middleware.ts
│  │  ├─ role.middleware.ts
│  │  ├─ validateRequest.ts
│  │  ├─ errorHandler.ts
│  │  └─ notFound.ts
│  │
│  ├─ utils/
│  │  ├─ catchAsync.ts
│  │  ├─ sendResponse.ts
│  │  ├─ AppError.ts
│  │  └─ queryBuilder.ts
│  │
│  ├─ templates/
│  │  ├─ applicationReceived.ejs
│  │  ├─ applicationApproved.ejs
│  │  ├─ applicationRejected.ejs
│  │  └─ paymentReceipt.ejs
│  │
│  ├─ lib/
│  │  └─ prisma.ts
│  │
│  ├─ routes/
│  │  └─ index.ts
│  │
│  └─ modules/
│     ├─ auth/
│     ├─ users/
│     ├─ applications/
│     ├─ members/
│     ├─ events/
│     ├─ registrations/
│     ├─ notices/
│     ├─ payments/
│     ├─ dashboard/
│     ├─ settings/
│     └─ uploads/
│
├─ .env.example
├─ package.json
├─ tsconfig.json
└─ eslint.config.mjs
```

এই structure **enterprise standard**।

---

# 3️⃣ Database Design (Clean Relational Model)

### Core Tables

### users

```text
id
name
email
password
role
created_at
updated_at
```

roles enum:

```
SUPER_ADMIN
ADMIN
EVENT_MANAGER
MEMBER
```

---

### membership_applications

```text
id
user_id
department
session
student_id
district
phone
status
submitted_at
reviewed_at
reviewed_by
```

status:

```
PENDING
APPROVED
REJECTED
```

---

### member_profiles

```text
id
user_id
membership_id
join_date
bio
profile_photo
status
```

status:

```
ACTIVE
SUSPENDED
```

---

### events

```text
id
title
description
location
event_date
capacity
created_by
created_at
updated_at
```

---

### event_registrations

```text
id
event_id
member_id
status
registered_at
```

status:

```
REGISTERED
WAITLISTED
CANCELLED
```

---

### notices

```text
id
title
content
audience
created_by
created_at
```

audience:

```
ALL
MEMBERS
ADMINS
```

---

### site_settings

```text
id
organization_name
logo_url
contact_email
phone
social_links
about_text
```

---

# 4️⃣ Authentication System

Auth flow:

```
register
login
logout
session verify
```

Security:

- hashed passwords (bcrypt)
- httpOnly cookies
- session validation
- token expiry

Middleware:

```
authMiddleware
roleMiddleware
```

Example:

```ts
router.get("/admin/dashboard", authMiddleware, roleMiddleware("ADMIN"), controller);
```

---

# 5️⃣ Core Backend Modules

MVP modules:

### auth

login / register / logout

### applications

membership apply

### members

member profile

### events

event CRUD

### registrations

event registration

### notices

announcement system

### dashboard

statistics

### settings

organization settings

---

# 6️⃣ REST API Design (Clean & Versioned)

```text
/api/v1/auth/login
/api/v1/auth/register
/api/v1/auth/logout

/api/v1/applications
/api/v1/applications/:id/review

/api/v1/members
/api/v1/members/:id

/api/v1/events
/api/v1/events/:id

/api/v1/events/:id/register

/api/v1/notices
/api/v1/notices/:id

/api/v1/dashboard/admin
/api/v1/dashboard/member
```

---

# 7️⃣ Validation Layer (Zod)

Every request validate হবে।

Example:

```ts
const createEventSchema = z.object({
  title: z.string(),
  description: z.string(),
  eventDate: z.string(),
  capacity: z.number(),
});
```

Middleware:

```
validateRequest(schema)
```

---

# 8️⃣ Error Handling System

Global error handler থাকবে।

Example error types:

```
ValidationError
UnauthorizedError
ForbiddenError
NotFoundError
```

Response format:

```json
{
 "success": false,
 "message": "Unauthorized",
 "error": {...}
}
```

---

# 9️⃣ File Upload System

Flow:

```
Client
↓
Express
↓
Multer
↓
Cloudinary
↓
DB store image URL
```

Use cases:

- profile photo
- event banner
- gallery

---

# 🔟 Email Notification System

Use **Nodemailer**

Emails:

### membership application received

### application approved

### application rejected

Example template:

```
Hello,

Your membership application has been approved.

Welcome to the organization.
```

---

# 11️⃣ Security Layer

Add:

- CORS
- rate limiting
- helmet
- input validation
- protected admin routes

---

# 12️⃣ Testing Layer

Test with:

- Postman
- Thunder Client

Test scenarios:

- login
- application submit
- admin approve
- event create
- event register

---

# 13️⃣ Dashboard Statistics

Admin dashboard API:

```
total members
pending applications
total events
recent notices
```

Member dashboard:

```
profile status
upcoming events
registered events
```

---

# Final MVP Feature Set

Backend MVP:

```
Auth
Membership application
Admin approve/reject
Member profile
Event CRUD
Event registration
Notice CRUD
Admin dashboard stats
Member dashboard
```

---

# Final Work Order (Perfect Sequence)

1️⃣ Express + TypeScript setup
2️⃣ Prisma + PostgreSQL
3️⃣ Schema design
4️⃣ Migration run
5️⃣ Auth system
6️⃣ Role middleware
7️⃣ Applications module
8️⃣ Members module
9️⃣ Events module
🔟 Registrations module
11️⃣ Notices module
12️⃣ Dashboard stats
13️⃣ Settings module
14️⃣ Cloudinary integration
15️⃣ Email system
16️⃣ Final security + testing

---

---

## TEST BY `POSTMAN`

**Setup**

Base URL:

```text
http://localhost:5000/api/v1
```

Before Postman:

```bash
pnpm prisma db push
pnpm run seed
pnpm run dev
```

Use Postman cookie jar enabled, because login is session-based.

Create 2 environments if you want:

- `baseUrl = http://localhost:5000/api/v1`
- `memberEmail = member1@example.com`
- `memberPassword = Test12345`
- `adminEmail = admin@club.com`
- `adminPassword = Admin12345`

---

**1. Health Check**

Request:

```http
GET {{baseUrl}}/health
```

Expected:

- `200 OK`
- success true

---

**2. Register Member**

Request:

```http
POST {{baseUrl}}/auth/register
Content-Type: application/json
```

Body:

```json
{
  "name": "Member One",
  "email": "member1@example.com",
  "password": "Test12345"
}
```

Expected:

- `201`
- user created
- auth cookie may be set

Demo data:

- name: `Member One`
- email: `member1@example.com`
- password: `Test12345`

---

**3. Login Member**

Request:

```http
POST {{baseUrl}}/auth/login
Content-Type: application/json
```

Body:

```json
{
  "email": "member1@example.com",
  "password": "Test12345"
}
```

Expected:

- `200`
- session cookie set

Important:

- Save this in a Postman folder called `Member Flow`

---

**4. Check Member Session**

Request:

```http
GET {{baseUrl}}/auth/session
```

Expected:

- `200`
- current logged-in member data

---

**5. Create Membership Application**

Request:

```http
POST {{baseUrl}}/applications
Content-Type: application/json
```

Body:

```json
{
  "department": "CSE",
  "session": "2021-22",
  "studentId": "CSE-2021-001",
  "district": "Dhaka",
  "phone": "01700000001"
}
```

Expected:

- `201`
- application created

---

**6. Get My Applications**

Request:

```http
GET {{baseUrl}}/applications?page=1&limit=10
```

Expected:

- `200`
- list with your application

Copy the returned `application.id`

Example variable:

- `applicationId = paste_here`

---

**7. Get Single Application**

Request:

```http
GET {{baseUrl}}/applications/{{applicationId}}
```

Expected:

- `200`

---

**8. Logout Member**

Request:

```http
POST {{baseUrl}}/auth/logout
```

Expected:

- `200`

---

**9. Login Admin**

Seeded admin credentials:

- email: `admin@club.com`
- password: `Admin12345`

Request:

```http
POST {{baseUrl}}/auth/login
Content-Type: application/json
```

Body:

```json
{
  "email": "admin@club.com",
  "password": "Admin12345"
}
```

Expected:

- `200`

Put this in a separate Postman folder called `Admin Flow`

---

**10. Check Admin Session**

Request:

```http
GET {{baseUrl}}/auth/session
```

Expected:

- `200`
- role should be `SUPER_ADMIN`

---

**11. Review Application as Admin**

Approve request:

```http
PATCH {{baseUrl}}/applications/{{applicationId}}/review
Content-Type: application/json
```

Body:

```json
{
  "status": "APPROVED"
}
```

Expected:

- `200`
- application approved
- member profile auto-created

Alternative reject body:

```json
{
  "status": "REJECTED",
  "reason": "Incomplete profile"
}
```

---

**12. List Members**

Request:

```http
GET {{baseUrl}}/members?page=1&limit=10
```

Expected:

- `200`
- approved user now appears as member

Copy `memberId`

Example:

- `memberId = paste_here`

---

**13. Get Single Member**

Request:

```http
GET {{baseUrl}}/members/{{memberId}}
```

Expected:

- `200`

---

**14. Create Event**

Request:

```http
POST {{baseUrl}}/events
Content-Type: application/json
```

Body:

```json
{
  "title": "Annual Tech Fest",
  "description": "Main annual event for all members",
  "location": "Central Auditorium",
  "eventDate": "2026-04-10T10:00:00.000Z",
  "capacity": 100
}
```

Expected:

- `201`

Copy `eventId`

Example:

- `eventId = paste_here`

---

**15. Get All Events**

Request:

```http
GET {{baseUrl}}/events?page=1&limit=10
```

Expected:

- `200`

---

**16. Get Event by ID**

Request:

```http
GET {{baseUrl}}/events/{{eventId}}
```

Expected:

- `200`

---

**17. Update Event**

Request:

```http
PATCH {{baseUrl}}/events/{{eventId}}
Content-Type: application/json
```

Body:

```json
{
  "location": "Main Hall",
  "capacity": 120
}
```

Expected:

- `200`

---

**18. Create Notice**

Request:

```http
POST {{baseUrl}}/notices
Content-Type: application/json
```

Body:

```json
{
  "title": "General Meeting",
  "content": "All members must attend the meeting at 3 PM.",
  "audience": "ALL"
}
```

Expected:

- `201`

Copy `noticeId`

---

**19. List Notices**

Request:

```http
GET {{baseUrl}}/notices?page=1&limit=10
```

Expected:

- `200`

---

**20. Update Notice**

Request:

```http
PATCH {{baseUrl}}/notices/{{noticeId}}
Content-Type: application/json
```

Body:

```json
{
  "title": "Updated General Meeting"
}
```

Expected:

- `200`

---

**21. Get Admin Dashboard**

Request:

```http
GET {{baseUrl}}/dashboard/admin
```

Expected:

- `200`
- should show totals

---

**22. Test Admin Access Route**

Request:

```http
GET {{baseUrl}}/dashboard/test/admin
```

Expected:

- `200`

---

**23. Update Site Settings**

Request:

```http
PUT {{baseUrl}}/settings
Content-Type: application/json
```

Body:

```json
{
  "organizationName": "Club Management System",
  "contactEmail": "club@example.com",
  "phone": "01711111111",
  "aboutText": "Official backend for club operations"
}
```

Expected:

- `200`

---

**24. Get Site Settings**

Request:

```http
GET {{baseUrl}}/settings
```

Expected:

- `200`

---

**25. Logout Admin**

Request:

```http
POST {{baseUrl}}/auth/logout
```

Expected:

- `200`

---

**26. Login Member Again**

Request:

```http
POST {{baseUrl}}/auth/login
Content-Type: application/json
```

Body:

```json
{
  "email": "member1@example.com",
  "password": "Test12345"
}
```

Expected:

- `200`

---

**27. Register for Event as Member**

Request:

```http
POST {{baseUrl}}/events/{{eventId}}/register
```

Expected:

- `201`
- registration created

Copy `registrationId` from response

---

**28. Get My Registrations**

Request:

```http
GET {{baseUrl}}/registrations?page=1&limit=10
```

Expected:

- `200`

---

**29. Get Member Dashboard**

Request:

```http
GET {{baseUrl}}/dashboard/member
```

Expected:

- `200`
- registered event should appear

---

**30. Cancel Registration**

Request:

```http
PATCH {{baseUrl}}/registrations/{{registrationId}}/cancel
```

Expected:

- `200`

---

**31. Negative Tests**

Protected route without login:

```http
GET {{baseUrl}}/dashboard/member
```

Expected:

- `401`

Member trying admin route:

```http
GET {{baseUrl}}/dashboard/admin
```

Expected:

- `403`

Invalid event payload:

```http
POST {{baseUrl}}/events
Content-Type: application/json
```

Body:

```json
{
  "title": "",
  "capacity": "wrong"
}
```

Expected:

- `400`

Unknown route:

```http
GET {{baseUrl}}/unknown-route
```

Expected:

- `404`

---

**Suggested Postman Folder Order**

- `01 Health`
- `02 Member Auth`
- `03 Member Application`
- `04 Admin Auth`
- `05 Admin Review`
- `06 Members`
- `07 Events`
- `08 Notices`
- `09 Dashboard`
- `10 Settings`
- `11 Member Event Registration`
- `12 Negative Tests`

---

---
