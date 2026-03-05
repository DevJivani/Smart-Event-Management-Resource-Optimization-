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
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-50 border border-yellow-200 ${className}`}>
      <span className="text-yellow-500">{rounded >= 1 ? "★".repeat(rounded) : "☆☆☆☆☆"}</span>
      <span className="text-xs text-gray-700">{avg.toFixed(1)}</span>
      <span className="text-xs text-gray-500">({count})</span>
      {loading ? <span className="ml-1 w-2 h-2 rounded-full bg-yellow-300 animate-pulse"></span> : null}
    </div>
  );
}