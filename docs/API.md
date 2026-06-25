# API Reference

Base URL: `/api` (same origin in production; proxied to `:3001` in local dev)

All JSON responses use `Content-Type: application/json`.

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

Use the token in protected requests:

```
Authorization: Bearer <jwt>
```

---

## Projects

### `GET /api/projects`

Public. Returns all projects sorted by `order` ascending.

**Response 200:**

```json
[
  {
    "_id": "...",
    "title": "TaskMaster",
    "description": "...",
    "image": "/TaskMaster.png",
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
  "image": "https://bucket.s3.amazonaws.com/projects/...",
  "link": "https://github.com/...",
  "order": 0
}
```

**Response 201:** Created project object  
**Response 400:** Validation errors  
**Response 401:** Missing/invalid token  
**Response 503:** Database unavailable

---

### `PUT /api/projects/:id`

**Protected.** Update a project by MongoDB `_id`.

**Body:** Same as POST (all fields required by schema).

**Response 200:** Updated project  
**Response 404:** Project not found

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

**Content-Type:** `multipart/form-data`  
**Field name:** `image`  
**Max size:** 5 MB  
**Allowed types:** `image/*`

**Response 200:**

```json
{
  "imageUrl": "https://farely-profile-photos.s3.us-east-1.amazonaws.com/projects/1234567890-screenshot.png"
}
```

**Response 400:** No file / invalid file type  
**Response 401:** Missing/invalid token  
**Response 500:** S3 upload failure

---

## Contact

### `POST /api/contact`

Public. Sends a contact form email via Brevo.

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

**Response 400:** Validation errors  
**Response 503:** Brevo not configured

---

## Validation Error Format

```json
{
  "errors": [
    { "field": "title", "message": "Project title is required" },
    { "field": "link", "message": "Project link must be a valid URL" }
  ]
}
```
