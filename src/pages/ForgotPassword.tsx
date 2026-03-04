import React, { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StarField from "@/components/StarField";
import { Mail, ArrowLeft, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";

type Step = "input" | "sent" | "error";

const ForgotPassword = () => {
    const [step, setStep] = useState<Step>("input");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resendCountdown, setResendCountdown] = useState(0);

    const startResendCountdown = () => {
        setResendCountdown(60);
        const interval = setInterval(() => {
            setResendCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSendResetEmail = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            await sendPasswordResetEmail(auth, email.trim());

            setStep("sent");
            startResendCountdown();
        } catch (err: any) {
            console.error("Password reset error:", err);

            if (err.code === "auth/user-not-found") {
                setError(
                    "No account found with this email address. Please check and try again."
                );
            } else if (err.code === "auth/invalid-email") {
                setError("Please enter a valid email address.");
            } else if (err.code === "auth/too-many-requests") {
                setError(
                    "Too many reset attempts. Please wait a few minutes before trying again."
                );
            } else {
                setError(err.message || "Failed to send reset email. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCountdown > 0) return;
        await handleSendResetEmail();
    };

    // ─── Step: Email Sent Successfully ───────────────────────────────────────────
    if (step === "sent") {
        return (
            <div className="min-h-screen bg-background relative flex items-center justify-center py-12 px-4">
                <StarField />

                <Card className="w-full max-w-md p-8 relative z-10 glass-panel border border-white/10 text-center">
                    {/* Success Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center animate-pulse">
                                <CheckCircle className="w-10 h-10 text-green-400" />
                            </div>
                            <div className="absolute -inset-1 rounded-full border border-green-500/10 animate-ping" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Check Your Gmail!
                    </h1>
                    <p className="text-muted-foreground text-sm mb-2">
                        We've sent a password reset link to:
                    </p>
                    <p className="text-primary font-semibold text-sm mb-6 break-all bg-primary/5 border border-primary/20 rounded-lg px-4 py-2">
                        {email}
                    </p>

                    {/* Steps */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                            How to reset your password
                        </p>
                        {[
                            { num: "1", text: "Open your Gmail inbox" },
                            { num: "2", text: 'Click the link in the email from "Ask My Notes"' },
                            { num: "3", text: "Enter your new password on the reset page" },
                            { num: "4", text: "Come back here and sign in!" },
                        ].map((step) => (
                            <div key={step.num} className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold mt-0.5">
                                    {step.num}
                                </span>
                                <span className="text-sm text-muted-foreground">{step.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Note: check spam */}
                    <div className="flex items-start gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-4 py-3 mb-6 text-left">
                        <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-300/80">
                            If you don't see the email, check your spam or junk folder. The
                            link expires in <strong>1 hour</strong>.
                        </p>
                    </div>

                    {/* Resend */}
                    <Button
                        onClick={handleResend}
                        disabled={resendCountdown > 0 || loading}
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2 mb-4"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        {loading
                            ? "Sending..."
                            : resendCountdown > 0
                                ? `Resend in ${resendCountdown}s`
                                : "Resend Email"}
                    </Button>

                    {/* Back to login */}
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Sign In
                    </Link>
                </Card>
            </div>
        );
    }

    // ─── Step: Enter Email ────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-background relative flex items-center justify-center py-12 px-4">
            <StarField />

            <Card className="w-full max-w-md p-8 relative z-10 glass-panel border border-white/10">
                {/* Back link */}
                <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Sign In
                </Link>

                {/* Header */}
                <div className="mb-8">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                        <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Forgot Password?
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        No worries! Enter your registered email address and we'll send a
                        password reset link straight to your Gmail.
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSendResetEmail} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="reset-email" className="text-sm font-medium">
                            Email Address
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="reset-email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (error) setError(null);
                                }}
                                className="pl-10"
                                disabled={loading}
                                autoComplete="email"
                                autoFocus
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Enter the email address associated with your account.
                        </p>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full"
                        size="lg"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Sending Reset Link...
                            </span>
                        ) : (
                            "Send Reset Link to Gmail"
                        )}
                    </Button>
                </form>

                {/* Sign up link */}
                <div className="mt-6 text-center">
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

export default ForgotPassword;
