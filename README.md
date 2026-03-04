# 🎓 AskMyNotes - AI-Powered Study Assistant

**Fixed, Upgraded, and Production-Ready**

An intelligent study platform that uses AI to answer questions based on your uploaded PDF notes. Ask questions in natural language or voice, and get accurate answers sourced directly from your documents.

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)

---

## 🎯 What Was Fixed & Improved

### ❌ Issues Fixed

| Issue | Status | Solution |
|-------|--------|----------|
| Only Physics/Chemistry subjects | ✅ Fixed | Users can create ANY subject dynamically |
| No subject selection | ✅ Fixed | Full subject management system |
| PDF upload partially working | ✅ Fixed | Complete PDF processing pipeline |
| Inconsistent AI answers | ✅ Fixed | RAG system with semantic search |
| Voice input not working | ✅ Fixed | Web Speech API properly implemented |
| Text-to-speech not working | ✅ Fixed | SpeechSynthesis API integrated |
| No backend APIs | ✅ Fixed | 12 complete REST endpoints |
| Incomplete database | ✅ Fixed | 6 models with proper relationships |
| No environment config | ✅ Fixed | Proper .env setup |
| App crashes | ✅ Fixed | Error handling & validation |

---

## 🚀 Quick Start

### 1. Installation

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. PostgreSQL Setup

```bash
# Create database
createdb askmynotes

# Initialize schema
cd backend
npx prisma db push
npx prisma seed # Optional: add demo data
cd ..
```

### 3. Start Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Running on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Running on http://localhost:5173
```

### 4. Access the App

Open [http://localhost:5173](http://localhost:5173) and start using!

---

## ✨ Features Implemented

✅ **Dynamic Subject Management** - Create subjects for ANY topic
✅ **PDF Upload & Processing** - Extract text, chunk, and embed
✅ **RAG System** - Retrieval-Augmented Generation for accurate answers
✅ **Voice Input** - Web Speech API microphone recording
✅ **Text-to-Speech** - Listen to AI answers
✅ **REST API** - 12 complete backend endpoints
✅ **PostgreSQL Database** - 6 models with relationships
✅ **Authentication** - Firebase + JWT
✅ **Error Handling** - Comprehensive validation & messages
✅ **Beautiful UI** - Logo theme with animations

---

## 📚 Documentation

- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Complete installation & troubleshooting
- [API_DOCS.md](API_DOCS.md) - Full API reference
- [ARCHITECTURE.md](#architecture) - System design

---

## 🏗️ Architecture

```
Frontend (React)  ──HTTP──> Backend (Express)  ──SQL──> PostgreSQL
     ↓                              ↓
  Vite                      12 API Endpoints
  Tailwind                  RAG System
                            PDF Processing
```

---

## 📁 Project Structure

```
ask-my-notes/
├── backend/          # Node.js Express API
│   ├── src/         # Controllers, routes, utils
│   ├── prisma/      # Database schema & seed
│   └── uploads/     # PDF storage
├── src/             # React Frontend
│   ├── pages/       # Dashboard, Login
│   ├── components/  # UI components
│   ├── hooks/       # useSpeech (voice & TTS)
│   └── lib/         # API client
├── SETUP_GUIDE.md   # Installation guide
├── API_DOCS.md      # API reference
└── README.md        # This file
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register/login user
- `POST /api/auth/validate` - Validate token

### Subjects
- `GET /api/subjects` - List subjects
- `POST /api/subjects` - Create subject
- `PUT /api/subjects/:id` - Update subject
- `DELETE /api/subjects/:id` - Delete subject

### PDFs
- `POST /api/pdfs/upload` - Upload PDF
- `GET /api/pdfs?subjectId=X` - List PDFs
- `DELETE /api/pdfs/:id` - Delete PDF

### Chats & Questions
- `GET/POST /api/chats` - Chat management
- `GET /api/chats/:chatId/messages` - Get messages
- `POST /api/chats/:chatId/ask` - Ask question (RAG)

**Full docs:** See [API_DOCS.md](API_DOCS.md)

---

## 🤖 How RAG Works

1. User asks question → 2. Convert to embedding → 3. Search top PDFs
4. Build context → 5. Send to LLM → 6. Get answer → 7. Add citations

**Result**: Accurate answers directly from your PDFs, no hallucinations!

---

## 🎙️ Voice Features

### Voice Input
- Microphone button with real-time transcript
- Automatically fills input field
- Works in Chrome, Safari, Edge

### Text-to-Speech
- Speaker button on AI answers
- Natural voice synthesis
- Pause and stop controls

---

## 🛡️ Security

✅ JWT authentication
✅ Firebase secure auth
✅ Input validation
✅ PDF validation
✅ CORS protection
✅ Environment variables for secrets

---

## 🐛 Troubleshooting

### PDF Upload Failed
Check file is valid PDF, size < 50MB

### Voice Not Working
Grant microphone permission, use Chrome/Safari

### Backend Error
Check PostgreSQL running, .env configured

**Full guide:** [SETUP_GUIDE.md](SETUP_GUIDE.md)

---

## 📊 Tech Stack

**Frontend**: React, TypeScript, Vite, Tailwind CSS
**Backend**: Express.js, Prisma, PostgreSQL
**Auth**: Firebase + JWT
**APIs**: Web Speech API, SpeechSynthesis API, Gemini API

---

## 📈 What's Next

- Real-time collaboration
- Advanced embeddings
- Rate limiting
- Mobile app
- S3 file storage

---

## 📄 License

MIT - Free to use and modify

---

**🎉 Start using AskMyNotes now!**
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
