import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";
import AverageRatingBadge from "../components/AverageRatingBadge.jsx";
import ReviewWidget from "../components/ReviewWidget.jsx";

export default function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const [copied, setCopied] = useState(false);

  const categoryGradient = (name) => {
    const key = (name || "").toLowerCase();
    if (key.includes("music")) return ["#7c3aed", "#2563eb"];
    if (key.includes("sports")) return ["#16a34a", "#065f46"];
    if (key.includes("technology")) return ["#0ea5e9", "#4338ca"];
    if (key.includes("art")) return ["#ef4444", "#f59e0b"];
    if (key.includes("food")) return ["#f97316", "#16a34a"];
    if (key.includes("education")) return ["#2563eb", "#0ea5e9"];
    if (key.includes("business")) return ["#111827", "#6b7280"];
    if (key.includes("entertainment")) return ["#ec4899", "#a855f7"];
    if (key.includes("health")) return ["#10b981", "#059669"];
    if (key.includes("travel")) return ["#8b5cf6", "#14b8a6"];
    return ["#4f46e5", "#7c3aed"];
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/api/v1/event/${eventId}`);
        if (res.data?.success) {
          setEvent(res.data.event);
        } else {
          toast.error(res.data?.message || "Failed to load event");
        }
      } catch (e) {
        toast.error(e.response?.data?.message || "Error loading event");
      } finally {
        setLoading(false);
      }
    };
    if (eventId) fetchEvent();
  }, [eventId]);

  const formatPrice = (n) => Number(n || 0).toFixed(2);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const copyShare = async () => {
    try {
      await navigator.clipboard?.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const toICSDate = (date) => {
    const pad = (n) => String(n).padStart(2, "0");
    return (
      date.getUTCFullYear().toString() +
      pad(date.getUTCMonth() + 1) +
      pad(date.getUTCDate()) +
      "T" +
      pad(date.getUTCHours()) +
      pad(date.getUTCMinutes()) +
      pad(date.getUTCSeconds()) +
      "Z"
    );
  };

  const parseDateTime = (dateStr, timeStr, fallbackHour = 9) => {
    try {
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return null;
      let hours = fallbackHour;
      let minutes = 0;
      if (typeof timeStr === "string" && timeStr.includes(":")) {
        const [h, m] = timeStr.split(":").map((x) => parseInt(x, 10));
        if (!Number.isNaN(h)) hours = h;
        if (!Number.isNaN(m)) minutes = m;
      }
      const local = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        hours,
        minutes,
        0,
        0
      );
      return local;
    } catch {
      return null;
    }
  };

  const buildGoogleCalendarUrl = () => {
    if (!event) return null;
    const startLocal = parseDateTime(event.startDate, event.startTime, 9) || new Date();
    let endLocal =
      parseDateTime(event.endDate, event.endTime, (startLocal.getHours() + 2) % 24) ||
      new Date(startLocal.getTime() + 2 * 60 * 60 * 1000);
    if (endLocal <= startLocal) {
      endLocal = new Date(startLocal.getTime() + 60 * 60 * 1000);
    }
    const dates = `${toICSDate(startLocal)}/${toICSDate(endLocal)}`;
    const text = encodeURIComponent(event.title || "Event");
    const details = encodeURIComponent(event.description || "");
    const location = encodeURIComponent(
      [`${event.venue || ""}`, `${event.city || ""}`].filter(Boolean).join(", ").trim()
    );
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}${
      location ? `&location=${location}` : ""
    }${shareUrl ? `&sprop=${encodeURIComponent(shareUrl)}` : ""}`;
    return url;
  };

  const handleAddToGoogleCalendar = () => {
    const url = buildGoogleCalendarUrl();
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  // duplicates removed below

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        {event?.bannerImage ? (
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url(${event.bannerImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(24px) saturate(1.1)",
              transform: "scale(1.08)",
              transformOrigin: "center",
            }}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${categoryGradient(event?.categoryId?.name)[0]} 0%, ${categoryGradient(event?.categoryId?.name)[1]} 100%)`,
              filter: "saturate(1.1)",
            }}
          />
        )}
        <div className="absolute inset-0 bg-white/70" />
      </div>
      <Navbar />
      <div className="relative">
        <div className="h-64 md:h-80 w-full relative">
          {event?.bannerImage ? (
            <img src={event.bannerImage} alt={event?.title || "Event"} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
          <div className="absolute top-4 right-4 z-10">
            <button
              aria-label="Add to Google Calendar"
              className="p-2 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 transition"
              onClick={handleAddToGoogleCalendar}
              title="Add to Google Calendar"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 2a1 1 0 011 1v1h8V3a1 1 0 112 0v1h1a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 112 0v1zM5 8v10h14V8H5zm4 3h6v2H9v-2z"/>
              </svg>
            </button>
          </div>
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow">
                {event?.title || "Event"}
              </h1>
              <div className="mt-2 flex items-center gap-2">
                <AverageRatingBadge eventId={eventId} className="bg-white/20 border-white/30" />
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-500/80 text-white capitalize">
                  {event?.effectiveStatus || event?.status || "upcoming"}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-2 rounded-md bg-white/90 text-gray-800 text-sm hover:bg-white shadow"
                onClick={copyShare}
              >
                {copied ? "Link Copied" : "Share"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <main className="max-w-6xl mx-auto px-6 -mt-8 relative">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : !event ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-900">Event not found</h2>
            <button className="mt-6 px-4 py-2 bg-gray-800 text-white rounded-md" onClick={() => navigate(-1)}>
              Go Back
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow p-6 space-y-6">
                <div className="border rounded-xl p-5">
                  <h2 className="text-lg font-semibold text-gray-900">Schedule</h2>
                  <div className="mt-3 grid sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10h5v5H7z" /><path d="M3 4a1 1 0 011-1h1V1h2v2h6V1h2v2h1a1 1 0 011 1v3H3V4zm0 5h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z"/></svg>
                      </div>
                      <div>
                        <p className="font-semibold">Starts</p>
                        <p className="text-sm text-gray-700">
                          {new Date(event.startDate).toLocaleDateString()} {event.startTime || ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10h5v5H7z" /><path d="M3 4a1 1 0 011-1h1V1h2v2h6V1h2v2h1a1 1 0 011 1v3H3V4zm0 5h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z"/></svg>
                      </div>
                      <div>
                        <p className="font-semibold">Ends</p>
                        <p className="text-sm text-gray-700">
                          {new Date(event.endDate).toLocaleDateString()} {event.endTime || ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10h5v5H7z" /><path d="M3 4a1 1 0 011-1h1V1h2v2h6V1h2v2h1a1 1 0 011 1v3H3V4zm0 5h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z"/></svg>
                    </div>
                    <div>
                      <p className="font-semibold">Date</p>
                      <p>{new Date(event.startDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8a4 4 0 100 8 4 4 0 000-8z"/><path d="M12 1a1 1 0 011 1v2h-2V2a1 1 0 011-1zM4.22 5.22a1 1 0 011.42 0L7.05 6.63l-1.41 1.41-1.41-1.41a1 1 0 010-1.41zM1 13a1 1 0 011-1h2v2H2a1 1 0 01-1-1zm3.22 5.78a1 1 0 010-1.41l1.41-1.41 1.41 1.41-1.41 1.41a1 1 0 01-1.41 0zM12 19a1 1 0 011 1v2h-2v-2a1 1 0 011-1zm8.78-1.22a1 1 0 01-1.41 0l-1.41-1.41 1.41-1.41 1.41 1.41a1 1 0 010 1.41zM21 13a1 1 0 01-1 1h-2v-2h2a1 1 0 011 1zm-3.22-7.78a1 1 0 010 1.41l-1.41 1.41-1.41-1.41 1.41-1.41a1 1 0 011.41 0z"/></svg>
                    </div>
                    <div>
                      <p className="font-semibold">Time</p>
                      <p>{event.startTime || "TBA"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l7 7-7 13L5 9l7-7z" /></svg>
                    </div>
                    <div>
                      <p className="font-semibold">Venue</p>
                      <p>{event.venue}{event.city ? `, ${event.city}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v2H4zM4 9h16v2H4zM4 14h16v2H4zM4 19h16v2H4z"/></svg>
                    </div>
                    <div>
                      <p className="font-semibold">Seats</p>
                      <p>{event.availableSeats} / {event.totalSeats}</p>
                    </div>
                  </div>
                </div>
                {event.description && (
                  <div className="border rounded-xl p-5">
                    <h2 className="text-lg font-semibold text-gray-900">About</h2>
                    <p className="mt-2 text-gray-700">{event.description}</p>
                  </div>
                )}
                <div className="border rounded-xl p-5">
                  <h2 className="text-lg font-semibold text-gray-900">Organizer</h2>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold">
                      {(event?.createdBy?.name || "O").toString().charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{event?.createdBy?.name || "Organizer"}</p>
                      <p className="text-xs text-gray-500">{event?.createdBy?.email || ""}</p>
                    </div>
                  </div>
                </div>
                {(event.venue || event.city) && (
                  <div className="border rounded-xl p-5">
                    <h2 className="text-lg font-semibold text-gray-900">Location</h2>
                    <p className="text-sm text-gray-700">
                      {event.venue}{event.city ? `, ${event.city}` : ""}
                    </p>
                    <div className="mt-3 rounded-xl overflow-hidden border">
                      <iframe
                        title="map"
                        src={`https://www.google.com/maps?q=${encodeURIComponent(`${event.venue || ""} ${event.city || ""}`)}&output=embed`}
                        width="100%"
                        height="260"
                        style={{ border: 0 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </div>
                )}
                <div className="border rounded-xl p-5">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Reviews</h2>
                  <ReviewWidget eventId={event._id} canWrite={!!user && user.role === "user"} />
                </div>
              </div>
            </section>
            <aside className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="bg-white rounded-2xl shadow p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                      {event.effectiveStatus || event.status}
                    </span>
                    <AverageRatingBadge eventId={event._id} />
                  </div>
                  <div className="border rounded-xl p-4">
                    {event.isPaid ? (
                      <p className="text-2xl font-bold text-gray-900">₹{formatPrice(event.price)}</p>
                    ) : (
                      <p className="text-2xl font-bold text-gray-900">Free</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Per ticket</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17l-3.88-3.88L3 13.41 9 19.41 21 7.41 19.59 6l-10.6 10.17z"/></svg>
                    {event.availableSeats > 0 ? "Seats available" : "Sold out"}
                  </div>
                  <button
                    className="w-full px-5 py-2.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                    onClick={() => navigate(`/book/${event._id}`)}
                    disabled={event.availableSeats <= 0}
                  >
                    Book Now
                  </button>
                  {/* calendar actions are shown in hero now */}
                  <button
                    className="w-full px-5 py-2.5 rounded-md border border-gray-300 text-sm"
                    onClick={copyShare}
                  >
                    {copied ? "Link Copied" : "Share"}
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}