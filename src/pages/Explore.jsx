import React, { useEffect, useState } from "react";
import NoteCard from "@/components/NoteCard";
import { Compass, Fire, Star, Clock } from "@phosphor-icons/react";

const DEMO_NOTES = [
  {
    id: "1",
    title: "Digital Electronics Complete Notes",
    subject: "Digital Electronics",
    college: "NIT Patna",
    branch: "ECE",
    semester: 3,
    price: 49,
    rating: 4.8,
    downloads: 120,
  },
  {
    id: "2",
    title: "Signals & Systems Handwritten Notes",
    subject: "Signals and Systems",
    college: "NIT Patna",
    branch: "ECE",
    semester: 4,
    price: 39,
    rating: 4.7,
    downloads: 95,
  },
  {
    id: "3",
    title: "DBMS Complete Guide",
    subject: "DBMS",
    college: "IIT Delhi",
    branch: "CSE",
    semester: 5,
    price: 59,
    rating: 4.9,
    downloads: 240,
  },
  {
    id: "4",
    title: "Engineering Maths PYQs",
    subject: "Mathematics",
    college: "NIT Patna",
    branch: "All",
    semester: 2,
    price: 0,
    rating: 4.5,
    downloads: 180,
  },
];

const Pill = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 border-2 border-black rounded-full text-xs uppercase font-bold transition-all ${
      active ? "bg-black text-white brutal-shadow-sm" : "bg-white"
    }`}
  >
    {children}
  </button>
);

export default function Explore() {
  const [tab, setTab] = useState("trending");
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    let result = [...DEMO_NOTES];

    switch (tab) {
      case "trending":
        result.sort((a, b) => b.downloads - a.downloads);
        break;

      case "top":
        result.sort((a, b) => b.rating - a.rating);
        break;

      case "new":
        result.reverse();
        break;

      case "free":
        result = result.filter((n) => n.price === 0);
        break;

      default:
        break;
    }

    setNotes(result);
  }, [tab]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 border-2 border-black rounded-md flex items-center justify-center bg-[#FF6B9E] text-white">
          <Compass size={20} weight="bold" />
        </div>

        <h1 className="font-display text-4xl">Explore</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Pill active={tab === "trending"} onClick={() => setTab("trending")}>
          <span className="inline-flex items-center gap-1">
            <Fire size={12} weight="bold" />
            Trending
          </span>
        </Pill>

        <Pill active={tab === "top"} onClick={() => setTab("top")}>
          <span className="inline-flex items-center gap-1">
            <Star size={12} weight="bold" />
            Top Rated
          </span>
        </Pill>

        <Pill active={tab === "new"} onClick={() => setTab("new")}>
          <span className="inline-flex items-center gap-1">
            <Clock size={12} weight="bold" />
            New
          </span>
        </Pill>

        <Pill active={tab === "free"} onClick={() => setTab("free")}>
          Free
        </Pill>
      </div>

      <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
        {notes.map((note, i) => (
          <div
            key={note.id}
            className="break-inside-avoid"
            style={{ transform: `rotate(${(i % 3 - 1) * 0.4}deg)` }}
          >
            <NoteCard note={note} />
          </div>
        ))}
      </div>
    </div>
  );
}
