import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, auth } from "@/api";
import { Envelope, Lock, GraduationCap, User, Hash, ArrowRight, ShieldCheck } from "@phosphor-icons/react";

const TextField = ({ icon: Icon, label, testId, ...props }) => (
  <label className="block">
    <span className="block text-xs uppercase font-bold mb-1 tracking-wide">{label}</span>
    <div className="flex items-center gap-2 border-2 border-black rounded-md px-3 py-2 bg-white focus-within:shadow-[3px_3px_0_0_#050505] transition-shadow">
      {Icon && <Icon size={16} weight="bold" className="text-neutral-600" />}
      <input data-testid={testId} {...props} className="w-full outline-none bg-transparent text-sm" />
    </div>
  </label>
);

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // login | register | verify
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "", password: "", name: "", college: "", roll_number: "",
    department: "", year: 1, semester: 1, phone: "", otp: "",
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        const payload = { ...form, year: Number(form.year), semester: Number(form.semester) };
        const r = await api.post("/auth/register", payload);
        toast.success(`OTP sent! Demo code: ${r.data.dev_otp}`);
        setForm({ ...form, otp: r.data.dev_otp });
        setMode("verify");
      } else if (mode === "verify") {
        const r = await api.post("/auth/verify", { email: form.email, otp: form.otp });
        auth.set(r.data.token, r.data.user);
        toast.success("Welcome to Notezy!");
        navigate("/home");
      } else {
        const r = await api.post("/auth/login", { email: form.email, password: form.password });
        auth.set(r.data.token, r.data.user);
        toast.success("Logged in");
        navigate("/home");
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Something went wrong");
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
          <h1 className="font-display text-6xl mt-6 leading-[0.95]">Welcome to the campus that earns.</h1>
          <p className="text-neutral-800 mt-4 max-w-md">Sign up with your college email. We'll verify with OTP. No fakes. No spam. Just real notes from real students.</p>
        </div>
        <div className="bg-white border-2 border-black rounded-md p-4 brutal-shadow">
          <div className="font-mono text-xs uppercase text-neutral-600">Latest Earner</div>
          <div className="font-display text-2xl mt-1">Priya from IIT-B made ₹2,340 this week</div>
        </div>
      </div>

      <div className="p-6 lg:p-12 flex items-center justify-center">
        <form onSubmit={submit} className="w-full max-w-md bg-white border-2 border-black rounded-lg p-6 brutal-shadow space-y-4">
          <div className="flex gap-2">
            {["login", "register"].map((m) => (
              <button
                key={m}
                type="button"
                data-testid={`auth-tab-${m}`}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 border-2 border-black rounded-md uppercase font-bold text-sm transition-all ${mode === m ? "bg-[#F4FF47] brutal-shadow-sm" : "bg-white"}`}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {mode === "verify" && (
            <div className="bg-[#4ADE80]/30 border-2 border-black p-3 rounded-md text-sm">
              <div className="font-bold uppercase text-xs mb-1">Verify your college email</div>
              We sent a 6-digit code to <b>{form.email}</b>. Enter it below.
            </div>
          )}

          {mode === "register" && (
            <>
              <TextField icon={User} testId="auth-name" label="Full name" placeholder="Rahul Sharma" value={form.name} onChange={set("name")} required />
              <div className="grid grid-cols-2 gap-3">
                <TextField icon={GraduationCap} testId="auth-college" label="College" placeholder="NIT Patna" value={form.college} onChange={set("college")} required />
                <TextField icon={Hash} testId="auth-roll" label="Roll No" placeholder="2101145" value={form.roll_number} onChange={set("roll_number")} required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <TextField testId="auth-dept" label="Branch" placeholder="ECE" value={form.department} onChange={set("department")} required />
                <TextField testId="auth-year" label="Year" type="number" min="1" max="5" value={form.year} onChange={set("year")} required />
                <TextField testId="auth-sem" label="Sem" type="number" min="1" max="10" value={form.semester} onChange={set("semester")} required />
              </div>
            </>
          )}

          {(mode === "login" || mode === "register") && (
            <>
              <TextField icon={Envelope} testId="auth-email" label="College Email" placeholder="you@college.ac.in" type="email" value={form.email} onChange={set("email")} required />
              <TextField icon={Lock} testId="auth-password" label="Password" placeholder="••••••••" type="password" value={form.password} onChange={set("password")} required minLength={6} />
            </>
          )}

          {mode === "verify" && (
            <TextField testId="auth-otp" label="6-digit OTP" placeholder="123456" value={form.otp} onChange={set("otp")} required maxLength={6} />
          )}

          <button
            type="submit"
            data-testid="auth-submit"
            disabled={loading}
            className="w-full brutal-btn bg-black text-white py-3 rounded-md uppercase font-display text-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "..." : mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : "Verify & Continue"}
            <ArrowRight size={18} weight="bold" />
          </button>

          <div className="text-xs text-neutral-600 text-center">
            {mode === "login" && (
              <span>New here? <button type="button" data-testid="auth-switch-register" className="underline font-bold" onClick={() => setMode("register")}>Create an account</button></span>
            )}
            {mode === "register" && (
              <span>Already verified? <button type="button" data-testid="auth-switch-login" className="underline font-bold" onClick={() => setMode("login")}>Sign in</button></span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
