import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axios";

export default function AverageRatingBadge({ eventId, className = "" }) {
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const endpoints = [
          `/api/v1/event/${eventId}/reviews`,
          `/api/v1/review/event/${eventId}`,
          `/api/v1/review/${eventId}/all`,
        ];
        let data = null;
        for (const ep of endpoints) {
          try {
            const res = await axiosInstance.get(ep);
            if (res.data?.success) {
              data =
                res.data.reviews ||
                res.data.data ||
                res.data.items ||
                res.data.results ||
                res.data.result ||
                [];
              break;
            }
          } catch {
            void 0;
          }
        }
        const arr = Array.isArray(data) ? data : [];
        const c = arr.length;
        const s = arr.reduce((sum, r) => sum + Number(r.rating || 0), 0);
        setAvg(c ? s / c : 0);
        setCount(c);
      } finally {
        setLoading(false);
      }
    };
    if (eventId) load();
  }, [eventId]);

  const rounded = Math.round(avg);
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30 transition-colors ${className}`}>
      <span className="text-yellow-500 text-xs">{rounded >= 1 ? "★".repeat(rounded) : "☆☆☆☆☆"}</span>
      <span className="text-[10px] font-black text-yellow-700 dark:text-yellow-400">{avg.toFixed(1)}</span>
      <span className="text-[10px] font-bold text-yellow-600/60 dark:text-yellow-500/50">({count})</span>
      {loading ? <span className="ml-1 w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span> : null}
    </div>
  );
}