import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Wallet, ArrowDown, ArrowUp } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function WalletPage() {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    loadWallet();
  }, []);

  async function loadWallet() {
    try {
      const { data: auth } = await supabase.auth.getUser();

      if (!auth.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .eq("id", auth.user.id)
        .single();

      setBalance(profile?.wallet_balance || 0);

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
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">

      <div className="bg-[#F4FF47] border-2 border-black rounded-xl p-6 shadow-[6px_6px_0_#000] mb-8">

        <div className="flex items-center gap-3">

          <Wallet size={28} weight="fill" />

          <div>

            <div className="text-xs uppercase font-bold">
              Wallet Balance
            </div>

            <div className="font-display text-5xl mt-1">
              ₹{Number(balance).toFixed(2)}
            </div>

          </div>

        </div>

      </div>

      <div className="bg-white border-2 border-black rounded-xl shadow-[6px_6px_0_#000]">

        <div className="p-5 border-b-2 border-black">

          <h2 className="font-display text-3xl">
            Wallet History
          </h2>

        </div>

        {transactions.length === 0 ? (

          <div className="p-8 text-center text-neutral-500">
            No wallet transactions yet.
          </div>

        ) : (

          transactions.map((tx) => (

            <div
              key={tx.id}
              className="flex items-center justify-between p-5 border-b"
            >

              <div className="flex items-center gap-4">

                <div
                  className={`w-12 h-12 rounded-md border-2 border-black flex items-center justify-center ${
                    tx.type === "credit"
                      ? "bg-[#4ADE80]"
                      : "bg-[#FF8A8A]"
                  }`}
                >

                  {tx.type === "credit" ? (
                    <ArrowDown weight="bold" />
                  ) : (
                    <ArrowUp weight="bold" />
                  )}

                </div>

                <div>

                  <div className="font-bold">
                    {tx.description}
                  </div>

                  <div className="text-sm text-neutral-500">
                    {new Date(tx.created_at).toLocaleString()}
                  </div>

                </div>

              </div>

              <div
                className={`font-display text-2xl ${
                  tx.type === "credit"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {tx.type === "credit" ? "+" : "-"}₹
                {Number(tx.amount).toFixed(2)}
              </div>

            </div>

          ))

        )}

      </div>

    </div>
  );
}