import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Wallet,
  ArrowDown,
  ArrowUp,
  ClockCounterClockwise,
  CreditCard,
} from "@phosphor-icons/react";
import { toast } from "sonner";

export default function WalletPage() {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallet();
  }, []);

  async function loadWallet() {
    try {
      setLoading(true);

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .eq("id", auth.user.id)
        .single();

      setBalance(Number(profile?.wallet_balance || 0));

      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't load wallet");
    } finally {
      setLoading(false);
    }
  }

  const summary = useMemo(() => {
    const credit = transactions
      .filter((tx) => tx.type === "credit")
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const debit = transactions
      .filter((tx) => tx.type !== "credit")
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    return { credit, debit };
  }, [transactions]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        <div className="h-44 notezy-card animate-pulse" />
        <div className="h-80 notezy-card animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 text-black dark:text-white">
      <section className="bg-[#F4FF47] text-black border-2 border-black dark:border-white rounded-xl p-5 sm:p-7 brutal-shadow relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-white/40 border-2 border-black" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white border-2 border-black rounded-xl flex items-center justify-center brutal-shadow-sm">
              <Wallet size={30} weight="fill" />
            </div>

            <div>
              <div className="text-xs uppercase font-bold">Wallet Balance</div>
              <div className="font-display text-5xl mt-1">
                ₹{Number(balance).toFixed(2)}
              </div>
              <div className="text-xs text-neutral-700 mt-1">
                Minimum withdrawal: ₹100
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-black rounded-lg p-4 min-w-[180px]">
            <div className="text-xs uppercase font-bold text-neutral-600">
              Status
            </div>
            <div className="font-display text-2xl">
              {balance >= 100 ? "Withdrawable" : "Below Limit"}
            </div>
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-4">
        <MiniCard
          icon={ArrowDown}
          label="Total Credits"
          value={`₹${summary.credit.toFixed(2)}`}
          color="#4ADE80"
        />
        <MiniCard
          icon={ArrowUp}
          label="Total Debits"
          value={`₹${summary.debit.toFixed(2)}`}
          color="#FF6B9E"
        />
        <MiniCard
          icon={CreditCard}
          label="Transactions"
          value={transactions.length}
          color="#4C7BF4"
        />
      </section>

      <section className="notezy-card overflow-hidden">
        <div className="p-5 border-b-2 border-black dark:border-white flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl">Wallet History</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Track your earnings and wallet deductions.
            </p>
          </div>

          <ClockCounterClockwise size={26} weight="bold" />
        </div>

        {transactions.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto w-16 h-16 bg-[#F4FF47] text-black border-2 border-black dark:border-white rounded-xl flex items-center justify-center brutal-shadow-sm mb-4">
              <Wallet size={32} weight="bold" />
            </div>
            <div className="font-display text-2xl">No wallet transactions yet</div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2">
              Your earnings and withdrawals will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y-2 divide-black dark:divide-white">
            {transactions.map((tx) => {
              const isCredit = tx.type === "credit";

              return (
                <div
                  key={tx.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-md border-2 border-black dark:border-white flex items-center justify-center text-black"
                      style={{
                        background: isCredit ? "#4ADE80" : "#FF6B9E",
                      }}
                    >
                      {isCredit ? (
                        <ArrowDown weight="bold" />
                      ) : (
                        <ArrowUp weight="bold" />
                      )}
                    </div>

                    <div>
                      <div className="font-bold">
                        {tx.description || "Wallet transaction"}
                      </div>

                      <div className="text-sm text-neutral-500 dark:text-neutral-300">
                        {tx.created_at
                          ? new Date(tx.created_at).toLocaleString()
                          : ""}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`font-display text-2xl ${
                      isCredit
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {isCredit ? "+" : "-"}₹{Number(tx.amount).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

const MiniCard = ({ icon: Icon, label, value, color }) => (
  <div className="notezy-card p-4">
    <div
      className="w-10 h-10 border-2 border-black dark:border-white rounded-md flex items-center justify-center text-black mb-3"
      style={{ background: color }}
    >
      <Icon size={20} weight="bold" />
    </div>

    <div className="text-xs uppercase font-bold text-neutral-600 dark:text-neutral-300">
      {label}
    </div>
    <div className="font-display text-2xl mt-1">{value}</div>
  </div>
);