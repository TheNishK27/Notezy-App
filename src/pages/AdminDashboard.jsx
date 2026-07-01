import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ClipboardText,
  Users,
  Wallet,
  Crown,
  CheckCircle,
  XCircle,
  Eye,
} from "@phosphor-icons/react";

const Stat = ({ label, value, icon: Icon, color }) => (
  <div
    className="bg-white border-2 border-black rounded-lg p-5 brutal-shadow"
    style={{ borderTop: `8px solid ${color}` }}
  >
    <div className="flex justify-between items-center">
      <div className="text-xs uppercase font-bold text-neutral-600">{label}</div>
      <Icon size={20} weight="bold" />
    </div>
    <div className="font-display text-3xl mt-2">{value}</div>
  </div>
);

export default function AdminDashboard() {
  const [pendingNotes, setPendingNotes] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);

    const [{ data: notes }, { data: users }, { data: sales }, { data: withdraws }] =
      await Promise.all([
        supabase.from("notes").select("*").eq("status", "pending").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("purchases").select("*, notes(title)").order("created_at", { ascending: false }).limit(10),
        supabase.from("withdrawals").select("*").eq("status", "pending").order("created_at", { ascending: false }),
      ]);

    setPendingNotes(notes || []);
    setProfiles(users || []);
    setPurchases(sales || []);
    setWithdrawals(withdraws || []);
    setLoading(false);
  };

  const updateNoteStatus = async (id, status) => {
    const payload =
      status === "approved"
        ? { status, approved_at: new Date().toISOString(), rejected_reason: null }
        : { status, rejected_reason: "Rejected by admin" };

    await supabase.from("notes").update(payload).eq("id", id);
    loadAdminData();
  };

  const makeElite = async (userId) => {
    await supabase
      .from("profiles")
      .update({
        is_verified: true,
        seller_level: "Notezy Elite",
      })
      .eq("id", userId);

    loadAdminData();
  };

  const platformRevenue = purchases.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  const platformProfit = purchases.reduce(
    (sum, p) => sum + Number(p.platform_fee || 0),
    0
  );

  const eliteCount = profiles.filter((p) => p.seller_level === "Notezy Elite").length;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 font-display text-3xl">
        Loading admin panel...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <h1 className="font-display text-5xl">Notezy Admin Panel</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <Stat label="Pending Notes" value={pendingNotes.length} color="#F4FF47" icon={ClipboardText} />
        <Stat label="Users" value={profiles.length} color="#4C7BF4" icon={Users} />
        <Stat label="Revenue" value={`₹${platformRevenue.toFixed(2)}`} color="#4ADE80" icon={Wallet} />
        <Stat label="Profit" value={`₹${platformProfit.toFixed(2)}`} color="#FF6B9E" icon={Wallet} />
        <Stat label="Elite Creators" value={eliteCount} color="#A855F7" icon={Crown} />
      </div>

      <section className="bg-white border-2 border-black rounded-lg p-6 brutal-shadow">
        <h2 className="font-display text-3xl mb-4">Pending Note Approvals</h2>

        {pendingNotes.length === 0 ? (
          <div className="text-neutral-600">No pending notes.</div>
        ) : (
          <div className="space-y-4">
            {pendingNotes.map((note) => (
              <div key={note.id} className="border-2 border-black rounded-lg p-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <div>
                    <h3 className="font-display text-2xl">{note.title}</h3>
                    <p className="text-sm text-neutral-600">
                      {note.subject} · {note.branch} · Sem {note.semester} · ₹{note.price}
                    </p>
                    <p className="mt-2 text-sm">{note.description}</p>
                  </div>

                  <div className="flex gap-2 flex-wrap h-fit">
                    <a href={note.file_url} target="_blank" rel="noreferrer" className="brutal-btn bg-[#4C7BF4] text-white px-4 py-2 rounded-md flex items-center gap-1">
                      <Eye size={16} /> Preview
                    </a>
                    <button onClick={() => updateNoteStatus(note.id, "approved")} className="brutal-btn bg-[#4ADE80] px-4 py-2 rounded-md flex items-center gap-1">
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button onClick={() => updateNoteStatus(note.id, "rejected")} className="brutal-btn bg-[#FF6B9E] text-white px-4 py-2 rounded-md flex items-center gap-1">
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border-2 border-black rounded-lg p-6 brutal-shadow">
          <h2 className="font-display text-3xl mb-4">Recent Transactions</h2>

          {purchases.length === 0 ? (
            <div className="text-neutral-600">No transactions yet.</div>
          ) : (
            <div className="space-y-3">
              {purchases.map((p) => (
                <div key={p.id} className="flex justify-between border-b border-dashed border-black/30 pb-2 text-sm">
                  <div>
                    <div className="font-bold">{p.notes?.title || "Note"}</div>
                    <div className="text-neutral-600">Seller earned ₹{p.seller_earning}</div>
                  </div>
                  <div className="font-mono">₹{p.amount}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border-2 border-black rounded-lg p-6 brutal-shadow">
          <h2 className="font-display text-3xl mb-4">Top Sellers</h2>

          <div className="space-y-3">
            {profiles
              .filter((p) => Number(p.total_sales || 0) > 0)
              .sort((a, b) => Number(b.wallet_balance || 0) - Number(a.wallet_balance || 0))
              .slice(0, 5)
              .map((p) => (
                <div key={p.id} className="flex justify-between items-center border-b border-dashed border-black/30 pb-2 text-sm">
                  <div>
                    <div className="font-bold">{p.full_name}</div>
                    <div className="text-neutral-600">{p.seller_level || "New Seller"} · {p.total_sales || 0} sales</div>
                  </div>
                  <button onClick={() => makeElite(p.id)} className="brutal-btn bg-[#F4FF47] px-3 py-1 rounded-md text-xs uppercase font-bold">
                    Make Elite
                  </button>
                </div>
              ))}
          </div>
        </div>
      </section>

      <section className="bg-white border-2 border-black rounded-lg p-6 brutal-shadow">
        <h2 className="font-display text-3xl mb-4">Pending Withdrawals</h2>

        {withdrawals.length === 0 ? (
          <div className="text-neutral-600">No pending withdrawals.</div>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex justify-between border-b border-dashed border-black/30 pb-2">
                <div>Seller: {w.seller_id}</div>
                <div className="font-mono">₹{w.amount}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}