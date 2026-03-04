import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel">
      <div className="container mx-auto flex items-center justify-between py-3 px-6">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Ask My Notes" className="h-10 w-10" />
          <span className="font-serif text-xl font-bold text-foreground">
            Ask My Notes
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
            Features
          </a>
          <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
            How It Works
          </a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
            Pricing
          </a>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user.displayName || user.email}
                </span>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-5 py-2 rounded-lg text-sm font-medium text-secondary-foreground animate-glow-pulse"
                style={{ background: "var(--gradient-primary)" }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
