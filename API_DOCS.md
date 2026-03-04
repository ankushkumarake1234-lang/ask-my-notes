# 📚 AskMyNotes - API Documentation

Base URL: `http://localhost:3001/api`

## Authentication

All endpoints (except `/auth/register`) require Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

Token is obtained from `/api/auth/register` response.

---

## Authentication Routes

### POST /auth/register

Register or login a user (Firebase integration).

**Request:**
```json
{
  "firebaseId": "firebase_uid",
  "email": "user@example.com",
  "displayName": "User Name",
  "photoUrl": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "displayName": "User Name",
    "photoUrl": "https://..."
  },
  "token": "eyJhbGc..."
}
```

**Status:** 200 OK, 400 Bad Request, 500 Internal Error

---

### POST /auth/validate

Validate JWT token and get user info.

**Request:**
```json
{
  "userId": "user_id"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "displayName": "User Name",
    "createdAt": "2024-03-01T10:00:00Z"
  }
}
```

**Status:** 200 OK, 401 Unauthorized

---

## Subject Routes

### GET /subjects

Get all subjects for the current user.

**Response:**
```json
{
  "success": true,
  "subjects": [
    {
      "id": "subject_id",
      "name": "Physics",
      "description": "Classical Physics",
      "pdfs": [
        {
          "id": "pdf_id",
          "originalFileName": "mechanics.pdf",
          "pageCount": 45
        }
      ],
      "_count": {
        "chats": 3
      },
      "createdAt": "2024-03-01T10:00:00Z"
    }
  ]
}
```

**Status:** 200 OK, 401 Unauthorized

---

### POST /subjects

Create a new subject.

**Request:**
```json
{
  "name": "Mathematics",
  "description": "Calculus and Algebra"
}
```

**Response:**
```json
{
  "success": true,
  "subject": {
    "id": "subject_id",
    "name": "Mathematics",
    "description": "Calculus and Algebra",
    "userId": "user_id",
    "createdAt": "2024-03-01T10:00:00Z"
  }
}
```

**Status:** 201 Created, 400 Bad Request, 401 Unauthorized

---

### PUT /subjects/:id

Update a subject.

**Request:**
```json
{
  "name": "Advanced Mathematics",
  "description": "Advanced Calculus"
}
```

**Response:**
```json
{
  "success": true,
  "subject": {
    "id": "subject_id",
    "name": "Advanced Mathematics",
    "description": "Advanced Calculus",
    "updatedAt": "2024-03-01T10:00:00Z"
  }
}
```

**Status:** 200 OK, 404 Not Found, 401 Unauthorized

---

### DELETE /subjects/:id

Delete a subject and all associated PDFs and chats.

**Response:**
```json
{
  "success": true,
  "message": "Subject deleted"
}
```

**Status:** 200 OK, 404 Not Found, 401 Unauthorized

---

## PDF Routes

### POST /pdfs/upload

Upload a PDF file to a subject.

**Request:**
```
Content-Type: multipart/form-data

file: <binary PDF file>
subjectId: "subject_id"
```

**Response:**
```json
{
  "success": true,
  "pdf": {
    "id": "pdf_id",
    "originalFileName": "mechanics.pdf",
    "pageCount": 45,
    "fileSize": 1024000
  },
  "message": "Uploaded and processed 120 chunks from PDF"
}
```

**Status:** 200 OK, 400 Bad Request, 404 Not Found, 500 Error

**Validations:**
- File must be PDF (application/pdf)
- Maximum size: 50MB
- Subject must belong to current user

---

### GET /pdfs

Get all PDFs for a subject.

**Query Parameters:**
- `subjectId` (required): Subject ID

**Response:**
```json
{
  "success": true,
  "pdfs": [
    {
      "id": "pdf_id",
      "originalFileName": "mechanics.pdf",
      "fileSize": 1024000,
      "pageCount": 45,
      "createdAt": "2024-03-01T10:00:00Z"
    }
  ]
}
```

**Status:** 200 OK, 400 Bad Request, 404 Not Found, 401 Unauthorized

---

### DELETE /pdfs/:id

Delete a PDF and its embeddings.

**Response:**
```json
{
  "success": true,
  "message": "PDF deleted"
}
```

**Status:** 200 OK, 404 Not Found, 401 Unauthorized

---

## Chat Routes

### GET /chats

Get all chats for a subject.

**Query Parameters:**
- `subjectId` (required): Subject ID

**Response:**
```json
{
  "success": true,
  "chats": [
    {
      "id": "chat_id",
      "title": "First Chat",
      "subjectId": "subject_id",
      "_count": {
        "messages": 5
      },
      "createdAt": "2024-03-01T10:00:00Z"
    }
  ]
}
```

**Status:** 200 OK, 400 Bad Request, 404 Not Found, 401 Unauthorized

---

### POST /chats

Create a new chat in a subject.

**Request:**
```json
{
  "subjectId": "subject_id",
  "title": "Kinematics Discussion"
}
```

**Response:**
```json
{
  "success": true,
  "chat": {
    "id": "chat_id",
    "title": "Kinematics Discussion",
    "subjectId": "subject_id",
    "userId": "user_id",
    "createdAt": "2024-03-01T10:00:00Z"
  }
}
```

**Status:** 201 Created, 404 Not Found, 401 Unauthorized

---

### GET /chats/:chatId/messages

Get all messages in a chat.

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "msg_id",
      "role": "user",
      "content": "What is kinematics?",
      "createdAt": "2024-03-01T10:00:00Z"
    },
    {
      "id": "msg_id",
      "role": "assistant",
      "content": "Kinematics is the study of motion...",
      "citations": ["mechanics.pdf — Page 12"],
      "createdAt": "2024-03-01T10:00:01Z"
    }
  ]
}
```

**Status:** 200 OK, 404 Not Found, 401 Unauthorized

---

### POST /chats/:chatId/ask

Ask a question in a chat (RAG system).

**Request:**
```json
{
  "question": "What is Newton's first law?"
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "msg_id",
    "role": "assistant",
    "content": "Newton's first law states that an object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force.\n\nThis is also known as the law of inertia.",
    "citations": [
      "mechanics.pdf — Page 34",
      "physics-notes.pdf — Page 12"
    ],
    "pdfIds": "pdf_id1,pdf_id2",
    "createdAt": "2024-03-01T10:00:00Z"
  }
}
```

**Features:**
- RAG (Retrieval-Augmented Generation)
- Semantic search using embeddings
- Context-aware answers from PDFs
- Source citations
- Prevents hallucinations

**Status:** 200 OK, 404 Not Found, 500 Error

---

### DELETE /chats/:chatId

Delete a chat and all its messages.

**Response:**
```json
{
  "success": true,
  "message": "Chat deleted"
}
```

**Status:** 200 OK, 404 Not Found, 401 Unauthorized

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common Status Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (auth required/failed) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Rate Limiting

Currently no rate limiting implemented. Consider adding for production:

- 100 requests per minute per user
- 10 MB total upload per hour
- 100 chats per user

---

## Pagination

Future implementation planned for:
- Messages pagination
- PDFs pagination
- Subjects pagination

---

## Webhooks

Future feature for:
- PDF processing complete
- Chat created
- Message added

---

## WebSocket Events

Future real-time features:
- Live typing indicator
- Real-time message updates
- Download progress

---

## Testing

### Using cURL

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseId": "test123",
    "email": "test@example.com"
  }'

# Save token from response
TOKEN="eyJhbGc..."

# Create subject
curl -X POST http://localhost:3001/api/subjects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Physics"}'

# Get subjects
curl -X GET http://localhost:3001/api/subjects \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman

1. Create new collection
2. Set Authorization tab to "Bearer Token"
3. Add token from register response
4. Import endpoints as documented above

---

## Changelog

### v1.0.0 (2024-03-01)
- Initial API release
- Authentication with JWT
- Subject management
- PDF upload and processing
- RAG-based QA system
- Chat management

### Planned v1.1.0
- Rate limiting
- Pagination
- WebSocket support
- Email notifications
- Advanced embeddings with OpenAI
