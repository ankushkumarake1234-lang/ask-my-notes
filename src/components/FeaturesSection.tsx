import { motion } from "framer-motion";
import { BookOpen, MessageSquare, Brain, FileText, Mic, BarChart3 } from "lucide-react";

const features = [
  { icon: BookOpen, title: "Subject-Scoped", desc: "Create up to 3 subjects and upload your notes per subject." },
  { icon: MessageSquare, title: "Smart Chat", desc: "Ask questions and get answers strictly from your notes." },
  { icon: Brain, title: "Study Mode", desc: "Auto-generated MCQs and short answers from your material." },
  { icon: FileText, title: "Citations", desc: "Every answer comes with file name, page number, and confidence." },
  { icon: Mic, title: "Voice Mode", desc: "Speak your questions and hear AI-powered answers back." },
  { icon: BarChart3, title: "Confidence", desc: "High, Medium, or Low confidence levels on every response." },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative z-10">
      <div className="container mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-serif text-3xl md:text-5xl font-bold text-center text-foreground mb-4"
        >
          Everything You Need to{" "}
          <span className="text-accent">Study Smarter</span>
        </motion.h2>
        <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">
          Powerful features designed to transform how you learn
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel rounded-2xl p-6 hover:glow-border transition-all"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "var(--gradient-primary)" }}
              >
                <f.icon className="w-6 h-6 text-secondary-foreground" />
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
