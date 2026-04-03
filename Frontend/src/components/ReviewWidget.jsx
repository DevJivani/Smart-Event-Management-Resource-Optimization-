import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

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
        `/api/v1/review/event/${eventId}`,
        `/api/v1/event/${eventId}/reviews`,
        `/api/v1/review/${eventId}/all`,
      ];
      let data = null;
      for (const ep of endpoints) {
        try {
          const res = await axiosInstance.get(ep);
          console.log(`DEBUG: Review fetch from ${ep} success:`, res.data?.success);
          if (res.data?.success) {
            data =
              res.data.reviews ||
              res.data.data ||
              res.data.items ||
              res.data.results ||
              res.data.result ||
              [];
            console.log(`DEBUG: Data length:`, data.length);
            break;
          }
        } catch (err) {
          console.warn(`DEBUG: Review fetch from ${ep} failed:`, err.message);
        }
      }
      setReviews(data || []);
    } catch (err) {
      console.error("DEBUG: fetchReviews outer catch:", err);
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
    <div className="mt-4 bg-white dark:bg-gray-900 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-800 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-bold text-gray-900 dark:text-white">Reviews</h4>
        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{reviews.length} total</span>
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
          <div className="grid sm:grid-cols-3 gap-8 mb-8 bg-gray-50/50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="sm:col-span-1 flex flex-col items-center justify-center text-center sm:border-r border-gray-200 dark:border-gray-700 sm:pr-8">
              <div className="text-5xl font-black text-gray-900 dark:text-white">{avg.toFixed(1)}</div>
              <div className="mt-2 scale-125">
                <Stars value={Math.round(avg)} />
              </div>
              <div className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-3 uppercase tracking-widest">{total} ratings</div>
            </div>
            <div className="sm:col-span-2 space-y-2">
              {[5, 4, 3, 2, 1].map((n) => {
                const count = dist[n - 1];
                const pct = total ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={n} className="flex items-center gap-4">
                    <span className="w-6 text-xs font-bold text-gray-500 dark:text-gray-400">{n}★</span>
                    <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div className="h-2 bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="w-10 text-xs font-bold text-gray-400 dark:text-gray-500 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
      {loading ? (
        <div className="py-10 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-10 text-center bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No reviews yet. Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {reviews.slice(0, 5).map((r) => {
            const mainRole = r.userId?.role;
            const isOrganizer = mainRole === "organizer";
            return (
              <div
                key={r._id || r.id}
                className={`group relative rounded-2xl p-6 transition-all duration-300 ${
                  isOrganizer
                    ? "bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20"
                    : "bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-none"
                }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Link
                      to={`/profile/${r.userId?._id || r.userId}`}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm transition-transform hover:scale-105 ${
                        isOrganizer
                          ? "bg-blue-600 text-white"
                          : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-200"
                      }`}>
                      {(r.userId?.name || "-").toString().charAt(0).toUpperCase()}
                    </Link>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/profile/${r.userId?._id || r.userId}`}
                          className="text-sm font-bold text-gray-900 dark:text-white hover:text-indigo-600 transition-colors">
                          {r.userId?.name || "User"}
                        </Link>
                        {isOrganizer && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg bg-blue-600 text-white font-bold uppercase tracking-tighter">
                            Organizer
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mt-0.5">
                        {new Date(r.createdAt || Date.now()).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Stars value={Number(r.rating || 0)} />
                </div>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{r.comment || r.text || "-"}</p>

                {/* Main Review Action Buttons */}
                {!replyingTo && canReply && (
                  <div className="mt-4 flex gap-3">
                    <button
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      onClick={() => {
                        setReplyingTo(r._id);
                        setReplyText("");
                      }}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Reply
                    </button>
                  </div>
                )}

                {(r.replies || []).length > 0 && (
                  <div className="mt-6 ml-4 pl-6 border-l-2 border-indigo-100 dark:border-gray-700 space-y-4">
                    {r.replies.map((rep, idx) => {
                      const isRepOrganizer = rep.userId?.role === "organizer";
                      return (
                        <div key={idx} className="relative group/reply">
                          <div className="flex items-center gap-3">
                            <Link
                              to={`/profile/${rep.userId?._id || rep.userId}`}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-transform hover:scale-105 ${
                                isRepOrganizer
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                              }`}>
                              {(rep.userId?.name || "-").toString().charAt(0).toUpperCase()}
                            </Link>
                            <div>
                              <div className="flex items-center gap-2">
                                <Link
                                  to={`/profile/${rep.userId?._id || rep.userId}`}
                                  className="text-xs font-bold text-gray-900 dark:text-white hover:text-indigo-600 transition-colors">
                                  {rep.userId?.name || "User"}
                                </Link>
                                {isRepOrganizer && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold uppercase tracking-tighter">
                                    Organizer
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                                {new Date(rep.createdAt || Date.now()).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-start gap-2">
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 inline-block">
                              {rep.comment}
                            </p>
                            {canReply && !replyingTo && (
                              <button
                                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 ml-1 opacity-0 group-hover/reply:opacity-100 transition-opacity"
                                onClick={() => {
                                  setReplyingTo(r._id);
                                  setReplyText(`@${rep.userId?.name} `);
                                }}>
                                Reply
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {canReply && replyingTo === r._id && (
                  <div className="mt-4">
                    <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your reply..."
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText("");
                          }}>
                          Cancel
                        </button>
                        <button
                          className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
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
                          disabled={!replyText.trim()}>
                          Post Reply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {canWrite && (
        <div className="mt-10 pt-10 border-t-2 border-gray-50 dark:border-gray-800">
          <h5 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Write a Review</h5>
          <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Your Rating:</span>
              <Stars value={rating} onChange={setRating} editable />
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{rating} / 5</span>
            </div>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What was your favorite part? How was the organization?"
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
            />
            <div className="mt-6 flex justify-end">
              <button
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:grayscale disabled:hover:translate-y-0"
                onClick={submit}
                disabled={submitting || !comment.trim()}
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showAll && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 transition-all">
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setShowAll(false)}></div>
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden relative border border-gray-100 dark:border-gray-800 flex flex-col">
            <div className="flex items-center justify-between px-8 py-6 border-b dark:border-gray-800">
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">All Reviews</h3>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">{reviews.length} Feedbacks</p>
              </div>
              <button
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 transition-all"
                onClick={() => setShowAll(false)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {reviews.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize).map((r) => (
                <div key={r._id || r.id} className="bg-gray-50 dark:bg-gray-800/30 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold">
                        {(r.userId?.name || "-").toString().charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{r.userId?.name || "User"}</div>
                        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-0.5 uppercase tracking-tighter">
                          {new Date(r.createdAt || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Stars value={Number(r.rating || 0)} />
                  </div>
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{r.comment || r.text || "-"}</p>
                </div>
              ))}
            </div>
            <div className="px-8 py-6 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
              <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Page {page} of {Math.max(1, Math.ceil(reviews.length / pageSize))}
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-400 disabled:opacity-30 hover:bg-white dark:hover:bg-gray-800 transition-all"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <button
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-400 disabled:opacity-30 hover:bg-white dark:hover:bg-gray-800 transition-all"
                  onClick={() => setPage((p) => Math.min(Math.ceil(reviews.length / pageSize), p + 1))}
                  disabled={page >= Math.ceil(reviews.length / pageSize)}
                >
                  Next
                </button>
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