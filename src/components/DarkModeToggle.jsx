import React, { useEffect, useState } from "react";
import { Moon, Sun } from "@phosphor-icons/react";

export default function DarkModeToggle() {
  const [dark, setDark] =useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("notezy-theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const next = !dark;

    setDark(next);

    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("notezy-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("notezy-theme", "light");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle Dark Mode"
      title={dark ? "Light Mode" : "Dark Mode"}
      className="
        notezy-icon-btn
        sm:w-auto sm:px-3 sm:gap-2
        flex items-center justify-center
        transition-all duration-200
        hover:scale-105
      "
    >
      {dark ? (
        <Sun size={20} weight="fill" />
      ) : (
        <Moon size={20} weight="fill" />
      )}

      <span className="hidden sm:inline font-bold text-sm">
        {dark ? "Light" : "Dark"}
      </span>
    </button>
  );
}