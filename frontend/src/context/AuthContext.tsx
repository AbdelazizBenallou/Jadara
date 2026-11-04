import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
} from "@/api/auth";
import type { LoginCredentials, User } from "@/types/user";

export type { User, UserSocial } from "@/types/user";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  login: async () => {
    throw new Error("AuthProvider is not mounted");
  },
  logout: async () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      try {
        const profile = await getCurrentUser();
        if (mounted) setUser(profile);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchProfile();

    const handleSessionExpired = () => setUser(null);
    window.addEventListener("auth-refresh-failed", handleSessionExpired);
    window.addEventListener("auth:session-expired", handleSessionExpired);

    return () => {
      mounted = false;
      window.removeEventListener("auth-refresh-failed", handleSessionExpired);
      window.removeEventListener("auth:session-expired", handleSessionExpired);
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const authenticatedUser = await loginRequest(credentials);
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  const logout = async () => {
    await logoutRequest();
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
