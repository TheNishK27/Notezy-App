import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";

import Nav from "@/components/Nav";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Home from "@/pages/Home";
import Browse from "@/pages/Browse";
import Explore from "@/pages/Explore";
import NoteDetail from "@/pages/NoteDetail";
import Library from "@/pages/Library";
import UploadPage from "@/pages/Upload";
import SellerDashboard from "@/pages/SellerDashboard";
import Profile from "@/pages/Profile";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import { auth } from "@/api";

function Protected({ children }) {
  const location = useLocation();
  if (!auth.getToken()) return <Navigate to="/auth" state={{ from: location }} replace />;
  return children;
}

function Shell({ children }) {
  return (
    <div className="App min-h-screen bg-[#FAFAFA] text-[#050505]">
      <Nav />
      <main>{children}</main>
      <Toaster
        position="top-right"
        toastOptions={{
          className: "border-2 border-black rounded-lg font-medium",
          style: { boxShadow: "4px 4px 0 0 #050505", background: "#fff" },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/home" element={<Protected><Home /></Protected>} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/notes/:id" element={<NoteDetail />} />
          <Route path="/library" element={<Protected><Library /></Protected>} />
          <Route path="/upload" element={<Protected><UploadPage /></Protected>} />
          <Route path="/dashboard" element={<Protected><SellerDashboard /></Protected>} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />
          <Route path="/checkout/success" element={<Protected><CheckoutSuccess /></Protected>} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}

export default App;
