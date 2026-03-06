import { useState, useEffect, useRef, Component } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, MessageSquare, Brain, Mic, MicOff, Plus, Send, Upload, FileText, Trash2, ChevronLeft, Volume2, VolumeX, Pause, Play, Loader, User, Mail, Calendar, Shield, LogOut, RefreshCw, AlertCircle,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { subjectsAPI, pdfsAPI, chatsAPI } from "@/lib/api";
import { useVoiceInput, useTextToSpeech } from "@/hooks/useSpeech";
import { toast } from "sonner";

// ─── Error Boundary ─────────────────────────────────────────────────────────
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, message: "" };
  }
  static getDerivedStateFromError(err: any) {
    return { hasError: true, message: err?.message || "Unknown error" };
  }
  componentDidCatch(err: any, info: any) {
    console.error("Dashboard crashed:", err, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="glass-panel rounded-2xl p-10 text-center max-w-md border border-red-500/20">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
            <p className="text-muted-foreground text-sm mb-6">{this.state.message}</p>
            <button
              onClick={() => { this.setState({ hasError: false, message: "" }); window.location.reload(); }}
              className="px-6 py-2 rounded-xl text-sm font-semibold text-secondary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

type Subject = { id: string; name: string; description?: string; pdfs?: any[] };
type Message = { id?: string; role: "user" | "assistant"; content: string; citations?: string[] };
type PDF = { id: string; originalFileName: string; pageCount: number; fileSize: number };
type Chat = { id: string; title: string; subjectId: string };

const Dashboard = () => {
  const { user, logout, backendReady, refreshBackendToken } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeSubject, setActiveSubject] = useState<string>("");
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "study" | "voice" | "profile">("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [chatLevel, setChatLevel] = useState("medium");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
        if (user && backendReady) {
          await loadSubjects();
        }
      } catch (err) {
        console.error("Init error:", err);
      }
    };
    initUser();
  }, [user, backendReady]);

  // Load subjects
  const loadSubjects = async () => {
    try {
      const result = await subjectsAPI.getAll();
      setSubjects(result.subjects || []);
      if (result.subjects?.length > 0) {
        setActiveSubject(result.subjects[0].id);
      }
    } catch (err: any) {
      if (!err.message?.includes("401") && !err.message?.includes("token")) {
        toast.error("Failed to load subjects: " + err.message);
      }
    }
  };

  // Ref to prevent concurrent createNewChat calls
  const creatingChatRef = useRef(false);

  // Load PDFs for current subject
  useEffect(() => {
    if (activeSubject) {
      loadPDFs();
      loadChats();
    }
  }, [activeSubject]);

  const loadPDFs = async () => {
    if (!activeSubject) return;
    try {
      const result = await pdfsAPI.getBySubject(activeSubject);
      setPdfs(result.pdfs || []);
    } catch (err: any) {
      console.error("Load PDFs error:", err);
    }
  };

  const loadChats = async () => {
    if (!activeSubject) return;
    try {
      const result = await chatsAPI.getBySubject(activeSubject);
      setChats(result.chats || []);

      // Auto-select first chat or create a new one (guarded against concurrent calls)
      if (result.chats?.length > 0) {
        selectChat(result.chats[0]);
      } else if (!creatingChatRef.current) {
        creatingChatRef.current = true;
        await createNewChat();
        creatingChatRef.current = false;
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
    if (!activeSubject) return;
    try {
      const result = await chatsAPI.create(activeSubject, `Chat ${new Date().toLocaleTimeString()}`);
      const newChat = result.chat;
      setChats((prev) => [...prev, newChat]);
      selectChat(newChat);
    } catch (err: any) {
      console.error("Failed to create chat:", err);
      // Don't show toast here — this fires silently on first load
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeChat) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const result = await chatsAPI.ask(activeChat.id, userMessage, chatLevel);
      const aiMessage = result.message;

      if (!aiMessage) throw new Error("No response from AI");

      // Normalize citations: may be a JSON string or already an array
      let parsedCitations: string[] = [];
      if (Array.isArray(aiMessage.citations)) {
        parsedCitations = aiMessage.citations;
      } else if (typeof aiMessage.citations === "string" && aiMessage.citations) {
        try { parsedCitations = JSON.parse(aiMessage.citations); } catch { parsedCitations = []; }
      }

      setMessages((prev) => [...prev, { ...aiMessage, citations: parsedCitations }]);

      // Auto-speak the answer (null-safe)
      const content = aiMessage.content || "";
      if (content) {
        const cleanText = content.replace(/\*\*/g, "").substring(0, 500);
        speak(cleanText);
      }
    } catch (err: any) {
      console.error("Send error:", err);
      toast.error(err.message || "Failed to get a response. Please try again.");
      // Remove the optimistic user message on failure
      setMessages((prev) => prev.filter((m) => m.content !== userMessage || m.role !== "user"));
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = async () => {
    if (isListening) {
      const recordedText = await stopListening();
      if (recordedText.trim()) {
        setInput(recordedText);
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
    if (!file || !activeSubject) {
      toast.error("Please select a subject first");
      return;
    }

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }

    setUploading(true);
    try {
      const result = await pdfsAPI.upload(file, activeSubject);
      toast.success(`✅ PDF uploaded: ${result.pdf?.originalFileName || file.name}`);
      // Refresh PDF list and chats so AI context is updated
      await Promise.all([loadPDFs()]);
      toast.info("PDF processed! You can now ask questions about it.");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Upload failed. Please try again.");
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
    { id: "profile" as const, icon: User, label: "My Profile" },
  ];

  return (
    <ErrorBoundary>
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === item.id
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
                      className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-all ${activeSubject === s.id
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

              {/* User Profile Card at bottom of sidebar */}
              <div className="p-3 border-t border-border">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all mb-1 ${activeTab === "profile"
                    ? "bg-sidebar-accent"
                    : "hover:bg-sidebar-accent/50"
                    }`}
                >
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/30 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 ring-2 ring-primary/30">
                      <span className="text-primary text-sm font-bold">
                        {(user?.displayName || user?.email || "U")[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user?.displayName || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
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
            <h2 className="font-serif text-lg font-bold text-foreground flex-1">
              {activeTab === "chat" && `Chat — ${currentSubject?.name || "Select Subject"}`}
              {activeTab === "study" && `Study Mode — ${currentSubject?.name || "Select Subject"}`}
              {activeTab === "voice" && `Voice Mode — ${currentSubject?.name || "Select Subject"}`}
              {activeTab === "profile" && "My Profile"}
            </h2>
            {/* Backend status dot */}
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${backendReady
                ? "bg-green-500/10 text-green-400"
                : "bg-red-500/10 text-red-400"
                }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${backendReady ? "bg-green-400" : "bg-red-400 animate-pulse"}`} />
              {backendReady ? "Connected" : "Disconnected"}
            </div>
          </header>

          {/* Backend not connected banner */}
          {!backendReady && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-4 mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3"
            >
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-400">Backend not connected</p>
                <p className="text-xs text-red-400/70">
                  Make sure the backend server is running:{" "}
                  <code className="font-mono">cd backend && npm run dev</code>
                </p>
              </div>
              <button
                onClick={async () => {
                  toast.info("Reconnecting...");
                  await refreshBackendToken();
                  if (backendReady) toast.success("Reconnected!");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-medium flex-shrink-0 transition-all"
              >
                <RefreshCw className="w-3 h-3" />
                Reconnect
              </button>
            </motion.div>
          )}

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
                      className={`max-w-[70%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${msg.role === "user"
                        ? "text-secondary-foreground"
                        : "glass-panel text-foreground"
                        }`}
                      style={msg.role === "user" ? { background: "var(--gradient-primary)" } : undefined}
                    >
                      <p className="whitespace-pre-wrap">{msg.content || ""}</p>
                      {msg.role === "assistant" && (
                        <div className="mt-2 flex items-center gap-2">
                          {!isSpeaking && (
                            <button
                              onClick={() => speak((msg.content || "").replace(/\*\*/g, ""))}
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
                      {(() => {
                        // Safely normalise citations — backend may send string or array
                        let cits: string[] = [];
                        if (Array.isArray(msg.citations)) {
                          cits = msg.citations as string[];
                        } else if (typeof msg.citations === "string" && msg.citations) {
                          try { cits = JSON.parse(msg.citations); } catch { cits = []; }
                        }
                        return cits.length > 0 ? (
                          <div className="mt-3 pt-2 border-t border-border/30">
                            <span className="text-xs text-accent font-semibold">📌 Sources:</span>
                            {cits.map((c, idx) => (
                              <span key={idx} className="block text-xs text-muted-foreground mt-1">{c}</span>
                            ))}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="glass-panel rounded-2xl px-5 py-3 text-sm flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span className="text-muted-foreground text-xs">Thinking...</span>
                    </div>
                  </motion.div>
                )}

                {/* Auto-scroll anchor */}
                <div ref={messagesEndRef} />
              </div>

              {voiceError && (
                <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm rounded-lg mx-4 mb-2">
                  {voiceError}
                </div>
              )}

              <div className="p-4 border-t border-border">
                <div className="flex gap-2 mb-3 px-2">
                  <span className="text-xs text-muted-foreground flex items-center">Response Level:</span>
                  <button onClick={() => setChatLevel("basic")} className={`text-xs px-2 py-1 rounded-md transition-all ${chatLevel === "basic" ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}>Basic</button>
                  <button onClick={() => setChatLevel("medium")} className={`text-xs px-2 py-1 rounded-md transition-all ${chatLevel === "medium" ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}>Medium</button>
                  <button onClick={() => setChatLevel("advanced")} className={`text-xs px-2 py-1 rounded-md transition-all ${chatLevel === "advanced" ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}>Advanced</button>
                </div>
                <div className="flex items-center gap-3 glass-panel rounded-xl px-4 py-2">
                  <input
                    value={isListening ? "" : input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !loading && !isListening && handleSend()}
                    placeholder={isListening ? "Recording voice... Please wait" : `Ask about ${currentSubject?.name || "your notes"}...`}
                    className="flex-1 bg-transparent text-foreground text-sm focus:outline-none placeholder:text-muted-foreground"
                    disabled={!activeChat || loading || isListening}
                  />
                  <button
                    onClick={handleVoiceInput}
                    className={`p-2 rounded-lg transition-all ${isListening
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

          {activeTab === "study" && currentSubject && (
            <StudyModeView
              subject={currentSubject.name}
              subjectId={currentSubject.id}
            />
          )}
          {activeTab === "voice" && (
            <VoiceModeView
              isListening={isListening}
              transcript={transcript}
              onStart={startListening}
              onStop={stopListening}
              activeChat={activeChat}
              onSendVoiceMessage={async (text: string) => {
                if (!text.trim() || !activeChat) return;
                setActiveTab("chat");
                setInput(text);
                // Small delay so the UI switches to chat tab first
                setTimeout(async () => {
                  setMessages((prev) => [...prev, { role: "user", content: text }]);
                  setLoading(true);
                  try {
                    const result = await chatsAPI.ask(activeChat.id, text, chatLevel);
                    setMessages((prev) => [...prev, result.message]);
                    if (result.message.content) {
                      speak(result.message.content.replace(/\*\*/g, "").substring(0, 500));
                    }
                  } catch (err: any) {
                    toast.error(err.message);
                  } finally {
                    setLoading(false);
                  }
                }, 100);
              }}
            />
          )}
          {activeTab === "profile" && (
            <ProfileView
              user={user}
              subjects={subjects}
              pdfs={pdfs}
              chats={chats}
            />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
};

// ─── Study Mode with Real AI MCQs ───────────────────────────────────────────
const StudyModeView = ({
  subject,
  subjectId,
}: {
  subject: string;
  subjectId: string;
}) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState("medium");

  const loadMCQs = async () => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    setCurrent(0);
    setSelectedAnswer(null);
    setScore(0);
    setFinished(false);
    try {
      const result = await chatsAPI.generateMCQ(subjectId, 5, level);
      if (result.questions?.length > 0) {
        setQuestions(result.questions);
      } else {
        setError("No questions could be generated. Please upload a PDF first.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate questions.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    if (idx === questions[current].correct) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setSelectedAnswer(null);
    }
  };

  // Empty state — no questions yet
  if (!loading && questions.length === 0 && !error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Study Mode — {subject}</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Generate AI-powered MCQ questions based on your uploaded PDFs.
            Make sure you have uploaded at least one PDF for this subject.
          </p>

          <div className="flex justify-center gap-2 mb-6">
            <button
              onClick={() => setLevel("basic")}
              className={`px-4 py-1.5 rounded-lg text-sm transition-all ${level === "basic" ? "bg-primary text-secondary-foreground" : "bg-sidebar-accent text-muted-foreground hover:text-foreground"}`}
            >
              Basic
            </button>
            <button
              onClick={() => setLevel("medium")}
              className={`px-4 py-1.5 rounded-lg text-sm transition-all ${level === "medium" ? "bg-primary text-secondary-foreground" : "bg-sidebar-accent text-muted-foreground hover:text-foreground"}`}
            >
              Medium
            </button>
            <button
              onClick={() => setLevel("advanced")}
              className={`px-4 py-1.5 rounded-lg text-sm transition-all ${level === "advanced" ? "bg-primary text-secondary-foreground" : "bg-sidebar-accent text-muted-foreground hover:text-foreground"}`}
            >
              Advanced
            </button>
          </div>

          <button
            onClick={loadMCQs}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-secondary-foreground transition-all hover:scale-105"
            style={{ background: "var(--gradient-primary)" }}
          >
            Generate Quiz Questions
          </button>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <p className="text-foreground font-semibold mb-1">Generating Questions...</p>
          <p className="text-muted-foreground text-sm">
            AI is reading your PDFs and creating quiz questions.
          </p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button
            onClick={loadMCQs}
            className="px-5 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:text-foreground transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Finished
  if (finished) {
    const percent = Math.round((score / questions.length) * 100);
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel rounded-2xl p-10 text-center max-w-md border border-white/10"
        >
          <div className="text-5xl mb-4">
            {percent >= 80 ? "🏆" : percent >= 60 ? "🎯" : "📚"}
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Quiz Complete!</h3>
          <p className="text-muted-foreground text-sm mb-6">{subject}</p>
          <div className="w-24 h-24 rounded-full border-4 border-primary/40 flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-bold text-primary">{percent}%</span>
          </div>
          <p className="text-foreground mb-1">
            You scored <strong>{score}</strong> out of <strong>{questions.length}</strong>
          </p>
          <p className="text-muted-foreground text-sm mb-8">
            {percent >= 80 ? "Excellent work! 🎉" : percent >= 60 ? "Good job! Keep practising." : "Keep studying — you'll get there!"}
          </p>
          <button
            onClick={loadMCQs}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-secondary-foreground transition-all hover:scale-105"
            style={{ background: "var(--gradient-primary)" }}
          >
            Generate New Quiz
          </button>
        </motion.div>
      </div>
    );
  }

  // Active quiz
  const q = questions[current];
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="flex items-center justify-between mb-4 text-xs text-muted-foreground">
          <span>Question {current + 1} of {questions.length}</span>
          <span>Score: {score}/{current + (selectedAnswer !== null ? 1 : 0)}</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-1.5 mb-6">
          <div
            className="h-1.5 rounded-full bg-primary transition-all"
            style={{ width: `${((current) / questions.length) * 100}%` }}
          />
        </div>

        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel rounded-2xl p-8 border border-white/10"
        >
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-6 text-accent-foreground"
            style={{ background: "var(--gradient-gold)" }}
          >
            MCQ {current + 1} of {questions.length}
          </span>
          <h3 className="font-serif text-xl font-bold text-foreground mb-6">{q.question}</h3>
          <div className="space-y-3">
            {q.options.map((opt: string, i: number) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={selectedAnswer !== null}
                className={`w-full text-left px-5 py-3 rounded-xl text-sm transition-all border ${selectedAnswer === null
                  ? "border-border text-muted-foreground hover:border-secondary/50 hover:text-foreground cursor-pointer"
                  : i === q.correct
                    ? "border-green-500 bg-green-500/10 text-foreground"
                    : selectedAnswer === i
                      ? "border-red-500 bg-red-500/10 text-foreground"
                      : "border-border text-muted-foreground opacity-50 cursor-not-allowed"
                  }`}
              >
                <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>
                {opt}
                {selectedAnswer !== null && i === q.correct && (
                  <span className="ml-2 text-green-400">✓</span>
                )}
                {selectedAnswer === i && i !== q.correct && (
                  <span className="ml-2 text-red-400">✗</span>
                )}
              </button>
            ))}
          </div>

          {selectedAnswer !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-xl bg-muted"
            >
              <p className="text-sm text-foreground mb-2 font-semibold">
                {selectedAnswer === q.correct ? "✅ Correct!" : "❌ Incorrect."}
              </p>
              <p className="text-sm text-muted-foreground">{q.explanation}</p>
              <button
                onClick={handleNext}
                className="mt-4 px-5 py-2 rounded-lg text-sm font-medium text-secondary-foreground transition-all hover:opacity-90"
                style={{ background: "var(--gradient-primary)" }}
              >
                {current + 1 >= questions.length ? "View Results" : "Next Question →"}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

// ─── Voice Mode — sends question to chat ─────────────────────────────────────
const VoiceModeView = ({
  isListening,
  transcript,
  onStart,
  onStop,
  activeChat,
  onSendVoiceMessage,
}: {
  isListening: boolean;
  transcript: string;
  onStart: () => void;
  onStop: () => Promise<string | void>;
  activeChat: any;
  onSendVoiceMessage: (text: string) => void;
}) => {
  const [pendingText, setPendingText] = useState("");

  const handleStop = async () => {
    const recordedText = await onStop();
    if (recordedText && recordedText.trim()) {
      setPendingText(recordedText.trim());
    }
  };

  const handleSend = () => {
    if (pendingText.trim()) {
      onSendVoiceMessage(pendingText.trim());
      setPendingText("");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-md mx-auto">
        <motion.div
          animate={{ scale: isListening ? [1, 1.15, 1] : 1 }}
          transition={{ repeat: isListening ? Infinity : 0, duration: 1.2 }}
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 cursor-pointer shadow-lg"
          style={{ background: "var(--gradient-primary)" }}
          onClick={isListening ? handleStop : onStart}
        >
          {isListening ? (
            <MicOff className="w-10 h-10 text-secondary-foreground" />
          ) : (
            <Mic className="w-10 h-10 text-secondary-foreground" />
          )}
        </motion.div>

        {isListening && (
          <div className="flex justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                animate={{ height: [8, 24, 8] }}
                transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                className="w-1.5 bg-primary rounded-full"
              />
            ))}
          </div>
        )}

        <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
          {isListening ? "Listening..." : "Voice Mode"}
        </h3>

        {/* Live transcript */}
        {isListening && transcript && (
          <p className="text-foreground bg-sidebar-accent/50 rounded-lg p-4 mb-4 text-sm leading-relaxed">
            {transcript}
          </p>
        )}

        {/* Ready-to-send transcript */}
        {!isListening && pendingText && (
          <div className="mb-4">
            <p className="text-foreground bg-sidebar-accent/50 rounded-lg p-4 mb-3 text-sm leading-relaxed">
              "{pendingText}"
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleSend}
                disabled={!activeChat}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-secondary-foreground disabled:opacity-50"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Send className="w-4 h-4" />
                Send to Chat
              </button>
              <button
                onClick={() => setPendingText("")}
                className="px-4 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground transition-all"
              >
                Discard
              </button>
            </div>
            {!activeChat && (
              <p className="text-xs text-yellow-400 mt-2">Select a subject first to send voice messages.</p>
            )}
          </div>
        )}

        {!isListening && !pendingText && (
          <p className="text-muted-foreground text-sm mb-6">
            Tap the microphone, ask your question, then tap again to stop. Your question will be sent to the chat.
          </p>
        )}

        <button
          onClick={isListening ? handleStop : onStart}
          className="mt-2 px-6 py-2 rounded-lg text-sm font-medium text-secondary-foreground transition-all hover:opacity-90"
          style={{ background: "var(--gradient-primary)" }}
        >
          {isListening ? "Stop & Review" : "Start Recording"}
        </button>
      </div>
    </div>
  );
};

// ─── Profile View Component ──────────────────────────────────────────────────
const ProfileView = ({
  user,
  subjects,
  pdfs,
  chats,
}: {
  user: any;
  subjects: any[];
  pdfs: any[];
  chats: any[];
}) => {
  const joinDate = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    : "—";

  const isGoogle = user?.providerData?.some(
    (p: any) => p.providerId === "google.com"
  );

  const stats = [
    { label: "Subjects", value: subjects.length, icon: BookOpen, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Files Uploaded", value: pdfs.length, icon: FileText, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
    { label: "Chats", value: chats.length, icon: MessageSquare, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  ];

  const [localPhoto, setLocalPhoto] = useState<string | null>(localStorage.getItem("user_avatar"));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be smaller than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLocalPhoto(base64String);
        localStorage.setItem("user_avatar", base64String);
        toast.success("Profile photo updated successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setLocalPhoto(null);
    localStorage.removeItem("user_avatar");
    toast.success("Profile photo removed!");
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Profile Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-2xl p-8 border border-white/10 text-center"
        >
          {/* Avatar */}
          <div className="flex flex-col items-center justify-center mb-5 relative group">
            <div className="relative group/avatar cursor-pointer rounded-full" onClick={() => fileInputRef.current?.click()}>
              {localPhoto || user?.photoURL ? (
                <img
                  src={localPhoto || user.photoURL}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/30 shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center shadow-lg">
                  <span className="text-primary text-4xl font-bold">
                    {(user?.displayName || user?.email || "U")[0].toUpperCase()}
                  </span>
                </div>
              )}

              <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity backdrop-blur-[1px]">
                <Upload className="w-6 h-6 text-white mb-1" />
                <span className="text-[10px] text-white font-medium">Upload</span>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handlePhotoUpload}
            />

            {(localPhoto || user?.photoURL) && (
              <button
                onClick={handleRemovePhoto}
                className="mt-4 text-xs font-medium text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 px-4 py-1.5 rounded-full border border-red-500/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Photo
              </button>
            )}
          </div>

          {/* Name */}
          <h2 className="text-2xl font-bold text-foreground mb-1">
            {user?.displayName || "No Name Set"}
          </h2>
          <p className="text-muted-foreground text-sm mb-4">{user?.email}</p>

          {/* Badges */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${isGoogle
              ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
              : "bg-purple-500/10 border-purple-500/20 text-purple-400"
              }`}>
              {isGoogle ? (
                <svg viewBox="0 0 48 48" width="12" height="12">
                  <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.86l6.09-6.09C34.46 3.04 29.48 1 24 1 14.82 1 6.97 6.44 3.29 14.19l7.12 5.53C12.17 13.22 17.62 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.22-.43-4.75H24v9h12.7c-.55 2.97-2.22 5.48-4.73 7.18l7.34 5.7C43.56 37.38 46.5 31.42 46.5 24.5z" />
                  <path fill="#FBBC05" d="M10.41 28.28A14.6 14.6 0 0 1 9.5 24c0-1.49.26-2.93.71-4.28L3.09 14.19A23.43 23.43 0 0 0 .5 24c0 3.77.9 7.34 2.49 10.48l7.42-6.2z" />
                  <path fill="#34A853" d="M24 47c5.48 0 10.08-1.82 13.44-4.93l-7.34-5.7C28.22 37.71 26.22 38.5 24 38.5c-6.38 0-11.83-3.72-13.59-9.22l-7.42 6.2C6.97 43.56 14.82 47 24 47z" />
                </svg>
              ) : (
                <Mail className="w-3 h-3" />
              )}
              {isGoogle ? "Google Account" : "Email & Password"}
            </span>

            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${user?.emailVerified
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
              }`}>
              <Shield className="w-3 h-3" />
              {user?.emailVerified ? "Email Verified ✓" : "Not Verified"}
            </span>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`glass-panel rounded-xl p-4 text-center border ${stat.bg}`}
            >
              <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Account Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-panel rounded-2xl border border-white/10 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/10">
            <h3 className="font-semibold text-foreground text-sm">Account Details</h3>
          </div>
          <div className="divide-y divide-white/5">
            {[
              {
                icon: User,
                label: "Full Name",
                value: user?.displayName || "Not set",
                color: "text-blue-400",
              },
              {
                icon: Mail,
                label: "Email Address",
                value: user?.email || "—",
                color: "text-green-400",
              },
              {
                icon: Calendar,
                label: "Member Since",
                value: joinDate,
                color: "text-purple-400",
              },
              {
                icon: Shield,
                label: "Sign-In Method",
                value: isGoogle ? "Google Sign-In" : "Email & Password",
                color: "text-yellow-400",
              },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-4 px-6 py-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <row.icon className={`w-4 h-4 ${row.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{row.label}</p>
                  <p className="text-sm font-medium text-foreground truncate">{row.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* User ID */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel rounded-xl border border-white/10 px-6 py-4"
        >
          <p className="text-xs text-muted-foreground mb-1">User ID</p>
          <p className="text-xs font-mono text-foreground/50 break-all select-all">{user?.uid || "—"}</p>
        </motion.div>

      </div>
    </div>
  );
};

export default Dashboard;
