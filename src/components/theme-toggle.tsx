import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getActiveTheme,
  THEME_CHANGE_EVENT,
  toggleTheme,
  type Theme,
} from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const syncTheme = () => setTheme(getActiveTheme());

    syncTheme();
    window.addEventListener(THEME_CHANGE_EVENT, syncTheme);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, syncTheme);
    };
  }, []);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="theme-toggle"
      onClick={() => setTheme(toggleTheme())}
    >
      <Sun className="theme-toggle__icon" aria-hidden="true" />
      <Moon className="theme-toggle__icon" aria-hidden="true" />
      <span className="theme-toggle__thumb" aria-hidden="true" />
    </button>
  );
}
