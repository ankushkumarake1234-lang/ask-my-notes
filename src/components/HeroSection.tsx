import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Sparkles, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden bg-background">
      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        
        {/* Editorial Top Border/Eyebrow */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-between items-end border-b border-border pb-4 mb-20"
        >
          <div className="small-caps text-muted-foreground">Vol. I — The Pursuit of Knowledge</div>
          <div className="small-caps text-muted-foreground hidden sm:block">Ask My Notes — Est. 2024</div>
        </motion.div>

        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-8 md:gap-12 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="flex flex-col items-center md:items-start text-center md:text-left"
          >
            <h1 className="font-serif text-6xl md:text-8xl font-normal text-foreground leading-[1.1] tracking-tight">
              Master Your <span className="italic text-accent">Studies</span>
            </h1>
            <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-md leading-relaxed">
              Transform static documents into an interactive intellect. Ask questions, receive cited answers, and embrace absolute clarity.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row gap-6 w-full sm:w-auto">
              <Button asChild size="lg" className="px-8 h-12 text-base rounded-md">
                <Link to="/dashboard">
                  <Sparkles className="mr-2 h-4 w-4" /> Begin Journey
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-8 h-12 text-base rounded-md">
                <button>
                  <Play className="mr-2 h-4 w-4" /> Watch Demo
                </button>
              </Button>
            </div>
            
            <div className="mt-12 pt-8 border-t border-border w-full grid grid-cols-2 gap-4 text-sm small-caps text-muted-foreground">
              <div>— No Hallucinations</div>
              <div>— Cited Sources Only</div>
              <div>— Enterprise Security</div>
              <div>— Infinite Recall</div>
            </div>
          </motion.div>

          {/* Center Divider Line */}
          <div className="hidden md:block w-px h-[60vh] bg-border mx-auto" />

          {/* Right Image/Logo Element */}
          <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
             className="relative flex justify-center items-center p-8 lg:p-16 border border-border bg-card rounded-lg shadow-sm"
          >
            <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-accent" />
            <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-accent" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-accent" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-accent" />
            
            <img
              src={logo}
              alt="Ask My Notes Emblem"
              className="w-48 h-48 md:w-64 md:h-64 object-contain filter grayscale contrast-125 opacity-90 mix-blend-multiply"
            />
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
