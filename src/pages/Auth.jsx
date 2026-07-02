import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  Envelope,
  Lock,
  GraduationCap,
  User,
  Hash,
  ArrowRight,
  ShieldCheck,
} from "@phosphor-icons/react";

const TextField = ({ icon: Icon, label, testId, ...props }) => (
  <label className="block">
    <span className="block text-xs uppercase font-bold mb-1 tracking-wide">
      {label}
    </span>
    <div className="flex items-center gap-2 border-2 border-black rounded-md px-3 py-2 bg-white focus-within:shadow-[3px_3px_0_0_#050505] transition-shadow">
      {Icon && <Icon size={16} weight="bold" className="text-neutral-600" />}
      <input
        data-testid={testId}
        {...props}
        className="w-full outline-none bg-transparent text-sm"
      />
    </div>
  </label>
);

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    college: "",
    roll_number: "",
    department: "",
    year: 1,
    semester: 1,
  });

  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              full_name: form.name,
              college: form.college,
              roll_number: form.roll_number,
              branch: form.department,
              year: Number(form.year),
              semester: Number(form.semester),
            },
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        });

        if (error) throw error;

        toast.success("Verification email sent. Check your college email.");
        setMode("login");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

        if (error) throw error;

        if (!data.session) {
          throw new Error("Please verify your email first.");
        }

        toast.success("Logged in successfully");
        navigate("/home", { replace: true });
      }
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] grid lg:grid-cols-2">
      <div className="hidden lg:flex bg-[#F4FF47] border-r-2 border-black p-12 flex-col justify-between">
        <div>
          <div className="inline-flex items-center gap-2 bg-white border-2 border-black px-3 py-1 rounded-full brutal-shadow-sm text-xs uppercase font-bold">
            <ShieldCheck size={14} weight="bold" /> Verified Students Only
          </div>

          <h1 className="font-display text-6xl mt-6 leading-[0.95]">
            Welcome to the campus that earns.
          </h1>

          <p className="text-neutral-800 mt-4 max-w-md">
            Sign up with your college email. Supabase will send a verification
            link. No fakes. No spam. Just real notes from real students.
          </p>
        </div>

        <div className="bg-white border-2 border-black rounded-md p-4 brutal-shadow">
          <div className="font-mono text-xs uppercase text-neutral-600">
            Latest Earner
          </div>

          <div className="font-display text-2xl mt-1">
            Priya from IIT-B made ₹2,340 this week
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-12 flex items-center justify-center">
        <form
          onSubmit={submit}
          className="w-full max-w-md bg-white border-2 border-black rounded-lg p-6 brutal-shadow space-y-4"
        >
          <div className="flex gap-2">
            {["login", "register"].map((m) => (
              <button
                key={m}
                type="button"
                data-testid={`auth-tab-${m}`}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 border-2 border-black rounded-md uppercase font-bold text-sm transition-all ${
                  mode === m ? "bg-[#F4FF47] brutal-shadow-sm" : "bg-white"
                }`}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {mode === "register" && (
            <>
              <TextField
                icon={User}
                testId="auth-name"
                label="Full name"
                placeholder="Rahul Sharma"
                value={form.name}
                onChange={set("name")}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <TextField
                  icon={GraduationCap}
                  testId="auth-college"
                  label="College"
                  placeholder="NIT Patna"
                  value={form.college}
                  onChange={set("college")}
                  required
                />

                <TextField
                  icon={Hash}
                  testId="auth-roll"
                  label="Roll No"
                  placeholder="2304124"
                  value={form.roll_number}
                  onChange={set("roll_number")}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <TextField
                  testId="auth-dept"
                  label="Branch"
                  placeholder="ECE"
                  value={form.department}
                  onChange={set("department")}
                  required
                />

                <TextField
                  testId="auth-year"
                  label="Year"
                  type="number"
                  min="1"
                  max="5"
                  value={form.year}
                  onChange={set("year")}
                  required
                />

                <TextField
                  testId="auth-sem"
                  label="Sem"
                  type="number"
                  min="1"
                  max="10"
                  value={form.semester}
                  onChange={set("semester")}
                  required
                />
              </div>
            </>
          )}

          <TextField
            icon={Envelope}
            testId="auth-email"
            label="College Email"
            placeholder="you@college.ac.in"
            type="email"
            value={form.email}
            onChange={set("email")}
            required
          />

          <TextField
            icon={Lock}
            testId="auth-password"
            label="Password"
            placeholder="••••••••"
            type="password"
            value={form.password}
            onChange={set("password")}
            required
            minLength={6}
          />

          {mode === "login" && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-xs underline font-bold"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            data-testid="auth-submit"
            disabled={loading}
            className="w-full brutal-btn bg-black text-white py-3 rounded-md uppercase font-display text-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}
            <ArrowRight size={18} weight="bold" />
          </button>

          <div className="text-xs text-neutral-600 text-center">
            {mode === "login" ? (
              <span>
                New here?{" "}
                <button
                  type="button"
                  data-testid="auth-switch-register"
                  className="underline font-bold"
                  onClick={() => setMode("register")}
                >
                  Create an account
                </button>
              </span>
            ) : (
              <span>
                Already verified?{" "}
                <button
                  type="button"
                  data-testid="auth-switch-login"
                  className="underline font-bold"
                  onClick={() => setMode("login")}
                >
                  Sign in
                </button>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}