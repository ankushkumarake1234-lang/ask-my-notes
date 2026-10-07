import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { authAPI, saveToken, clearToken, getAuthToken } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        try {
          // Register or get user from backend
          const result = await authAPI.register(
            currentUser.uid,
            currentUser.email || "",
            currentUser.displayName || undefined,
            currentUser.photoURL || undefined
          );
          
          // Save the token
          saveToken(result.token);
          setUser(currentUser);
        } catch (err) {
          console.error("Backend auth error:", err);
          // Still set user even if backend fails
          setUser(currentUser);
        }
      } else {
        clearToken();
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await auth.signOut();
      clearToken();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
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
