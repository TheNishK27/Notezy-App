import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Toaster } from "sonner";

import "@/App.css";
import { supabase } from "@/lib/supabase";

import Nav from "@/components/Nav";

import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";

import Home from "@/pages/Home";
import Browse from "@/pages/Browse";
import Explore from "@/pages/Explore";
import NoteDetail from "@/pages/NoteDetail";

import Library from "@/pages/Library";
import Wishlist from "@/pages/Wishlist";
import WalletPage from "@/pages/WalletPage";

import UploadPage from "@/pages/Upload";
import SellerDashboard from "@/pages/SellerDashboard";
import Profile from "@/pages/Profile";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import AdminDashboard from "@/pages/AdminDashboard";

function LoadingScreen({ text = "Loading..." }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="notezy-card px-6 py-5 font-display text-2xl">
        {text}
      </div>
    </div>
  );
}

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

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <LoadingScreen />;

  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
}

function AdminProtected({ children }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
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

    checkAdminAccess();
  }, []);

  if (loading) return <LoadingScreen text="Checking admin access..." />;

  if (!allowed) return <Navigate to="/home" replace />;

  return children;
}

const protectedRoute = (page) => <Protected>{page}</Protected>;

function Shell({ children }) {
  return (
    <div className="App min-h-screen bg-[#FAFAFA] text-[#050505] dark:bg-[#111111] dark:text-white transition-colors duration-200">
      <Nav />

      <main className="min-h-[calc(100vh-70px)] pb-8">{children}</main>

      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "border-2 border-black dark:border-white rounded-lg font-medium",
          style: {
            background: "var(--toast-bg)",
            color: "var(--toast-text)",
            boxShadow: "4px 4px 0 0 var(--toast-shadow)",
          },
        }}
      />
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/browse" element={<Browse />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/notes/:id" element={<NoteDetail />} />

      <Route path="/home" element={protectedRoute(<Home />)} />
      <Route path="/library" element={protectedRoute(<Library />)} />
      <Route path="/wishlist" element={protectedRoute(<Wishlist />)} />
      <Route path="/wallet" element={protectedRoute(<WalletPage />)} />
      <Route path="/profile" element={protectedRoute(<Profile />)} />

      <Route path="/upload" element={protectedRoute(<UploadPage />)} />
      <Route path="/dashboard" element={protectedRoute(<SellerDashboard />)} />

      <Route
        path="/checkout/success"
        element={protectedRoute(<CheckoutSuccess />)}
      />

      <Route
        path="/admin"
        element={
          <AdminProtected>
            <AdminDashboard />
          </AdminProtected>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell>
        <AppRoutes />
      </Shell>
    </BrowserRouter>
  );
}