"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-lg border border-border/60 bg-background/50 flex items-center justify-center opacity-70">
        <span className="sr-only">Đang tải chủ đề</span>
      </div>
    );
  }

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background/80 hover:bg-accent/60 hover:text-accent-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95"
      title={`Chủ đề hiện tại: ${
        theme === "dark" ? "Tối" : theme === "light" ? "Sáng" : "Hệ thống"
      }. Bấm để chuyển đổi.`}
      aria-label="Chuyển đổi giao diện sáng tối"
    >
      {theme === "light" && <Sun className="h-4 w-4 text-amber-500 transition-all duration-300 rotate-0 scale-100" />}
      {theme === "dark" && <Moon className="h-4 w-4 text-sky-400 transition-all duration-300 rotate-0 scale-100" />}
      {theme === "system" && <Laptop className="h-4 w-4 text-muted-foreground transition-all duration-300" />}
      <span className="sr-only">Đổi chủ đề</span>
    </button>
  );
}
