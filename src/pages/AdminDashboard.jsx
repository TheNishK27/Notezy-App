// AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ClipboardText,
  Wallet,
  Crown,
  CheckCircle,
  XCircle,
  Eye,
  Star,
  ShieldCheck,
  Users,
  Receipt,
  Bank,
  TrendUp,
  Sparkle,
} from "@phosphor-icons/react";

const Stat = ({ label, value, icon: Icon, color, helper }) => (
  <div className="notezy-card p-5 relative overflow-hidden group hover:-translate-y-1 transition-transform">
    <div
      className="absolute top-0 left-0 right-0 h-2"
      style={{ background: color }}
    />

    <div className="flex justify-between items-start gap-3 mt-2">
      <div>
        <div className="text-xs uppercase font-bold text-neutral-600 dark:text-neutral-300">
          {label}
        </div>
        <div className="font-display text-3xl mt-2 break-words">{value}</div>
        {helper && (
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {helper}
          </div>
        )}
      </div>

      <div
        className="w-10 h-10 border-2 border-black dark:border-white rounded-md flex items-center justify-center text-black shrink-0"
        style={{ background: color }}
      >
        <Icon size={20} weight="bold" />
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [adminRole, setAdminRole] = useState("none");
  const [currentAdminId, setCurrentAdminId] = useState(null);
  const [transactionIds, setTransactionIds] = useState({});

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

    setCurrentAdminId(authData.user.id);

    const { data: myProfile } = await supabase
      .from("profiles")
      .select("admin_role")
      .eq("id", authData.user.id)
      .single();

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
          supabase.from("profiles").select("*").order("created_at", {
            ascending: false,
          }),

          supabase
            .from("purchases")
            .select("*, notes(title)")
            .order("created_at", { ascending: false })
            .limit(10),

          supabase
            .from("withdrawals")
            .select("*")
            .order("requested_at", { ascending: false }),
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

    const { error } = await supabase.from("notes").update(payload).eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadAdminData();
  };

  const toggleFeatured = async (note) => {
    const { error } = await supabase
      .from("notes")
      .update({ featured: !note.featured })
      .eq("id", note.id);

    if (error) {
      alert(error.message);
      return;
    }

    loadAdminData();
  };

  const makeElite = async (userId) => {
    if (!isSuperAdmin) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        is_verified: true,
        seller_level: "Notezy Elite",
      })
      .eq("id", userId);

    if (error) {
      alert(error.message);
      return;
    }

    loadAdminData();
  };

  const updateWithdrawalStatus = async (withdrawal, status) => {
    if (!isSuperAdmin) return;

    if (withdrawal.status === "paid") {
      alert("This withdrawal is already marked as paid.");
      return;
    }

    const payload = {
      status,
      processed_at: new Date().toISOString(),
      processed_by: currentAdminId,
    };

    if (status === "rejected") payload.admin_note = "Rejected by super admin";
    if (status === "approved") payload.admin_note = "Approved by super admin";

    if (status === "paid") {
      const utr = transactionIds[withdrawal.id];

      if (!utr || !utr.trim()) {
        alert("Enter UTR / Transaction ID before marking as paid.");
        return;
      }

      payload.admin_note = "Marked as paid by super admin";
      payload.transaction_id = utr.trim();

      const { data: freshWithdrawal, error: freshWithdrawalError } =
        await supabase
          .from("withdrawals")
          .select("status")
          .eq("id", withdrawal.id)
          .single();

      if (freshWithdrawalError) {
        alert(freshWithdrawalError.message);
        return;
      }

      if (freshWithdrawal?.status === "paid") {
        alert("This withdrawal is already paid.");
        return;
      }

      const { data: sellerProfile, error: sellerError } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .eq("id", withdrawal.seller_id)
        .single();

      if (sellerError) {
        alert(sellerError.message);
        return;
      }

      const currentWallet = Number(sellerProfile?.wallet_balance || 0);
      const withdrawalAmount = Number(withdrawal.amount || 0);

      if (withdrawalAmount > currentWallet) {
        alert("Seller wallet balance is lower than withdrawal amount.");
        return;
      }

      const { error: walletError } = await supabase
        .from("profiles")
        .update({ wallet_balance: currentWallet - withdrawalAmount })
        .eq("id", withdrawal.seller_id);

      if (walletError) {
        alert(walletError.message);
        return;
      }
    }

    const { error } = await supabase
      .from("withdrawals")
      .update(payload)
      .eq("id", withdrawal.id);

    if (error) {
      alert(error.message);
      return;
    }

    setTransactionIds((prev) => ({ ...prev, [withdrawal.id]: "" }));
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

  const activeWithdrawals = withdrawals.filter(
    (w) => w.status === "pending" || w.status === "approved"
  ).length;

  const getSeller = (sellerId) => profiles.find((p) => p.id === sellerId);

  const topSellers = useMemo(
    () =>
      profiles
        .filter((p) => Number(p.total_sales || 0) > 0)
        .sort(
          (a, b) => Number(b.wallet_balance || 0) - Number(a.wallet_balance || 0)
        )
        .slice(0, 5),
    [profiles]
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        <div className="h-36 notezy-card animate-pulse" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 notezy-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 text-black dark:text-white">
      <section className="notezy-card p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-[#F4FF47] border-2 border-black opacity-70" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 chip mb-3">
              <ShieldCheck size={14} weight="fill" />
              {isSuperAdmin ? "Super Admin" : "Moderator Admin"}
            </div>

            <h1 className="font-display text-4xl sm:text-5xl leading-tight">
              Notezy Admin Panel
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2 max-w-2xl">
              Review uploads, manage featured notes, track transactions, and
              process seller withdrawals from one place.
            </p>
          </div>

          {isSuperAdmin && (
            <div className="bg-[#F4FF47] text-black border-2 border-black dark:border-white rounded-lg p-4 min-w-[190px] brutal-shadow-sm">
              <div className="text-xs uppercase font-bold">Marketplace Revenue</div>
              <div className="font-display text-3xl mt-1">
                ₹{platformRevenue.toFixed(2)}
              </div>
              <div className="text-xs text-neutral-700 mt-1">
                Platform fee: ₹{platformProfit.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <Stat
          label="Pending Notes"
          value={pendingNotes.length}
          helper="Needs review"
          color="#F4FF47"
          icon={ClipboardText}
        />
        <Stat
          label="Approved Notes"
          value={approvedNotes.length}
          helper="Live marketplace"
          color="#4C7BF4"
          icon={ClipboardText}
        />
        <Stat
          label="Featured"
          value={featuredCount}
          helper="Homepage visibility"
          color="#FF6B9E"
          icon={Star}
        />

        {isSuperAdmin && (
          <>
            <Stat
              label="Withdrawals"
              value={activeWithdrawals}
              helper="Pending / approved"
              color="#4ADE80"
              icon={Bank}
            />

            <Stat
              label="Elite Creators"
              value={eliteCount}
              helper="Special sellers"
              color="#A855F7"
              icon={Crown}
            />
          </>
        )}
      </div>

      {!isSuperAdmin && (
        <section className="bg-[#F4FF47] text-black border-2 border-black dark:border-white rounded-lg p-5 brutal-shadow">
          <h2 className="font-display text-2xl mb-2">Moderator Access</h2>
          <p className="text-sm font-bold">
            You can approve/reject notes and manage featured notes. Revenue,
            transactions, withdrawals, and confidential startup data are hidden.
          </p>
        </section>
      )}

      <section className="notezy-card p-5 sm:p-6">
        <SectionHeader
          icon={ClipboardText}
          title="Pending Note Approvals"
          subtitle="Review new uploads before they go live."
          count={pendingNotes.length}
        />

        {pendingNotes.length === 0 ? (
          <EmptyState text="No pending notes. Everything is reviewed." />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
            {pendingNotes.map((note) => (
              <NoteReviewCard
                key={note.id}
                note={note}
                mode="pending"
                onApprove={() => updateNoteStatus(note.id, "approved")}
                onReject={() => updateNoteStatus(note.id, "rejected")}
              />
            ))}
          </div>
        )}
      </section>

      <section className="notezy-card p-5 sm:p-6">
        <SectionHeader
          icon={Star}
          title="Approved Notes"
          subtitle="Manage featured notes shown across Notezy."
          count={approvedNotes.length}
        />

        {approvedNotes.length === 0 ? (
          <EmptyState text="No approved notes yet." />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
            {approvedNotes.slice(0, 12).map((note) => (
              <NoteReviewCard
                key={note.id}
                note={note}
                mode="approved"
                onToggleFeatured={() => toggleFeatured(note)}
              />
            ))}
          </div>
        )}
      </section>

      {isSuperAdmin && (
        <>
          <section className="grid lg:grid-cols-2 gap-6">
            <div className="notezy-card p-5 sm:p-6">
              <SectionHeader
                icon={Receipt}
                title="Recent Transactions"
                subtitle="Latest purchases on Notezy."
                count={purchases.length}
              />

              {purchases.length === 0 ? (
                <EmptyState text="No transactions yet." />
              ) : (
                <div className="space-y-3 mt-5">
                  {purchases.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between gap-4 border-b border-dashed border-black/30 dark:border-white/30 pb-3 text-sm"
                    >
                      <div>
                        <div className="font-bold">{p.notes?.title || "Note"}</div>
                        <div className="text-neutral-600 dark:text-neutral-300">
                          Seller earned ₹{p.seller_earning || 0}
                        </div>
                      </div>
                      <div className="font-display text-xl shrink-0">
                        ₹{Number(p.amount || 0).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="notezy-card p-5 sm:p-6">
              <SectionHeader
                icon={Users}
                title="Top Sellers"
                subtitle="Creators with wallet activity."
                count={topSellers.length}
              />

              {topSellers.length === 0 ? (
                <EmptyState text="No seller activity yet." />
              ) : (
                <div className="space-y-3 mt-5">
                  {topSellers.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-4 border-b border-dashed border-black/30 dark:border-white/30 pb-3 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="font-bold truncate">
                          {p.full_name || "Student"}
                        </div>
                        <div className="text-neutral-600 dark:text-neutral-300">
                          {p.seller_level || "New Seller"} · {p.total_sales || 0} sales
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          Wallet ₹{Number(p.wallet_balance || 0).toFixed(2)}
                        </div>
                      </div>

                      <button
                        onClick={() => makeElite(p.id)}
                        className="notezy-yellow-btn px-3 py-2 rounded-md text-xs uppercase shrink-0"
                      >
                        Make Elite
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="notezy-card p-5 sm:p-6">
            <SectionHeader
              icon={Wallet}
              title="Withdrawals"
              subtitle="Approve seller payouts and record UTR IDs."
              count={withdrawals.length}
            />

            {withdrawals.length === 0 ? (
              <EmptyState text="No withdrawal requests." />
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
                {withdrawals.map((w) => {
                  const seller = getSeller(w.seller_id);

                  return (
                    <WithdrawalCard
                      key={w.id}
                      withdrawal={w}
                      seller={seller}
                      transactionIds={transactionIds}
                      setTransactionIds={setTransactionIds}
                      onUpdate={updateWithdrawalStatus}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

const SectionHeader = ({ icon: Icon, title, subtitle, count }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-[#F4FF47] text-black border-2 border-black dark:border-white rounded-md flex items-center justify-center brutal-shadow-sm">
        <Icon size={20} weight="bold" />
      </div>
      <div>
        <h2 className="font-display text-3xl leading-tight">{title}</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {subtitle}
        </p>
      </div>
    </div>

    <div className="chip">{count} items</div>
  </div>
);

const NoteReviewCard = ({ note, mode, onApprove, onReject, onToggleFeatured }) => (
  <div className="border-2 border-black dark:border-white rounded-lg p-4 bg-white dark:bg-[#111111] space-y-3">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="font-display text-2xl leading-tight line-clamp-2">
          {note.title}
        </h3>
        <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
          {note.subject} · {note.branch} · Sem {note.semester} · ₹{note.price}
        </p>
      </div>

      {note.featured && (
        <span className="bg-[#F4FF47] text-black border-2 border-black rounded-md px-2 py-1 text-xs font-bold shrink-0">
          ⭐ Featured
        </span>
      )}
    </div>

    <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-3">
      {note.description || "No description provided."}
    </p>

    <div className="flex flex-wrap gap-2 pt-2">
      <a
        href={note.preview_file_url || note.preview_url}
        target="_blank"
        rel="noreferrer"
        className="notezy-blue-btn px-3 py-2 rounded-md text-sm flex items-center gap-1"
      >
        <Eye size={16} /> Preview
      </a>

      {mode === "pending" && (
        <>
          <button
            onClick={onApprove}
            className="brutal-btn bg-[#4ADE80] text-black px-3 py-2 rounded-md text-sm flex items-center gap-1"
          >
            <CheckCircle size={16} /> Approve
          </button>

          <button
            onClick={onReject}
            className="brutal-btn bg-[#FF6B9E] text-white px-3 py-2 rounded-md text-sm flex items-center gap-1"
          >
            <XCircle size={16} /> Reject
          </button>
        </>
      )}

      {mode === "approved" && (
        <button
          onClick={onToggleFeatured}
          className={`brutal-btn px-3 py-2 rounded-md text-sm flex items-center gap-1 ${
            note.featured ? "bg-black text-white dark:bg-white dark:text-black" : "bg-[#F4FF47] text-black"
          }`}
        >
          <Star size={16} weight="fill" />
          {note.featured ? "Remove" : "Feature"}
        </button>
      )}
    </div>
  </div>
);

const WithdrawalCard = ({
  withdrawal,
  seller,
  transactionIds,
  setTransactionIds,
  onUpdate,
}) => (
  <div className="border-2 border-black dark:border-white rounded-lg p-4 bg-white dark:bg-[#111111] space-y-3">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="font-display text-3xl">
          ₹{Number(withdrawal.amount || 0).toFixed(2)}
        </div>
        <div className="text-sm text-neutral-600 dark:text-neutral-300">
          {seller?.full_name || withdrawal.seller_id}
        </div>
      </div>
      <StatusBadge status={withdrawal.status} />
    </div>

    <div className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1">
      <div>Email: {seller?.email || "Not available"}</div>
      <div>Wallet: ₹{Number(seller?.wallet_balance || 0).toFixed(2)}</div>
      <div>
        Requested: {withdrawal.requested_at ? new Date(withdrawal.requested_at).toLocaleString() : "N/A"}
      </div>
    </div>

    {withdrawal.upi_id && (
      <div className="bg-[#FAFAFA] dark:bg-[#1b1b1b] border-2 border-black dark:border-white rounded-md p-2 text-sm">
        UPI: <b>{withdrawal.upi_id}</b>
      </div>
    )}

    {withdrawal.bank_account_number && (
      <div className="bg-[#FAFAFA] dark:bg-[#1b1b1b] border-2 border-black dark:border-white rounded-md p-2 text-sm">
        Bank: <b>{withdrawal.bank_account_name}</b> · <b>{withdrawal.bank_account_number}</b> · <b>{withdrawal.bank_ifsc}</b>
      </div>
    )}

    {withdrawal.transaction_id && (
      <div className="text-xs text-green-700 dark:text-green-400 font-bold">
        UTR: {withdrawal.transaction_id}
      </div>
    )}

    {withdrawal.admin_note && (
      <div className="text-xs text-neutral-600 dark:text-neutral-300">
        Admin note: {withdrawal.admin_note}
      </div>
    )}

    {withdrawal.status === "pending" && (
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onUpdate(withdrawal, "approved")}
          className="notezy-blue-btn px-3 py-2 rounded-md text-sm"
        >
          Approve
        </button>
        <button
          onClick={() => onUpdate(withdrawal, "rejected")}
          className="brutal-btn bg-[#FF6B9E] text-white px-3 py-2 rounded-md text-sm"
        >
          Reject
        </button>
      </div>
    )}

    {withdrawal.status === "approved" && (
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Enter UTR / Transaction ID"
          value={transactionIds[withdrawal.id] || ""}
          onChange={(e) =>
            setTransactionIds((prev) => ({
              ...prev,
              [withdrawal.id]: e.target.value,
            }))
          }
          className="notezy-input text-sm"
        />
        <button
          onClick={() => onUpdate(withdrawal, "paid")}
          className="w-full brutal-btn bg-[#4ADE80] text-black px-3 py-2 rounded-md text-sm"
        >
          Mark Paid
        </button>
      </div>
    )}
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    pending: "bg-yellow-200 text-black",
    approved: "bg-blue-200 text-black",
    rejected: "bg-red-200 text-black",
    paid: "bg-green-200 text-black",
  };

  return (
    <span
      className={`border-2 border-black rounded-full px-3 py-1 text-xs uppercase font-bold text-center ${
        styles[status] || "bg-neutral-200 text-black"
      }`}
    >
      {status}
    </span>
  );
};

const EmptyState = ({ text }) => (
  <div className="border-2 border-dashed border-black dark:border-white rounded-lg p-8 text-center mt-5">
    <div className="mx-auto w-12 h-12 bg-[#F4FF47] text-black border-2 border-black dark:border-white rounded-lg flex items-center justify-center brutal-shadow-sm mb-4">
      <Sparkle size={24} weight="bold" />
    </div>
    <div className="font-bold text-neutral-600 dark:text-neutral-300">
      {text}
    </div>
  </div>
);
