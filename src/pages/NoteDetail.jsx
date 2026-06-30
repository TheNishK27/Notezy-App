import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, auth } from "@/api";
import { toast } from "sonner";
import { Star, Download, FileText, Sparkle, ShoppingCart, ArrowLeft, ChatCircle } from "@phosphor-icons/react";

export default function NoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = auth.getUser();
  const [note, setNote] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [buying, setBuying] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");

  const load = async () => {
    try {
      const [n, rv] = await Promise.all([
        api.get(`/notes/${id}`),
        api.get(`/reviews/${id}`),
      ]);
      setNote(n.data);
      setReviews(rv.data);
    } catch (e) {
      toast.error("Note not found");
      navigate("/browse");
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const buy = async () => {
    if (!auth.getToken()) { navigate("/auth"); return; }
    setBuying(true);
    try {
      const r = await api.post("/checkout/session", { note_id: id, origin_url: window.location.origin });
      window.location.href = r.data.url;
    } catch (e) {
      toast.error(e.response?.data?.detail || "Couldn't start checkout");
      setBuying(false);
    }
  };

  const download = async () => {
    try {
      const r = await api.get(`/notes/${id}/download`);
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${r.data.file_b64 || ""}`;
      link.download = r.data.file_name || "note.pdf";
      if (!r.data.file_b64) { toast.info("Demo note – no real file. Try uploading your own!"); return; }
      link.click();
      toast.success("Download started");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Download failed");
    }
  };

  const aiSummary = async () => {
    setSummaryLoading(true);
    try {
      const r = await api.post("/ai/summary", { note_id: id });
      setSummary(r.data.summary);
    } catch (e) {
      toast.error("AI summary failed");
    } finally {
      setSummaryLoading(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!myRating) { toast.error("Pick a star rating"); return; }
    try {
      await api.post("/reviews", { note_id: id, rating: myRating, comment: myComment });
      toast.success("Review posted");
      setMyComment(""); setMyRating(0);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Couldn't submit");
    }
  };

  if (!note) return <div className="max-w-4xl mx-auto p-8 font-display text-2xl">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <button onClick={() => navigate(-1)} className="text-sm font-bold uppercase flex items-center gap-2 hover:underline">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border-2 border-black rounded-lg p-6 brutal-shadow space-y-4" style={{ borderLeft: "12px solid #4C7BF4" }}>
            <div className="flex flex-wrap gap-2">
              <span className="chip" style={{ background: "#F4FF47" }}>{note.content_type}</span>
              <span className="chip">{note.subject}</span>
              <span className="chip">Sem {note.semester}</span>
              <span className="chip">{note.branch}</span>
              {note.tags?.map((t) => <span key={t} className="chip" style={{ background: "#4ADE80" }}>#{t}</span>)}
            </div>
            <h1 className="font-display text-4xl leading-tight">{note.title}</h1>
            <p className="text-neutral-700">{note.description}</p>
            <div className="flex items-center gap-6 text-sm font-bold pt-3 border-t-2 border-dashed border-black/30">
              <span className="flex items-center gap-1"><Star size={16} weight="fill" className="text-yellow-500" /> {note.rating_avg || "—"} ({note.rating_count})</span>
              <span className="flex items-center gap-1"><Download size={16} /> {note.downloads}</span>
              <span className="flex items-center gap-1"><FileText size={16} /> by {note.seller_name}</span>
            </div>
          </div>

          <div className="bg-white border-2 border-black rounded-lg p-6 brutal-shadow">
            <button onClick={aiSummary} data-testid="ai-summary-btn" disabled={summaryLoading} className="brutal-btn bg-[#F4FF47] px-4 py-2 rounded-md uppercase font-bold text-sm inline-flex items-center gap-2 disabled:opacity-50">
              <Sparkle size={16} weight="fill" /> {summaryLoading ? "Generating..." : "Generate AI Summary"}
            </button>
            {summary && (
              <div className="mt-4 p-4 lined-paper border-2 border-black rounded-md whitespace-pre-wrap text-sm leading-relaxed">{summary}</div>
            )}
          </div>

          <div className="bg-white border-2 border-black rounded-lg p-6 brutal-shadow space-y-4">
            <h2 className="font-display text-2xl flex items-center gap-2"><ChatCircle size={22} weight="bold" /> Reviews ({reviews.length})</h2>
            {user && (
              <form onSubmit={submitReview} className="space-y-2 p-3 border-2 border-dashed border-black rounded-md">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} type="button" data-testid={`star-${s}`} onClick={() => setMyRating(s)} className="p-1">
                      <Star size={24} weight={s <= myRating ? "fill" : "regular"} className={s <= myRating ? "text-yellow-500" : "text-neutral-400"} />
                    </button>
                  ))}
                </div>
                <textarea data-testid="review-comment" placeholder="Was this note helpful?" value={myComment} onChange={(e) => setMyComment(e.target.value)} className="w-full border-2 border-black rounded-md p-2 text-sm" rows={2} />
                <button data-testid="submit-review" className="brutal-btn bg-black text-white px-4 py-2 rounded-md text-xs uppercase font-bold">Post Review</button>
              </form>
            )}
            {reviews.map((r) => (
              <div key={r.id} className="border-b border-dashed border-black/30 pb-3">
                <div className="flex items-center justify-between text-sm">
                  <b>{r.user_name}</b>
                  <div className="flex">{Array(r.rating).fill(0).map((_, i) => <Star key={i} size={14} weight="fill" className="text-yellow-500" />)}</div>
                </div>
                {r.comment && <p className="text-sm mt-1 text-neutral-700">{r.comment}</p>}
              </div>
            ))}
            {reviews.length === 0 && <div className="text-sm text-neutral-500">No reviews yet.</div>}
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="bg-white border-2 border-black rounded-lg p-6 brutal-shadow sticky top-24">
            <div className="font-mono text-3xl font-bold">{note.price === 0 ? "FREE" : `₹${note.price}`}</div>
            <div className="text-xs uppercase font-bold text-neutral-600 mt-1">{note.price === 0 ? "Download anytime" : "One-time purchase"}</div>

            {note.price === 0 ? (
              <button data-testid="download-btn" onClick={download} className="mt-4 w-full brutal-btn bg-[#4ADE80] py-3 rounded-md uppercase font-display text-lg flex items-center justify-center gap-2">
                <Download size={20} weight="bold" /> Download
              </button>
            ) : (
              <button data-testid="buy-btn" onClick={buy} disabled={buying} className="mt-4 w-full brutal-btn bg-[#F4FF47] py-3 rounded-md uppercase font-display text-lg flex items-center justify-center gap-2 disabled:opacity-50">
                <ShoppingCart size={20} weight="bold" /> {buying ? "Loading..." : "Buy & Download"}
              </button>
            )}

            <div className="mt-5 pt-5 border-t-2 border-dashed border-black/30 text-sm space-y-2">
              <div className="font-bold uppercase text-xs">Seller</div>
              <div className="font-display text-lg">{note.seller_name}</div>
              <div className="text-neutral-600">{note.seller_college}</div>
              <div className="flex items-center gap-1 text-xs"><span className="chip" style={{ background: "#4ADE80" }}>Verified</span></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
