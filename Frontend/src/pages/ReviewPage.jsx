import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const ReviewPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/v1/review/admin/all");
      if (res.data?.success) {
        setReviews(res.data.reviews || []);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const stats = {
    total: reviews.length,
    visible: reviews.filter(r => r.visible).length,
    hidden: reviews.filter(r => !r.visible).length,
    avgRating: reviews.length 
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : 0
  };

  const groupedReviews = reviews.reduce((acc, review) => {
    const eventId = review.eventId?._id || "deleted";
    if (!acc[eventId]) {
      acc[eventId] = {
        eventTitle: review.eventId?.title || "Deleted Event",
        reviews: []
      };
    }
    acc[eventId].reviews.push(review);
    return acc;
  }, {});

  const handleToggleVisibility = async (reviewId, currentVisibility) => {
    try {
      const endpoint = currentVisibility 
        ? `/api/v1/review/${reviewId}/hide` 
        : `/api/v1/review/${reviewId}/approve`;
      
      const res = await axiosInstance.patch(endpoint);
      if (res.data?.success) {
        toast.success(currentVisibility ? "Review hidden" : "Review approved");
        setReviews(prev => prev.map(r => r._id === reviewId ? res.data.review : r));
      }
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const Stars = ({ value }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= value ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Review Management</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Monitor and manage all event reviews across the platform.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Reviews</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Rating</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgRating}</p>
              <svg className="w-5 h-5 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Visible Reviews</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.visible}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Hidden Reviews</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.hidden}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400"></div>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.keys(groupedReviews).length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No reviews found</h3>
                <p className="text-gray-500 dark:text-gray-400">There are no reviews submitted for any events yet.</p>
              </div>
            ) : (
              Object.entries(groupedReviews).map(([eventId, group]) => (
                <div key={eventId} className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
                  {/* Event Header */}
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 px-8 py-4 border-b border-purple-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 dark:bg-purple-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{group.eventTitle}</h2>
                          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">{group.reviews.length} total reviews</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reviews List */}
                  <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {group.reviews.map((review) => (
                      <div key={review._id} className="p-6 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors duration-200">
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* User Info & Rating */}
                          <div className="md:w-1/4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center text-purple-700 dark:text-purple-400 font-bold">
                                {(review.userId?.name || "U").charAt(0).toUpperCase()}
                              </div>
                              <div className="overflow-hidden">
                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{review.userId?.name || "Unknown User"}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{review.userId?.email}</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Stars value={review.rating} />
                              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString("en-US", {
                                  month: 'short', day: 'numeric', year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>

                          {/* Comment & Actions */}
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                              <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 relative">
                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                  "{review.comment || "No comment provided."}"
                                </p>
                              </div>
                              
                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  review.visible 
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                }`}>
                                  {review.visible ? "Visible" : "Hidden"}
                                </span>
                                <button
                                  onClick={() => handleToggleVisibility(review._id, review.visible)}
                                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                                    review.visible
                                      ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      : "bg-purple-600 dark:bg-purple-700 text-white hover:bg-purple-700 dark:hover:bg-purple-600 shadow-lg shadow-purple-500/20"
                                  }`}
                                >
                                  {review.visible ? "Hide" : "Approve"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewPage;