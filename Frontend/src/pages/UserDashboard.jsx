import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";
import ReviewWidget from "../components/ReviewWidget.jsx";
import AverageRatingBadge from "../components/AverageRatingBadge";
import AdBanner from "../components/AdBanner";

const UserDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState({ received: [], sent: [] });
  const [requestsLoading, setRequestsLoading] = useState(false);
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    status: "all",
    searchQuery: "",
    priceMin: "",
    priceMax: "",
    city: ""
  });
  const [isCityOpen, setIsCityOpen] = useState(false);
  const popularCities = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Pune", "Chennai", "Kolkata"];

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

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return;
      try {
        setRequestsLoading(true);
        const res = await axiosInstance.get("/api/v1/matchmaker/requests");
        if (res.data?.success) {
          setRequests({
            received: res.data.received || [],
            sent: res.data.sent || []
          });
        }
      } catch (err) {
        console.error("Error fetching connection requests:", err);
      } finally {
        setRequestsLoading(false);
      }
    };
    fetchRequests();
  }, [user]);

  const handleUpdateStatus = async (requestId, status) => {
    try {
      const res = await axiosInstance.patch("/api/v1/matchmaker/status", {
        connectionId: requestId,
        status
      });
      if (res.data?.success) {
        toast.success(`Request ${status}`);
        if (status === "accepted") {
          // Find the request to get receiverId and eventId
          const req = requests.received.find(r => r._id === requestId);
          if (req) {
            navigate("/chat", { state: { receiverId: req.senderId._id, eventId: req.eventId._id } });
          }
        }
        setRequests(prev => ({
          ...prev,
          received: prev.received.filter(r => r._id !== requestId)
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error updating status");
    }
  };

  const handleBlockUser = async (blockUserId) => {
    if (!window.confirm("Are you sure you want to block this user? You will no longer see each other at events and any existing connections will be removed.")) return;
    try {
      const res = await axiosInstance.post("/api/v1/matchmaker/block", { blockUserId });
      if (res.data?.success) {
        toast.success("User blocked");
        // Remove any requests from this user
        setRequests(prev => ({
          ...prev,
          received: prev.received.filter(r => r.senderId._id !== blockUserId),
          sent: prev.sent.filter(r => r.receiverId._id !== blockUserId)
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error blocking user");
    }
  };

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "user") return <Navigate to="/" replace />;

  const formatDate = (date) => new Date(date).toLocaleDateString();
  const filteredEvents = events.filter((e) => {
    const q = filters.searchQuery.trim().toLowerCase();
    const city = filters.city.trim().toLowerCase();
    const matchesQuery = q
      ? ((e.title || "").toLowerCase().includes(q) ||
         (e.city || "").toLowerCase().includes(q) ||
         (e.venue || "").toLowerCase().includes(q))
      : true;
    const matchesCity = city
      ? (e.city || "").toLowerCase().includes(city)
      : true;
    const price = Number(e.price || 0);
    const minOk = filters.priceMin !== "" ? price >= Number(filters.priceMin) : true;
    const maxOk = filters.priceMax !== "" ? price <= Number(filters.priceMax) : true;
    const status = e.effectiveStatus || e.status;
    const hideCompleted = filters.status === "all" ? status !== "completed" : true;
    return matchesQuery && matchesCity && minOk && maxOk && hideCompleted;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      <AdBanner />
      <main className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Discover Events</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Find and book the best events in your favorite cities.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-gray-900/50 backdrop-blur-md rounded-2xl p-4 mb-8 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center gap-6 relative z-30">
          
          {/* Status Filter */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Status:</span>
            <select
              value={filters.status}
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all min-w-[100px]"
            >
              {["all","upcoming","ongoing","completed","cancelled"].map(opt => (
                <option key={opt} value={opt} className="capitalize">{opt}</option>
              ))}
            </select>
          </div>

          {/* Price Filter */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Price:</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                className="w-20 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                value={filters.priceMin}
                onChange={(e) => setFilters(f => ({ ...f, priceMin: e.target.value }))}
              />
              <span className="text-gray-400 text-xs uppercase font-bold">to</span>
              <input
                type="number"
                placeholder="Max"
                className="w-20 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                value={filters.priceMax}
                onChange={(e) => setFilters(f => ({ ...f, priceMax: e.target.value }))}
              />
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text"
              placeholder="Search by title, city or venue..."
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
              value={filters.searchQuery}
              onChange={(e) => setFilters(f => ({ ...f, searchQuery: e.target.value }))}
            />
          </div>

          {/* City Popover Filter */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsCityOpen(!isCityOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                filters.city 
                  ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/25" 
                  : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:border-purple-500"
              }`}
            >
              <span>{filters.city || "Cities"}</span>
              <svg className={`w-4 h-4 transition-transform ${isCityOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isCityOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsCityOpen(false)} />
                <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-6 z-20 animate-in fade-in zoom-in-95 duration-200">
                  <div className="space-y-6">
                    {/* Search inside popover */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Find your city</p>
                      <div className="relative">
                        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search city..."
                          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                          value={filters.city}
                          onChange={(e) => setFilters(f => ({ ...f, city: e.target.value }))}
                        />
                      </div>
                    </div>

                    {/* Popular Cities list */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Popular Cities</p>
                      <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        <button
                          onClick={() => { setFilters(f => ({ ...f, city: "" })); setIsCityOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            filters.city === "" ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          All Cities
                        </button>
                        {popularCities.map(city => (
                          <button
                            key={city}
                            onClick={() => { setFilters(f => ({ ...f, city })); setIsCityOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                              filters.city === city ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* AI Social Matchmaker Requests */}
        {requests.received.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Social Matchmaker Requests</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Attendees want to connect with you!</p>
              </div>
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-bold border border-indigo-200 dark:border-indigo-800">
                {requests.received.length} New
              </span>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {requests.received.map((req) => (
                <div key={req._id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-indigo-100 dark:border-indigo-800 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
                      {req.senderId.profileImage ? (
                        <img src={req.senderId.profileImage} alt={req.senderId.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-bold text-indigo-600">
                          {req.senderId.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">{req.senderId.name}</h3>
                        <button 
                          onClick={() => handleBlockUser(req.senderId._id)}
                          className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all"
                          title="Block User"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">at {req.eventId.title}</p>
                    </div>
                  </div>
                  
                  <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl p-3 mb-4 border border-indigo-100/50 dark:border-indigo-800/30">
                    <p className="text-xs text-gray-600 dark:text-gray-300 italic line-clamp-2">"{req.message}"</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUpdateStatus(req._id, "rejected")}
                      className="flex-1 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                      Ignore
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(req._id, "accepted")}
                      className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm transition-all"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result Message */}
        <div className="mb-8">
          <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/20">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {filters.city ? `Showing events in ${filters.city}` : "Showing all available events"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Found {filteredEvents.length} events matching your current filters.
              </p>
            </div>
          </div>
        </div>

        {/* Latest Events Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400"></div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-gray-600">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">No events found</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Try adjusting your filters or search criteria.</p>
            <button
              onClick={() => setFilters({ status: "all", searchQuery: "", priceMin: "", priceMax: "", city: "" })}
              className="mt-6 px-6 py-2.5 bg-gray-900 dark:bg-gray-800 text-white rounded-xl font-bold hover:bg-black transition-all"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <div
                key={event._id}
                onClick={() => navigate(`/event/${event._id}`)}
                className="group relative bg-white dark:bg-gray-900 rounded-[2.5rem] p-3 border border-gray-100 dark:border-gray-800 hover:border-purple-500/30 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(79,70,229,0.1)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col h-full cursor-pointer overflow-hidden"
              >
                {/* Image Container */}
                <div className="relative h-64 w-full rounded-[2rem] overflow-hidden shadow-inner">
                  {event.bannerImage ? (
                    <img
                      src={event.bannerImage}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 flex items-center justify-center">
                      <svg className="w-16 h-16 text-indigo-200/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Floating Badges */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <div className="px-4 py-1.5 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${
                        event.effectiveStatus === 'upcoming' ? 'bg-emerald-500' : 
                        event.effectiveStatus === 'ongoing' ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white">
                        {event.effectiveStatus || event.status}
                      </span>
                    </div>
                    <div className="transform group-hover:scale-110 transition-transform duration-300">
                      <AverageRatingBadge eventId={event._id} />
                    </div>
                  </div>

                  {/* Price Tag Overlay */}
                  <div className="absolute bottom-4 right-4">
                    <div className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-2xl shadow-indigo-600/50 transform translate-y-0 group-hover:-translate-y-2 transition-transform duration-500">
                      {event.isPaid ? `₹${Number(event.price || 0).toLocaleString()}` : "FREE"}
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="px-6 py-8 flex flex-col flex-1">
                  <div className="mb-4">
                    <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em] mb-2">
                      {event.categoryId?.name || "Featured Event"}
                    </p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {event.title}
                    </h3>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4 mt-auto">
                    <div className="flex flex-col gap-1 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-gray-100/50 dark:border-gray-700/50">
                      <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Date</span>
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2.5" /></svg>
                        <span className="text-xs font-black">{formatDate(event.startDate)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-gray-100/50 dark:border-gray-700/50">
                      <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Location</span>
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth="2.5" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2.5" /></svg>
                        <span className="text-xs font-black truncate">{event.city || "Online"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Call to Action */}
                  <div className="mt-8 flex items-center gap-3">
                    <div className="flex-1">
                      {event.availableSeats > 0 ? (
                        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                            style={{ width: `${Math.min(100, (event.availableSeats / event.totalSeats) * 100)}%` }}
                          />
                        </div>
                      ) : null}
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-2">
                        {event.availableSeats > 0 ? `${event.availableSeats} tickets left` : "Registration Closed"}
                      </p>
                    </div>
                    
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-indigo-500/50">
                      <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default UserDashboard;