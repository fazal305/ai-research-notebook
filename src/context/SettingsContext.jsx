import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Application-level settings (theme, AI provider preference, etc).
 *
 * Theme and AI preference are read/written straight to localStorage
 * instead of going through the IndexedDB settings store: theme has to be
 * available synchronously on first paint (before any async DB read
 * resolves) to avoid a flash of the wrong theme, and the AI preference is
 * small and simple enough that the same approach is easiest. Other
 * settings that don't need that guarantee live in IndexedDB via the
 * settings repository (added in a later step).
 */

const THEME_STORAGE_KEY = "ai-research-notebook:theme";
const THEMES = ["light", "dark", "system"];

const AI_PREFERENCE_STORAGE_KEY = "ai-research-notebook:ai-preference";
const AI_PREFERENCES = ["auto", "local", "cloud"];

function readStoredTheme() {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return THEMES.includes(stored) ? stored : "system";
}

function readStoredAIPreference() {
  if (typeof window === "undefined") return "auto";
  const stored = window.localStorage.getItem(AI_PREFERENCE_STORAGE_KEY);
  return AI_PREFERENCES.includes(stored) ? stored : "auto";
}

function applyThemeAttribute(theme) {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

export const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme);
  const [aiPreference, setAIPreferenceState] = useState(readStoredAIPreference);

  useEffect(() => {
    applyThemeAttribute(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(AI_PREFERENCE_STORAGE_KEY, aiPreference);
  }, [aiPreference]);

  const setTheme = useCallback((next) => {
    setThemeState(THEMES.includes(next) ? next : "system");
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState(
      (current) => THEMES[(THEMES.indexOf(current) + 1) % THEMES.length],
    );
  }, []);

  const setAIPreference = useCallback((next) => {
    setAIPreferenceState(AI_PREFERENCES.includes(next) ? next : "auto");
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      cycleTheme,
      themes: THEMES,
      aiPreference,
      setAIPreference,
      aiPreferences: AI_PREFERENCES,
    }),
    [theme, setTheme, cycleTheme, aiPreference, setAIPreference],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
