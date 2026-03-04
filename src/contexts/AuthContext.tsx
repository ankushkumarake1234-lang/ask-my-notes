import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { authAPI, saveToken, clearToken } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  backendReady: boolean;
  logout: () => Promise<void>;
  refreshBackendToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendReady, setBackendReady] = useState(false);

  const registerWithBackend = useCallback(async (currentUser: User) => {
    let retries = 3;
    while (retries > 0) {
      try {
        const result = await authAPI.register(
          currentUser.uid,
          currentUser.email || "",
          currentUser.displayName || undefined,
          currentUser.photoURL || undefined
        );
        saveToken(result.token);
        setBackendReady(true);
        console.log("✅ Backend auth successful, token saved.");
        return;
      } catch (err: any) {
        retries--;
        console.warn(`Backend auth attempt failed (${3 - retries}/3):`, err.message);
        if (retries > 0) {
          await new Promise((r) => setTimeout(r, 1000)); // wait 1s before retry
        }
      }
    }
    // All retries exhausted — still let user into app but mark backend not ready
    console.error("❌ Backend auth failed after 3 attempts. Features requiring backend will not work.");
    setBackendReady(false);
  }, []);

  // Allows dashboard to manually refresh the token (e.g., after backend reconnects)
  const refreshBackendToken = useCallback(async () => {
    if (!user) return;
    await registerWithBackend(user);
  }, [user, registerWithBackend]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await registerWithBackend(currentUser);
      } else {
        clearToken();
        setUser(null);
        setBackendReady(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [registerWithBackend]);

  const logout = async () => {
    try {
      await auth.signOut();
      clearToken();
      setUser(null);
      setBackendReady(false);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, backendReady, logout, refreshBackendToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
