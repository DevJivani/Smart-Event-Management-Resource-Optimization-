import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";

const UserDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "user") return <Navigate to="/" replace />;

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/v1/event");
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

  useEffect(() => {
    fetchEvents();
  }, []);

  const formatDate = (date) => new Date(date).toLocaleDateString();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold">User Dashboard</h1>
        <p className="mt-4 text-gray-600">
          Welcome, {user.name}. Browse available events and book your seat.
        </p>

        <div className="mt-8">
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
                No events available
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Check back later for upcoming events.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <div
                  key={event._id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
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
                    <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {event.description?.substring(0, 100)}
                      {event.description?.length > 100 ? "..." : ""}
                    </p>
                    <div className="mt-4 space-y-2">
                      <p className="text-sm">
                        <span className="font-semibold">Date:</span> {formatDate(event.startDate)}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Time:</span> {event.startTime || "TBA"}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Location:</span> {event.venue}
                        {event.city && `, ${event.city}`}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Seats:</span> {event.availableSeats} / {event.totalSeats}
                      </p>
                    </div>
                    <div className="mt-4">
                      <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full capitalize bg-blue-100 text-blue-800">
                        {event.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
