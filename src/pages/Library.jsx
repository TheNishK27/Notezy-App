import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpenText,
  DownloadSimple,
  MagnifyingGlass,
  FileText,
  ArrowRight,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL;

export default function Library() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();

      if (!auth.user) {
        setItems([]);
        return;
      }

      const { data: purchases, error } = await supabase
        .from("purchases")
        .select(`
          note_id,
          created_at,
          notes(*)
        `)
        .eq("buyer_id", auth.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const notes = (purchases || [])
        .map((p) => ({
          ...p.notes,
          purchased_at: p.created_at,
        }))
        .filter(Boolean);

      setItems(notes);
    } catch (err) {
      console.error(err);
      toast.error("Could not load library");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return items;

    return items.filter((note) =>
      `${note.title} ${note.description} ${note.subject} ${note.branch}`
        .toLowerCase()
        .includes(q)
    );
  }, [items, search]);

  const downloadNote = async (noteId) => {
    try {
      setDownloadingId(noteId);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        toast.error("Please login first");
        return;
      }

      const res = await fetch(`${API_URL}/api/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note_id: noteId }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.detail || "Download failed");
      if (!json.download_url) throw new Error("Download URL not received");

      window.open(json.download_url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        <div className="h-24 notezy-card animate-pulse" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 notezy-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 text-black dark:text-white">
      <div className="notezy-card p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 border-2 border-black dark:border-white rounded-md flex items-center justify-center bg-[#4ADE80] text-black brutal-shadow-sm">
              <BookOpenText size={22} weight="bold" />
            </div>

            <div>
              <h1 className="font-display text-3xl sm:text-4xl">
                Your Library
              </h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                All your purchased notes in one place.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 border-2 border-black dark:border-white rounded-md px-3 py-2 bg-white dark:bg-[#111111] w-full lg:w-80">
            <MagnifyingGlass size={18} weight="bold" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your notes..."
              className="w-full bg-transparent outline-none text-sm text-black dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
          <MiniStat label="Purchased" value={items.length} />
          <MiniStat
            label="Subjects"
            value={new Set(items.map((n) => n.subject).filter(Boolean)).size}
          />
          <MiniStat
            label="Downloads"
            value={items.reduce((sum, n) => sum + Number(n.downloads || 0), 0)}
          />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="notezy-card border-dashed p-10 sm:p-12 text-center">
          <div className="mx-auto w-16 h-16 border-2 border-black dark:border-white rounded-xl bg-[#F4FF47] text-black flex items-center justify-center brutal-shadow-sm mb-5">
            <BookOpenText size={32} weight="bold" />
          </div>

          <div className="font-display text-3xl mb-2">No purchased notes</div>

          <div className="text-neutral-600 dark:text-neutral-300 max-w-md mx-auto">
            Buy a note and it will appear here instantly with secure download
            access.
          </div>

          <Link
            to="/browse"
            className="notezy-yellow-btn inline-flex items-center gap-2 mt-6 px-5 py-3 uppercase"
          >
            Browse Notes <ArrowRight size={18} weight="bold" />
          </Link>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="notezy-card border-dashed p-10 text-center">
          <div className="font-display text-2xl">No notes match your search</div>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2">
            Try another subject, title, or branch.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((note) => (
            <div key={note.id} className="notezy-card overflow-hidden">
              {note.thumbnail_url ? (
                <img
                  src={note.thumbnail_url}
                  alt={note.title}
                  className="w-full h-44 object-cover border-b-2 border-black dark:border-white"
                />
              ) : (
                <div className="h-44 bg-[#F4FF47] text-black border-b-2 border-black dark:border-white flex items-center justify-center">
                  <FileText size={44} weight="bold" />
                </div>
              )}

              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="chip text-xs">
                    {note.content_type || "PDF"}
                  </span>
                  <span className="font-mono text-xs font-bold">
                    ₹{note.price || 0}
                  </span>
                </div>

                <h2 className="font-display text-2xl leading-tight line-clamp-2">
                  {note.title}
                </h2>

                <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2">
                  {note.description || "Purchased note"}
                </p>

                <div className="text-xs text-neutral-600 dark:text-neutral-300 border-t border-dashed border-black/30 dark:border-white/30 pt-3">
                  {note.subject || "Subject"} · Sem {note.semester || "—"}
                </div>

                <button
                  onClick={() => downloadNote(note.id)}
                  disabled={downloadingId === note.id}
                  className="w-full notezy-blue-btn py-3 rounded-md flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <DownloadSimple size={18} weight="bold" />
                  {downloadingId === note.id ? "Preparing..." : "Download"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const MiniStat = ({ label, value }) => (
  <div className="bg-[#FAFAFA] dark:bg-[#111111] border-2 border-black dark:border-white rounded-md p-3">
    <div className="font-display text-2xl">{value}</div>
    <div className="text-[11px] uppercase font-bold text-neutral-600 dark:text-neutral-300">
      {label}
    </div>
  </div>
);