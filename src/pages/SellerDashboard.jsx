// SellerDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import NoteCard from "@/components/NoteCard";
import { supabase } from "@/lib/supabase";
import {
  ChartBar,
  Wallet,
  Users,
  Star,
  UploadSimple,
  Crown,
  TrendUp,
  Bank,
  ClockCounterClockwise,
  CheckCircle,
  WarningCircle,
} from "@phosphor-icons/react";

const getSharePercent = (level) => {
  if (level === "Notezy Elite") return 80;
  if (level === "Top Seller") return 75;
  if (level === "Rising Seller") return 65;
  return 60;
};

const Stat = ({ label, value, color, icon: Icon }) => (
  <div className="notezy-card p-4 sm:p-5 hover:-translate-y-1 transition-transform">
    <div
      className="h-2 rounded-full mb-4 border-2 border-black dark:border-white"
      style={{ background: color }}
    />

    <div className="flex items-center justify-between gap-3">
      <div className="text-xs uppercase font-bold text-neutral-600 dark:text-neutral-300">
        {label}
      </div>

      <div
        className="w-9 h-9 border-2 border-black dark:border-white rounded-md flex items-center justify-center text-black"
        style={{ background: color }}
      >
        <Icon size={18} weight="bold" />
      </div>
    </div>

    <div className="font-display text-2xl sm:text-3xl mt-2 break-words">
      {value}
    </div>
  </div>
);

export default function SellerDashboard() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [myNotes, setMyNotes] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState("");

  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    upi_id: "",
    bank_account_name: "",
    bank_account_number: "",
    bank_ifsc: "",
  });

  const [stats, setStats] = useState({
    total_revenue: "0.00",
    wallet_balance: "0.00",
    total_sold: 0,
    total_uploads: 0,
    seller_level: "New Seller",
    avg_rating: 0,
    recent_sales: [],
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) throw userError;

      const user = userData?.user;
      setCurrentUser(user);

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("wallet_balance,total_sales,seller_level")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError;
      }

      const { data: notes, error: notesError } = await supabase
        .from("notes")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (notesError) throw notesError;

      const { data: sales, error: salesError } = await supabase
        .from("purchases")
        .select(`
          amount,
          seller_earning,
          created_at,
          notes!inner(title, seller_id)
        `)
        .eq("notes.seller_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (salesError) throw salesError;

      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("seller_id", user.id)
        .order("requested_at", { ascending: false });

      if (withdrawalError) throw withdrawalError;

      const cleanSales = sales || [];
      const cleanNotes = notes || [];

      const totalRevenue = cleanSales.reduce(
        (sum, sale) => sum + Number(sale.seller_earning || 0),
        0
      );

      const ratedNotes = cleanNotes.filter((note) => Number(note.rating_avg || 0) > 0);
      const avgRating =
        ratedNotes.length > 0
          ? (
              ratedNotes.reduce(
                (sum, note) => sum + Number(note.rating_avg || 0),
                0
              ) / ratedNotes.length
            ).toFixed(1)
          : 0;

      setMyNotes(cleanNotes);
      setWithdrawals(withdrawalData || []);

      setStats({
        total_revenue: totalRevenue.toFixed(2),
        wallet_balance: Number(profile?.wallet_balance || 0).toFixed(2),
        total_sold: profile?.total_sales || 0,
        total_uploads: cleanNotes.length || 0,
        seller_level: profile?.seller_level || "New Seller",
        avg_rating: avgRating,
        recent_sales: cleanSales.map((sale) => ({
          note_title: sale.notes?.title || "Note",
          amount: Number(sale.seller_earning || 0).toFixed(2),
          created_at: sale.created_at,
        })),
      });
    } catch (err) {
      console.error("Seller dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawChange = (e) => {
    const { name, value } = e.target;
    setWithdrawForm((prev) => ({ ...prev, [name]: value }));
  };

  const requestWithdrawal = async (e) => {
    e.preventDefault();
    setWithdrawMessage("");

    const amount = Number(withdrawForm.amount);
    const walletBalance = Number(stats.wallet_balance);
    const MIN_WITHDRAWAL = 100;

    if (!currentUser) {
      setWithdrawMessage("Please login again.");
      return;
    }

    if (!amount || amount <= 0) {
      setWithdrawMessage("Enter a valid withdrawal amount.");
      return;
    }

    if (amount < MIN_WITHDRAWAL) {
      setWithdrawMessage(`Minimum withdrawal amount is ₹${MIN_WITHDRAWAL}.`);
      return;
    }

    if (amount > walletBalance) {
      setWithdrawMessage("Withdrawal amount cannot exceed wallet balance.");
      return;
    }

    const hasActiveWithdrawal = withdrawals.some(
      (w) => w.status === "pending" || w.status === "approved"
    );

    if (hasActiveWithdrawal) {
      setWithdrawMessage(
        "You already have an active withdrawal request. Wait until it is paid or rejected."
      );
      return;
    }

    if (
      !withdrawForm.upi_id &&
      (!withdrawForm.bank_account_name ||
        !withdrawForm.bank_account_number ||
        !withdrawForm.bank_ifsc)
    ) {
      setWithdrawMessage("Enter UPI ID or complete bank details.");
      return;
    }

    try {
      setWithdrawLoading(true);

      const { error } = await supabase.from("withdrawals").insert({
        seller_id: currentUser.id,
        amount,
        upi_id: withdrawForm.upi_id || null,
        bank_account_name: withdrawForm.bank_account_name || null,
        bank_account_number: withdrawForm.bank_account_number || null,
        bank_ifsc: withdrawForm.bank_ifsc || null,
        status: "pending",
      });

      if (error) throw error;

      setWithdrawForm({
        amount: "",
        upi_id: "",
        bank_account_name: "",
        bank_account_number: "",
        bank_ifsc: "",
      });

      setWithdrawMessage("Withdrawal request submitted successfully.");
      await loadDashboard();
    } catch (err) {
      console.error("Withdrawal request error:", err);
      setWithdrawMessage(err.message || "Failed to submit withdrawal request.");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const sharePercent = getSharePercent(stats.seller_level);
  const nextTarget =
    stats.total_sold < 25 ? 25 : stats.total_sold < 100 ? 100 : null;
  const progressPercent = nextTarget
    ? Math.min((stats.total_sold / nextTarget) * 100, 100)
    : 100;

  const activeWithdrawal = useMemo(
    () => withdrawals.find((w) => w.status === "pending" || w.status === "approved"),
    [withdrawals]
  );

  const fullName =
    currentUser?.user_metadata?.full_name ||
    currentUser?.email?.split("@")?.[0] ||
    "Creator";

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        <div className="h-44 notezy-card animate-pulse" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-32 notezy-card animate-pulse" />
          ))}
        </div>
        <div className="h-80 notezy-card animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 text-black dark:text-white">
      <section className="notezy-card p-5 sm:p-7 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#F4FF47] border-2 border-black rounded-full opacity-70" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 chip mb-3">
              <Crown size={12} weight="fill" />
              {stats.seller_level}
            </div>

            <h1 className="font-display text-4xl sm:text-5xl leading-tight">
              Welcome back, {fullName.split(" ")[0]} 👋
            </h1>

            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 mt-2 max-w-2xl">
              Track earnings, manage uploads, and withdraw your Notezy creator
              income from one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 min-w-full sm:min-w-[360px]">
            <div className="bg-[#F4FF47] text-black border-2 border-black dark:border-white rounded-lg p-4 brutal-shadow-sm">
              <div className="text-xs uppercase font-bold">Wallet</div>
              <div className="font-display text-3xl">₹{stats.wallet_balance}</div>
            </div>

            <div className="bg-[#4ADE80] text-black border-2 border-black dark:border-white rounded-lg p-4 brutal-shadow-sm">
              <div className="text-xs uppercase font-bold">Share</div>
              <div className="font-display text-3xl">{sharePercent}%</div>
            </div>

            <Link
              to="/upload"
              className="col-span-2 notezy-blue-btn rounded-md px-4 py-3 uppercase flex items-center justify-center gap-2"
            >
              <UploadSimple size={18} weight="bold" />
              Upload New Note
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
        <Stat
          label="Total Revenue"
          value={`₹${stats.total_revenue}`}
          color="#4ADE80"
          icon={Wallet}
        />
        <Stat
          label="Wallet Balance"
          value={`₹${stats.wallet_balance}`}
          color="#F4FF47"
          icon={Wallet}
        />
        <Stat
          label="Notes Sold"
          value={stats.total_sold}
          color="#4C7BF4"
          icon={ChartBar}
        />
        <Stat
          label="Total Uploads"
          value={stats.total_uploads}
          color="#FF6B9E"
          icon={UploadSimple}
        />
        <Stat
          label="Avg Rating"
          value={stats.avg_rating || "—"}
          color="#A855F7"
          icon={Star}
        />
      </section>

      <section className="notezy-card p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="lg:max-w-sm">
            <h2 className="font-display text-3xl">Creator Earnings</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2">
              Your creator level decides how much you keep from every sale.
            </p>

            <div className="mt-5 bg-[#F4FF47] text-black border-2 border-black dark:border-white rounded-lg p-5 brutal-shadow-sm">
              <div className="text-xs uppercase font-bold">
                Your Current Share
              </div>
              <div className="font-display text-6xl mt-1">{sharePercent}%</div>
              <div className="text-sm font-bold mt-1">{stats.seller_level}</div>
            </div>
          </div>

          <div className="flex-1 space-y-5">
            {nextTarget ? (
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span>
                    Progress to{" "}
                    {nextTarget === 25 ? "Rising Seller" : "Top Seller"}
                  </span>
                  <span>
                    {stats.total_sold}/{nextTarget} sales
                  </span>
                </div>

                <div className="h-5 border-2 border-black dark:border-white rounded-full overflow-hidden bg-white dark:bg-[#111111]">
                  <div
                    className="h-full bg-[#4ADE80] transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="font-bold text-green-700 dark:text-green-400 flex items-center gap-2">
                <CheckCircle size={18} weight="fill" />
                You have reached the highest automatic seller tier.
              </div>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Tier name="New Seller" requirement="0–24 sales" share="60%" />
              <Tier name="Rising Seller" requirement="25–99 sales" share="65%" />
              <Tier name="Top Seller" requirement="100+ sales" share="75%" />
              <Tier name="Notezy Elite" requirement="Invite only" share="80%" />
            </div>

            <div className="text-xs text-neutral-600 dark:text-neutral-300 border-t border-dashed border-black/30 dark:border-white/30 pt-3">
              Selected creators may earn up to 90% through special campaigns or
              platform initiatives.
            </div>
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 notezy-card p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-[#4C7BF4] text-white border-2 border-black dark:border-white rounded-md flex items-center justify-center">
              <Bank size={20} weight="bold" />
            </div>
            <div>
              <h2 className="font-display text-2xl">Request Withdrawal</h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-300">
                Minimum withdrawal amount is ₹100.
              </p>
            </div>
          </div>

          {activeWithdrawal && (
            <div className="mb-4 bg-[#F4FF47] text-black border-2 border-black rounded-md p-3 text-sm font-bold flex items-start gap-2">
              <WarningCircle size={18} weight="fill" />
              You already have an active withdrawal request. Wait until it is
              paid or rejected.
            </div>
          )}

          <form onSubmit={requestWithdrawal} className="space-y-4">
            <div>
              <label className="text-xs uppercase font-bold">Amount</label>
              <input
                type="number"
                name="amount"
                value={withdrawForm.amount}
                onChange={handleWithdrawChange}
                placeholder="Enter amount"
                className="notezy-input mt-1"
              />
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Available balance: ₹{stats.wallet_balance}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase font-bold">UPI ID</label>
              <input
                type="text"
                name="upi_id"
                value={withdrawForm.upi_id}
                onChange={handleWithdrawChange}
                placeholder="example@upi"
                className="notezy-input mt-1"
              />
            </div>

            <div className="text-center text-xs font-bold text-neutral-500 dark:text-neutral-400">
              OR ENTER BANK DETAILS
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <input
                type="text"
                name="bank_account_name"
                value={withdrawForm.bank_account_name}
                onChange={handleWithdrawChange}
                placeholder="Account holder name"
                className="notezy-input"
              />

              <input
                type="text"
                name="bank_account_number"
                value={withdrawForm.bank_account_number}
                onChange={handleWithdrawChange}
                placeholder="Account number"
                className="notezy-input"
              />

              <input
                type="text"
                name="bank_ifsc"
                value={withdrawForm.bank_ifsc}
                onChange={handleWithdrawChange}
                placeholder="IFSC code"
                className="notezy-input sm:col-span-2"
              />
            </div>

            {withdrawMessage && (
              <div className="text-sm font-bold">{withdrawMessage}</div>
            )}

            <button
              type="submit"
              disabled={withdrawLoading || !!activeWithdrawal}
              className="notezy-yellow-btn px-4 py-3 rounded-md uppercase disabled:opacity-50"
            >
              {withdrawLoading ? "Submitting..." : "Request Withdrawal"}
            </button>
          </form>
        </div>

        <div className="notezy-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl">Withdrawal History</h2>
            <ClockCounterClockwise size={22} weight="bold" />
          </div>

          {withdrawals.length === 0 ? (
            <div className="text-sm text-neutral-600 dark:text-neutral-300">
              No withdrawal requests yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-auto pr-1">
              {withdrawals.map((item) => (
                <div
                  key={item.id}
                  className="border-2 border-black dark:border-white rounded-md p-3 bg-[#FAFAFA] dark:bg-[#111111]"
                >
                  <div className="flex justify-between items-center gap-3">
                    <div className="font-display text-2xl">
                      ₹{Number(item.amount || 0).toFixed(2)}
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  <div className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                    {item.requested_at
                      ? new Date(item.requested_at).toLocaleDateString()
                      : ""}
                  </div>

                  {item.upi_id && (
                    <div className="text-xs mt-1">
                      UPI: <b>{item.upi_id}</b>
                    </div>
                  )}

                  {item.transaction_id && (
                    <div className="text-xs mt-1 text-green-700 dark:text-green-400 font-bold">
                      UTR: {item.transaction_id}
                    </div>
                  )}

                  {item.admin_note && (
                    <div className="text-xs mt-1 text-neutral-600 dark:text-neutral-300">
                      Admin note: {item.admin_note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 notezy-card p-5 sm:p-6">
          <h2 className="font-display text-2xl mb-4">Recent Sales</h2>

          {stats.recent_sales.length === 0 ? (
            <div className="text-sm text-neutral-600 dark:text-neutral-300">
              No sales yet. Upload a great note and start earning!
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recent_sales.map((sale, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-2 border-black dark:border-white rounded-md p-3 bg-[#FAFAFA] dark:bg-[#111111]"
                >
                  <div>
                    <div className="font-bold">{sale.note_title}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {sale.created_at
                        ? new Date(sale.created_at).toLocaleDateString()
                        : ""}
                    </div>
                  </div>

                  <div className="font-mono font-bold text-green-700 dark:text-green-400">
                    +₹{sale.amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="notezy-card p-5 sm:p-6">
          <h2 className="font-display text-2xl mb-4">Creator Program</h2>

          <div className="space-y-3 text-sm">
            <ProgramRow icon={Users} label="Current Level" value={stats.seller_level} />
            <ProgramRow icon={Wallet} label="Current Share" value={`${sharePercent}%`} />
            <ProgramRow icon={Star} label="Avg Rating" value={stats.avg_rating || "—"} />

            <div className="border-t border-dashed border-black/30 dark:border-white/30 pt-3 text-xs text-neutral-600 dark:text-neutral-300">
              Your revenue split is recalculated on every sale based on creator
              level.
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-display text-2xl">
            Your Uploads ({myNotes.length})
          </h2>

          <Link
            to="/upload"
            className="text-sm font-bold uppercase hover:underline flex items-center gap-1"
          >
            Upload <TrendUp size={14} weight="bold" />
          </Link>
        </div>

        {myNotes.length === 0 ? (
          <div className="notezy-card border-dashed p-10 text-center">
            <div className="font-display text-2xl mb-2">No uploads yet</div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Upload your first note and start earning from your study material.
            </p>

            <Link
              to="/upload"
              className="notezy-yellow-btn inline-flex px-4 py-2 rounded-md uppercase font-bold mt-5"
            >
              Upload your first note
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {myNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const Tier = ({ name, requirement, share }) => (
  <div className="border-2 border-black dark:border-white rounded-md p-3 bg-[#FAFAFA] dark:bg-[#111111]">
    <div className="font-bold text-sm">{name}</div>
    <div className="text-xs text-neutral-600 dark:text-neutral-300">
      {requirement}
    </div>
    <div className="font-display text-2xl mt-1">{share}</div>
  </div>
);

const ProgramRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between">
    <span className="flex items-center gap-2">
      <Icon size={16} weight="bold" />
      {label}
    </span>
    <b>{value}</b>
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
      className={`border-2 border-black rounded-full px-2 py-1 text-xs uppercase font-bold ${
        styles[status] || "bg-neutral-200 text-black"
      }`}
    >
      {status}
    </span>
  );
};
