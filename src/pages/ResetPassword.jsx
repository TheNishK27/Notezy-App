import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Lock,
  ShieldCheck,
  CheckCircle,
  Key,
} from "@phosphor-icons/react";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const updatePassword = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      toast.success("Password updated successfully.");

      navigate("/auth", {
        replace: true,
      });
    } catch (err) {
      toast.error(err.message || "Could not update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-8 text-black dark:text-white">

      <form
        onSubmit={updatePassword}
        className="w-full max-w-md notezy-card p-6 sm:p-8"
      >

        <div className="inline-flex items-center gap-2 chip mb-4">
          <ShieldCheck size={12} weight="fill" />
          Secure Password Reset
        </div>

        <h1 className="font-display text-4xl">
          Create New Password
        </h1>

        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
          Choose a strong password that you'll remember.
        </p>

        <div className="mt-6 space-y-4">

          <label className="block">
            <span className="block text-xs uppercase font-bold mb-2">
              New Password
            </span>

            <div className="notezy-input flex items-center gap-3">
              <Lock
                size={18}
                weight="bold"
                className="text-neutral-500"
              />

              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="flex-1 bg-transparent outline-none"
              />
            </div>
          </label>

          <label className="block">
            <span className="block text-xs uppercase font-bold mb-2">
              Confirm Password
            </span>

            <div className="notezy-input flex items-center gap-3">
              <Key
                size={18}
                weight="bold"
                className="text-neutral-500"
              />

              <input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className="flex-1 bg-transparent outline-none"
              />
            </div>
          </label>

        </div>

        {password.length > 0 && password === confirm && (
          <div className="mt-5 flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-semibold">
            <CheckCircle size={18} weight="fill" />
            Passwords match
          </div>
        )}

        <button
          disabled={loading}
          className="w-full mt-6 notezy-yellow-btn py-3 rounded-md flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <ShieldCheck size={18} weight="bold" />

          {loading ? "Updating..." : "Update Password"}
        </button>

        <div className="mt-6 border-t-2 border-dashed border-black/20 dark:border-white/20 pt-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
          After updating your password, you'll be redirected to the login page.
        </div>

      </form>
    </div>
  );
}