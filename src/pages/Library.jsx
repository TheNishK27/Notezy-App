import React, { useEffect, useState } from "react";
import { api } from "@/api";
import NoteCard from "@/components/NoteCard";
import { BookOpenText } from "@phosphor-icons/react";

export default function Library() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/library").then((r) => setItems(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 border-2 border-black rounded-md flex items-center justify-center bg-[#4ADE80]"><BookOpenText size={20} weight="bold" /></div>
        <h1 className="font-display text-4xl">Your Library</h1>
      </div>
      {loading ? <div className="font-display text-2xl">Loading...</div> : items.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-black rounded-lg p-12 text-center">
          <div className="font-display text-3xl mb-2">No notes yet</div>
          <div className="text-neutral-600">Notes you purchase will show up here. Go grab some good ones!</div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((n) => <NoteCard key={n.id} note={n} testId={`library-note-${n.id}`} />)}
        </div>
      )}
    </div>
  );
}
