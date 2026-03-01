import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Sparkles, Play } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      <div className="container mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          <motion.img
            src={logo}
            alt="Ask My Notes"
            className="w-32 h-32 md:w-40 md:h-40 mb-8"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight max-w-4xl">
            Turn Your Notes Into a{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              Personal AI Teacher
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
            Ask questions. Get cited answers. Study smarter.
            Never get lost in your notes again.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              to="/dashboard"
              className="group px-8 py-3.5 rounded-xl text-base font-semibold text-secondary-foreground flex items-center gap-2 animate-glow-pulse transition-transform hover:scale-105"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Sparkles className="w-5 h-5" />
              Get Started Free
            </Link>
            <button className="px-8 py-3.5 rounded-xl text-base font-semibold text-foreground glass-panel flex items-center gap-2 hover:border-secondary/50 transition-all">
              <Play className="w-5 h-5 text-accent" />
              Watch Demo
            </button>
          </div>

          <div className="mt-16 flex items-center gap-6 text-muted-foreground text-sm">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" />
              No hallucinations
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              Cited answers only
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Your notes, your AI
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
