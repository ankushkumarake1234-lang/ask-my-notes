import logo from "@/assets/logo.png";

const Footer = () => (
  <footer className="relative z-10 border-t border-border py-12">
    <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <img src={logo} alt="Ask My Notes" className="w-8 h-8" />
        <span className="font-serif text-lg font-bold text-foreground">Ask My Notes</span>
      </div>
      <p className="text-sm text-muted-foreground">
        © 2026 Ask My Notes. All rights reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
