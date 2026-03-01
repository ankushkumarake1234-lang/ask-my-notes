import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, MessageSquare, Brain, Mic, Settings, Plus, Send, Upload, FileText, Trash2, ChevronLeft,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";

type Subject = { id: string; name: string; files: string[] };
type Message = { role: "user" | "assistant"; content: string; citations?: string[] };

const MAX_SUBJECTS = 3;

const Dashboard = () => {
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: "1", name: "Physics", files: ["mechanics.pdf", "thermodynamics.pdf"] },
    { id: "2", name: "Biology", files: ["cell-biology.pdf"] },
  ]);
  const [activeSubject, setActiveSubject] = useState<string>("1");
  const [activeTab, setActiveTab] = useState<"chat" | "study" | "voice">("chat");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI study assistant for **Physics**. Ask me anything from your uploaded notes.",
    },
  ]);
  const [input, setInput] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentSubject = subjects.find((s) => s.id === activeSubject);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input };
    const aiMsg: Message = {
      role: "assistant",
      content: `Based on your notes for **${currentSubject?.name}**, here's what I found:\n\nThis is a demo response. Enable Lovable Cloud to connect the AI backend and get real answers from your notes.\n\n**Confidence:** High`,
      citations: [`${currentSubject?.files[0] || "notes.pdf"} — Page 12`],
    };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput("");
  };

  const addSubject = () => {
    if (!newSubjectName.trim() || subjects.length >= MAX_SUBJECTS) return;
    setSubjects((prev) => [
      ...prev,
      { id: Date.now().toString(), name: newSubjectName, files: [] },
    ]);
    setNewSubjectName("");
    setShowNewSubject(false);
  };

  const deleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    if (activeSubject === id) setActiveSubject(subjects[0]?.id || "");
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
                  Subjects ({subjects.length}/{MAX_SUBJECTS})
                </span>
                {subjects.length < MAX_SUBJECTS && (
                  <button
                    onClick={() => setShowNewSubject(true)}
                    className="text-secondary hover:text-secondary/80"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
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
                      <span className="text-xs text-muted-foreground">({s.files.length})</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSubject(s.id); }}
                      className="opacity-0 group-hover:opacity-100 text-destructive"
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
                  Files
                </span>
                <div className="mt-2 space-y-1">
                  {currentSubject.files.map((f) => (
                    <div key={f} className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="truncate">{f}</span>
                    </div>
                  ))}
                </div>
                <button className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-secondary/50 transition-all">
                  <Upload className="w-4 h-4" />
                  Upload File
                </button>
              </div>
            )}

            <div className="p-3 border-t border-border">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50">
                <Settings className="w-4 h-4" />
                Settings
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
                    {msg.citations && (
                      <div className="mt-3 pt-2 border-t border-border/30">
                        <span className="text-xs text-accent font-semibold">📌 Citations:</span>
                        {msg.citations.map((c) => (
                          <span key={c} className="block text-xs text-muted-foreground mt-1">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3 glass-panel rounded-xl px-4 py-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={`Ask about ${currentSubject?.name || "your notes"}...`}
                  className="flex-1 bg-transparent text-foreground text-sm focus:outline-none placeholder:text-muted-foreground"
                />
                <button
                  onClick={handleSend}
                  className="p-2 rounded-lg transition-transform hover:scale-110"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Send className="w-4 h-4 text-secondary-foreground" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "study" && <StudyModeView subject={currentSubject?.name || "Subject"} />}
        {activeTab === "voice" && <VoiceModeView />}
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

        <p className="text-center text-sm text-muted-foreground mt-8">
          Enable Lovable Cloud to generate study questions from your actual notes.
        </p>
      </div>
    </div>
  );
};

const VoiceModeView = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="text-center">
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 animate-glow-pulse cursor-pointer"
        style={{ background: "var(--gradient-primary)" }}
      >
        <Mic className="w-10 h-10 text-secondary-foreground" />
      </div>
      <h3 className="font-serif text-2xl font-bold text-foreground mb-2">Voice Mode</h3>
      <p className="text-muted-foreground text-sm max-w-sm">
        Tap the microphone to ask questions using your voice. Enable Lovable Cloud to activate voice features.
      </p>
    </div>
  </div>
);

export default Dashboard;
