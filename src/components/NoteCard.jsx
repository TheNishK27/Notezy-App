import React from "react";
import { Link } from "react-router-dom";
import { Star, Download, Eye, FileText, PencilSimpleLine } from "@phosphor-icons/react";

const accentByType = {
  PDF: "#4C7BF4",
  Handwritten: "#FF6B9E",
  Typed: "#4ADE80",
  PYQ: "#F4FF47",
};

export default function NoteCard({ note, testId }) {
  const accent = accentByType[note.content_type] || "#4C7BF4";
  return (
    <Link
      to={`/notes/${note.id}`}
      data-testid={testId || `note-card-${note.id}`}
      className="block bg-white border-2 border-black rounded-lg brutal-shadow brutal-card-hover overflow-hidden"
      style={{ borderLeft: `10px solid ${accent}` }}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="chip" style={{ background: accent, color: accent === "#F4FF47" ? "#050505" : "#fff" }}>
            {note.content_type === "Handwritten" ? <PencilSimpleLine size={12} weight="bold" /> : <FileText size={12} weight="bold" />}
            {note.content_type}
          </span>
          <span className="font-mono text-sm font-bold">
            {note.price === 0 ? "FREE" : `₹${note.price}`}
          </span>
        </div>
        <h3 className="font-display text-lg leading-snug line-clamp-2">{note.title}</h3>
        <p className="text-xs text-neutral-600 line-clamp-2">{note.description}</p>
        <div className="flex items-center justify-between text-[11px] text-neutral-700 font-bold uppercase tracking-wide pt-2 border-t-2 border-dashed border-black/30">
          <span>{note.subject} · Sem {note.semester}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <Star size={14} weight="fill" className="text-yellow-500" />
            <span className="font-bold">{note.rating_avg || "—"}</span>
            <span className="text-neutral-500">({note.rating_count})</span>
          </div>
          <div className="flex items-center gap-3 text-neutral-600">
            <span className="flex items-center gap-1"><Download size={12} /> {note.downloads}</span>
            <span className="flex items-center gap-1"><Eye size={12} /> {note.views}</span>
          </div>
        </div>
        <div className="text-[11px] uppercase font-bold text-neutral-700">
          by {note.seller_name} · {note.college}
        </div>
      </div>
    </Link>
  );
}
