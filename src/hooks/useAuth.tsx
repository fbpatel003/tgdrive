import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { db } from "../lib/db";
import { resetClient } from "../lib/telegram";

interface AuthContextType {
  isAuthenticated: boolean;
  phone: string;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    db.credentials.get(1).then((creds) => {
      if (creds?.sessionString) {
        setIsAuthenticated(true);
        setPhone(creds.phone);
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    });
  }, [tick]);

  const logout = async () => {
    await db.credentials.clear();
    await db.folders.clear();
    await db.files.clear();
    resetClient();
    setIsAuthenticated(false);
    setPhone("");
  };

  const refresh = () => setTick((t) => t + 1);

  return (
    <AuthContext.Provider value={{ isAuthenticated, phone, loading, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
