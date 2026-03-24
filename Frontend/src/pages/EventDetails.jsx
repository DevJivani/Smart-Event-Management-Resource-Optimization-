import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
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
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    message: ""
  });
  const [sending, setSending] = useState(false);

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

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.message.trim()) return toast.error("Please enter a message");
    try {
      setSending(true);
      const res = await axiosInstance.post(`/api/v1/event/contact-organizer`, {
        eventId,
        ...contactForm
      });
      if (res.data?.success) {
        toast.success("Message sent to organizer!");
        setIsContactOpen(false);
        setContactForm({ ...contactForm, message: "" });
      } else {
        toast.error(res.data?.message || "Failed to send message");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error sending message");
    } finally {
      setSending(false);
    }
  };

  // duplicates removed below

  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-300">
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
        <div className="absolute inset-0 bg-white/70 dark:bg-gray-950/80 transition-colors duration-300" />
      </div>
      <Navbar />
      <div className="relative">
        <div className="h-64 md:h-80 w-full relative">
          {event?.bannerImage ? (
            <img src={event.bannerImage} alt={event?.title || "Event"} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute top-4 right-4 z-10">
            <button
              aria-label="Add to Google Calendar"
              className="p-2.5 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all hover:scale-110"
              onClick={handleAddToGoogleCalendar}
              title="Add to Google Calendar"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 2a1 1 0 011 1v1h8V3a1 1 0 112 0v1h1a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 112 0v1zM5 8v10h14V8H5zm4 3h6v2H9v-2z"/>
              </svg>
            </button>
          </div>
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg mb-3">
                {event?.title || "Event"}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <AverageRatingBadge eventId={eventId} className="bg-white/20 border-white/30 backdrop-blur-sm" />
                <span className="px-3 py-1 text-xs font-bold rounded-lg bg-blue-500/80 text-white capitalize backdrop-blur-sm border border-white/20">
                  {event?.effectiveStatus || event?.status || "upcoming"}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 rounded-xl bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-white text-sm font-semibold hover:bg-white dark:hover:bg-gray-700 shadow-lg backdrop-blur-sm transition-all"
                onClick={copyShare}
              >
                {copied ? "Link Copied" : "Share"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <main className="max-w-6xl mx-auto px-6 -mt-8 relative mb-20">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          </div>
        ) : !event ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 transition-colors">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Event not found</h2>
            <button className="mt-6 px-6 py-2.5 bg-gray-800 dark:bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-900 transition-all" onClick={() => navigate(-1)}>
              Go Back
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <section className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 space-y-8 border border-gray-100 dark:border-gray-800 transition-colors">
                <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-6 bg-gray-50/50 dark:bg-gray-800/50">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Schedule</h2>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10h5v5H7z" /><path d="M3 4a1 1 0 011-1h1V1h2v2h6V1h2v2h1a1 1 0 011 1v3H3V4zm0 5h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z"/></svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Starts</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                          {new Date(event.startDate).toLocaleDateString()} {event.startTime || ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10h5v5H7z" /><path d="M3 4a1 1 0 011-1h1V1h2v2h6V1h2v2h1a1 1 0 011 1v3H3V4zm0 5h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z"/></svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Ends</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                          {new Date(event.endDate).toLocaleDateString()} {event.endTime || ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {event.description && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About the Event</h2>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm break-words">
                      {event.description}
                    </p>
                  </div>
                )}

                <div className="border-t border-gray-100 dark:border-gray-800 pt-8">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Organizer</h2>
                  <Link to={`/profile/${event?.createdBy?._id || event?.createdBy}`} className="flex items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                      {(event?.createdBy?.name || "O").toString().charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{event?.createdBy?.name || "Organizer"}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{event?.createdBy?.email || ""}</p>
                    </div>
                  </Link>
                </div>

                {(event.venue || event.city) && (
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Location</h2>
                    <div className="flex items-center gap-3 mb-4 text-gray-600 dark:text-gray-400">
                      <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm font-medium">
                        {event.venue}{event.city ? `, ${event.city}` : ""}
                      </p>
                    </div>
                    <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-inner">
                      <iframe
                        title="map"
                        src={`https://www.google.com/maps?q=${encodeURIComponent(`${event.venue || ""} ${event.city || ""}`)}&output=embed`}
                        width="100%"
                        height="300"
                        style={{ border: 0, filter: 'contrast(1.1) brightness(0.9)' }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-100 dark:border-gray-800 pt-8">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Reviews & Ratings</h2>
                  <ReviewWidget eventId={event._id} canWrite={!!user && user.role === "user"} />
                </div>
              </div>
            </section>

            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-800 transition-colors">
                  <div className="flex items-center justify-between mb-6">
                    <span className="px-3 py-1 text-xs font-bold rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800 capitalize">
                      {event.effectiveStatus || event.status}
                    </span>
                    <AverageRatingBadge eventId={event._id} />
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 mb-6">
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Ticket Price</p>
                    <div className="flex items-baseline gap-1">
                      {event.isPaid ? (
                        <span className="text-3xl font-extrabold text-gray-900 dark:text-white">₹{formatPrice(event.price)}</span>
                      ) : (
                        <span className="text-3xl font-extrabold text-gray-900 dark:text-white">Free</span>
                      )}
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">/ person</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${event.availableSeats > 0 ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></div>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Availability</span>
                      </div>
                      <span className={`text-sm font-bold ${event.availableSeats > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {event.availableSeats > 0 ? `${event.availableSeats} seats left` : "Sold out"}
                      </span>
                    </div>

                    <button
                      className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:grayscale disabled:hover:translate-y-0"
                      onClick={() => navigate(`/book/${event._id}`)}
                      disabled={event.availableSeats <= 0 || ["completed", "cancelled"].includes(event.effectiveStatus || event.status)}
                    >
                      {event.availableSeats > 0 ? "Book Now" : "Sold Out"}
                    </button>

                    <button
                      className="w-full py-3.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-sm flex items-center justify-center gap-2"
                      onClick={copyShare}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      {copied ? "Link Copied" : "Share Event"}
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl">
                  <h3 className="font-bold mb-2">Need Help?</h3>
                  <p className="text-indigo-100 text-xs mb-4 leading-relaxed">If you have any questions about this event, feel free to contact the organizer.</p>
                  <button 
                    onClick={() => setIsContactOpen(true)}
                    className="w-full py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-sm font-bold transition-all border border-white/20"
                  >
                    Contact Organizer
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* Contact Organizer Modal */}
      {isContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6 text-white relative">
              <button 
                onClick={() => setIsContactOpen(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h3 className="text-xl font-bold">Contact Organizer</h3>
              <p className="text-indigo-100 text-xs mt-1">Send a message to {event?.createdBy?.name}</p>
            </div>
            
            <form onSubmit={handleContactSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Your Email</label>
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type your message here..."
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : "Send Message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}