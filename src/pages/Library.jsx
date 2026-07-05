import React, { useEffect, useState } from "react";
import { BookOpenText, DownloadSimple } from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL;

export default function Library() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

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
          notes(*)
        `)
        .eq("buyer_id", auth.user.id);

      if (error) throw error;

      const notes = (purchases || []).map((p) => p.notes).filter(Boolean);
      setItems(notes);
    } catch (err) {
      console.error(err);
      toast.error("Could not load library");
    } finally {
      setLoading(false);
    }
  };

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
        body: JSON.stringify({
          note_id: noteId,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.detail || "Download failed");
      }

      if (!json.download_url) {
        throw new Error("Download URL not received");
      }

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
      <div className="max-w-6xl mx-auto p-10 font-display text-3xl">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 border-2 border-black rounded-md flex items-center justify-center bg-[#4ADE80]">
          <BookOpenText size={20} weight="bold" />
        </div>

        <h1 className="font-display text-4xl">Your Library</h1>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-black rounded-lg p-12 text-center">
          <div className="font-display text-3xl mb-2">
            No purchased notes
          </div>

          <div className="text-neutral-600">
            Buy a note and it'll appear here instantly.
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((note) => (
            <div
              key={note.id}
              className="bg-white border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_#000]"
            >
              <h2 className="font-display text-2xl mb-2">{note.title}</h2>

              <p className="text-sm text-neutral-600 mb-4">
                {note.description || "Purchased note"}
              </p>

              <button
                onClick={() => downloadNote(note.id)}
                disabled={downloadingId === note.id}
                className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-md font-bold disabled:opacity-60"
              >
                <DownloadSimple size={18} weight="bold" />
                {downloadingId === note.id ? "Preparing..." : "Download"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}