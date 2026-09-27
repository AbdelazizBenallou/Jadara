import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
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
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      try {
        const res = await apiClient.get("/users/me/profile");
        if (mounted && res.data?.data) {
          setUser(normalizeUser(res.data.data));
        }
      } catch (error) {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();

    // Listen for refresh failures from the Axios interceptor
    const handleRefreshFailed = () => {
      setUser(null);
    };
    window.addEventListener("auth-refresh-failed", handleRefreshFailed);

    return () => {
      mounted = false;
      window.removeEventListener("auth-refresh-failed", handleRefreshFailed);
    };
  }, []);

  const login = async (credentials: Record<string, unknown>) => {
    const res = await apiClient.post("/auth/login", credentials);
    if (res.data?.data?.user) {
      const u = normalizeUser(res.data.data.user);
      setUser(u);
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
    }
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
