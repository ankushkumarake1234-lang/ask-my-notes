import { motion } from "framer-motion";
import { AlertTriangle, Wand2, ShieldCheck, Mic } from "lucide-react";

const stories = [
  {
    icon: AlertTriangle,
    title: "The Problem",
    description: "Students upload notes but struggle to revise efficiently. Information is scattered, and finding answers takes forever.",
    color: "text-destructive",
  },
  {
    icon: Wand2,
    title: "The Magic",
    description: "Ask My Notes transforms your notes into a subject-aware AI teacher that understands your material deeply.",
    color: "text-secondary",
  },
  {
    icon: ShieldCheck,
    title: "The Trust",
    description: "No hallucinations. No guessing. Only answers sourced directly from YOUR notes — with citations you can verify.",
    color: "text-accent",
  },
  {
    icon: Mic,
    title: "The Power",
    description: "Voice-based teacher conversations, study mode with MCQs, and intelligent study sessions tailored to your curriculum.",
    color: "text-primary",
  },
];

const StorySection = () => {
  return (
    <section id="how-it-works" className="py-24 relative z-10">
      <div className="container mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-serif text-3xl md:text-5xl font-bold text-center text-foreground mb-16"
        >
          How the{" "}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
            Magic
          </span>{" "}
          Works
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {stories.map((story, i) => (
            <motion.div
              key={story.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass-panel rounded-2xl p-8 hover:border-secondary/30 transition-all group"
            >
              <story.icon className={`w-10 h-10 ${story.color} mb-4 group-hover:scale-110 transition-transform`} />
              <h3 className="font-serif text-2xl font-bold text-foreground mb-3">
                {story.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {story.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StorySection;
