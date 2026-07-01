import React, { useEffect, useState } from "react";
import { Heart } from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";
import NoteCard from "@/components/NoteCard";

export default function Wishlist() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) return;

    const { data, error } = await supabase
      .from("wishlist")
      .select(`
        note_id,
        notes(*)
      `)
      .eq("user_id", auth.user.id);

    if (!error) {
      setNotes(data.map((x) => x.notes).filter(Boolean));
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-10 font-display text-3xl">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Heart size={28} weight="fill" className="text-red-500" />
        <h1 className="font-display text-4xl">
          Wishlist
        </h1>
      </div>

      {notes.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-black rounded-lg p-12 text-center">
          <div className="font-display text-3xl">
            Your wishlist is empty
          </div>

          <p className="text-neutral-500 mt-2">
            Save notes to revisit them later.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
            />
          ))}
        </div>
      )}
    </div>
  );
}