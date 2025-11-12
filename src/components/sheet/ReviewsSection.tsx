"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

function Stars({
  value,
  onChange,
  readOnly = false,
}: { value: number; onChange?: (v: number) => void; readOnly?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`h-5 w-5 ${n <= value ? "text-amber-500" : "text-zinc-300"}`}
          onClick={() => !readOnly && onChange?.(n)}
          aria-label={`${n} star`}
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill={n <= value ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M10 2.5l2.45 4.96 5.47.8-3.96 3.86.93 5.44L10 14.98 5.11 17.56l.93-5.44L2.08 8.26l5.47-.8L10 2.5z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

type Review = { id: string; rating: number; comment: string | null; user: { id: string; email: string | null }; createdAt: string };

export default function ReviewsSection({ recipeId }: { recipeId: string }) {
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/reviews?recipeId=${recipeId}`, { cache: "no-store" });
      const j = await res.json();
      if (res.ok) {
        setAvg(j.avg || 0);
        setCount(j.count || 0);
        setReviews(j.reviews || []);
        setRating(j.myReview?.rating || 0);
        setComment(j.myReview?.comment || "");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    load();
  }, [recipeId, status]);

  async function post() {
    if (status !== "authenticated") { alert("Please sign in to post a review."); return; }
    if (rating < 1) { alert("Please select a star rating."); return; }
    const res = await fetch("/api/user/reviews", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId, rating, comment }),
    });
    const j = await res.json();
    if (res.ok) {
      setAvg(j.avg || 0); setCount(j.count || 0); setReviews(j.reviews || []);
      setComment("");
    } else { alert(j.error || "Failed to post."); }
  }

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold mb-2">Reviews</h2>

      <div className="card p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-zinc-600">Average: <span className="font-medium">{avg ? avg.toFixed(1) : "-"}</span> ({count})</div>
          <Stars value={rating} onChange={setRating} />
        </div>
        <div className="mt-3 flex gap-2">
          <input className="input flex-1" placeholder="Leave a comment…" value={comment} onChange={(e)=>setComment(e.target.value)} />
          <button className="btn primary" onClick={post}>Post</button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {loading && <div className="card h-16 animate-pulse" />}
        {!loading && reviews.length === 0 && <div className="text-sm text-zinc-600">No reviews yet. Be the first to write one.</div>}
        {reviews.map(r => (
          <div key={r.id} className="card p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{r.user.email || "User"}</div>
              <Stars value={r.rating} readOnly />
            </div>
            {r.comment && <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{r.comment}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

