
import React from "react";
import { useEffect, useState } from "react";
import { Moon, Sun, SunMoon } from "lucide-react";

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState<boolean>(() =>
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const classList = document.documentElement.classList;
    if (isDark) {
      classList.add("dark");
    } else {
      classList.remove("dark");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(d => !d);
  };

  return (
    <button
      className="fixed z-50 top-4 right-5 bg-white/70 dark:bg-black/60 border border-gray-300 dark:border-gray-600 rounded-full shadow-xl p-2 flex items-center justify-center transition-all hover:scale-105 hover:ring-2 hover:ring-primary focus:outline-none"
      onClick={toggleTheme}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
    >
      {/* Animated sun/moon icon */}
      <span className="transition-all duration-300 ease-in-out flex">
        {isDark ? (
          <Moon className="h-6 w-6 text-gray-700 dark:text-yellow-300 animate-fade-in" />
        ) : (
          <Sun className="h-6 w-6 text-yellow-400 dark:text-gray-200 animate-fade-in" />
        )}
      </span>
    </button>
  );
};

export default ThemeToggle;
