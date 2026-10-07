import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import StarField from "@/components/StarField";
import { Chrome } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      
      // Navigate to dashboard after successful sign-in
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Sign-in error:", err);
      setError(err.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center">
      <StarField />
      
      <Card className="w-full max-w-md p-8 relative z-10 glass-panel border border-white/10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Ask My Notes
          </h1>
          <p className="text-muted-foreground">Sign in to continue</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2"
            size="lg"
          >
            <Chrome className="w-5 h-5" />
            {loading ? "Signing in..." : "Sign in with Google"}
          </Button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-primary hover:underline font-medium"
            >
              Create one
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Sign up with email and password on the sign-up page
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
