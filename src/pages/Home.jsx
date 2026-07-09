import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NoteCard from "@/components/NoteCard";
import {
  MagnifyingGlass,
  Sparkle,
  ArrowRight,
  Fire,
  Clock,
  Star,
} from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";

const yellowTextStroke = {
  textShadow:
    "-0.6px -0.6px 0 #050505, 0.6px -0.6px 0 #050505, -0.6px 0.6px 0 #050505, 0.6px 0.6px 0 #050505",
};

const Row = ({ title, icon: Icon, accent, children, action }) => (
  <section className="space-y-4">
    <div className="flex items-end justify-between gap-3">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 border-2 border-black dark:border-white rounded-md flex items-center justify-center text-black"
          style={{ background: accent }}
        >
          <Icon size={20} weight="bold" />
        </div>

        <h2 className="font-display text-3xl text-black dark:text-white">
          {title}
        </h2>
      </div>

      {action}
    </div>

    {children}
  </section>
);

export default function Home() {
  const user = { name: "Student" };

  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recent, setRecent] = useState([]);
  const [colleges, setColleges] = useState([]);

  const [aiQuery, setAiQuery] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadHome();
  }, []);

  const loadHome = async () => {
    try {
      const [
        { data: featuredNotes },
        { data: recentNotes },
        { data: trendingNotes },
      ] = await Promise.all([
        supabase
          .from("notes")
          .select("*")
          .eq("status", "approved")
          .eq("featured", true)
          .order("created_at", { ascending: false })
          .limit(8),

        supabase
          .from("notes")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(8),

        supabase
          .from("notes")
          .select("*")
          .eq("status", "approved")
          .order("downloads", { ascending: false })
          .limit(8),
      ]);

      setFeatured(featuredNotes || []);
      setRecent(recentNotes || []);
      setTrending(trendingNotes || []);

      const collegeMap = {};

      [
        ...(featuredNotes || []),
        ...(recentNotes || []),
        ...(trendingNotes || []),
      ].forEach((note) => {
        if (!note.college) return;
        collegeMap[note.college] = (collegeMap[note.college] || 0) + 1;
      });

      setColleges(
        Object.entries(collegeMap).map(([name, count]) => ({
          name,
          count,
        }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const runAi = async (e) => {
    e.preventDefault();

    if (!aiQuery.trim()) return;

    setAiLoading(true);

    const query = aiQuery.toLowerCase();
    const allNotes = [...featured, ...recent, ...trending];

    const uniqueNotes = Array.from(
      new Map(allNotes.map((note) => [note.id, note])).values()
    );

    const results = uniqueNotes.filter((note) =>
      `${note.title} ${note.subject} ${note.branch} ${note.college}`
        .toLowerCase()
        .includes(query)
    );

    setAiResult({
      keywords: aiQuery.split(" ").filter(Boolean),
      results,
    });

    setAiLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12 text-black dark:text-white">
      <div className="bg-white dark:bg-[#1b1b1b] border-2 border-black dark:border-white rounded-lg p-6 lg:p-8 brutal-shadow space-y-4 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-[#F4FF47] rounded-full border-2 border-black opacity-60" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 chip bg-white dark:bg-[#111111] border-black dark:border-white text-black dark:text-white">
            <Sparkle size={12} weight="fill" /> AI-Powered
          </div>

          <h1 className="font-display text-3xl sm:text-4xl mt-3 text-black dark:text-white">
            Hi {user?.name?.split(" ")[0] || "there"}, what are you studying
            today?
          </h1>

          <form onSubmit={runAi} className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 border-2 border-black dark:border-white rounded-md px-4 py-3 bg-white dark:bg-[#111111] focus-within:shadow-[4px_4px_0_0_#050505] dark:focus-within:shadow-[4px_4px_0_0_#ffffff] transition-shadow">
              <MagnifyingGlass size={18} weight="bold" />

              <input
                data-testid="ai-search-input"
                placeholder="e.g. easy DSP notes for last minute revision"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                className="w-full bg-transparent outline-none text-base text-black dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
              />
            </div>

            <button
              data-testid="ai-search-submit"
              type="submit"
              disabled={aiLoading}
              className="brutal-btn bg-[#F4FF47] text-black px-6 py-3 rounded-md uppercase font-display text-lg disabled:opacity-50"
            >
              <span style={yellowTextStroke}>
                {aiLoading ? "Searching..." : "Search with AI"}
              </span>
            </button>
          </form>

          {aiResult && (
            <div className="mt-4 space-y-3">
              <div className="text-sm">
                <span className="font-bold uppercase text-xs">Keywords:</span>{" "}
                {aiResult.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="chip mr-2 mt-1 text-black"
                    style={{ background: "#4ADE80" }}
                  >
                    {keyword}
                  </span>
                ))}
              </div>

              {aiResult.results.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {aiResult.results.slice(0, 6).map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              ) : (
                <div className="text-sm text-neutral-600 dark:text-neutral-300">
                  No approved notes found. Try simpler keywords.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Row
        title="Featured Notes"
        icon={Star}
        accent="#F4FF47"
        action={
          <Link
            to="/browse?featured=true"
            className="text-sm font-bold uppercase flex items-center gap-1 hover:underline text-black dark:text-white"
          >
            View all <ArrowRight size={14} />
          </Link>
        }
      >
        {featured.length > 0 ? (
          <div className="flex gap-5 overflow-x-auto no-scrollbar pb-3 -mx-1 px-1">
            {featured.map((note) => (
              <div key={note.id} className="min-w-[280px] max-w-[280px]">
                <NoteCard note={note} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="No featured notes yet. Mark notes as featured from Admin Dashboard." />
        )}
      </Row>

      <Row
        title="Trending now"
        icon={Fire}
        accent="#FF6B9E"
        action={
          <Link
            to="/browse?sort=popular"
            className="text-sm font-bold uppercase flex items-center gap-1 hover:underline text-black dark:text-white"
            data-testid="home-view-all-trending"
          >
            View all <ArrowRight size={14} />
          </Link>
        }
      >
        {trending.length > 0 ? (
          <div className="flex gap-5 overflow-x-auto no-scrollbar pb-3 -mx-1 px-1">
            {trending.map((note) => (
              <div key={note.id} className="min-w-[280px] max-w-[280px]">
                <NoteCard note={note} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="No approved trending notes yet." />
        )}
      </Row>

      <Row
        title="Recently uploaded"
        icon={Clock}
        accent="#4ADE80"
        action={
          <Link
            to="/browse"
            className="text-sm font-bold uppercase flex items-center gap-1 hover:underline text-black dark:text-white"
            data-testid="home-view-all-recent"
          >
            View all <ArrowRight size={14} />
          </Link>
        }
      >
        {recent.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recent.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <EmptyState text="No approved recent notes yet." />
        )}
      </Row>

      {colleges.length > 0 && (
        <Row title="Popular colleges" icon={Sparkle} accent="#4C7BF4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {colleges.map((college) => (
              <Link
                key={college.name}
                to={`/browse?college=${encodeURIComponent(college.name)}`}
                data-testid={`college-chip-${college.name}`}
                className="bg-white dark:bg-[#1b1b1b] border-2 border-black dark:border-white rounded-md p-4 brutal-shadow-sm hover:bg-[#F4FF47] dark:hover:bg-[#F4FF47] hover:text-black transition-colors"
              >
                <div className="font-display text-lg leading-tight">
                  {college.name}
                </div>

                <div className="font-mono text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                  {college.count} notes
                </div>
              </Link>
            ))}
          </div>
        </Row>
      )}
    </div>
  );
}

const EmptyState = ({ text }) => (
  <div className="bg-white dark:bg-[#1b1b1b] border-2 border-dashed border-black dark:border-white rounded-lg p-8 text-center text-sm text-neutral-600 dark:text-neutral-300">
    {text}
  </div>
);