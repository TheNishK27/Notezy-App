import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Star } from "@phosphor-icons/react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function NoteDetail() {
  const { id } = useParams();

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(null);
  const [hasPurchased, setHasPurchased] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    loadPage();
  }, [id]);

  const loadPage = async () => {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData?.user || null;
    setUser(currentUser);

    const { data: noteData, error: noteError } = await supabase
      .from("notes")
      .select("*")
      .eq("id", id)
      .single();

    if (noteError) {
      console.error(noteError);
      setLoading(false);
      return;
    }

    setNote(noteData);

    if (currentUser) {
      const { data: purchaseData } = await supabase
        .from("purchases")
        .select("id")
        .eq("buyer_id", currentUser.id)
        .eq("note_id", id)
        .maybeSingle();

      setHasPurchased(!!purchaseData);

      const { data: myReviewData } = await supabase
        .from("reviews")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("note_id", id)
        .maybeSingle();

      if (myReviewData) {
        setMyReview(myReviewData);
        setRating(myReviewData.rating);
        setComment(myReviewData.comment || "");
      } else {
        setMyReview(null);
        setRating(5);
        setComment("");
      }
    }

    await loadReviews();
    setLoading(false);
  };

  const loadReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("note_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setReviews(data || []);
  };

  const submitReview = async () => {
    if (!user) {
      alert("Please login first.");
      return;
    }

    if (!hasPurchased) {
      alert("Only buyers can review this note.");
      return;
    }

    const payload = {
      note_id: id,
      user_id: user.id,
      rating,
      comment,
    };

    const { data, error } = await supabase
      .from("reviews")
      .upsert(payload, {
        onConflict: "note_id,user_id",
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setMyReview(data);
    await loadReviews();
    alert("Review saved!");
  };

  const deleteReview = async () => {
    if (!myReview) return;

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", myReview.id);

    if (error) {
      alert(error.message);
      return;
    }

    setMyReview(null);
    setRating(5);
    setComment("");
    await loadReviews();
  };

  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
          reviews.length
        ).toFixed(1)
      : "0.0";

  const buyNow = async () => {
    try {
      const res = await fetch(`${API_URL}/api/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note_id: note.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Payment failed");
        return;
      }

      if (!window.Razorpay) {
        alert("Razorpay script not loaded");
        return;
      }

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "Notezy",
        description: note.title,
        order_id: data.order_id,

        handler: async function (response) {
          const { data: userData } = await supabase.auth.getUser();
          const { data: sessionData } = await supabase.auth.getSession();

          const token = sessionData?.session?.access_token;

          if (!userData?.user || !token) {
            alert("Please login first.");
            return;
          }

          const verifyRes = await fetch(`${API_URL}/api/payments/verify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              note_id: note.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();

          if (!verifyRes.ok) {
            alert(verifyData.detail || "Payment verification failed");
            return;
          }

          alert("Payment successful! Note unlocked in Library.");
          loadPage();
        },

        prefill: {
          name: "Student",
          email: user?.email || "",
        },

        theme: {
          color: "#F4FF47",
        },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      console.error("BUY ERROR:", err);
      alert(err?.message || "Something went wrong");
    }
  };

const payWithWallet = async () => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      alert("Please login first.");
      return;
    }

    const res = await fetch(`${API_URL}/api/wallet/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        note_id: note.id,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.detail || "Wallet payment failed");
      return;
    }

    alert("Purchased successfully using Wallet!");

    loadPage();
  } catch (err) {
    console.error(err);
    alert(err.message || "Wallet payment failed");
  }
};

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-10 font-display text-3xl">
        Loading...
      </div>
    );
  }

  if (!note) {
    return (
      <div className="max-w-5xl mx-auto p-10 font-display text-3xl">
        Note not found
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      <div className="grid md:grid-cols-2 gap-10">
        <div>
          {note.thumbnail_url ? (
            <img
              src={note.thumbnail_url}
              alt={note.title}
              className="w-full rounded-lg border-2 border-black"
            />
          ) : (
            <div className="h-96 border-2 border-dashed border-black rounded-lg flex items-center justify-center">
              No Thumbnail
            </div>
          )}
        </div>

        <div className="space-y-5">
          <h1 className="font-display text-5xl">{note.title}</h1>

          <div className="flex items-center gap-2">
            <Star size={22} weight="fill" />
            <b>{avgRating}</b>
            <span className="text-sm text-neutral-500">
              ({reviews.length} reviews)
            </span>
          </div>

          <p className="text-neutral-700">{note.description}</p>

          <div className="space-y-2">
            <p>
              <b>Subject:</b> {note.subject}
            </p>
            <p>
              <b>Branch:</b> {note.branch}
            </p>
            <p>
              <b>Semester:</b> {note.semester}
            </p>
            <p>
              <b>Price:</b> ₹{note.price}
            </p>
          </div>

          <button
            disabled
            className="inline-block brutal-btn bg-gray-300 text-gray-600 px-6 py-3 rounded-md cursor-not-allowed"
          >
            Preview Coming Soon
          </button>

          <p className="text-xs text-neutral-500">
            Only a small preview of this note is available. Purchase to unlock
            the full PDF.
          </p>

          {!hasPurchased && (
  <div className="flex flex-col gap-3 mt-4">
    <button
      onClick={payWithWallet}
      className="brutal-btn bg-[#4ADE80] px-6 py-3 rounded-md font-bold"
    >
      💰 Pay with Wallet
    </button>

    <button
      onClick={buyNow}
      className="brutal-btn bg-[#F4FF47] px-6 py-3 rounded-md font-bold"
    >
      💳 Pay with Razorpay
    </button>
  </div>
)}

          {hasPurchased && (
            <div className="font-bold text-green-700">
              Purchased — available in your Library.
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border-2 border-black rounded-lg p-6 brutal-shadow">
        <h2 className="font-display text-3xl mb-4">Reviews & Ratings</h2>

        {user && hasPurchased ? (
          <div className="border-2 border-black rounded-lg p-4 mb-6 bg-[#FAFAFA]">
            <h3 className="font-bold mb-3">
              {myReview ? "Update your review" : "Write a review"}
            </h3>

            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  className="text-2xl"
                >
                  {s <= rating ? "★" : "☆"}
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your review..."
              className="w-full border-2 border-black rounded-md p-3 min-h-24"
            />

            <div className="flex gap-3 mt-3">
              <button
                onClick={submitReview}
                className="brutal-btn bg-[#F4FF47] px-5 py-2 rounded-md font-bold"
              >
                Save Review
              </button>

              {myReview && (
                <button
                  onClick={deleteReview}
                  className="brutal-btn bg-red-500 text-white px-5 py-2 rounded-md font-bold"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-neutral-600 mb-6">
            Purchase this note to write a review.
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="text-neutral-600">No reviews yet.</div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="border-b border-dashed border-black/30 pb-4"
              >
                <div className="font-bold">
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </div>

                <p className="text-sm mt-1">{r.comment || "No comment"}</p>

                <div className="text-xs text-neutral-500 mt-1">
                  {new Date(r.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}