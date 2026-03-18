import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";
import AverageRatingBadge from "../components/AverageRatingBadge.jsx";
import ReviewWidget from "../components/ReviewWidget.jsx";

export default function OrganizerEventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { role } = useSelector((s) => s.auth);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/api/v1/event/${eventId}`);
        if (res.data?.success) setEvent(res.data.event);
        else toast.error(res.data?.message || "Failed to load event");
      } catch (e) {
        toast.error(e.response?.data?.message || "Error loading event");
      } finally {
        setLoading(false);
      }
    };
    if (eventId) load();
  }, [eventId]);

  const fmt = (n) => Number(n || 0).toFixed(2);

  if (!eventId) return null;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="relative h-72 md:h-96 w-full overflow-hidden">
        {event?.bannerImage ? (
          <img src={event.bannerImage} alt={event?.title || "Event"} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-200 to-purple-200" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Link to="/organizer" className="px-4 py-2 rounded-md bg-white/90 text-gray-800 text-sm hover:bg-white shadow">
            Back
          </Link>
          {role === "organizer" && (
            <button
              className="px-4 py-2 rounded-md bg-white/90 text-gray-800 text-sm hover:bg-white shadow"
              onClick={() => navigate(`/organizer/events/${eventId}/edit`)}
              title="Edit in dashboard"
            >
              Edit
            </button>
          )}
        </div>
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                {event?.title || "Event"}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 capitalize">
                  {event?.categoryId?.name || "Event"}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/90 text-white capitalize">
                  {event?.effectiveStatus || event?.status || "upcoming"}
                </span>
                <AverageRatingBadge eventId={eventId} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : !event ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-900">Event not found</h2>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {Array.isArray(event?.images) && event.images.length > 0 && (
              <div className="lg:col-span-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {event.images.slice(0, 8).map((src, idx) => (
                    <div key={idx} className="aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
                      <img src={src} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <aside className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="rounded-2xl overflow-hidden border">
                  <div className="h-40 bg-gray-100">
                    {event.bannerImage ? (
                      <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-200 to-purple-200" />
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Per ticket</span>
                      <strong className="text-xl text-gray-900">{event.isPaid ? `₹${fmt(event.price)}` : "Free"}</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="font-medium text-gray-900">{new Date(event.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Time</p>
                        <p className="font-medium text-gray-900">{event.startTime || "TBA"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
            <section className="lg:col-span-2">
              <div className="space-y-6">
                <div className="rounded-2xl border p-6">
                  <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
                  <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="font-medium capitalize">{event.effectiveStatus || event.status}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Seats</p>
                      <p className="font-medium">{event.availableSeats} / {event.totalSeats}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs text-gray-500">Venue</p>
                      <p className="font-medium">{event.venue}{event.city ? `, ${event.city}` : ""}</p>
                    </div>
                  </div>
                </div>
                {event.description && (
                  <div className="rounded-2xl border p-6">
                    <h2 className="text-lg font-semibold text-gray-900">Description</h2>
                    <p className="mt-2 text-gray-700">{event.description}</p>
                  </div>
                )}
                <div className="rounded-2xl border p-6">
                  <h2 className="text-lg font-semibold text-gray-900">Location</h2>
                  <p className="text-sm text-gray-700">
                    {event.venue}{event.city ? `, ${event.city}` : ""}
                  </p>
                  <div className="mt-3 rounded-xl overflow-hidden border">
                    <iframe
                      title="map"
                      src={`https://www.google.com/maps?q=${encodeURIComponent(`${event.venue || ""} ${event.city || ""}`)}&output=embed`}
                      width="100%"
                      height="240"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
        {event && (
          <div className="mt-8 bg-white rounded-2xl border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Reviews</h2>
            <ReviewWidget eventId={event._id} canReply />
          </div>
        )}
      </main>
    </div>
  );
}
