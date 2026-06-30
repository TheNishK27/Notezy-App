import React, { useEffect, useState } from "react";
import { api, auth } from "@/api";
import { User, Envelope, GraduationCap, Wallet, SealCheck, Hash } from "@phosphor-icons/react";

export default function Profile() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    api.get("/auth/me").then((r) => { setUser(r.data); auth.set(localStorage.getItem("notezy_token"), r.data); });
  }, []);

  if (!user) return <div className="max-w-4xl mx-auto p-8 font-display text-2xl">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="bg-white border-2 border-black rounded-lg p-6 brutal-shadow flex items-center gap-6">
        <div className="w-24 h-24 bg-[#FF6B9E] border-2 border-black rounded-md flex items-center justify-center font-display text-5xl brutal-shadow-sm">
          {user.name?.[0]?.toUpperCase() || <User />}
        </div>
        <div className="flex-1">
          <h1 className="font-display text-3xl flex items-center gap-2">
            {user.name}
            {user.verified && <span className="chip" style={{background: "#4ADE80"}}><SealCheck size={12} weight="fill" /> Verified</span>}
          </h1>
          <div className="text-sm text-neutral-700 mt-1">{user.college} · {user.department} · Year {user.year}, Sem {user.semester}</div>
          <div className="text-sm text-neutral-600 mt-1">Roll: {user.roll_number}</div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        <Info icon={Envelope} label="Email" value={user.email} />
        <Info icon={Hash} label="Phone" value={user.phone || "—"} />
        <Info icon={GraduationCap} label="College" value={user.college} />
      </div>

      <div className="bg-[#F4FF47] border-2 border-black rounded-lg p-6 brutal-shadow flex items-center justify-between" data-testid="profile-wallet">
        <div>
          <div className="text-xs uppercase font-bold">Wallet Balance</div>
          <div className="font-display text-5xl mt-1">₹{user.wallet_balance || 0}</div>
          <div className="text-xs text-neutral-700 mt-1">Min withdrawal: ₹100</div>
        </div>
        <button data-testid="profile-withdraw" className="brutal-btn bg-black text-white px-4 py-3 rounded-md uppercase font-bold text-sm flex items-center gap-2">
          <Wallet size={16} weight="bold" /> Withdraw
        </button>
      </div>
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
