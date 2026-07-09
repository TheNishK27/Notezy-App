import React, { useEffect, useState } from "react";
import NoteCard from "@/components/NoteCard";
import { Compass, Fire, Star, Clock } from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";

const Pill = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 border-2 rounded-full text-xs uppercase font-bold transition-all ${
      active
        ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white brutal-shadow-sm"
        : "bg-white text-black border-black dark:bg-[#1b1b1b] dark:text-white dark:border-white hover:bg-[#F4FF47] hover:text-black"
    }`}
  >
    {children}
  </button>
);

export default function Explore() {
  const [tab, setTab] = useState("trending");
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    loadNotes();
  }, [tab]);

  const loadNotes = async () => {
    let query = supabase.from("notes").select("*").eq("status", "approved");

    if (tab === "trending") {
      query = query.order("downloads", { ascending: false });
    }

    if (tab === "top") {
      query = query.order("rating_avg", { ascending: false });
    }

    if (tab === "new") {
      query = query.order("created_at", { ascending: false });
    }

    if (tab === "free") {
      query = query.eq("price", 0).order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      setNotes([]);
      return;
    }

    setNotes(data || []);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-black dark:text-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 border-2 border-black dark:border-white rounded-md flex items-center justify-center bg-[#FF6B9E] text-white">
          <Compass size={20} weight="bold" />
        </div>

        <h1 className="font-display text-4xl">Explore</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Pill active={tab === "trending"} onClick={() => setTab("trending")}>
          <span className="inline-flex items-center gap-1">
            <Fire size={12} weight="bold" />
            Trending
          </span>
        </Pill>

        <Pill active={tab === "top"} onClick={() => setTab("top")}>
          <span className="inline-flex items-center gap-1">
            <Star size={12} weight="bold" />
            Top Rated
          </span>
        </Pill>

        <Pill active={tab === "new"} onClick={() => setTab("new")}>
          <span className="inline-flex items-center gap-1">
            <Clock size={12} weight="bold" />
            New
          </span>
        </Pill>

        <Pill active={tab === "free"} onClick={() => setTab("free")}>
          Free
        </Pill>
      </div>

      {notes.length > 0 ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
          {notes.map((note, index) => (
            <div
              key={note.id}
              className="break-inside-avoid"
              style={{ transform: `rotate(${(index % 3 - 1) * 0.4}deg)` }}
            >
              <NoteCard note={note} />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1b1b1b] border-2 border-dashed border-black dark:border-white rounded-lg p-10 text-center">
          <div className="font-display text-2xl text-black dark:text-white">
            No approved notes yet
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-300 mt-2">
            Approved notes will appear here after admin review.
          </div>
        </div>
      )}
    </div>
  );
}