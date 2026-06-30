import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "@/api";
import { CheckCircle, ArrowRight, XCircle, Clock } from "@phosphor-icons/react";

const MAX_POLLS = 8;

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState("polling");
  const [attempt, setAttempt] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionId) { setStatus("error"); return; }
    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      attempts += 1;
      setAttempt(attempts);
      try {
        const r = await api.get(`/checkout/status/${sessionId}`);
        if (r.data.payment_status === "paid") {
          if (!cancelled) setStatus("paid");
          return;
        }
        if (r.data.status === "expired") {
          if (!cancelled) setStatus("expired");
          return;
        }
        if (attempts >= MAX_POLLS) {
          if (!cancelled) setStatus("timeout");
          return;
        }
        setTimeout(poll, 2000);
      } catch (e) {
        if (!cancelled) setStatus("error");
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [sessionId]);

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="bg-white border-2 border-black rounded-lg p-8 brutal-shadow text-center space-y-4" data-testid="checkout-status-card">
        {status === "polling" && (
          <>
            <Clock size={56} weight="bold" className="mx-auto" />
            <h1 className="font-display text-3xl">Confirming your payment...</h1>
            <div className="font-mono text-sm text-neutral-600">Attempt {attempt} of {MAX_POLLS}</div>
          </>
        )}
        {status === "paid" && (
          <>
            <CheckCircle size={56} weight="fill" className="mx-auto text-[#4ADE80]" />
            <h1 className="font-display text-4xl">Payment successful!</h1>
            <p className="text-neutral-700">Your note is now in your Library.</p>
            <Link to="/library" data-testid="goto-library" className="brutal-btn inline-flex items-center gap-2 bg-[#F4FF47] px-5 py-3 rounded-md uppercase font-bold">
              Go to Library <ArrowRight size={16} weight="bold" />
            </Link>
          </>
        )}
        {(status === "expired" || status === "error" || status === "timeout") && (
          <>
            <XCircle size={56} weight="bold" className="mx-auto text-red-500" />
            <h1 className="font-display text-3xl">{status === "expired" ? "Session expired" : status === "timeout" ? "Still processing" : "Something went wrong"}</h1>
            <p className="text-neutral-700">
              {status === "timeout" ? "It's taking longer than usual. Check your library shortly." : "Please try again."}
            </p>
            <button onClick={() => navigate("/browse")} className="brutal-btn inline-flex bg-white px-5 py-3 rounded-md uppercase font-bold">Back to Browse</button>
          </>
        )}
      </div>
    </div>
  );
}
