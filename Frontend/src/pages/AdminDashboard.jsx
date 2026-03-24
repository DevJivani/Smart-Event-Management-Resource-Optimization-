import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";
import StatusBadge from "../components/StatusBadge.jsx";

const AdminDashboard = () => {
  const { user, role } = useSelector((state) => state.auth);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    status: "all",
    categoryId: "",
    searchQuery: "",
    priceMin: "",
    priceMax: ""
  });
  const navigate = useNavigate();

  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get("/api/v1/event/categories");
      if (res.data.success) setCategories(res.data.categories || []);
    } catch {
      // ignore
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status === "all") {
        ["upcoming", "ongoing", "completed", "cancelled"].forEach((s) => params.append("status", s));
      } else {
        params.append("status", filters.status);
      }
      if (filters.categoryId) params.append("categoryId", filters.categoryId);
      const response = await axiosInstance.get(`/api/v1/event/admin/all?${params.toString()}`);
      if (response.data.success) {
        const evts = response.data.events || [];
        setEvents(evts);
      } else {
        toast.error(response.data.message || "Failed to fetch events");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching events");
    } finally {
      setLoading(false);
    }
  };

  const approveEvent = async (id) => {
    try {
      const res = await axiosInstance.put(`/api/v1/event/${id}/admin/approve`);
      if (res.data.success) {
        if (res.data.alreadyApproved) {
          toast("Event is already approved");
        } else {
          toast.success("Event approved");
        }
        fetchEvents();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve");
    }
  };

  const unapproveEvent = async (id) => {
    try {
      const res = await axiosInstance.put(`/api/v1/event/${id}/admin/unapprove`);
      if (res.data.success) {
        if (res.data.alreadyUnapproved) {
          toast("Event is already not approved");
        } else {
          toast.success("Event marked not approved");
        }
        fetchEvents();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to mark not approved");
    }
  };
  const disableEvent = async (id) => {
    try {
      const res = await axiosInstance.put(`/api/v1/event/${id}/admin/disable`);
      if (res.data.success) {
        toast.success("Event disabled");
        fetchEvents();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to disable");
    }
  };

  const enableEvent = async (id) => {
    try {
      const res = await axiosInstance.put(`/api/v1/event/${id}/admin/enable`);
      if (res.data.success) {
        toast.success("Event enabled");
        fetchEvents();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to enable");
    }
  };

  const updateEventStatus = async (id, status) => {
    try {
      const res = await axiosInstance.put(`/api/v1/event/${id}/admin/status`, { status });
      if (res.data.success) {
        toast.success("Status updated");
        fetchEvents();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.categoryId]);

  if (!user) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/" replace />;

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 border-b dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Welcome, {user?.name}. Manage the platform.</p>
        </div>
      </div>
      <main className="max-w-7xl mx-auto p-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 border border-gray-100 dark:border-gray-800 transition-colors duration-300">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Events</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{events.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 border border-gray-100 dark:border-gray-800 transition-colors duration-300">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Upcoming</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{events.filter((e) => e.status === "upcoming").length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 border border-gray-100 dark:border-gray-800 transition-colors duration-300">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Ongoing</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{events.filter((e) => e.status === "ongoing").length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 border border-gray-100 dark:border-gray-800 transition-colors duration-300">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Categories</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{categories.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-8 flex flex-wrap items-center gap-8 transition-colors duration-300">
          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">Status:</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white transition-all font-medium min-w-[140px]"
            >
              <option value="all">All</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-3 border-l border-gray-100 dark:border-gray-800 pl-8">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">Category:</label>
            <select
              value={filters.categoryId}
              onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value }))}
              className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white transition-all font-medium min-w-[160px]"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Price Filter Box */}
          <div className="flex items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-2.5 transition-all border-l border-gray-100 dark:border-gray-800 ml-auto lg:ml-0">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">Price :</span>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                value={filters.priceMin}
                onChange={(e) => setFilters((f) => ({ ...f, priceMin: e.target.value }))}
                placeholder="Min"
                className="w-20 text-sm bg-transparent outline-none border-b-2 border-gray-200 dark:border-gray-700 focus:border-indigo-500 transition-colors font-bold text-center text-gray-900 dark:text-white"
              />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">to</span>
              <input
                type="number"
                min="0"
                value={filters.priceMax}
                onChange={(e) => setFilters((f) => ({ ...f, priceMax: e.target.value }))}
                placeholder="Max"
                className="w-20 text-sm bg-transparent outline-none border-b-2 border-gray-200 dark:border-gray-700 focus:border-indigo-500 transition-colors font-bold text-center text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Search Filter */}
          <div className="flex-1 min-w-[300px] relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters((f) => ({ ...f, searchQuery: e.target.value }))}
              placeholder="Search by title, city or venue..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-medium text-gray-900 dark:text-white"
            />
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400 transition-colors duration-300"></div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-12 text-center border border-gray-100 dark:border-gray-800 transition-colors duration-300">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No events found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Organizers have not created any events yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <div 
                key={event._id} 
                onClick={() => navigate(`/event/${event._id}`)}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer group"
              >
                <div className="w-full h-40">
                  {event.bannerImage ? (
                    <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <svg className="h-10 w-10 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                      {event?.categoryId?.name || "General"}
                    </span>
                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg capitalize bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                      {event.status}
                    </span>
                    {event.isDisabled && (
                      <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800">
                        Disabled
                      </span>
                    )}
                    {!event.isApproved && (
                      <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-800">
                        Not approved
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors break-words">{event.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2 break-words">
                    {event.description}
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-y-4 gap-x-6 border-t border-gray-50 dark:border-gray-800 pt-6">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Date</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                        {new Date(event.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Organizer</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5 truncate">
                        {event?.createdBy?.name || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Location</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5 truncate">
                        {event.city || event.venue}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Seats</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                        {event.availableSeats} / {event.totalSeats}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2 pt-6 border-t border-gray-50 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        event.isApproved ? unapproveEvent(event._id) : approveEvent(event._id);
                      }}
                      className={`flex-1 px-3 py-2.5 rounded-xl text-white text-xs font-bold transition-all ${event.isApproved ? "bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20" : "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"}`}
                    >
                      {event.isApproved ? "Unapprove" : "Approve"}
                    </button>
                    <select
                      value={event.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateEventStatus(event._id, e.target.value);
                      }}
                      className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {event.isDisabled ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          enableEvent(event._id);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-gray-600 hover:bg-gray-700 text-white text-xs font-bold transition-all shadow-lg shadow-gray-500/20"
                      >
                        Enable
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          disableEvent(event._id);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-lg shadow-rose-500/20"
                      >
                        Disable
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
