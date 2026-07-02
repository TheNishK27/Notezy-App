import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Lock } from "@phosphor-icons/react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const updatePassword = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      navigate("/auth", { replace: true });
    } catch (err) {
      toast.error(err.message || "Could not reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4">
      <form
        onSubmit={updatePassword}
        className="w-full max-w-md bg-white border-2 border-black rounded-lg p-6 brutal-shadow space-y-4"
      >
        <h1 className="font-display text-4xl">Reset Password</h1>

        <label className="block">
          <span className="block text-xs uppercase font-bold mb-1">
            New Password
          </span>

          <div className="flex items-center gap-2 border-2 border-black rounded-md px-3 py-2 bg-white">
            <Lock size={16} weight="bold" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full outline-none bg-transparent text-sm"
            />
          </div>
        </label>

        <label className="block">
          <span className="block text-xs uppercase font-bold mb-1">
            Confirm Password
          </span>

          <div className="flex items-center gap-2 border-2 border-black rounded-md px-3 py-2 bg-white">
            <Lock size={16} weight="bold" />
            <input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full outline-none bg-transparent text-sm"
            />
          </div>
        </label>

        <button
          disabled={loading}
          className="w-full brutal-btn bg-black text-white py-3 rounded-md uppercase font-display text-lg disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}