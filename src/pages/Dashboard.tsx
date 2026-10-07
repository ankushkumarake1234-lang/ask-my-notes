import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, MessageSquare, Brain, Mic, MicOff, Settings, Plus, Send, Upload, FileText, Trash2, ChevronLeft, Volume2, VolumeX, Pause, Play, Download, Loader,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { subjectsAPI, pdfsAPI, chatsAPI, saveToken, getAuthToken } from "@/lib/api";
import { useVoiceInput, useTextToSpeech } from "@/hooks/useSpeech";
import { toast } from "sonner";

type Subject = { id: string; name: string; description?: string; pdfs?: any[] };
type Message = { id?: string; role: "user" | "assistant"; content: string; citations?: string[] };
type PDF = { id: string; originalFileName: string; pageCount: number; fileSize: number };
type Chat = { id: string; title: string; subjectId: string };

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeSubject, setActiveSubject] = useState<string>("");
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "study" | "voice">("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isListening, transcript, error: voiceError, startListening, stopListening, resetTranscript } = useVoiceInput();
  const { isSpeaking, speak, stop: stopSpeech } = useTextToSpeech();

  // when transcript updates while listening, mirror it into the input field
  useEffect(() => {
    if (isListening && transcript) {
      setInput(transcript);
    }
  }, [transcript, isListening]);

  const currentSubject = subjects.find((s) => s.id === activeSubject);

  // Initialize user and load data
  useEffect(() => {
    const initUser = async () => {
      try {
        if (user) {
          // If a user exists (from Firebase), always attempt to load subjects.
          // Auth token is saved by AuthProvider after register; loadSubjects handles errors.
          await loadSubjects();
        }
      } catch (err) {
        console.error("Init error:", err);
      }
    };
    initUser();
  }, [user]);

  // Load subjects
  const loadSubjects = async () => {
    try {
      const result = await subjectsAPI.getAll();
      setSubjects(result.subjects || []);
      if (result.subjects?.length > 0) {
        setActiveSubject(result.subjects[0].id);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Load PDFs for current subject
  useEffect(() => {
    if (activeSubject) {
      loadPDFs();
      loadChats();
    }
  }, [activeSubject]);

  const loadPDFs = async () => {
    try {
      const result = await pdfsAPI.getBySubject(activeSubject);
      setPdfs(result.pdfs || []);
    } catch (err: any) {
      console.error("Load PDFs error:", err);
    }
  };

  const loadChats = async () => {
    try {
      const result = await chatsAPI.getBySubject(activeSubject);
      setChats(result.chats || []);
      
      // Auto-select first chat or create new one
      if (result.chats?.length > 0) {
        selectChat(result.chats[0]);
      } else {
        createNewChat();
      }
    } catch (err: any) {
      console.error("Load chats error:", err);
    }
  };

  const selectChat = async (chat: Chat) => {
    setActiveChat(chat);
    try {
      const result = await chatsAPI.getMessages(chat.id);
      setMessages(result.messages || []);
    } catch (err: any) {
      toast.error("Failed to load messages");
    }
  };

  const createNewChat = async () => {
    try {
      const result = await chatsAPI.create(activeSubject, `Chat ${new Date().toLocaleTimeString()}`);
      const newChat = result.chat;
      setChats((prev) => [...prev, newChat]);
      selectChat(newChat);
    } catch (err: any) {
      toast.error("Failed to create chat");
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeChat) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const result = await chatsAPI.ask(activeChat.id, userMessage);
      const aiMessage = result.message;
      setMessages((prev) => [...prev, aiMessage]);

      // Auto-speak the answer
      if (aiMessage.content) {
        // Remove markdown and format for speech
        const cleanText = aiMessage.content.replace(/\*\*/g, "").substring(0, 500);
        speak(cleanText);
      }
    } catch (err: any) {
      toast.error(err.message);
      setMessages((prev) => prev.filter((m) => m.content !== userMessage));
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
      if (transcript.trim()) {
        setInput(transcript);
        resetTranscript();
      }
    } else {
      resetTranscript();
      startListening();
    }
  };

  const addSubject = async () => {
    if (!newSubjectName.trim()) return;
    try {
      const result = await subjectsAPI.create(newSubjectName);
      const newSubject = result.subject;
      setSubjects((prev) => [...prev, newSubject]);
      setActiveSubject(newSubject.id);
      setNewSubjectName("");
      setShowNewSubject(false);
      toast.success("Subject created!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteSubject = async (id: string) => {
    try {
      await subjectsAPI.delete(id);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      if (activeSubject === id) {
        setActiveSubject(subjects[0]?.id || "");
      }
      toast.success("Subject deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSubject) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }

    setUploading(true);
    try {
      const result = await pdfsAPI.upload(file, activeSubject);
      toast.success(`PDF uploaded: ${result.pdf.originalFileName}`);
      await loadPDFs();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const deletePDF = async (id: string) => {
    try {
      await pdfsAPI.delete(id);
      setPdfs((prev) => prev.filter((p) => p.id !== id));
      toast.success("PDF deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const navItems = [
    { id: "chat" as const, icon: MessageSquare, label: "Chat" },
    { id: "study" as const, icon: Brain, label: "Study Mode" },
    { id: "voice" as const, icon: Mic, label: "Voice Mode" },
  ];

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="w-[280px] flex-shrink-0 border-r border-border flex flex-col"
            style={{ background: "hsl(var(--sidebar-background))" }}
          >
            <div className="p-4 border-b border-border">
              <Link to="/" className="flex items-center gap-2">
                <img src={logo} alt="Logo" className="w-8 h-8" />
                <span className="font-serif text-lg font-bold text-foreground">Ask My Notes</span>
              </Link>
            </div>

            {/* Nav */}
            <div className="p-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    activeTab === item.id
                      ? "bg-sidebar-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </div>

            {/* Subjects */}
            <div className="px-3 mt-4">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Subjects ({subjects.length})
                </span>
                <button
                  onClick={() => setShowNewSubject(true)}
                  className="text-secondary hover:text-secondary/80"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {showNewSubject && (
                <div className="flex gap-2 mb-2">
                  <input
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSubject()}
                    placeholder="Subject name..."
                    className="flex-1 bg-muted text-foreground text-sm px-3 py-1.5 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-secondary"
                    autoFocus
                  />
                  <button
                    onClick={addSubject}
                    className="px-2 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="space-y-1">
                {subjects.map((s) => (
                  <div
                    key={s.id}
                    className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-all ${
                      activeSubject === s.id
                        ? "bg-sidebar-accent text-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/50"
                    }`}
                    onClick={() => setActiveSubject(s.id)}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{s.name}</span>
                      <span className="text-xs text-muted-foreground">({s.pdfs?.length || 0})</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSubject(s.id); }}
                      className="opacity-0 group-hover:opacity-100 text-destructive hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Files */}
            {currentSubject && (
              <div className="px-3 mt-4 flex-1 overflow-y-auto">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Files ({pdfs.length})
                </span>
                <div className="mt-2 space-y-1">
                  {pdfs.map((f) => (
                    <div key={f.id} className="flex items-center justify-between group px-2 py-1.5 text-sm text-muted-foreground hover:bg-sidebar-accent/50 rounded">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{f.originalFileName}</span>
                      </div>
                      <button
                        onClick={() => deletePDF(f.id)}
                        className="opacity-0 group-hover:opacity-100 text-destructive hover:text-red-600 flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-secondary/50 transition-all cursor-pointer">
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading..." : "Upload PDF"}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading || !activeSubject}
                  />
                </label>
              </div>
            )}

            <div className="p-3 border-t border-border">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-all"
              >
                <Settings className="w-4 h-4" />
                Logout
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center px-4 gap-3 flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className={`w-5 h-5 transition-transform ${!sidebarOpen ? "rotate-180" : ""}`} />
          </button>
          <h2 className="font-serif text-lg font-bold text-foreground">
            {activeTab === "chat" && `Chat — ${currentSubject?.name || "Select Subject"}`}
            {activeTab === "study" && `Study Mode — ${currentSubject?.name || "Select Subject"}`}
            {activeTab === "voice" && `Voice Mode — ${currentSubject?.name || "Select Subject"}`}
          </h2>
        </header>

        {/* Content */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                    <p className="text-muted-foreground">No messages yet. Upload a PDF and ask a question to get started!</p>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "text-secondary-foreground"
                        : "glass-panel text-foreground"
                    }`}
                    style={msg.role === "user" ? { background: "var(--gradient-primary)" } : undefined}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.role === "assistant" && (
                      <div className="mt-2 flex items-center gap-2">
                        {!isSpeaking && (
                          <button
                            onClick={() => speak(msg.content.replace(/\*\*/g, ""))}
                            className="p-1.5 rounded hover:bg-white/10 transition-all"
                            title="Speak answer"
                          >
                            <Volume2 className="w-4 h-4 text-accent" />
                          </button>
                        )}
                        {isSpeaking && (
                          <>
                            <button
                              onClick={stopSpeech}
                              className="p-1.5 rounded hover:bg-white/10 transition-all"
                              title="Stop speaking"
                            >
                              <VolumeX className="w-4 h-4 text-accent" />
                            </button>
                            <button
                              onClick={() => {
                                if ((window.speechSynthesis && window.speechSynthesis.paused)) {
                                  window.speechSynthesis.resume();
                                } else {
                                  window.speechSynthesis.pause();
                                }
                              }}
                              className="p-1.5 rounded hover:bg-white/10 transition-all"
                              title="Pause/Resume"
                            >
                              {window.speechSynthesis && window.speechSynthesis.paused ? (
                                <Play className="w-4 h-4 text-accent" />
                              ) : (
                                <Pause className="w-4 h-4 text-accent" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-border/30">
                        <span className="text-xs text-accent font-semibold">📌 Sources:</span>
                        {msg.citations.map((c, idx) => (
                          <span key={idx} className="block text-xs text-muted-foreground mt-1">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="glass-panel rounded-2xl px-5 py-3 text-sm">
                    <Loader className="w-4 h-4 animate-spin" />
                  </div>
                </motion.div>
              )}
            </div>

            {voiceError && (
              <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm rounded-lg mx-4 mb-2">
                {voiceError}
              </div>
            )}

            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3 glass-panel rounded-xl px-4 py-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !loading && handleSend()}
                  placeholder={`Ask about ${currentSubject?.name || "your notes"}...`}
                  className="flex-1 bg-transparent text-foreground text-sm focus:outline-none placeholder:text-muted-foreground"
                  disabled={!activeChat || loading}
                />
                <button
                  onClick={handleVoiceInput}
                  className={`p-2 rounded-lg transition-all ${
                    isListening
                      ? "bg-red-500/20 text-red-500"
                      : "hover:scale-110 text-muted-foreground hover:text-foreground"
                  }`}
                  title={isListening ? "Stop recording" : "Start recording"}
                  disabled={loading}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim() || !activeChat}
                  className="p-2 rounded-lg transition-transform hover:scale-110 disabled:opacity-50"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {loading ? (
                    <Loader className="w-4 h-4 text-secondary-foreground animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-secondary-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "study" && currentSubject && <StudyModeView subject={currentSubject.name} />}
        {activeTab === "voice" && (
          <VoiceModeView
            isListening={isListening}
            transcript={transcript}
            onStart={startListening}
            onStop={stopListening}
          />
        )}
      </main>
    </div>
  );
};

const StudyModeView = ({ subject }: { subject: string }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const mcq = {
    question: `What is Newton's Second Law of Motion?`,
    options: [
      "An object at rest stays at rest",
      "F = ma (Force equals mass times acceleration)",
      "Every action has an equal and opposite reaction",
      "Energy cannot be created or destroyed",
    ],
    correct: 1,
    explanation: "Newton's Second Law states that the net force acting on an object is equal to the mass of the object multiplied by its acceleration.",
    citation: "mechanics.pdf — Page 34",
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        <div className="glass-panel rounded-2xl p-8">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-6 text-accent-foreground"
            style={{ background: "var(--gradient-gold)" }}
          >
            MCQ 1 of 5
          </span>
          <h3 className="font-serif text-xl font-bold text-foreground mb-6">{mcq.question}</h3>
          <div className="space-y-3">
            {mcq.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelectedAnswer(i)}
                className={`w-full text-left px-5 py-3 rounded-xl text-sm transition-all border ${
                  selectedAnswer === i
                    ? i === mcq.correct
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-destructive bg-destructive/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-secondary/50 hover:text-foreground"
                }`}
              >
                <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            ))}
          </div>
          {selectedAnswer !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-xl bg-muted"
            >
              <p className="text-sm text-foreground mb-2">
                {selectedAnswer === mcq.correct ? "✅ Correct!" : "❌ Incorrect."}
              </p>
              <p className="text-sm text-muted-foreground">{mcq.explanation}</p>
              <p className="text-xs text-accent mt-2">📌 {mcq.citation}</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

const VoiceModeView = ({
  isListening,
  transcript,
  onStart,
  onStop,
}: {
  isListening: boolean;
  transcript: string;
  onStart: () => void;
  onStop: () => void;
}) => (
  <div className="flex-1 flex items-center justify-center p-6">
    <div className="text-center max-w-md mx-auto">
      <motion.div
        animate={{ scale: isListening ? 1.2 : 1 }}
        className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 cursor-pointer"
        style={{ background: "var(--gradient-primary)" }}
        onClick={isListening ? onStop : onStart}
      >
        {isListening ? (
          <MicOff className="w-10 h-10 text-secondary-foreground animate-pulse" />
        ) : (
          <Mic className="w-10 h-10 text-secondary-foreground" />
        )}
      </motion.div>
      <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
        {isListening ? "Listening..." : "Voice Mode"}
      </h3>
      {transcript && (
        <p className="text-foreground bg-sidebar-accent/50 rounded-lg p-4 mb-4 text-sm leading-relaxed">
          {transcript}
        </p>
      )}
      <p className="text-muted-foreground text-sm">
        {isListening
          ? "Speak your question now..."
          : "Tap the microphone to ask questions using your voice."}
      </p>
      <button
        onClick={isListening ? onStop : onStart}
        className="mt-6 px-6 py-2 rounded-lg text-sm font-medium text-secondary-foreground transition-all"
        style={{ background: "var(--gradient-primary)" }}
      >
        {isListening ? "Stop Recording" : "Start Recording"}
      </button>
    </div>
  </div>
);

export default Dashboard;
