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
    <section id="how-it-works" className="py-32 relative z-10 bg-muted">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="mb-10 flex items-center gap-4">
          <span className="h-px w-12 bg-border" />
          <span className="small-caps text-accent">
            The Philosophy
          </span>
        </div>

        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-serif text-4xl md:text-5xl font-normal text-foreground mb-16 tracking-tight"
        >
          How the <span className="text-accent italic">Magic</span> Works
        </motion.h2>

        <div className="grid md:grid-cols-[1.3fr_0.7fr] gap-12">
          {stories.map((story, i) => (
            <motion.div
              key={story.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6, ease: "easeOut" }}
              className="bg-card rounded-lg p-10 shadow-sm border border-border flex flex-col group relative overflow-hidden transition-all duration-300 hover:shadow-md hover:bg-background"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-border group-hover:bg-accent transition-colors duration-300" />
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-muted rounded-md text-foreground group-hover:text-accent transition-colors duration-300">
                  <story.icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-2xl font-semibold text-foreground">
                  {story.title}
                </h3>
              </div>
              <p className="text-muted-foreground leading-relaxed text-lg">
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
