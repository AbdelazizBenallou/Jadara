import { createContext, useContext, type ReactNode } from "react";

// Light-mode only — dark mode was removed from the app
interface ThemeContextValue {
  theme: "light";
}

const ThemeContext = createContext<ThemeContextValue>({ theme: "light" });

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeContext.Provider value={{ theme: "light" }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
