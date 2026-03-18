import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";
import ReviewWidget from "../components/ReviewWidget.jsx";
import AverageRatingBadge from "../components/AverageRatingBadge.jsx";

const UserDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    status: "all",
    searchQuery: "",
    priceMin: "",
    priceMax: ""
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filters.status === "all") {
          ["upcoming", "ongoing", "completed", "cancelled"].forEach((s) => params.append("status", s));
        } else {
          params.append("status", filters.status);
        }
        const response = await axiosInstance.get(`/api/v1/event?${params.toString()}`);
        if (response.data.success) {
          setEvents(response.data.events || []);
        } else {
          toast.error(response.data.message || "Failed to fetch events");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error fetching events");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [filters.status]);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "user") return <Navigate to="/" replace />;

  const formatDate = (date) => new Date(date).toLocaleDateString();
  const filteredEvents = events.filter((e) => {
    const q = filters.searchQuery.trim().toLowerCase();
    const matchesQuery = q
      ? ((e.title || "").toLowerCase().includes(q) ||
         (e.city || "").toLowerCase().includes(q) ||
         (e.venue || "").toLowerCase().includes(q))
      : true;
    const price = Number(e.price || 0);
    const minOk = filters.priceMin !== "" ? price >= Number(filters.priceMin) : true;
    const maxOk = filters.priceMax !== "" ? price <= Number(filters.priceMax) : true;
    const status = e.effectiveStatus || e.status;
    const hideCompleted = filters.status === "all" ? status !== "completed" : true;
    return matchesQuery && minOk && maxOk && hideCompleted;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold">User Dashboard</h1>
        <p className="mt-4 text-gray-600">
          Welcome, {user.name}. Browse available events and book your seat.
        </p>

        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <aside className="md:col-span-1">
              <div className="bg-white rounded-xl shadow p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">Status</label>
                  <div className="flex flex-col gap-2">
                    {["all","upcoming","ongoing","completed","cancelled"].map((opt) => (
                      <label key={opt} className="inline-flex items-center gap-2 text-sm text-gray-700 capitalize">
                        <input
                          type="radio"
                          name="status"
                          value={opt}
                          checked={filters.status === opt}
                          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4 mt-8">Price (₹)</label>
                  <div className="flex-column gap-2">
                    <input
                      type="number"
                      min="0"
                      value={filters.priceMin}
                      onChange={(e) => setFilters((f) => ({ ...f, priceMin: e.target.value }))}
                      placeholder="Min"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 mb-4"
                    />
                    <input
                      type="number"
                      min="0"
                      value={filters.priceMax}
                      onChange={(e) => setFilters((f) => ({ ...f, priceMax: e.target.value }))}
                      placeholder="Max"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            </aside>
            <section className="md:col-span-3">
              <div className="bg-white rounded-xl shadow p-4 mb-6">
                <input
                  type="text"
                  value={filters.searchQuery}
                  onChange={(e) => setFilters((f) => ({ ...f, searchQuery: e.target.value }))}
                  placeholder="Search events by title or location"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
              ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No events available
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Check back later for upcoming events.
              </p>
            </div>
              ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <div
                  key={event._id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/event/${event._id}`)}
                >
                  <div className="w-full h-40">
                    {event.bannerImage ? (
                      <img
                        src={event.bannerImage}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <svg
                          className="h-10 w-10 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                    </svg>
                      </div>
              )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                      <AverageRatingBadge eventId={event._id} />
                    </div>
                    {/* simplified card: only date, price, status, book */}
                    <div className="mt-4 space-y-2">
                      <p className="text-sm">
                        <span className="font-semibold">Date:</span> {formatDate(event.startDate)}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Price:</span>{" "}
                        {event.isPaid ? `₹${Number(event.price ?? 0).toFixed(2)}` : "Free"}
                      </p>
                    </div>
                    <div className="mt-4">
                      <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full capitalize bg-blue-100 text-blue-800">
                        {event.effectiveStatus || event.status}
                      </span>
                    </div>
                    {event.isPaid && event.availableSeats > 0 && ["upcoming","ongoing"].includes(event.effectiveStatus || event.status) && (
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm font-semibold text-gray-900">
                          Price: ₹{event.price || 0}
                        </div>
                        <button
                          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/book/${event._id}`);
                          }}
                        >
                          Book Now
                        </button>
                      </div>
                    )}
                  {/* removed review toggle from card to keep minimal */}
                  </div>
                </div>
              ))}
            </div>
          )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
