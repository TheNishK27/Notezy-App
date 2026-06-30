import React, { useEffect, useState } from "react";
import { api } from "@/api";
import NoteCard from "@/components/NoteCard";
import { Compass, Fire, Star, Clock } from "@phosphor-icons/react";

const Pill = ({ active, onClick, children, testId }) => (
  <button data-testid={testId} onClick={onClick} className={`px-4 py-2 border-2 border-black rounded-full text-xs uppercase font-bold transition-all ${active ? "bg-black text-white brutal-shadow-sm" : "bg-white"}`}>{children}</button>
);

export default function Explore() {
  const [tab, setTab] = useState("trending");
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const sortMap = { trending: "popular", top: "rating", new: "recent", free: "recent" };
    const params = { sort: sortMap[tab] };
    if (tab === "free") params.free = true;
    api.get("/notes", { params }).then((r) => setNotes(r.data)).finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 border-2 border-black rounded-md flex items-center justify-center bg-[#FF6B9E] text-white"><Compass size={20} weight="bold" /></div>
        <h1 className="font-display text-4xl">Explore</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Pill testId="explore-tab-trending" active={tab === "trending"} onClick={() => setTab("trending")}><span className="inline-flex items-center gap-1"><Fire size={12} weight="bold" /> Trending</span></Pill>
        <Pill testId="explore-tab-top" active={tab === "top"} onClick={() => setTab("top")}><span className="inline-flex items-center gap-1"><Star size={12} weight="bold" /> Top Rated</span></Pill>
        <Pill testId="explore-tab-new" active={tab === "new"} onClick={() => setTab("new")}><span className="inline-flex items-center gap-1"><Clock size={12} weight="bold" /> New</span></Pill>
        <Pill testId="explore-tab-free" active={tab === "free"} onClick={() => setTab("free")}>Free</Pill>
      </div>

      {loading ? <div className="font-display text-2xl">Loading...</div> : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
          {notes.map((n, i) => (
            <div key={n.id} className="break-inside-avoid" style={{ transform: `rotate(${(i % 3 - 1) * 0.4}deg)` }}>
              <NoteCard note={n} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
