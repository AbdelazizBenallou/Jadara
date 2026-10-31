import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Role } from "@/constants/roles";
import { apiClient } from "@/api/client";

// Normalize the backend payload into our frontend User model.
// Important: `login` returns `{ id, email, status, profile, role }`
// `getMyProfile` returns `{ id, email, status, profiles, user_socials, role }`

export interface UserSocial {
  id: number;
  platform: string;
  url: string;
}
export interface User {
  id: number;
  email: string;
  role: Role;
  status: string;
  name: string; // Computed for frontend convenience
  profile: {
    first_name: string;
    last_name: string;
    phone?: string | null;
    gender?: string | null;
    date_of_birth?: string | null;
    avatar?: string | null;
    avatar_url?: string | null;
    location?: string | null;
    bio?: string | null;
  } | null;
  user_socials: UserSocial[];
}

interface UserPayload {
  id: number;
  email: string;
  role: string;
  status: string;
  profiles?: Record<string, unknown>;
  profile?: Record<string, unknown>;
  user_socials?: UserSocial[];
}

function normalizeUser(data: UserPayload): User {
  // Extract profile from either 'profiles' or 'profile' property
  const profileData = (data.profiles || data.profile || null) as Record<string, unknown> | null;

  // Safely compute a fallback name so existing UI doesn't break
  const name = profileData?.first_name
    ? `${profileData.first_name as string} ${(profileData.last_name as string) || ""}`.trim()
    : data.email.split("@")[0];

  return {
    id: data.id,
    email: data.email,
    role: (data.role || "beneficiary").toLowerCase() as Role,
    status: data.status,
    profile: profileData as User["profile"],
    user_socials: data.user_socials || [],
    name,
  };
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (data: Record<string, unknown>) => Promise<User | void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  updateUser: () => {},
  refreshUser: async () => null,
});

// Cache initial profile fetch to avoid duplicate calls during React StrictMode mount
let initialProfilePromise: Promise<User | null> | null = null;

async function fetchCurrentUser(): Promise<User | null> {
  const res = await apiClient.get("/users/me/profile");
  if (res.data?.data) {
    return normalizeUser(res.data.data);
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      if (!initialProfilePromise) {
        initialProfilePromise = fetchCurrentUser()
          .catch((error: unknown) => {
            // Log network errors for debugging without crashing
            const axiosErr = error as { response?: unknown; message?: string };
            if (!axiosErr.response) {
              console.warn("Unable to contact auth server during session restoration:", axiosErr.message);
            }
            return null;
          })
          .finally(() => {
            // Keep active briefly so React StrictMode duplicate mount reuses the same request
            setTimeout(() => {
              initialProfilePromise = null;
            }, 1000);
          });
      }

      try {
        const restoredUser = await initialProfilePromise;
        if (mounted) {
          setUser(restoredUser);
        }
      } catch {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    // Listen for refresh failures broadcast by the Axios interceptor
    const handleRefreshFailed = () => {
      if (mounted) {
        setUser(null);
        queryClient.clear();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("auth-refresh-failed", handleRefreshFailed);
    }

    return () => {
      mounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("auth-refresh-failed", handleRefreshFailed);
      }
    };
  }, [queryClient]);

  const login = async (credentials: Record<string, unknown>) => {
    const res = await apiClient.post("/auth/login", credentials);
    if (res.data?.data?.user) {
      const u = normalizeUser(res.data.data.user);
      setUser(u);
      queryClient.clear();
      return u;
    }
    throw new Error("Login failed");
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      setUser(null);
      queryClient.clear();
    }
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const refreshUser = async (): Promise<User | null> => {
    try {
      const u = await fetchCurrentUser();
      setUser(u);
      return u;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

