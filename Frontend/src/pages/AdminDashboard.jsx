import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const { user, role } = useSelector((state) => state.auth);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    status: "all",
    categoryId: "",
    city: "",
  });

  if (!user) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/" replace />;

  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get("/api/v1/event/categories");
      if (res.data.success) setCategories(res.data.categories || []);
    } catch (error) {
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
      if (filters.city) params.append("city", filters.city.trim());
      const response = await axiosInstance.get(`/api/v1/event/admin/all?${params.toString()}`);
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

  const approveEvent = async (id) => {
    try {
      const res = await axiosInstance.put(`/api/v1/event/${id}/admin/approve`);
      if (res.data.success) {
        toast.success("Event approved");
        fetchEvents();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve");
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
  }, [filters.status, filters.categoryId, filters.city]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome, {user?.name}. Manage the platform.</p>
        </div>
      </div>
      <main className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">All</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.categoryId}
                onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
                placeholder="Enter city name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-sm text-gray-500">Organizers have not created any events yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div key={event._id} className="bg-white rounded-xl shadow overflow-hidden">
                <div className="w-full h-40">
                  {event.bannerImage ? (
                    <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-indigo-50 text-indigo-700">
                      {event?.categoryId?.name || "General"}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full capitalize bg-blue-100 text-blue-800">
                      {event.status}
                    </span>
                    {event.isDisabled && (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                        Disabled
                      </span>
                    )}
                    {!event.isApproved && (
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                        Not approved
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {event.description?.substring(0, 100)}
                    {event.description?.length > 100 ? "..." : ""}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(event.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Organizer</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {event?.createdBy?.name || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {event.venue}
                        {event.city && `, ${event.city}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Seats</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {event.availableSeats} / {event.totalSeats}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => approveEvent(event._id)}
                      className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                    >
                      {event.isApproved ? "Approved" : "Approve"}
                    </button>
                    <select
                      value={event.status}
                      onChange={(e) => updateEventStatus(event._id, e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {event.isDisabled ? (
                      <button
                        onClick={() => enableEvent(event._id)}
                        className="px-3 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-sm"
                      >
                        Enable
                      </button>
                    ) : (
                      <button
                        onClick={() => disableEvent(event._id)}
                        className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
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
