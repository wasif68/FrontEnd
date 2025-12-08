import { createContext, useContext, useLayoutEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Always ensure dark mode is applied
  useLayoutEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes first
    root.classList.remove("light-mode", "dark-mode", "light", "dark");
    // Always apply dark mode
    root.classList.add("dark-mode", "dark");
  }, []);

  // Provide a simple context value (theme is always 'dark')
  const value = {
    theme: "dark",
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
