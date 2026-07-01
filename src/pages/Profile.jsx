import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  User,
  Envelope,
  GraduationCap,
  Wallet,
  SealCheck,
  Hash,
  Heart,
  BookOpenText,
  ChartBar,
  UploadSimple,
  SignOut,
} from "@phosphor-icons/react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const onLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-8 font-display text-2xl">
        Loading...
      </div>
    );
  }

  const meta = user.user_metadata || {};

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="bg-white border-2 border-black rounded-lg p-6 brutal-shadow flex items-center gap-6">
        <div className="w-24 h-24 bg-[#FF6B9E] border-2 border-black rounded-md flex items-center justify-center font-display text-5xl brutal-shadow-sm">
          {meta.full_name?.[0]?.toUpperCase() || <User />}
        </div>

        <div className="flex-1">
          <h1 className="font-display text-3xl flex items-center gap-2 flex-wrap">
            {meta.full_name || "Student"}
            {user.email_confirmed_at && (
              <span className="chip" style={{ background: "#4ADE80" }}>
                <SealCheck size={12} weight="fill" /> Email Verified
              </span>
            )}
          </h1>

          <div className="text-sm text-neutral-700 mt-1">
            {meta.college || "College not set"} · {meta.branch || "Branch not set"} · Year{" "}
            {meta.year || "—"}, Sem {meta.semester || "—"}
          </div>

          <div className="text-sm text-neutral-600 mt-1">
            Roll: {meta.roll_number || "—"}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        <Info icon={Envelope} label="Email" value={user.email} />
        <Info icon={Hash} label="Roll No" value={meta.roll_number || "—"} />
        <Info icon={GraduationCap} label="College" value={meta.college || "—"} />
      </div>

      <div className="bg-white border-2 border-black rounded-lg p-6 brutal-shadow">
        <h2 className="font-display text-3xl mb-4">Quick Actions</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Action to="/wishlist" icon={Heart} label="Wishlist" color="#FF6B9E" />
          <Action to="/library" icon={BookOpenText} label="Library" color="#4ADE80" />
          <Action to="/dashboard" icon={ChartBar} label="Dashboard" color="#F4FF47" />
          <Action to="/upload" icon={UploadSimple} label="Upload Notes" color="#4C7BF4" />
        </div>
      </div>

      <div className="bg-[#F4FF47] border-2 border-black rounded-lg p-6 brutal-shadow flex items-center justify-between">
        <div>
          <div className="text-xs uppercase font-bold">Wallet Balance</div>
          <div className="font-display text-5xl mt-1">₹0</div>
          <div className="text-xs text-neutral-700 mt-1">
            Min withdrawal: ₹100
          </div>
        </div>

        <button className="brutal-btn bg-black text-white px-4 py-3 rounded-md uppercase font-bold text-sm flex items-center gap-2">
          <Wallet size={16} weight="bold" /> Withdraw
        </button>
      </div>

      <button
        onClick={onLogout}
        className="brutal-btn bg-red-500 text-white px-5 py-3 rounded-md uppercase font-bold flex items-center gap-2"
      >
        <SignOut size={18} weight="bold" />
        Logout
      </button>
    </div>
  );
}

const Info = ({ icon: Icon, label, value }) => (
  <div className="bg-white border-2 border-black rounded-md p-4 brutal-shadow-sm">
    <div className="flex items-center gap-2 text-xs uppercase font-bold text-neutral-600">
      <Icon size={14} weight="bold" /> {label}
    </div>
    <div className="font-bold mt-1 break-words text-sm">{value}</div>
  </div>
);

const Action = ({ to, icon: Icon, label, color }) => (
  <Link
    to={to}
    className="bg-white border-2 border-black rounded-md p-4 brutal-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
  >
    <div
      className="w-10 h-10 border-2 border-black rounded-md flex items-center justify-center mb-3"
      style={{ background: color }}
    >
      <Icon size={20} weight="bold" />
    </div>
    <div className="font-display text-xl">{label}</div>
  </Link>
);