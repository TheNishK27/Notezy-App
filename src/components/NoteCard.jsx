import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Star,
  Download,
  Eye,
  FileText,
  PencilSimpleLine,
  Heart,
} from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const accentByType = {
  PDF: "#4C7BF4",
  Handwritten: "#FF6B9E",
  Typed: "#4ADE80",
  PYQ: "#F4FF47",
};

export default function NoteCard({ note, testId }) {
  const accent = accentByType[note.content_type] || "#4C7BF4";
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    checkWishlist();
  }, [note.id]);

  const checkWishlist = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    const { data } = await supabase
      .from("wishlist")
      .select("id")
      .eq("user_id", auth.user.id)
      .eq("note_id", note.id)
      .maybeSingle();

    setWishlisted(!!data);
  };

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      toast.error("Please login first");
      return;
    }

    if (wishlisted) {
      const { error } = await supabase
        .from("wishlist")
        .delete()
        .eq("user_id", auth.user.id)
        .eq("note_id", note.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      setWishlisted(false);
      toast.success("Removed from wishlist");
    } else {
      const { error } = await supabase.from("wishlist").insert({
        user_id: auth.user.id,
        note_id: note.id,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setWishlisted(true);
      toast.success("Added to wishlist");
    }
  };

  return (
    <Link
      to={`/notes/${note.id}`}
      data-testid={testId || `note-card-${note.id}`}
      className="block bg-white dark:bg-[#1b1b1b] text-black dark:text-white border-2 border-black dark:border-white rounded-lg brutal-shadow brutal-card-hover overflow-hidden relative"
      style={{
        borderLeftWidth: "10px",
        borderLeftStyle: "solid",
        borderLeftColor: accent,
      }}
    >
      <button
        onClick={toggleWishlist}
        className="absolute top-3 right-3 z-10 w-9 h-9 bg-white dark:bg-[#111111] border-2 border-black dark:border-white rounded-md flex items-center justify-center brutal-shadow-sm"
        title="Wishlist"
      >
        <Heart
          size={18}
          weight={wishlisted ? "fill" : "bold"}
          className={wishlisted ? "text-red-500" : "text-black dark:text-white"}
        />
      </button>

      <div className="p-4 space-y-3 pr-14">
        <div className="flex items-center justify-between gap-2">
          <span
            className="chip"
            style={{
              background: accent,
              color: accent === "#F4FF47" ? "#050505" : "#fff",
              borderColor: accent === "#F4FF47" ? "#050505" : "#050505",
            }}
          >
            {note.content_type === "Handwritten" ? (
              <PencilSimpleLine size={12} weight="bold" />
            ) : (
              <FileText size={12} weight="bold" />
            )}
            {note.content_type}
          </span>

          <span className="font-mono text-sm font-bold text-black dark:text-white">
            {Number(note.price) === 0 ? "FREE" : `₹${note.price}`}
          </span>
        </div>

        <h3 className="font-display text-lg leading-snug line-clamp-2 text-black dark:text-white">
          {note.title}
        </h3>

        <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2">
          {note.description}
        </p>

        <div className="flex items-center justify-between text-[11px] text-neutral-700 dark:text-neutral-300 font-bold uppercase tracking-wide pt-2 border-t-2 border-dashed border-black/30 dark:border-white/30">
          <span>
            {note.subject} · Sem {note.semester}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <Star size={14} weight="fill" className="text-yellow-500" />
            <span className="font-bold text-black dark:text-white">
              {note.rating_avg || "—"}
            </span>
            <span className="text-neutral-500 dark:text-neutral-400">
              ({note.rating_count || 0})
            </span>
          </div>

          <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
            <span className="flex items-center gap-1">
              <Download size={12} /> {note.downloads || 0}
            </span>
            <span className="flex items-center gap-1">
              <Eye size={12} /> {note.views || 0}
            </span>
          </div>
        </div>

        <div className="text-[11px] uppercase font-bold text-neutral-700 dark:text-neutral-300">
          by {note.seller_name || "Seller"} · {note.college || "College"}
        </div>
      </div>
    </Link>
  );
}