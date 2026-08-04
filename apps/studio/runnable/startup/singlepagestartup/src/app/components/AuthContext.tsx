import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { type BlogAuthor, blogAuthors } from "../blogData";

/* ─── Types ──────────────────────────────────────────────────────────── */

export interface AuthUser {
  email: string;
  author: BlogAuthor;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

/* ─── Context ────────────────────────────────────────────────────────── */

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/* ─── Provider ───────────────────────────────────────────────────────── */

/** Mock mapping: email prefix → author slug. Falls back to Sarah Kim. */
function resolveAuthor(email: string): BlogAuthor {
  const prefix = email.split("@")[0].toLowerCase();
  const match = blogAuthors.find(
    (a) => a.slug.includes(prefix) || a.name.toLowerCase().includes(prefix),
  );
  return match ?? blogAuthors[0]; // default → Sarah Kim
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem("sps_auth_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email: string, _password: string) => {
    // simulate network delay
    await new Promise((r) => setTimeout(r, 600));
    const author = resolveAuthor(email);
    const u: AuthUser = { email, author };
    setUser(u);
    localStorage.setItem("sps_auth_user", JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("sps_auth_user");
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
