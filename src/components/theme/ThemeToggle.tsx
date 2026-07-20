"use client";

import * as React from "react";
import { Moon, Sun, Check, Laptop } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors group"
        aria-label="Toggle theme"
      >
        <motion.div
          initial={false}
          animate={{
            rotate: theme === "dark" ? -90 : 0,
            scale: theme === "dark" ? 0 : 1,
          }}
          transition={{ duration: 0.3, ease: "backOut" }}
          className="absolute origin-center"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] transition-transform group-hover:scale-110" />
        </motion.div>
        <motion.div
          initial={false}
          animate={{
            rotate: theme === "dark" ? 0 : 90,
            scale: theme === "dark" ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease: "backOut" }}
          className="absolute origin-center"
        >
          <Moon className="h-[1.2rem] w-[1.2rem] transition-transform group-hover:scale-110" />
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px] rounded-xl p-1.5 shadow-lg border-border bg-popover text-popover-foreground">
        <DropdownMenuItem onClick={() => setTheme("light")} className="justify-between cursor-pointer rounded-lg px-2.5 py-2">
          <div className="flex items-center gap-2.5">
            <Sun className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Light</span>
          </div>
          {theme === "light" && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="justify-between cursor-pointer rounded-lg px-2.5 py-2">
          <div className="flex items-center gap-2.5">
            <Moon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Dark</span>
          </div>
          {theme === "dark" && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="justify-between cursor-pointer rounded-lg px-2.5 py-2">
          <div className="flex items-center gap-2.5">
            <Laptop className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">System</span>
          </div>
          {theme === "system" && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
