# API Reference

Base URL: `/api` (same origin in production; proxied to `:3001` in local dev)

All JSON responses use `Content-Type: application/json` unless noted.

**Auth header for protected routes:**

```
Authorization: Bearer <jwt>
```

---

## Health

### `GET /api/health`

Public liveness check.

**Response 200:**

```json
{
  "status": "ok",
  "environment": "vercel",
  "timestamp": "2026-06-25T12:00:00.000Z",
  "version": "1.0.0"
}
```

---

## Authentication

### `POST /api/auth/login`

Authenticate as admin. Returns a JWT.

**Body:**

```json
{
  "username": "admin",
  "password": "your-password"
}
```

**Response 200:**

```json
{
  "token": "<jwt>",
  "message": "Login successful"
}
```

**Response 400:** Validation errors  
**Response 401:** Invalid credentials

---

## Projects

### `GET /api/projects`

Public. Returns all projects sorted by `order` ascending. Includes `imageUrl` (presigned) when image is stored in S3.

**Response 200:**

```json
[
  {
    "_id": "...",
    "title": "TaskMaster",
    "description": "...",
    "image": "projects/123-screenshot.png",
    "imageUrl": "https://...presigned...",
    "link": "https://...",
    "order": 0,
    "createdAt": "..."
  }
]
```

Falls back to seed data if MongoDB is unavailable.

---

### `POST /api/projects`

**Protected.** Create a project.

**Body:**

```json
{
  "title": "My Project",
  "description": "What I built...",
  "image": "projects/123-screenshot.png",
  "link": "https://github.com/...",
  "order": 0
}
```

**Response 201:** Created project  
**Response 401:** Missing/invalid token

---

### `PUT /api/projects/:id`

**Protected.** Update a project by MongoDB `_id`.

**Response 200:** Updated project  
**Response 404:** Not found

---

### `DELETE /api/projects/:id`

**Protected.** Delete a project.

**Response 200:**

```json
{
  "message": "Project deleted successfully",
  "id": "..."
}
```

---

### `POST /api/projects/upload`

**Protected.** Upload a project image to S3.

| | |
|--|--|
| **Content-Type** | `multipart/form-data` |
| **Field name** | `image` |
| **Max size** | 5 MB |
| **Allowed types** | `image/*` |

**Response 200:**

```json
{
  "imageKey": "projects/1234567890-screenshot.png",
  "imageUrl": "https://...presigned..."
}
```

Store `imageKey` in the project record (or use `imageUrl` for display only).

---

## Expertise

### `GET /api/expertise`

Public. Returns all expertise items sorted by `order`.

---

### `POST /api/expertise`

**Protected.** Create an expertise item.

**Body:**

```json
{
  "title": "React",
  "description": "Building SPAs...",
  "order": 0
}
```

---

### `PUT /api/expertise/:id`

**Protected.** Update an expertise item.

---

### `DELETE /api/expertise/:id`

**Protected.** Delete an expertise item.

---

## Timeline (Career History)

### `GET /api/timeline`

Public. Returns timeline entries sorted by `order` (0 = top).

---

### `POST /api/timeline`

**Protected.** Create entry. New entries are pushed to order `0` (top of stack).

**Body:**

```json
{
  "title": "Software Engineer",
  "company": "Acme Inc",
  "date": "2024 – Present",
  "description": "..."
}
```

---

### `PUT /api/timeline/:id`

**Protected.** Full update of a timeline entry.

---

### `PATCH /api/timeline/:id`

**Protected.** Partial update — used for reordering (`order` field).

---

### `DELETE /api/timeline/:id`

**Protected.** Delete entry and compact remaining orders.

---

### `POST /api/timeline/normalize`

**Protected.** Re-index all timeline orders to `0..n`. Use "Fix positions" in admin.

---

## Resume

### `GET /api/resume`

Public. Returns presigned URLs for the current resume PDF.

**Response 200 (no resume):**

```json
{ "hasResume": false }
```

**Response 200 (has resume):**

```json
{
  "hasResume": true,
  "fileName": "Riyan-Qadir-Resume.pdf",
  "previewUrl": "https://...presigned...",
  "downloadUrl": "https://...presigned...",
  "updatedAt": "2026-06-25T12:00:00.000Z"
}
```

---

### `POST /api/resume/upload`

**Protected.** Upload or replace resume PDF.

| | |
|--|--|
| **Content-Type** | `multipart/form-data` |
| **Field name** | `resume` |
| **Max size** | 10 MB |
| **Allowed types** | `application/pdf` |

**Response 200:**

```json
{
  "message": "Resume uploaded successfully",
  "fileName": "Resume.pdf",
  "previewUrl": "...",
  "downloadUrl": "...",
  "updatedAt": "..."
}
```

---

## Profile Photo

### `GET /api/profile-photo`

Public. Returns presigned URLs for the profile photo.

**Response 200 (no photo):**

```json
{ "hasProfilePhoto": false }
```

**Response 200 (has photo):**

```json
{
  "hasProfilePhoto": true,
  "fileName": "profile.jpg",
  "imageUrl": "https://...presigned...",
  "previewUrl": "https://...presigned...",
  "downloadUrl": "https://...presigned...",
  "updatedAt": "..."
}
```

---

### `POST /api/profile-photo/upload`

**Protected.** Upload or replace profile photo.

| | |
|--|--|
| **Content-Type** | `multipart/form-data` |
| **Field name** | `photo` |
| **Max size** | 5 MB |
| **Allowed types** | JPEG, PNG, WebP |

**Response 200:**

```json
{
  "message": "Profile photo uploaded successfully",
  "fileName": "profile.jpg",
  "imageUrl": "...",
  "previewUrl": "...",
  "downloadUrl": "...",
  "updatedAt": "..."
}
```

---

## Contact

### `POST /api/contact`

Public. Sends contact form email via Brevo.

**Body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "message": "Hello, I'd like to work with you."
}
```

**Response 200:**

```json
{
  "message": "Message sent successfully!"
}
```

**Response 503:** Brevo not configured

---

## Validation error format

```json
{
  "errors": [
    { "field": "title", "message": "Project title is required" },
    { "field": "link", "message": "Project link must be a valid URL" }
  ]
}
```

---

## Protected routes summary

| Method | Route |
|--------|-------|
| POST | `/api/projects`, `/api/projects/upload` |
| PUT, DELETE | `/api/projects/:id` |
| POST | `/api/expertise` |
| PUT, DELETE | `/api/expertise/:id` |
| POST | `/api/timeline`, `/api/timeline/normalize` |
| PUT, PATCH, DELETE | `/api/timeline/:id` |
| POST | `/api/resume/upload`, `/api/profile-photo/upload` |

All other routes listed above are public (GET) or login/contact.
