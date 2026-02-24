import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";
import CreateEventModal from "../components/CreateEventModal";
import EditEventModal from "../components/EditEventModal";
import Navbar from "../components/Navbar";

const OrganizerDashboard = () => {
    const { user, role } = useSelector((state) => state.auth);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [filters, setFilters] = useState({
        status: "all",
        searchQuery: "",
        priceMin: "",
        priceMax: ""
    });
    const location = useLocation();
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get("create") === "1") {
            setShowCreateModal(true);
        }
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

    // Handle edit event
    const handleEditEvent = (event) => {
        setSelectedEvent(event);
        setShowEditModal(true);
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
    const handleEventSaved = () => {
        // Re-fetch after save
        if (user?._id) {
            setLoading(true);
            axiosInstance
                .get(`/api/v1/event/organizer/${user._id}`)
                .then((response) => {
                    if (response.data.success) {
                        setEvents(response.data.events || []);
                    } else {
                        toast.error(response.data.message || "Failed to fetch events");
                    }
                })
                .catch((error) => {
                    toast.error(error.response?.data?.message || "Error fetching events");
                })
                .finally(() => setLoading(false));
        }
        setShowCreateModal(false);
        setShowEditModal(false);
        setSelectedEvent(null);
    };

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case "upcoming":
                return "bg-blue-100 text-blue-800";
            case "ongoing":
                return "bg-green-100 text-green-800";
            case "completed":
                return "bg-gray-100 text-gray-800";
            case "cancelled":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    // Redirect if not an organizer
    if (role !== "organizer") {
        return <Navigate to="/login" replace />;
    }

    const filteredEvents = events.filter((e) => {
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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>
                <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32">
                    <div className="text-center text-white">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                            Create Memorable
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200">
                                Events Effortlessly
                            </span>
                        </h1>
                        <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
                            Plan, organize, and manage your events with our powerful platform.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-8 py-4 bg-white text-purple-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                Create New Event
                            </button>
                            <a
                                href="/profile"
                                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                View My Profile
                            </a>
                        </div>
                    </div>
                </div>
            </section>
            <main className="flex-1">

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <aside className="md:col-span-1">
                        <div className="bg-white rounded-xl shadow p-6 space-y-4">
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
                        <div className="bg-white rounded-xl shadow p-6">
                            <div className="relative">
                                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                                </svg>
                                <input
                                    type="text"
                                    value={filters.searchQuery}
                                    onChange={(e) => setFilters((f) => ({ ...f, searchQuery: e.target.value }))}
                                    placeholder="Search by title or location"
                                    className="w-full border border-gray-300 rounded-lg pl-10 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-6 mb-4">
                            <h2 className="text-xl font-bold text-gray-900">My Events</h2>
                            <span className="text-sm text-gray-600">{filteredEvents.length} results</span>
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
                                    No matching events
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Adjust filters or create a new event.
                                </p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    Create Event
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {filteredEvents.map((event) => (
                                    <div
                                        key={event._id}
                                        className="bg-white rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-0.5 overflow-hidden"
                                    >
                                        <div className="sm:flex">
                                            <div className="sm:flex-shrink-0 w-full sm:w-40 h-36">
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
                                            <div className="flex-1 p-5">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-bold text-gray-900">
                                                            {event.title}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {event.description?.substring(0, 90)}
                                                            {event.description?.length > 90 ? "..." : ""}
                                                        </p>
                                                        <div className="mt-3 text-sm font-semibold text-gray-900">
                                                            {event.isPaid ? `Price: ₹${Number(event.price ?? 0).toFixed(2)}` : "Free"}
                                                        </div>
                                                        <div className="mt-4 flex flex-wrap gap-4">
                                                            <div>
                                                                <p className="text-xs text-gray-500 uppercase tracking-wide">
                                                                    Date
                                                                </p>
                                                                <p className="text-sm font-semibold text-gray-900">
                                                                    {new Date(
                                                                        event.startDate
                                                                    ).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500 uppercase tracking-wide">
                                                                    Time
                                                                </p>
                                                                <p className="text-sm font-semibold text-gray-900">
                                                                    {event.startTime || "TBA"}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500 uppercase tracking-wide">
                                                                    Location
                                                                </p>
                                                                <p className="text-sm font-semibold text-gray-900">
                                                                    {event.venue}
                                                                    {event.city && `, ${event.city}`}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500 uppercase tracking-wide">
                                                                    Seats
                                                                </p>
                                                                <p className="text-sm font-semibold text-gray-900">
                                                                    {event.availableSeats} / {event.totalSeats}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500 uppercase tracking-wide">
                                                                    Status
                                                                </p>
                                                                <span
                                                                    className={`inline-block px-3 py-1 text-xs font-semibold rounded-full capitalize ${getStatusBadgeColor(
                                                                        event.effectiveStatus || event.status
                                                                    )}`}
                                                                >
                                                                    {event.effectiveStatus || event.status}
                                                                </span>
                                                                {event.isApproved && !event.isDisabled && (
                                                                    <span className="inline-block ml-2 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                                                                        Approved
                                                                    </span>
                                                                )}
                                                                {event.isDisabled && (
                                                                    <span className="inline-block ml-2 px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                                                                        Disabled
                                                                    </span>
                                                                )}
                                                                {!event.isApproved && (
                                                                    <span className="inline-block ml-2 px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
                                                                        Not approved
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3 ml-4">
                                                        <button
                                                            onClick={() => handleEditEvent(event)}
                                                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-semibold hover:bg-blue-100 transition-colors"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDeleteEvent(event._id)
                                                            }
                                                            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
                
            </div>
            {/* Features Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
                            Everything You Need to Manage Events
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Our comprehensive suite of tools helps you create, promote, and manage events of any size.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-8 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl hover:shadow-lg transition-shadow">
                            <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Easy Event Creation</h3>
                            <p className="text-gray-600">
                                Create beautiful event pages in minutes with our intuitive builder.
                            </p>
                        </div>
                        <div className="p-8 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl hover:shadow-lg transition-shadow">
                            <div className="w-14 h-14 bg-emerald-600 rounded-xl flex items-center justify-center mb-6">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Attendee Management</h3>
                            <p className="text-gray-600">
                                Track registrations and manage your guest list effortlessly.
                            </p>
                        </div>
                        <div className="p-8 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl hover:shadow-lg transition-shadow">
                            <div className="w-14 h-14 bg-orange-600 rounded-xl flex items-center justify-center mb-6">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Real-time Analytics</h3>
                            <p className="text-gray-600">
                                Get insights on ticket sales and event performance.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            </main>
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center gap-2 mb-6 md:mb-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold">EventHub</span>
                        </div>
                        <div className="flex gap-6 text-gray-400">
                            <a href="#" className="hover:text-white transition-colors">About</a>
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <a href="#" className="hover:text-white transition-colors">Contact</a>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
                        © 2026 EventHub. All rights reserved.
                    </div>
                </div>
            </footer>

            {/* Modals */}
            {showCreateModal && (
                <CreateEventModal
                    onClose={() => setShowCreateModal(false)}
                    onSave={handleEventSaved}
                />
            )}

            {showEditModal && selectedEvent && (
                <EditEventModal
                    event={selectedEvent}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedEvent(null);
                    }}
                    onSave={handleEventSaved}
                />
            )}
        </div>
    );
};

export default OrganizerDashboard;