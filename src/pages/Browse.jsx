import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import NoteCard from "@/components/NoteCard";
import { MagnifyingGlass, FunnelSimple } from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";

const SUBJECTS = ["DSP", "Operating Systems", "DBMS", "Mathematics", "Thermodynamics", "DSA", "Microprocessors", "VLSI", "Signals and Systems", "Network Theory", "Polity", "Physics"];
const BRANCHES = ["CSE", "ECE", "EEE", "Mechanical", "Civil", "All", "Arts"];
const CATEGORIES = ["Engineering", "Medical", "Law", "MBA", "Commerce", "Arts", "Competitive Exams"];
const TYPES = ["PDF", "Handwritten", "Typed", "PYQ"];

const DEMO_NOTES = [
  { id: "1", title: "Digital Electronics Complete Notes", subject: "Digital Electronics", college: "NIT Patna", branch: "ECE", semester: 3, price: 49, rating: 4.8, downloads: 120, category: "Engineering", content_type: "PDF" },
  { id: "2", title: "Signals and Systems Short Notes", subject: "Signals and Systems", college: "NIT Patna", branch: "ECE", semester: 4, price: 39, rating: 4.7, downloads: 95, category: "Engineering", content_type: "Handwritten" },
  { id: "3", title: "DBMS Last Minute Notes", subject: "DBMS", college: "IIT Delhi", branch: "CSE", semester: 5, price: 59, rating: 4.9, downloads: 210, category: "Engineering", content_type: "Typed" },
  { id: "4", title: "Engineering Mathematics PYQ Pack", subject: "Mathematics", college: "NIT Patna", branch: "All", semester: 2, price: 29, rating: 4.6, downloads: 160, category: "Engineering", content_type: "PYQ" },
];

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [filters, setFilters] = useState({
    q: searchParams.get("q") || "",
    college: searchParams.get("college") || "",
    semester: searchParams.get("semester") || "",
    branch: searchParams.get("branch") || "",
    subject: searchParams.get("subject") || "",
    category: searchParams.get("category") || "",
    content_type: searchParams.get("content_type") || "",
    free: searchParams.get("free") || "",
    sort: searchParams.get("sort") || "recent",
  });

useEffect(() => {
  const loadNotes = async () => {
    let query = supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters.q) {
      query = query.ilike("title", `%${filters.q}%`);
    }

    if (filters.semester) {
      query = query.eq("semester", Number(filters.semester));
    }

    if (filters.branch) {
      query = query.eq("branch", filters.branch);
    }

    if (filters.subject) {
      query = query.ilike("subject", `%${filters.subject}%`);
    }

    if (filters.free === "true") query = query.eq("price", 0);
    if (filters.free === "false") query = query.gt("price", 0);

    const { data, error } = await query;

    if (error) {
      console.error(error);
      setNotes([]);
      return;
    }

    setNotes(data || []);
  };

  loadNotes();
}, [filters]);

  const set = (k, v) => {
    const f = { ...filters, [k]: v };
    setFilters(f);
    const sp = new URLSearchParams();
    Object.entries(f).forEach(([key, val]) => {
      if (val) sp.set(key, val);
    });
    setSearchParams(sp);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 border-2 border-black rounded-md flex items-center justify-center bg-[#4C7BF4] text-white">
          <MagnifyingGlass size={20} weight="bold" />
        </div>
        <h1 className="font-display text-4xl">Browse Notes</h1>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3 bg-white border-2 border-black rounded-lg p-5 brutal-shadow space-y-4 h-fit sticky top-24">
          <div className="flex items-center gap-2 font-display text-xl">
            <FunnelSimple size={20} weight="bold" /> Filters
          </div>

          <div className="flex items-center gap-2 border-2 border-black rounded-md px-3 py-2 bg-white">
            <MagnifyingGlass size={14} />
            <input placeholder="Search keywords..." value={filters.q} onChange={(e) => set("q", e.target.value)} className="w-full text-sm outline-none" />
          </div>

          <Select label="Category" value={filters.category} onChange={(v) => set("category", v)} options={CATEGORIES} />
          <Select label="Branch" value={filters.branch} onChange={(v) => set("branch", v)} options={BRANCHES} />
          <Select label="Subject" value={filters.subject} onChange={(v) => set("subject", v)} options={SUBJECTS} />
          <Select label="Content type" value={filters.content_type} onChange={(v) => set("content_type", v)} options={TYPES} />

          <div>
            <div className="text-xs uppercase font-bold mb-1">Semester</div>
            <input type="number" min="1" max="10" placeholder="Any" value={filters.semester} onChange={(e) => set("semester", e.target.value)} className="w-full border-2 border-black rounded-md px-3 py-2 text-sm" />
          </div>

          <div>
            <div className="text-xs uppercase font-bold mb-1">College</div>
            <input placeholder="e.g. NIT Patna" value={filters.college} onChange={(e) => set("college", e.target.value)} className="w-full border-2 border-black rounded-md px-3 py-2 text-sm" />
          </div>

          <Select label="Sort by" value={filters.sort} onChange={(v) => set("sort", v)} options={["recent", "rating", "popular", "price_low", "price_high"]} />
        </aside>

        <div className="lg:col-span-9">
          <div className="text-sm font-bold uppercase text-neutral-700 mb-3">
            {notes.length} notes found
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {notes.map((n) => <NoteCard key={n.id} note={n} />)}
          </div>

          {notes.length === 0 && (
            <div className="bg-white border-2 border-dashed border-black rounded-lg p-10 text-center">
              <div className="font-display text-2xl">No notes match these filters</div>
              <div className="text-sm text-neutral-600 mt-2">Try removing some filters or change keywords.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Select = ({ label, value, onChange, options }) => (
  <div>
    <div className="text-xs uppercase font-bold mb-1">{label}</div>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full border-2 border-black rounded-md px-3 py-2 text-sm bg-white">
      <option value="">Any</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);