import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StarField from "@/components/StarField";
import { Mail, Lock } from "lucide-react";

// Official Google "G" logo SVG
const GoogleLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="20"
    height="20"
    className="flex-shrink-0"
  >
    <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.86l6.09-6.09C34.46 3.04 29.48 1 24 1 14.82 1 6.97 6.44 3.29 14.19l7.12 5.53C12.17 13.22 17.62 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.22-.43-4.75H24v9h12.7c-.55 2.97-2.22 5.48-4.73 7.18l7.34 5.7C43.56 37.38 46.5 31.42 46.5 24.5z" />
    <path fill="#FBBC05" d="M10.41 28.28A14.6 14.6 0 0 1 9.5 24c0-1.49.26-2.93.71-4.28L3.09 14.19A23.43 23.43 0 0 0 .5 24c0 3.77.9 7.34 2.49 10.48l7.42-6.2z" />
    <path fill="#34A853" d="M24 47c5.48 0 10.08-1.82 13.44-4.93l-7.34-5.7C28.22 37.71 26.22 38.5 24 38.5c-6.38 0-11.83-3.72-13.59-9.22l-7.42 6.2C6.97 43.56 14.82 47 24 47z" />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }
    if (!formData.password) {
      setError("Password is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await signInWithEmailAndPassword(auth, formData.email, formData.password);

      navigate("/dashboard");
    } catch (err: any) {
      console.error("Email sign-in error:", err);

      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Invalid email or password. Please try again.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError(err.message || "Failed to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);

      navigate("/dashboard");
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      setError(err.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center py-12 px-4">
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

        {/* Email & Password Form */}
        <form onSubmit={handleEmailSignIn} className="space-y-4 mb-6">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
                className="pl-10"
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Link
                to="/forgot-password"
                className="text-xs text-primary hover:underline font-medium"
                tabIndex={-1}
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                className="pl-10"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>

        {/* Google Sign In */}
        <Button
          onClick={handleGoogleSignIn}
          disabled={loading}
          variant="outline"
          className="w-full flex items-center justify-center gap-2 mb-6"
          size="lg"
        >
          <GoogleLogo />
          {loading ? "Signing in..." : "Sign in with Google"}
        </Button>

        {/* Sign Up Link */}
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
      </Card>
    </div>
  );
};

export default Login;
