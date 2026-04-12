import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

const getInitialTheme = () => {
  const stored = localStorage.getItem("theme");
  if (stored === "light") return true;
  if (stored === "dark") return false;
  return true; // default light
};

export const ThemeProvider = ({ children }) => {
  const [isLight, setIsLight] = useState(getInitialTheme);

  useEffect(() => {
    document.body.classList.toggle("light", isLight);
    document.body.classList.toggle("dark", !isLight);
    localStorage.setItem("theme", isLight ? "light" : "dark");
  }, [isLight]);

  const toggleTheme = () => setIsLight((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isLight, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);