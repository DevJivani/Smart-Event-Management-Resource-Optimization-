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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      <div className="relative h-72 md:h-96 w-full overflow-hidden">
        {event?.bannerImage ? (
          <img src={event.bannerImage} alt={event?.title || "Event"} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-200 to-purple-200 dark:from-indigo-900/40 dark:to-purple-900/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Link to="/organizer" className="px-4 py-2 rounded-xl bg-white/90 dark:bg-gray-900/90 text-gray-800 dark:text-gray-100 text-sm font-bold hover:bg-white dark:hover:bg-gray-800 shadow-lg backdrop-blur-md transition-all">
            Back
          </Link>
          {role === "organizer" && (
            <button
              className="px-4 py-2 rounded-xl bg-white/90 dark:bg-gray-900/90 text-gray-800 dark:text-gray-100 text-sm font-bold hover:bg-white dark:hover:bg-gray-800 shadow-lg backdrop-blur-md transition-all"
              onClick={() => navigate(`/organizer/events/${eventId}/edit`)}
              title="Edit in dashboard"
            >
              Edit
            </button>
          )}
        </div>
        <div className="absolute bottom-8 left-8 right-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">
                {event?.title || "Event"}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-md">
                  {event?.categoryId?.name || "Event"}
                </span>
                <span className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                  {event?.effectiveStatus || event?.status || "upcoming"}
                </span>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/20 shadow-lg">
                  <AverageRatingBadge eventId={eventId} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-6 py-10">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          </div>
        ) : !event ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border dark:border-gray-800 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Event not found</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">The event you are looking for does not exist or has been removed.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-10">
            {Array.isArray(event?.images) && event.images.length > 0 && (
              <div className="lg:col-span-3">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {event.images.slice(0, 10).map((src, idx) => (
                    <div key={idx} className="aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                      <img src={src} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <aside className="lg:col-span-1">
              <div className="sticky top-28 space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border dark:border-gray-800 shadow-sm">
                  <div className="h-44 bg-gray-100 dark:bg-gray-800 relative">
                    {event.bannerImage ? (
                      <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-200 to-purple-200 dark:from-indigo-900/30 dark:to-purple-900/30" />
                    )}
                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 dark:border-gray-800/50 shadow-lg">
                      <strong className="text-lg text-gray-900 dark:text-white">{event.isPaid ? `₹${fmt(event.price)}` : "Free"}</strong>
                    </div>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Event Date</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{new Date(event.startDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Start Time</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{event.startTime || "TBA"}</p>
                      </div>
                    </div>
                    <div className="pt-6 border-t dark:border-gray-800">
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Attendee Overview</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Available Seats</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{event.availableSeats} / {event.totalSeats}</span>
                      </div>
                      <div className="mt-3 w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500" 
                          style={{ width: `${(event.availableSeats / event.totalSeats) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl space-y-3">
                  <h4 className="font-bold mb-2">Organizer Dashboard</h4>
                  <p className="text-indigo-100 text-xs leading-relaxed mb-4">You are viewing this as an organizer. Use the dashboard to manage bookings and updates.</p>
                  <button 
                    onClick={() => navigate(`/organizer/events/${eventId}/edit`)}
                    className="w-full py-2.5 bg-white text-indigo-600 rounded-xl text-xs font-bold transition-all shadow-lg hover:shadow-indigo-500/40 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                    Edit Event
                  </button>
                  <button 
                    onClick={() => navigate(`/memory-box/${eventId}`)}
                    className="w-full py-2.5 bg-indigo-500/30 backdrop-blur-md text-white border border-white/20 rounded-xl text-xs font-bold transition-all hover:bg-indigo-500/50 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Memory Box & Gallery
                  </button>
                </div>
              </div>
            </aside>
            <section className="lg:col-span-2 space-y-8">
              <div className="bg-white dark:bg-gray-900 rounded-3xl border dark:border-gray-800 p-8 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" /></svg>
                  Event Overview
                </h2>
                <div className="mt-8 grid sm:grid-cols-2 gap-8">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" /></svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Event Status</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">{event.effectiveStatus || event.status}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-2xl text-purple-600 dark:text-purple-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth="2" /></svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Location</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{event.venue}{event.city ? `, ${event.city}` : ""}</p>
                    </div>
                  </div>
                </div>
              </div>

              {event.description && (
                <div className="bg-white dark:bg-gray-900 rounded-3xl border dark:border-gray-800 p-8 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h7" strokeWidth="2" /></svg>
                    Description
                  </h2>
                  <div className="mt-6 prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line break-words">
                    {event.description}
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-gray-900 rounded-3xl border dark:border-gray-800 p-8 shadow-sm overflow-hidden">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth="2" /></svg>
                  Location & Map
                </h2>
                <div className="rounded-2xl overflow-hidden border dark:border-gray-800 shadow-inner">
                  <iframe
                    title="map"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(`${event.venue || ""} ${event.city || ""}`)}&output=embed`}
                    width="100%"
                    height="320"
                    style={{ border: 0 }}
                    className="dark:invert dark:grayscale dark:opacity-80 transition-all duration-500"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth="2" /></svg>
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {event.venue}{event.city ? `, ${event.city}` : ""}
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
        
        {event && (
          <div className="mt-12 bg-white dark:bg-gray-900 rounded-3xl border dark:border-gray-800 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeWidth="2" /></svg>
              Attendee Reviews
            </h2>
            <div className="dark:text-gray-300">
              <ReviewWidget eventId={event._id} canReply />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}