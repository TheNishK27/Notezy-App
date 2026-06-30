import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api";
import NoteCard from "@/components/NoteCard";
import { ChartBar, Wallet, Users, Star, UploadSimple } from "@phosphor-icons/react";

const Stat = ({ label, value, color, icon: Icon, testId }) => (
  <div data-testid={testId} className="bg-white border-2 border-black rounded-lg p-5 brutal-shadow" style={{ borderTop: `8px solid ${color}` }}>
    <div className="flex items-center justify-between">
      <div className="text-xs uppercase font-bold text-neutral-600">{label}</div>
      <Icon size={18} weight="bold" />
    </div>
    <div className="font-display text-3xl mt-2">{value}</div>
  </div>
);

export default function SellerDashboard() {
  const [stats, setStats] = useState(null);
  const [myNotes, setMyNotes] = useState([]);

  useEffect(() => {
    api.get("/seller/dashboard").then((r) => setStats(r.data));
    api.get("/seller/my-notes").then((r) => setMyNotes(r.data));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-2 border-black rounded-md flex items-center justify-center bg-[#F4FF47]"><ChartBar size={20} weight="bold" /></div>
          <h1 className="font-display text-4xl">Seller Dashboard</h1>
        </div>
        <Link to="/upload" data-testid="dashboard-upload-btn" className="brutal-btn bg-[#4C7BF4] text-white px-4 py-2 rounded-md uppercase font-bold text-sm flex items-center gap-2">
          <UploadSimple size={16} weight="bold" /> Upload New
        </Link>
      </div>

      {!stats ? <div className="font-display text-2xl">Loading...</div> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <Stat testId="stat-revenue" label="Total Revenue" value={`₹${stats.total_revenue}`} color="#4ADE80" icon={Wallet} />
            <Stat testId="stat-wallet" label="Wallet Balance" value={`₹${stats.wallet_balance}`} color="#F4FF47" icon={Wallet} />
            <Stat testId="stat-sold" label="Notes Sold" value={stats.total_sold} color="#4C7BF4" icon={ChartBar} />
            <Stat testId="stat-uploads" label="Total Uploads" value={stats.total_uploads} color="#FF6B9E" icon={UploadSimple} />
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-white border-2 border-black rounded-lg p-6 brutal-shadow">
              <h2 className="font-display text-2xl mb-4">Recent sales</h2>
              {stats.recent_sales.length === 0 ? (
                <div className="text-sm text-neutral-600">No sales yet. Upload a great note and start earning!</div>
              ) : (
                <div className="space-y-2">
                  {stats.recent_sales.map((s, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-dashed border-black/30 py-2 text-sm">
                      <div className="font-bold">{s.note_title}</div>
                      <div className="font-mono">+₹{s.amount}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white border-2 border-black rounded-lg p-6 brutal-shadow">
              <h2 className="font-display text-2xl mb-4">Profile stats</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between"><span className="flex items-center gap-2"><Users size={16} /> Followers</span><b>{stats.followers}</b></div>
                <div className="flex items-center justify-between"><span className="flex items-center gap-2"><Star size={16} /> Avg rating</span><b>{stats.avg_rating}</b></div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl mb-4">Your uploads</h2>
            {myNotes.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-black rounded-lg p-10 text-center">
                <div className="font-display text-2xl mb-2">No uploads yet</div>
                <Link to="/upload" className="brutal-btn inline-block bg-[#F4FF47] px-4 py-2 rounded-md uppercase font-bold mt-2">Upload your first note</Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {myNotes.map((n) => <NoteCard key={n.id} note={n} />)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
