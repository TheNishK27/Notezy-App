import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, auth } from "@/api";
import {
  ArrowRight,
  CheckCircle,
  Lightning,
  Shield,
  Sparkle,
  Wallet,
  GraduationCap,
  BookOpenText,
} from "@phosphor-icons/react";

const Marquee = () => (
  <div className="bg-[#F4FF47] text-black border-y-2 border-black dark:border-white overflow-hidden py-3">
    <div className="flex gap-12 whitespace-nowrap marquee-track font-display text-lg sm:text-xl uppercase tracking-tight">
      {Array(2)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="flex gap-12">
            <span>★ Verified Students</span>
            <span>★ Real College Notes</span>
            <span>★ Earn While You Learn</span>
            <span>★ Best Revenue Split</span>
            <span>★ AI-Powered Search</span>
            <span>★ IIT · NIT · IIIT · BITS · VIT</span>
          </div>
        ))}
    </div>
  </div>
);

export default function Landing() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ notes: 0, students: 0, colleges: 0 });

  useEffect(() => {
    api.get("/stats")
      .then((r) => setStats(r.data))
      .catch((err) => console.error(err));

    if (auth.getToken()) navigate("/home");
  }, [navigate]);

  return (
    <div className="text-black dark:text-white">
      <section className="paper-bg border-b-2 border-black dark:border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-white dark:bg-[#1b1b1b] border-2 border-black dark:border-white px-3 py-1 rounded-full brutal-shadow-sm text-xs uppercase font-bold">
              <Shield size={14} weight="bold" />
              India's Verified Student Marketplace
            </div>

            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl leading-[0.95]">
              Study smarter.
              <br />
              <span className="bg-[#F4FF47] text-black px-2 border-2 border-black inline-block rotate-[-1deg] brutal-shadow mt-2">
                Earn while you do.
              </span>
            </h1>

            <p className="text-base sm:text-lg max-w-xl text-neutral-700 dark:text-neutral-300">
              Buy & sell verified notes from your seniors. Handwritten gold from
              toppers, PYQs, cheat sheets — all from students who actually
              cracked the exam.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to="/auth"
                data-testid="hero-cta-signup"
                className="notezy-yellow-btn px-6 py-4 rounded-md uppercase font-display text-lg inline-flex items-center justify-center gap-2"
              >
                Get Started <ArrowRight size={18} weight="bold" />
              </Link>

              <Link
                to="/browse"
                data-testid="hero-cta-browse"
                className="brutal-btn bg-white dark:bg-[#1b1b1b] text-black dark:text-white px-6 py-4 rounded-md uppercase font-display text-lg inline-flex items-center justify-center gap-2"
              >
                Browse Notes
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4 max-w-md">
              {[
                { v: stats.notes, l: "Notes" },
                { v: stats.students, l: "Students" },
                { v: stats.colleges, l: "Colleges" },
              ].map((s) => (
                <div key={s.l} className="notezy-card p-3">
                  <div className="font-display text-xl sm:text-2xl">{s.v}+</div>
                  <div className="text-[10px] sm:text-[11px] uppercase font-bold text-neutral-600 dark:text-neutral-300">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="absolute -top-4 -left-4 w-full h-full bg-[#4C7BF4] border-2 border-black dark:border-white rounded-lg" />
            <img
              src="https://images.unsplash.com/photo-1637589316488-6d4c41b335cd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzB8MHwxfHNlYXJjaHwzfHxpbmRpYW4lMjBjb2xsZWdlJTIwc3R1ZGVudHMlMjBzdHVkeWluZ3xlbnwwfHx8fDE3ODI4MDA2MjF8MA&ixlib=rb-4.1.0&q=85"
              alt="students"
              className="relative w-full aspect-[4/5] object-cover rounded-lg border-2 border-black dark:border-white brutal-shadow-lg grayscale contrast-110"
            />

            <div className="absolute -bottom-5 -right-2 sm:-right-5 bg-[#F4FF47] text-black border-2 border-black dark:border-white p-3 rounded-md brutal-shadow-sm rotate-3">
              <div className="font-mono text-xs font-bold">VERIFIED ✓</div>
              <div className="font-display text-base sm:text-lg leading-tight">
                10,000+ students
              </div>
            </div>
          </div>
        </div>
      </section>

      <Marquee />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <h2 className="font-display text-3xl sm:text-4xl mb-8 sm:mb-10">
          How Notezy works
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              i: GraduationCap,
              t: "1. Verify with college email",
              d: "Sign up with your college email. Verified-only access keeps fakes out.",
            },
            {
              i: BookOpenText,
              t: "2. Buy quality notes",
              d: "Discover topper notes, PYQs, handwritten gems. Filter by college, subject, semester, branch.",
            },
            {
              i: Wallet,
              t: "3. Sell yours. Earn more",
              d: "Upload your notes. Set price ₹10-₹100. Your creator share updates automatically.",
            },
          ].map((s, i) => (
            <div key={i} className="notezy-card p-6 space-y-3">
              <div className="w-12 h-12 border-2 border-black dark:border-white rounded-md flex items-center justify-center bg-[#4ADE80] text-black">
                <s.i size={24} weight="bold" />
              </div>
              <h3 className="font-display text-xl">{s.t}</h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                {s.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white dark:bg-[#1b1b1b] border-y-2 border-black dark:border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
          <h2 className="font-display text-3xl sm:text-4xl mb-8 sm:mb-10">
            Built for Indian campuses
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
            <div className="md:col-span-4 bg-[#F4FF47] text-black border-2 border-black rounded-lg p-6 brutal-shadow">
              <Sparkle size={28} weight="fill" />
              <h3 className="font-display text-2xl sm:text-3xl mt-3 mb-2">
                AI search that gets it.
              </h3>
              <p>
                Type "easy DSP notes for last-minute prep" and we'll find the
                gold. No more digging Drive folders.
              </p>
            </div>

            <div className="md:col-span-2 bg-[#FF6B9E] text-white border-2 border-black dark:border-white rounded-lg p-6 brutal-shadow">
              <Lightning size={28} weight="fill" />
              <h3 className="font-display text-2xl mt-3 mb-2">
                Instant downloads
              </h3>
              <p>Pay, download, study. No waiting on Telegram sellers.</p>
            </div>

            <div className="md:col-span-2 bg-[#4ADE80] text-black border-2 border-black rounded-lg p-6 brutal-shadow">
              <CheckCircle size={28} weight="fill" />
              <h3 className="font-display text-2xl mt-3 mb-2">
                Verified only
              </h3>
              <p>Every uploader is a real student. College email + ID.</p>
            </div>

            <div className="md:col-span-4 bg-[#4C7BF4] text-white border-2 border-black dark:border-white rounded-lg p-6 brutal-shadow">
              <Wallet size={28} weight="fill" />
              <h3 className="font-display text-2xl sm:text-3xl mt-3 mb-2">
                You keep a fair creator share.
              </h3>
              <p>
                Withdraw to UPI/Bank after crossing ₹100. Built for real student
                sellers.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-16 sm:py-20 text-center">
        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-tight">
          Your campus. Your notes.{" "}
          <span className="bg-[#F4FF47] text-black inline-block border-2 border-black px-3 brutal-shadow-sm">
            Your earnings.
          </span>
        </h2>

        <p className="mt-6 text-base sm:text-lg text-neutral-700 dark:text-neutral-300">
          Join Notezy and turn your study grind into side income.
        </p>

        <Link
          to="/auth"
          data-testid="footer-cta-signup"
          className="mt-8 inline-flex brutal-btn bg-black dark:bg-white text-white dark:text-black px-6 sm:px-8 py-4 rounded-md uppercase font-display text-base sm:text-lg items-center gap-2"
        >
          Join free — verify in 30s <ArrowRight size={18} weight="bold" />
        </Link>
      </section>

      <footer className="border-t-2 border-black dark:border-white bg-white dark:bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row gap-4 justify-between items-center text-sm">
          <div className="font-display text-xl">
            notezy<span className="text-[#4C7BF4]">.</span>
          </div>
          <div className="text-neutral-600 dark:text-neutral-300">
            Study. Share. Succeed.
          </div>
        </div>
      </footer>
    </div>
  );
}