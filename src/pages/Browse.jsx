import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import NoteCard from "@/components/NoteCard";
import { MagnifyingGlass, FunnelSimple, X } from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";

const SUBJECTS = [
  "Engineering Mathematics",
  "Engineering Physics",
  "Engineering Chemistry",
  "Data Structures and Algorithms",
  "Database Management System",
  "Microprocessors and Microcontroller",
  "VLSI",
  "Signals and Systems",
  "Network Theory",
  "Polity",
];

const BRANCHES = [
  "Computer Science and Engineering",
  "Electronics and Communication Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Architecture and Planning",
  "Mathematics and Computing",
  "Chemical Science and Technology",
  "Mechatronics and Automation Engineering",
  "Master of Computer Applications",
];

const CATEGORIES = [
  "Engineering",
  "Medical",
  "Law",
  "MBA",
  "Commerce",
  "Arts",
  "Competitive Exams",
];

const TYPES = ["PDF", "Handwritten", "Typed", "PYQ"];

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    q: searchParams.get("q") || "",
    college: searchParams.get("college") || "",
    semester: searchParams.get("semester") || "",
    branch: searchParams.get("branch") || "",
    subject: searchParams.get("subject") || "",
    category: searchParams.get("category") || "",
    content_type: searchParams.get("content_type") || "",
    price: searchParams.get("price") || "",
    featured: searchParams.get("featured") || "",
    sort: searchParams.get("sort") || "recent",
  });

  useEffect(() => {
    loadNotes();
  }, [filters]);

  const loadNotes = async () => {
    setLoading(true);

    let query = supabase.from("notes").select("*").eq("status", "approved");

    if (filters.q.trim()) {
      const q = filters.q.trim();
      query = query.or(
        `title.ilike.%${q}%,description.ilike.%${q}%,subject.ilike.%${q}%,branch.ilike.%${q}%,college.ilike.%${q}%`
      );
    }

    if (filters.college) {
      query = query.ilike("college", `%${filters.college}%`);
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

    if (filters.category) {
      query = query.eq("category", filters.category);
    }

    if (filters.content_type) {
      query = query.eq("content_type", filters.content_type);
    }

    if (filters.price === "free") {
      query = query.eq("price", 0);
    }

    if (filters.price === "paid") {
      query = query.gt("price", 0);
    }

    if (filters.featured === "true") {
      query = query.eq("featured", true);
    }

    if (filters.sort === "popular") {
      query = query.order("downloads", { ascending: false });
    } else if (filters.sort === "rating") {
      query = query.order("rating_avg", { ascending: false });
    } else if (filters.sort === "price_low") {
      query = query.order("price", { ascending: true });
    } else if (filters.sort === "price_high") {
      query = query.order("price", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      setNotes([]);
    } else {
      setNotes(data || []);
    }

    setLoading(false);
  };

  const set = (key, value) => {
    const updatedFilters = { ...filters, [key]: value };
    setFilters(updatedFilters);

    const params = new URLSearchParams();

    Object.entries(updatedFilters).forEach(([k, v]) => {
      if (v && v !== "recent") params.set(k, v);
    });

    setSearchParams(params);
  };

  const clearFilters = () => {
    const reset = {
      q: "",
      college: "",
      semester: "",
      branch: "",
      subject: "",
      category: "",
      content_type: "",
      price: "",
      featured: "",
      sort: "recent",
    };

    setFilters(reset);
    setSearchParams({});
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 text-black dark:text-white overflow-x-hidden">
      <div className="flex items-center gap-3 mb-5 sm:mb-6 min-w-0">
        <div className="w-10 h-10 border-2 border-black dark:border-white rounded-md flex items-center justify-center bg-[#4C7BF4] text-white shrink-0">
          <MagnifyingGlass size={20} weight="bold" />
        </div>

        <h1 className="font-display text-3xl sm:text-4xl leading-none break-words">
          Browse Notes
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        <aside className="w-full min-w-0 lg:col-span-3 bg-white dark:bg-[#1b1b1b] border-2 border-black dark:border-white rounded-lg p-4 sm:p-5 brutal-shadow space-y-4 h-fit lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-2 font-display text-xl min-w-0">
              <FunnelSimple size={20} weight="bold" className="shrink-0" />
              <span className="truncate">Filters</span>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-bold underline flex items-center gap-1 shrink-0"
            >
              <X size={12} /> Clear
            </button>
          </div>

          <div>
            <div className="text-xs uppercase font-bold mb-1">Search</div>
            <div className="flex items-center gap-2 border-2 border-black dark:border-white rounded-md px-3 py-2 bg-white dark:bg-[#111111] min-w-0">
              <MagnifyingGlass size={14} className="shrink-0" />
              <input
                placeholder="Title, subject, branch..."
                value={filters.q}
                onChange={(e) => set("q", e.target.value)}
                className="w-full min-w-0 text-sm outline-none bg-transparent text-black dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <Select
              label="Category"
              value={filters.category}
              onChange={(v) => set("category", v)}
              options={CATEGORIES}
            />

            <Select
              label="Branch"
              value={filters.branch}
              onChange={(v) => set("branch", v)}
              options={BRANCHES}
            />

            <Select
              label="Subject"
              value={filters.subject}
              onChange={(v) => set("subject", v)}
              options={SUBJECTS}
            />

            <Select
              label="Content type"
              value={filters.content_type}
              onChange={(v) => set("content_type", v)}
              options={TYPES}
            />

            <Select
              label="Price"
              value={filters.price}
              onChange={(v) => set("price", v)}
              options={[
                { label: "Free", value: "free" },
                { label: "Paid", value: "paid" },
              ]}
            />

            <Select
              label="Featured"
              value={filters.featured}
              onChange={(v) => set("featured", v)}
              options={[{ label: "Featured only", value: "true" }]}
            />

            <div className="min-w-0">
              <div className="text-xs uppercase font-bold mb-1">Semester</div>
              <input
                type="number"
                min="1"
                max="10"
                placeholder="Any"
                value={filters.semester}
                onChange={(e) => set("semester", e.target.value)}
                className="w-full min-w-0 border-2 border-black dark:border-white rounded-md px-3 py-2 text-sm bg-white dark:bg-[#111111] text-black dark:text-white outline-none"
              />
            </div>

            <div className="min-w-0">
              <div className="text-xs uppercase font-bold mb-1">College</div>
              <input
                placeholder="NIT Patna"
                value={filters.college}
                onChange={(e) => set("college", e.target.value)}
                className="w-full min-w-0 border-2 border-black dark:border-white rounded-md px-3 py-2 text-sm bg-white dark:bg-[#111111] text-black dark:text-white outline-none"
              />
            </div>

            <Select
              label="Sort by"
              value={filters.sort}
              onChange={(v) => set("sort", v)}
              options={[
                { label: "Newest", value: "recent" },
                { label: "Most popular", value: "popular" },
                { label: "Highest rated", value: "rating" },
                { label: "Price: Low to High", value: "price_low" },
                { label: "Price: High to Low", value: "price_high" },
              ]}
            />
          </div>
        </aside>

        <main className="w-full min-w-0 lg:col-span-9">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
            <div className="text-xs sm:text-sm font-bold uppercase text-neutral-700 dark:text-neutral-300 break-words">
              {loading ? "Searching..." : `${notes.length} approved notes found`}
            </div>
          </div>

          {notes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 min-w-0">
              {notes.map((note) => (
                <div key={note.id} className="min-w-0">
                  <NoteCard note={note} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1b1b1b] border-2 border-dashed border-black dark:border-white rounded-lg p-6 sm:p-10 text-center">
              <div className="font-display text-xl sm:text-2xl">
                {loading ? "Loading notes..." : "No approved notes match these filters"}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-300 mt-2">
                Try removing some filters or changing keywords.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const Select = ({ label, value, onChange, options }) => (
  <div className="min-w-0">
    <div className="text-xs uppercase font-bold mb-1">{label}</div>

    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full min-w-0 max-w-full border-2 border-black dark:border-white rounded-md px-3 py-2 text-sm bg-white dark:bg-[#111111] text-black dark:text-white outline-none truncate"
    >
      <option value="">Any</option>

      {options.map((option) => {
        const isObject = typeof option === "object";

        return (
          <option
            key={isObject ? option.value : option}
            value={isObject ? option.value : option}
          >
            {isObject ? option.label : option}
          </option>
        );
      })}
    </select>
  </div>
);
