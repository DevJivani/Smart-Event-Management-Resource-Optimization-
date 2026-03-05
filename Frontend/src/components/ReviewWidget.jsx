import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";

export default function ReviewWidget({ eventId, canWrite = false, canReply = false }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  const fetchReviews = async () => {
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
      setReviews(data || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const submit = async () => {
    try {
      setSubmitting(true);
      const attempts = [
        { url: `/api/v1/event/${eventId}/review`, body: { rating, comment } },
        { url: `/api/v1/event/${eventId}/reviews`, body: { rating, comment } },
        { url: `/api/v1/review/event/${eventId}`, body: { rating, comment } },
        { url: `/api/v1/review`, body: { eventId, rating, comment } },
      ];
      let ok = false;
      let lastErr = null;
      for (const a of attempts) {
        try {
          const res = await axiosInstance.post(a.url, a.body);
          if (res.data?.success) {
            ok = true;
            toast.success("Review submitted");
            setComment("");
            setRating(5);
            await fetchReviews();
            break;
          }
        } catch (e) {
          lastErr = e;
        }
      }
      if (!ok) {
        toast.error(lastErr?.response?.data?.message || "Review endpoint not available");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Error submitting review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-base font-semibold text-gray-900">Reviews</h4>
        <span className="text-xs text-gray-500">{reviews.length} total</span>
      </div>
      {(() => {
        const total = reviews.length;
        const avg = total ? (reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / total) : 0;
        const dist = [0, 0, 0, 0, 0];
        reviews.forEach((r) => {
          const v = Math.max(1, Math.min(5, Number(r.rating || 0)));
          dist[v - 1] += 1;
        });
        return (
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div className="sm:col-span-1">
              <div className="text-3xl font-bold text-gray-900">{avg.toFixed(1)}</div>
              <div className="mt-1">
                <Stars value={Math.round(avg)} />
              </div>
              <div className="text-xs text-gray-500 mt-1">{total} ratings</div>
            </div>
            <div className="sm:col-span-2">
              {[5, 4, 3, 2, 1].map((n) => {
                const count = dist[n - 1];
                const pct = total ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={n} className="flex items-center gap-3 mb-1">
                    <span className="w-6 text-xs text-gray-600">{n}★</span>
                    <div className="flex-1 h-2 rounded bg-gray-200 overflow-hidden">
                      <div className="h-2 bg-yellow-400" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="w-10 text-xs text-gray-600">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
      {loading ? (
        <div className="py-6 text-sm text-gray-600">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="py-6 text-sm text-gray-600">No reviews yet.</div>
      ) : (
        <div className="mt-2 space-y-4">
          {reviews.slice(0, 5).map((r) => {
            const mainRole = r.userId?.role;
            const mainTheme =
              mainRole === "organizer"
                ? "border-blue-200 bg-blue-50"
                : "border-gray-200 bg-gray-50";
            const avatarTheme =
              mainRole === "organizer"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-200 text-gray-700";
            return (
            <div key={r._id || r.id} className={`border rounded-lg p-4 ${mainTheme}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${avatarTheme}`}>
                    {(r.userId?.name || "-").toString().charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{r.userId?.name || "User"}</div>
                    <div className="mt-0.5">
                      {mainRole === "organizer" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          Organizer
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/>
                          </svg>
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">User</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(r.createdAt || Date.now()).toLocaleDateString()} {new Date(r.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
                <Stars value={Number(r.rating || 0)} />
              </div>
              <p className="mt-2 text-sm text-gray-700">{r.comment || r.text || "-"}</p>
              {(r.replies || []).length > 0 && (
                <div className="mt-3 pl-3 border-l space-y-2">
                  {r.replies.map((rep, idx) => (
                    <div key={idx} className="text-sm">
                      <div className={`flex items-center gap-2 ${rep.userId?.role === "organizer" ? "text-blue-900" : "text-gray-900"}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold ${rep.userId?.role === "organizer" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-700"}`}>
                          {(rep.userId?.name || "-").toString().charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold">{rep.userId?.name || "User"}</span>
                        {rep.userId?.role === "organizer" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            Organizer
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/>
                            </svg>
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">User</span>
                        )}
                        <span className="text-xs text-gray-500">{new Date(rep.createdAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                      <p className="mt-1 text-gray-700">{rep.comment}</p>
                    </div>
                  ))}
                </div>
              )}
              {canReply && (
                <div className="mt-3">
                  {replyingTo === r._id ? (
                    <div className="space-y-2">
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm"
                          onClick={async () => {
                            try {
                              const res = await axiosInstance.post(`/api/v1/review/${r._id}/reply`, { comment: replyText });
                              if (res.data?.success) {
                                toast.success("Reply added");
                                setReplyingTo(null);
                                setReplyText("");
                                fetchReviews();
                              } else {
                                toast.error(res.data?.message || "Failed to reply");
                              }
                            } catch (e) {
                              toast.error(e.response?.data?.message || "Error replying");
                            }
                          }}
                          disabled={!replyText.trim()}
                        >
                          Send
                        </button>
                        <button
                          className="px-3 py-1.5 rounded-md border border-gray-300 text-sm"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
                      onClick={() => setReplyingTo(r._id)}
                    >
                      Reply
                    </button>
                  )}
                </div>
              )}
            </div>
          )})}
          {reviews.length > 5 && (
            <div className="flex justify-end">
              <button
                className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
                onClick={() => {
                  setShowAll(true);
                  setPage(1);
                }}
              >
                View All Reviews
              </button>
            </div>
          )}
        </div>
      )}
      {canWrite && (
        <div className="mt-6 border-t pt-6">
          <h5 className="text-sm font-semibold text-gray-900 mb-2">Write a Review</h5>
          <div className="flex items-center gap-3 mb-3">
            <Stars value={rating} onChange={setRating} editable />
            <span className="text-xs text-gray-600">{rating} / 5</span>
          </div>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <div className="mt-3 flex justify-end">
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              onClick={submit}
              disabled={submitting || !comment.trim()}
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </div>
      )}
      {showAll && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">All Reviews</h3>
                <button
                  className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
                  onClick={() => setShowAll(false)}
                >
                  Close
                </button>
              </div>
              <div className="p-4 overflow-y-auto" style={{ maxHeight: "calc(80vh - 120px)" }}>
                {reviews.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize).map((r) => (
                  <div key={r._id || r.id} className="border rounded-lg p-4 mb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold">
                          {(r.userId?.name || "-").toString().charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{r.userId?.name || "User"}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(r.createdAt || Date.now()).toLocaleDateString()} {new Date(r.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                      <Stars value={Number(r.rating || 0)} />
                    </div>
                    <p className="mt-2 text-sm text-gray-700">{r.comment || r.text || "-"}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-gray-600">
                  Page {page} of {Math.max(1, Math.ceil(reviews.length / pageSize))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-1.5 rounded-md border border-gray-300 text-sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-md border border-gray-300 text-sm"
                    onClick={() => setPage((p) => Math.min(Math.ceil(reviews.length / pageSize), p + 1))}
                    disabled={page >= Math.ceil(reviews.length / pageSize)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stars({ value = 0, onChange, editable = false }) {
  const vals = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-0.5">
      {vals.map((v) => (
        <button
          key={v}
          className={`text-yellow-500 ${editable ? "hover:scale-105 transition-transform" : ""}`}
          onClick={() => editable && onChange?.(v)}
          title={`${v} star${v > 1 ? "s" : ""}`}
        >
          {v <= value ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}