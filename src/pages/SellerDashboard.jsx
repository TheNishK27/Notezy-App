import React, { useEffect, useState } from "react";
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
} from "@phosphor-icons/react";

const Stat = ({ label, value, color, icon: Icon }) => (
  <div
    className="bg-white border-2 border-black rounded-lg p-5 brutal-shadow"
    style={{ borderTop: `8px solid ${color}` }}
  >
    <div className="flex items-center justify-between">
      <div className="text-xs uppercase font-bold text-neutral-600">
        {label}
      </div>
      <Icon size={18} weight="bold" />
    </div>

    <div className="font-display text-3xl mt-2">{value}</div>
  </div>
);

export default function SellerDashboard() {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    total_revenue: "0.00",
    wallet_balance: "0.00",
    total_sold: 0,
    total_uploads: 0,
    seller_level: "New Seller",
    avg_rating: 0,
    recent_sales: [],
  });

  const [myNotes, setMyNotes] = useState([]);

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

      const cleanSales = sales || [];

      const totalRevenue = cleanSales.reduce(
        (sum, sale) => sum + Number(sale.seller_earning || 0),
        0
      );

      setMyNotes(notes || []);

      setStats({
        total_revenue: totalRevenue.toFixed(2),
        wallet_balance: Number(profile?.wallet_balance || 0).toFixed(2),
        total_sold: profile?.total_sales || 0,
        total_uploads: notes?.length || 0,
        seller_level: profile?.seller_level || "New Seller",
        avg_rating: 0,
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

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-10 font-display text-3xl">
        Loading seller dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-2 border-black rounded-md flex items-center justify-center bg-[#F4FF47]">
            <ChartBar size={20} weight="bold" />
          </div>

          <h1 className="font-display text-4xl">Seller Dashboard</h1>
        </div>

        <Link
          to="/upload"
          className="brutal-btn bg-[#4C7BF4] text-white px-4 py-2 rounded-md uppercase font-bold text-sm flex items-center gap-2"
        >
          <UploadSimple size={16} weight="bold" />
          Upload New
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
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
          label="Seller Level"
          value={stats.seller_level}
          color="#A855F7"
          icon={Crown}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border-2 border-black rounded-lg p-6 brutal-shadow">
          <h2 className="font-display text-2xl mb-4">Recent Sales</h2>

          {stats.recent_sales.length === 0 ? (
            <div className="text-sm text-neutral-600">
              No sales yet. Upload a great note and start earning!
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recent_sales.map((sale, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-dashed border-black/30 py-2 text-sm"
                >
                  <div>
                    <div className="font-bold">{sale.note_title}</div>
                    <div className="text-xs text-neutral-500">
                      {sale.created_at
                        ? new Date(sale.created_at).toLocaleDateString()
                        : ""}
                    </div>
                  </div>

                  <div className="font-mono font-bold text-green-700">
                    +₹{sale.amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border-2 border-black rounded-lg p-6 brutal-shadow">
          <h2 className="font-display text-2xl mb-4">Creator Program</h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users size={16} />
                Current Level
              </span>
              <b>{stats.seller_level}</b>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Star size={16} />
                Avg Rating
              </span>
              <b>{stats.avg_rating}</b>
            </div>

            <div className="border-t border-dashed border-black/30 pt-3 text-xs text-neutral-600">
              Seller levels increase as your notes get more sales.
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl mb-4">Your Uploads</h2>

        {myNotes.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-black rounded-lg p-10 text-center">
            <div className="font-display text-2xl mb-2">No uploads yet</div>

            <Link
              to="/upload"
              className="brutal-btn inline-block bg-[#F4FF47] px-4 py-2 rounded-md uppercase font-bold mt-2"
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
      </div>
    </div>
  );
}