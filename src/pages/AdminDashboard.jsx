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
  Star,
  ShieldCheck,
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
  const [adminRole, setAdminRole] = useState("none");

  const [pendingNotes, setPendingNotes] = useState([]);
  const [approvedNotes, setApprovedNotes] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = adminRole === "super_admin";

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      setLoading(false);
      return;
    }

    const { data: myProfile, error: roleError } = await supabase
      .from("profiles")
      .select("admin_role")
      .eq("id", authData.user.id)
      .single();

    if (roleError) {
      console.error("Admin role fetch error:", roleError);
    }

    const role = myProfile?.admin_role || "none";
    setAdminRole(role);

    const [{ data: pending }, { data: approved }] = await Promise.all([
      supabase
        .from("notes")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false }),

      supabase
        .from("notes")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false }),
    ]);

    setPendingNotes(pending || []);
    setApprovedNotes(approved || []);

    if (role === "super_admin") {
      const [{ data: users }, { data: sales }, { data: withdraws }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false }),

          supabase
            .from("purchases")
            .select("*, notes(title)")
            .order("created_at", { ascending: false })
            .limit(10),

          supabase
            .from("withdrawals")
            .select("*")
            .eq("status", "pending")
            .order("created_at", { ascending: false }),
        ]);

      setProfiles(users || []);
      setPurchases(sales || []);
      setWithdrawals(withdraws || []);
    } else {
      setProfiles([]);
      setPurchases([]);
      setWithdrawals([]);
    }

    setLoading(false);
  };

  const updateNoteStatus = async (id, status) => {
    const payload =
      status === "approved"
        ? {
            status,
            approved_at: new Date().toISOString(),
            rejected_reason: null,
          }
        : {
            status,
            featured: false,
            rejected_reason: "Rejected by admin",
          };

    await supabase.from("notes").update(payload).eq("id", id);
    loadAdminData();
  };

  const toggleFeatured = async (note) => {
    await supabase
      .from("notes")
      .update({ featured: !note.featured })
      .eq("id", note.id);

    loadAdminData();
  };

  const makeElite = async (userId) => {
    if (!isSuperAdmin) return;

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

  const eliteCount = profiles.filter(
    (p) => p.seller_level === "Notezy Elite"
  ).length;

  const featuredCount = approvedNotes.filter((n) => n.featured).length;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 font-display text-3xl">
        Loading admin panel...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-display text-5xl">Notezy Admin Panel</h1>

        <div className="bg-white border-2 border-black rounded-md px-4 py-2 brutal-shadow-sm text-sm font-bold flex items-center gap-2">
          <ShieldCheck size={18} weight="bold" />
          {isSuperAdmin ? "Super Admin" : "Moderator Admin"}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <Stat
          label="Pending Notes"
          value={pendingNotes.length}
          color="#F4FF47"
          icon={ClipboardText}
        />

        <Stat
          label="Approved Notes"
          value={approvedNotes.length}
          color="#4C7BF4"
          icon={ClipboardText}
        />

        <Stat
          label="Featured"
          value={featuredCount}
          color="#FF6B9E"
          icon={Star}
        />

        {isSuperAdmin && (
          <>
            <Stat
              label="Revenue"
              value={`₹${platformRevenue.toFixed(2)}`}
              color="#4ADE80"
              icon={Wallet}
            />

            <Stat
              label="Elite Creators"
              value={eliteCount}
              color="#A855F7"
              icon={Crown}
            />
          </>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="bg-[#F4FF47] border-2 border-black rounded-lg p-4 brutal-shadow text-sm font-bold">
          Moderator access: You can approve/reject notes and manage featured
          notes. Revenue, transactions, withdrawals, and confidential startup
          data are hidden.
        </div>
      )}

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
                      {note.subject} · {note.branch} · Sem {note.semester} · ₹
                      {note.price}
                    </p>
                    <p className="mt-2 text-sm">{note.description}</p>
                  </div>

                  <div className="flex gap-2 flex-wrap h-fit">
                    <a
                      href={note.preview_file_url || note.preview_url}
                      target="_blank"
                      rel="noreferrer"
                      className="brutal-btn bg-[#4C7BF4] text-white px-4 py-2 rounded-md flex items-center gap-1"
                    >
                      <Eye size={16} /> Preview
                    </a>

                    <button
                      onClick={() => updateNoteStatus(note.id, "approved")}
                      className="brutal-btn bg-[#4ADE80] px-4 py-2 rounded-md flex items-center gap-1"
                    >
                      <CheckCircle size={16} /> Approve
                    </button>

                    <button
                      onClick={() => updateNoteStatus(note.id, "rejected")}
                      className="brutal-btn bg-[#FF6B9E] text-white px-4 py-2 rounded-md flex items-center gap-1"
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white border-2 border-black rounded-lg p-6 brutal-shadow">
        <h2 className="font-display text-3xl mb-4">Approved Notes</h2>

        {approvedNotes.length === 0 ? (
          <div className="text-neutral-600">No approved notes yet.</div>
        ) : (
          <div className="space-y-4">
            {approvedNotes.map((note) => (
              <div key={note.id} className="border-2 border-black rounded-lg p-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <div>
                    <h3 className="font-display text-2xl flex items-center gap-2">
                      {note.title}
                      {note.featured && (
                        <span className="text-xs bg-[#F4FF47] border-2 border-black rounded-md px-2 py-1 font-bold">
                          ⭐ Featured
                        </span>
                      )}
                    </h3>

                    <p className="text-sm text-neutral-600">
                      {note.subject} · {note.branch} · Sem {note.semester} · ₹
                      {note.price}
                    </p>

                    <p className="mt-2 text-sm">{note.description}</p>
                  </div>

                  <div className="flex gap-2 flex-wrap h-fit">
                    <a
                      href={note.preview_file_url || note.preview_url}
                      target="_blank"
                      rel="noreferrer"
                      className="brutal-btn bg-[#4C7BF4] text-white px-4 py-2 rounded-md flex items-center gap-1"
                    >
                      <Eye size={16} /> Preview
                    </a>

                    <button
                      onClick={() => toggleFeatured(note)}
                      className={`brutal-btn px-4 py-2 rounded-md flex items-center gap-1 ${
                        note.featured
                          ? "bg-black text-white"
                          : "bg-[#F4FF47] text-black"
                      }`}
                    >
                      <Star size={16} weight="fill" />
                      {note.featured ? "Remove Featured" : "Make Featured"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {isSuperAdmin && (
        <>
          <section className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white border-2 border-black rounded-lg p-6 brutal-shadow">
              <h2 className="font-display text-3xl mb-4">
                Recent Transactions
              </h2>

              {purchases.length === 0 ? (
                <div className="text-neutral-600">No transactions yet.</div>
              ) : (
                <div className="space-y-3">
                  {purchases.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between border-b border-dashed border-black/30 pb-2 text-sm"
                    >
                      <div>
                        <div className="font-bold">{p.notes?.title || "Note"}</div>
                        <div className="text-neutral-600">
                          Seller earned ₹{p.seller_earning}
                        </div>
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
                  .sort(
                    (a, b) =>
                      Number(b.wallet_balance || 0) -
                      Number(a.wallet_balance || 0)
                  )
                  .slice(0, 5)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center border-b border-dashed border-black/30 pb-2 text-sm"
                    >
                      <div>
                        <div className="font-bold">{p.full_name}</div>
                        <div className="text-neutral-600">
                          {p.seller_level || "New Seller"} ·{" "}
                          {p.total_sales || 0} sales
                        </div>
                      </div>

                      <button
                        onClick={() => makeElite(p.id)}
                        className="brutal-btn bg-[#F4FF47] px-3 py-1 rounded-md text-xs uppercase font-bold"
                      >
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
                  <div
                    key={w.id}
                    className="flex justify-between border-b border-dashed border-black/30 pb-2"
                  >
                    <div>Seller: {w.seller_id}</div>
                    <div className="font-mono">₹{w.amount}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}