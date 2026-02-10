// components/ThemeToggle.tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evitar hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="w-10 h-10 rounded-full border-2 border-gray-200"
      >
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
      title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-yellow-500 transition-transform duration-300 rotate-0 hover:rotate-90" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700 transition-transform duration-300 rotate-0 hover:-rotate-12" />
      )}
      <span className="sr-only">Cambiar tema</span>
    </Button>
  );
}