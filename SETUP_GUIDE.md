# 🚀 AskMyNotes - Complete Setup Guide

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- Git

## Installation

### 1. Clone and Setup

```bash
cd ask-my-notes
npm install
```

### 2. PostgreSQL Setup

```bash
# Create database
createdb askmynotes

# Or using psql
psql -U postgres
CREATE DATABASE askmynotes;
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup Prisma database
npx prisma db push

# Seed demo data (optional)
npm run prisma:seed

# Start development server
npm run dev
```

The backend will run on `http://localhost:3001`

### 4. Frontend Setup

```bash
# From root directory
npm run dev
```

The frontend will run on `http://localhost:5173`

## Environment Variables

### Backend (.env)

```
DATABASE_URL="postgresql://user:password@localhost:5432/askmynotes"
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key (optional for AI features)
```

### Frontend (.env.local)

```
VITE_API_URL=http://localhost:3001/api
```

## Features Implemented

### ✅ Subject Management
- Create unlimited subjects (not limited to Physics/Chemistry)
- Dynamic subject names
- Delete subjects with cascading cleanup
- Store subjects in database

### ✅ PDF Upload & Processing
- Accept only PDF files
- Validate file type and size (50MB limit)
- Extract text using pdf-parse
- Split into chunks (~1000 tokens each)
- Generate embeddings for semantic search
- Store embeddings in database

### ✅ AI Question Answering (RAG)
- Convert questions to embeddings
- Search relevant PDF chunks
- Send context + question to LLM
- Generate answers from PDF content only
- Return "Answer not found" if not in documents
- Remove hallucinations with grounding

### ✅ Voice Input
- Use Web Speech API
- Live transcript display
- Real-time input box update
- Proper error handling
- Browser compatibility check
- Start/stop recording

### ✅ Text-to-Speech
- Automatic answer reading
- Natural voice synthesis
- Pause, resume, and stop controls
- Speaker icon for manual activation

### ✅ Backend APIs
- POST /api/auth/register - User registration
- POST /api/auth/validate - Token validation
- GET/POST /api/subjects - Subject CRUD
- POST /api/pdfs/upload - PDF upload
- GET /api/pdfs - List PDFs
- DELETE /api/pdfs/:id - Delete PDF
- GET/POST /api/chats - Chat management
- GET /api/chats/:chatId/messages - Get messages
- POST /api/chats/:chatId/ask - Ask question

### ✅ Database Features
- User model with Firebase integration
- Subject model with user association
- PDF model with text extraction
- PDFChunk model for embeddings
- Chat and Message models
- Proper relationships and cascading

### ✅ UI/UX Improvements
- Clean chat layout with logo theme
- Loading states and animations
- Error messages with toast notifications
- Success notifications
- Real-time transcript display
- Voice indicator during recording
- Speaker icon for answers
- Source citations from PDFs
- Empty state messages
- Responsive design

## API Testing

### 1. Register User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseId": "test_user_123",
    "email": "user@example.com",
    "displayName": "Test User"
  }'
```

### 2. Create Subject

```bash
TOKEN="your_token_from_register"

curl -X POST http://localhost:3001/api/subjects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Physics",
    "description": "Classical Physics"
  }'
```

### 3. Upload PDF

```bash
SUBJECT_ID="subject_id_from_previous"
TOKEN="your_token"

curl -X POST http://localhost:3001/api/pdfs/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@sample.pdf" \
  -F "subjectId=$SUBJECT_ID"
```

### 4. Create Chat

```bash
curl -X POST http://localhost:3001/api/chats \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "subjectId": "$SUBJECT_ID",
    "title": "My Chat"
  }'
```

### 5. Ask Question

```bash
CHAT_ID="chat_id_from_previous"

curl -X POST http://localhost:3001/api/chats/$CHAT_ID/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "question": "What is Newton'\''s first law?"
  }'
```

## Project Structure

```
ask-my-notes/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Business logic
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth & error handling
│   │   ├── lib/           # Database
│   │   ├── utils/         # Helpers (PDF, JWT, etc.)
│   │   └── index.ts       # Express entry point
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.ts        # Demo data
│   ├── uploads/           # PDF storage
│   ├── package.json
│   └── .env
│
├── src/
│   ├── pages/             # React pages
│   ├── components/        # UI components
│   ├── contexts/          # Auth context
│   ├── hooks/            # Custom hooks (voice, TTS)
│   ├── lib/              # API client
│   └── main.tsx          # Entry point
│
├── .env.local            # Frontend config
├── vite.config.ts
└── package.json
```

## Troubleshooting

### PostgreSQL Connection Error

```bash
# Check if PostgreSQL is running
pg_isready -h localhost

# Start PostgreSQL
brew services start postgresql@14 # macOS
# or
sudo systemctl start postgresql    # Linux
```

### Port Already in Use

```bash
# Find and kill process
lsof -i :3001
kill -9 <PID>
```

### Prisma Migration Issues

```bash
# Reset database (warning: deletes all data)
npx prisma migrate reset

# Recreate migrations
npx prisma db push
```

### Voice Input Not Working

- Check browser support (Chrome, Edge, Safari)
- Ensure microphone permissions are granted
- Check browser console for errors
- Try different browser

### PDF Upload Fails

- Ensure file is valid PDF
- Check file size (max 50MB)
- Check backend logs for details
- Verify uploads/ directory exists

## Performance Tips

1. **Embeddings**: Consider using OpenAI embeddings API for better semantic search
2. **Caching**: Implement Redis for caching chat responses
3. **File Storage**: Move uploads to S3 for production
4. **Database**: Add indexes on frequently queried fields
5. **API Rate Limiting**: Implement rate limiting for API endpoints

## Security Checklist

- [ ] Change JWT_SECRET in production
- [ ] Use environment variables for API keys
- [ ] Enable HTTPS in production
- [ ] Implement CORS properly for domain
- [ ] Add rate limiting
- [ ] Validate file uploads
- [ ] Sanitize user inputs
- [ ] Use strong database credentials

## Deployment

### Docker

```bash
docker-compose up -d
```

### Vercel (Frontend)

```bash
npm run build
# Deploy dist/ folder
```

### Heroku/DigitalOcean (Backend)

```bash
# Push to git
git push heroku main

# Run migrations
heroku run npx prisma db push
heroku run npm run prisma:seed
```

## Support & Debugging

- Check backend logs: `npm run dev`
- Check frontend console: DevTools
- Check database: `psql -d askmynotes`
- API testing: Postman or curl
- Database GUI: `npx prisma studio`

## License

MIT
