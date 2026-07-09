import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Envelope,
  ArrowLeft,
  PaperPlaneTilt,
  ShieldCheck,
} from "@phosphor-icons/react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const sendResetLink = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success("Password reset link sent successfully.");
    } catch (err) {
      toast.error(err.message || "Could not send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-8 text-black dark:text-white">

      <form
        onSubmit={sendResetLink}
        className="w-full max-w-md notezy-card p-6 sm:p-8"
      >
        <div className="inline-flex items-center gap-2 chip mb-4">
          <ShieldCheck size={12} weight="fill" />
          Secure Recovery
        </div>

        <h1 className="font-display text-4xl">
          Forgot Password?
        </h1>

        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
          Enter your registered email address and we'll send you a secure link
          to reset your password.
        </p>

        <div className="mt-6">
          <label className="block text-xs uppercase font-bold mb-2">
            Email Address
          </label>

          <div className="notezy-input flex items-center gap-3">
            <Envelope
              size={18}
              weight="bold"
              className="text-neutral-500"
            />

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@nitp.ac.in"
              className="flex-1 bg-transparent outline-none"
            />
          </div>
        </div>

        <button
          disabled={loading}
          className="w-full mt-6 notezy-yellow-btn py-3 rounded-md flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <PaperPlaneTilt size={18} weight="bold" />

          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <Link
          to="/auth"
          className="mt-6 flex items-center justify-center gap-2 font-bold text-sm hover:underline"
        >
          <ArrowLeft size={16} weight="bold" />
          Back to Login
        </Link>

        <div className="mt-6 border-t-2 border-dashed border-black/20 dark:border-white/20 pt-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
          Password reset links expire after some time for security reasons.
        </div>
      </form>
    </div>
  );
}