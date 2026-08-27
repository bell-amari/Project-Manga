export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "manga-labs-theme";
export const THEME_CHANGE_EVENT = "manga-labs-theme-change";

export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

export function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function getActiveTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function applyTheme(theme: Theme, persist = true) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  if (persist && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Browsers can block localStorage in some privacy modes. The theme still
      // works for the current page even if the preference cannot be persisted.
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<Theme>(THEME_CHANGE_EVENT, { detail: theme }),
    );
  }
}

export function toggleTheme(): Theme {
  const nextTheme: Theme = getActiveTheme() === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  return nextTheme;
}
