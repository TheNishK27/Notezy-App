import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Envelope, ArrowLeft } from "@phosphor-icons/react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const sendResetLink = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success("Password reset link sent. Check your email.");
    } catch (err) {
      toast.error(err.message || "Could not send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4">
      <form
        onSubmit={sendResetLink}
        className="w-full max-w-md bg-white border-2 border-black rounded-lg p-6 brutal-shadow space-y-4"
      >
        <h1 className="font-display text-4xl">Forgot Password</h1>

        <p className="text-sm text-neutral-600">
          Enter your email and we'll send you a password reset link.
        </p>

        <label className="block">
          <span className="block text-xs uppercase font-bold mb-1">
            Email
          </span>

          <div className="flex items-center gap-2 border-2 border-black rounded-md px-3 py-2 bg-white">
            <Envelope size={16} weight="bold" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@college.ac.in"
              className="w-full outline-none bg-transparent text-sm"
            />
          </div>
        </label>

        <button
          disabled={loading}
          className="w-full brutal-btn bg-black text-white py-3 rounded-md uppercase font-display text-lg disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <Link
          to="/auth"
          className="flex items-center justify-center gap-2 text-sm font-bold underline"
        >
          <ArrowLeft size={16} /> Back to Login
        </Link>
      </form>
    </div>
  );
}