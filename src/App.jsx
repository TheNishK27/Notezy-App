import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "sonner";
import { supabase } from "@/lib/supabase";
import "@/App.css";

import Nav from "@/components/Nav";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Home from "@/pages/Home";
import Browse from "@/pages/Browse";
import Explore from "@/pages/Explore";
import NoteDetail from "@/pages/NoteDetail";
import Library from "@/pages/Library";
import Wishlist from "@/pages/Wishlist";
import UploadPage from "@/pages/Upload";
import SellerDashboard from "@/pages/SellerDashboard";
import Profile from "@/pages/Profile";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import AdminDashboard from "@/pages/AdminDashboard";

function Protected({ children }) {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return <div className="p-8 font-bold">Loading...</div>;

  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
}

function AdminProtected({ children }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      setAllowed(profile?.is_admin === true);
      setLoading(false);
    };

    checkAdmin();
  }, []);

  if (loading) {
    return <div className="p-8 font-bold">Checking admin access...</div>;
  }

  if (!allowed) return <Navigate to="/home" replace />;

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
          style: {
            boxShadow: "4px 4px 0 0 #050505",
            background: "#fff",
          },
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

          <Route
            path="/home"
            element={
              <Protected>
                <Home />
              </Protected>
            }
          />

          <Route path="/browse" element={<Browse />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/notes/:id" element={<NoteDetail />} />

          <Route
            path="/library"
            element={
              <Protected>
                <Library />
              </Protected>
            }
          />

          <Route
            path="/wishlist"
            element={
              <Protected>
                <Wishlist />
              </Protected>
            }
          />

          <Route
            path="/upload"
            element={
              <Protected>
                <UploadPage />
              </Protected>
            }
          />

          <Route
            path="/dashboard"
            element={
              <Protected>
                <SellerDashboard />
              </Protected>
            }
          />

          <Route
            path="/profile"
            element={
              <Protected>
                <Profile />
              </Protected>
            }
          />

          <Route
            path="/checkout/success"
            element={
              <Protected>
                <CheckoutSuccess />
              </Protected>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminProtected>
                <AdminDashboard />
              </AdminProtected>
            }
          />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}

export default App;