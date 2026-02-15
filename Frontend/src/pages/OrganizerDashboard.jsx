import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
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

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Event Management Dashboard
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Welcome, {user?.name}! Manage your events here.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                        >
                            + Create Event
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : events.length === 0 ? (
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
                            No events yet
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Create your first event to get started!
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
                        {/* Event Cards */}
                        {events.map((event) => (
                            <div
                                key={event._id}
                                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
                            >
                                <div className="sm:flex">
                                    {/* Event Banner */}
                                    <div className="sm:flex-shrink-0 w-full sm:w-48 h-48">
                                        {event.bannerImage ? (
                                            <img
                                                src={event.bannerImage}
                                                alt={event.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                <svg
                                                    className="h-12 w-12 text-gray-400"
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

                                    {/* Event Details */}
                                    <div className="flex-1 p-6">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-gray-900">
                                                    {event.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {event.description?.substring(0, 100)}
                                                    {event.description?.length > 100 ? "..." : ""}
                                                </p>

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
                                                                event.status
                                                            )}`}
                                                        >
                                                            {event.status}
                                                        </span>
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

                                            {/* Action Buttons */}
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
            </div>

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
