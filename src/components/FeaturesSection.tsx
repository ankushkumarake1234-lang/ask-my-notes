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
    <section id="features" className="py-32 relative z-10 bg-background border-t border-b border-border">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="mb-10 flex items-center justify-center gap-4">
          <span className="h-px flex-1 bg-border" />
          <span className="small-caps text-accent">
            Core Capabilities
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-serif text-4xl md:text-5xl font-normal text-center text-foreground mb-4 tracking-tight"
        >
          Everything You Need to <span className="text-accent italic">Study Smarter</span>
        </motion.h2>
        <p className="text-center text-muted-foreground mb-20 max-w-xl mx-auto text-lg">
          Powerful features designed to transform how you learn, executed with absolute clarity.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
              className="bg-card rounded-lg p-10 border-t border-border shadow-sm hover:shadow-md hover:border-t-accent transition-all duration-300 group"
            >
              <div className="mb-6 flex">
                <div className="w-12 h-12 flex items-center justify-center rounded-md bg-muted text-foreground group-hover:bg-accent group-hover:text-primary-foreground transition-colors duration-300">
                  <f.icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground mb-3">{f.title}</h3>
              <p className="text-base text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
