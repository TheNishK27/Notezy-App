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
  CreditCard,
  ShieldCheck,
  ArrowRight,
} from "@phosphor-icons/react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data } = await supabase.auth.getUser();
    const currentUser = data?.user || null;

    setUser(currentUser);

    if (currentUser) {
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("wallet_balance,total_sales,seller_level,is_admin")
        .eq("id", currentUser.id)
        .single();

      if (error) console.error("Profile fetch error:", error);

      setProfile(profileData);
    }
  };

  const onLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="notezy-card px-6 py-5 font-display text-2xl">
          Loading profile...
        </div>
      </div>
    );
  }

  const meta = user.user_metadata || {};
  const walletBalance = Number(profile?.wallet_balance || 0).toFixed(2);
  const isAdmin = profile?.is_admin === true;
  const sellerLevel = profile?.seller_level || "New Seller";
  const totalSales = profile?.total_sales || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 text-black dark:text-white">
      <div className="notezy-card p-5 sm:p-6 overflow-hidden relative">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#F4FF47] border-2 border-black rounded-full opacity-70" />

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
          <div className="w-24 h-24 bg-[#FF6B9E] text-black border-2 border-black dark:border-white rounded-xl flex items-center justify-center font-display text-5xl brutal-shadow-sm shrink-0">
            {meta.full_name?.[0]?.toUpperCase() || <User size={42} />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl sm:text-4xl leading-tight break-words">
                {meta.full_name || "Student"}
              </h1>

              {user.email_confirmed_at && (
                <span className="chip" style={{ background: "#4ADE80" }}>
                  <SealCheck size={12} weight="fill" /> Verified
                </span>
              )}

              {isAdmin && (
  <span
    className="chip"
    style={{
      background: "#FF6B35",
      color: "#ffffff",
      borderColor: "#050505",
    }}
  >
    <ShieldCheck
      size={12}
      weight="fill"
      style={{ color: "#ffffff" }}
    />
    <span style={{ color: "#ffffff" }}>ADMIN</span>
  </span>
)}
            </div>

            <div className="text-sm text-neutral-700 dark:text-neutral-300 mt-2">
              {meta.college || "College not set"} ·{" "}
              {meta.branch || "Branch not set"} · Year {meta.year || "—"}, Sem{" "}
              {meta.semester || "—"}
            </div>

            <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Roll: {meta.roll_number || "—"}
            </div>
          </div>

          <button
            onClick={onLogout}
            className="brutal-btn bg-red-500 text-white px-4 py-3 rounded-md uppercase font-bold flex items-center justify-center gap-2"
          >
            <SignOut size={18} weight="bold" />
            Logout
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Info icon={Envelope} label="Email" value={user.email} />
        <Info icon={Hash} label="Roll No" value={meta.roll_number || "—"} />
        <Info icon={GraduationCap} label="College" value={meta.college || "—"} />
        <Info icon={ChartBar} label="Seller Level" value={sellerLevel} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 notezy-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="font-display text-3xl">Quick Actions</h2>
            <div className="text-xs uppercase font-bold text-neutral-600 dark:text-neutral-300">
              Manage Notezy
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Action to="/wishlist" icon={Heart} label="Wishlist" color="#FF6B9E" />
            <Action to="/library" icon={BookOpenText} label="Library" color="#4ADE80" />
            <Action to="/wallet" icon={CreditCard} label="Wallet" color="#F4FF47" />
            <Action to="/dashboard" icon={ChartBar} label="Seller Dashboard" color="#F4FF47" />
            <Action to="/upload" icon={UploadSimple} label="Upload Notes" color="#4C7BF4" />

            {isAdmin && (
              <Action
                to="/admin"
                icon={ShieldCheck}
                label="Admin Dashboard"
                color="#FF6B35"
              />
            )}
          </div>
        </div>

        <div className="bg-[#F4FF47] text-black border-2 border-black dark:border-white rounded-lg p-6 brutal-shadow flex flex-col justify-between gap-5">
          <div>
            <div className="text-xs uppercase font-bold">Wallet Balance</div>
            <div className="font-display text-5xl mt-1">₹{walletBalance}</div>
            <div className="text-xs text-neutral-700 mt-2">
              Min withdrawal: ₹100
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white border-2 border-black rounded-md p-3">
              <div className="text-xs uppercase font-bold">Sales</div>
              <div className="font-display text-2xl">{totalSales}</div>
            </div>

            <div className="bg-white border-2 border-black rounded-md p-3">
              <div className="text-xs uppercase font-bold">Level</div>
              <div className="font-bold text-sm">{sellerLevel}</div>
            </div>
          </div>

          <Link
            to="/dashboard"
            className="brutal-btn bg-black text-white px-4 py-3 rounded-md uppercase font-bold text-sm flex items-center justify-center gap-2"
          >
            <Wallet size={16} weight="bold" />
            Withdraw
          </Link>
        </div>
      </div>
    </div>
  );
}

const Info = ({ icon: Icon, label, value }) => (
  <div className="notezy-card p-4">
    <div className="flex items-center gap-2 text-xs uppercase font-bold text-neutral-600 dark:text-neutral-300">
      <Icon size={14} weight="bold" /> {label}
    </div>
    <div className="font-bold mt-1 break-words text-sm">{value}</div>
  </div>
);

const Action = ({ to, icon: Icon, label, color }) => (
  <Link
    to={to}
    className="notezy-card p-4 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all group"
  >
    <div
      className="w-11 h-11 border-2 border-black dark:border-white rounded-md flex items-center justify-center mb-3 text-black"
      style={{ background: color }}
    >
      <Icon size={21} weight="bold" />
    </div>

    <div className="flex items-center justify-between gap-2">
      <div className="font-display text-xl leading-tight">{label}</div>
      <ArrowRight
        size={16}
        weight="bold"
        className="opacity-60 group-hover:translate-x-1 transition-transform"
      />
    </div>
  </Link>
);