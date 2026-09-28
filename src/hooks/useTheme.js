import { useContext } from "react";
import { SettingsContext } from "../context/SettingsContext.jsx";

export function useTheme() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useTheme must be used within a SettingsProvider");
  }
  return context;
}
