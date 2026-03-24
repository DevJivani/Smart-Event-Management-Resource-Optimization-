import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ReviewWidget from "../components/ReviewWidget.jsx";
import AverageRatingBadge from "../components/AverageRatingBadge.jsx";

const OrganizerDashboard = () => {
    const { user, role } = useSelector((state) => state.auth);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    // modal states removed in favor of dedicated pages
    const [filters, setFilters] = useState({
        status: "all",
        searchQuery: "",
        priceMin: "",
        priceMax: ""
    });
    // const [notifications, setNotifications] = useState([]);
    const location = useLocation();
    const navigate = useNavigate();
    useEffect(() => {
        // no-op
    }, [location.search]);

    useEffect(() => {
        const fetchEvents = async () => {
            if (!user?._id) return;
            try {
                setLoading(true);
                const response = await axiosInstance.get(
                    `/api/v1/event/organizer/${user._id}`
                );
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
        fetchEvents();
    }, [user?._id]);

    // notifications are not used in the new layout

    // Handle edit event
    const handleEditEvent = (event) => {
        navigate(`/organizer/events/${event._id}/edit`);
    };

    // Handle delete event
    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm("Are you sure you want to delete this event?")) {
            return;
        }

        try {
            const response = await axiosInstance.delete(
                `/api/v1/event/${eventId}/organizer/${user?._id}`
            );

            if (response.data.success) {
                toast.success("Event deleted successfully");
                // Re-fetch events after delete
                if (user?._id) {
                    setLoading(true);
                    axiosInstance
                        .get(`/api/v1/event/organizer/${user._id}`)
                        .then((res) => {
                            if (res.data.success) {
                                setEvents(res.data.events || []);
                            } else {
                                toast.error(res.data.message || "Failed to fetch events");
                            }
                        })
                        .catch((err) => {
                            toast.error(err.response?.data?.message || "Error fetching events");
                        })
                        .finally(() => setLoading(false));
                }
            } else {
                toast.error(response.data.message || "Failed to delete event");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Error deleting event");
        }
    };

    // Handle event creation or update
    // create/edit handled by dedicated pages now

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case "upcoming":
                return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400";
            case "ongoing":
                return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400";
            case "completed":
                return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400";
            case "cancelled":
                return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400";
            default:
                return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400";
        }
    };

    // Redirect if not an organizer
    if (role !== "organizer") {
        return <Navigate to="/login" replace />;
    }

    const filteredEvents = events.filter((e) => {
        // Exclude completed events from this dashboard view
        if ((e.effectiveStatus || e.status) === "completed") {
            return false;
        }

        const q = filters.searchQuery.trim().toLowerCase();
        const matchesQuery = q
            ? ((e.title || "").toLowerCase().includes(q) ||
                (e.city || "").toLowerCase().includes(q) ||
                (e.venue || "").toLowerCase().includes(q))
            : true;

        const statusOk = filters.status === "all"
            ? true
            : (e.effectiveStatus || e.status) === filters.status;

        const price = Number(e.price || 0);
        const minOk = filters.priceMin !== "" ? price >= Number(filters.priceMin) : true;
        const maxOk = filters.priceMax !== "" ? price <= Number(filters.priceMax) : true;

        return matchesQuery && statusOk && minOk && maxOk;
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-300">
            <Navbar />
            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-900 dark:via-indigo-900 dark:to-blue-900">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>
                <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32">
                    <div className="text-center text-white">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                            Create Memorable
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200 dark:from-yellow-400 dark:to-pink-400">
                                Events Effortlessly
                            </span>
                        </h1>
                        <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
                            Plan, organize, and manage your events with our powerful platform.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => navigate("/organizer/events/create")}
                                className="px-8 py-4 bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-400 font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                Create New Event
                            </button>
                            <Link
                                to="/profile"
                                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                View My Profile
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
            <main className="flex-1">

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Filters Row */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 mb-8 flex flex-wrap items-center gap-6 border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                        {/* Status Filter */}
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Status:</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                                className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white capitalize transition-all"
                            >
                                {["all", "upcoming", "ongoing", "cancelled"].map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        {/* Price Filter Box */}
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent transition-all">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mr-2">Price :</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    value={filters.priceMin}
                                    onChange={(e) => setFilters((f) => ({ ...f, priceMin: e.target.value }))}
                                    placeholder="Min"
                                    className="w-20 text-sm bg-transparent outline-none border-b border-gray-300 dark:border-gray-600 focus:border-purple-500 transition-colors text-gray-900 dark:text-white"
                                />
                                <span className="text-gray-400 font-light mx-1">to</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={filters.priceMax}
                                    onChange={(e) => setFilters((f) => ({ ...f, priceMax: e.target.value }))}
                                    placeholder="Max"
                                    className="w-20 text-sm bg-transparent outline-none border-b border-gray-300 dark:border-gray-600 focus:border-purple-500 transition-colors text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Search Filter */}
                        <div className="flex-1 min-w-[250px] relative">
                            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                            </svg>
                            <input
                                type="text"
                                value={filters.searchQuery}
                                onChange={(e) => setFilters((f) => ({ ...f, searchQuery: e.target.value }))}
                                placeholder="Search by title, city or venue..."
                                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Events</h2>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm font-medium rounded-full">
                                {filteredEvents.length} results
                            </span>
                        </div>
                    </div>

                    <section>
                        {loading ? (
                                <div className="flex justify-center items-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400 transition-colors duration-300"></div>
                                </div>
                            ) : filteredEvents.length === 0 ? (
                                <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
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
                                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                                        No matching events
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Adjust filters or create a new event.
                                    </p>
                                <button
                                    onClick={() => navigate("/organizer/events/create")}
                                        className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                                    >
                                        Create Event
                                    </button>
                                </div>
                            ) : (
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                                    {filteredEvents.map((ev) => (
                                        <div 
                                            key={ev._id} 
                                            className="group bg-white dark:bg-gray-900 rounded-3xl shadow-lg hover:shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col transition-all duration-500 transform hover:-translate-y-2"
                                        >
                                            <div className="relative w-full h-48 overflow-hidden">
                                                {ev.bannerImage ? (
                                                    <img src={ev.bannerImage} alt={ev.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-indigo-200 to-purple-200 dark:from-indigo-900/30 dark:to-purple-900/30" />
                                                )}
                                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-500"></div>
                                                <div className="absolute top-4 right-4">
                                                    <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full capitalize ${getStatusBadgeColor(ev.effectiveStatus || ev.status)}`}>
                                                        {ev.effectiveStatus || ev.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-6 flex-1 flex flex-col">
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between gap-2 mb-3">
                                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                            {ev.title}
                                                        </h3>
                                                        <AverageRatingBadge eventId={ev._id} />
                                                    </div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 break-words">
                                                        {ev.description || "No description provided for this event."}
                                                    </p>
                                                </div>
                                                <div className="mt-6 grid grid-cols-2 gap-4 text-center text-sm border-t border-gray-100 dark:border-gray-800 pt-6">
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</p>
                                                        <p className="font-bold text-lg text-gray-900 dark:text-white mt-1">{ev.isPaid ? `₹${Number(ev.price ?? 0).toFixed(2)}` : "Free"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Attendees</p>
                                                        <p className="font-bold text-lg text-gray-900 dark:text-white mt-1">{ev.totalSeats - ev.availableSeats} / {ev.totalSeats}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-6 flex items-center gap-3">
                                                    <button
                                                        onClick={() => handleEditEvent(ev)}
                                                        className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs flex items-center justify-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteEvent(ev._id)}
                                                        className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-xs"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                    <Link
                                                        to={`/organizer/events/${ev._id}`}
                                                        className="flex-1 px-4 py-3 text-center rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                                                    >
                                                        View Details
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Features Section */}
                    <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300 mt-12 border-t dark:border-gray-900">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-4">
                                Everything You Need to Manage Events
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                Our comprehensive suite of tools helps you create, promote, and manage events of any size.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="p-8 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-2xl hover:shadow-lg dark:hover:shadow-purple-500/10 transition-all duration-300 border border-purple-100/50 dark:border-purple-800/20">
                                <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Easy Event Creation</h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Create beautiful event pages in minutes with our intuitive builder.
                                </p>
                            </div>
                            <div className="p-8 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-2xl hover:shadow-lg dark:hover:shadow-emerald-500/10 transition-all duration-300 border border-emerald-100/50 dark:border-emerald-800/20">
                                <div className="w-14 h-14 bg-emerald-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Attendee Management</h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Track registrations and manage your guest list effortlessly.
                                </p>
                            </div>
                            <div className="p-8 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 rounded-2xl hover:shadow-lg dark:hover:shadow-orange-500/10 transition-all duration-300 border border-orange-100/50 dark:border-orange-800/20">
                                <div className="w-14 h-14 bg-orange-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Real-time Analytics</h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Get insights on ticket sales and event performance.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />

            {/* Modals removed */}
        </div>
    );
};

export default OrganizerDashboard;
