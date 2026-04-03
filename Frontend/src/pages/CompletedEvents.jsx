import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axiosInstance from "../utils/axios";
import AverageRatingBadge from "../components/AverageRatingBadge.jsx";

export default function CompletedEvents() {
  const { user } = useSelector((s) => s.auth);
  const role = user?.role || "guest";
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        let url = "/api/v1/event";
        if (role === "organizer") url = `/api/v1/event/organizer/${user._id}`;
        if (role === "admin") url = "/api/v1/event/admin/all";
        const res = await axiosInstance.get(url);
        if (res.data?.success) {
          const list = res.data.events || res.data.data || res.data.items || res.data.results || [];
          setEvents(list.filter((e) => (e.effectiveStatus || e.status) === "completed"));
        } else {
          setEvents([]);
        }
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [role, user?._id]);

  const filtered = events.filter((e) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (e.title || "").toLowerCase().includes(q) ||
      (e.city || "").toLowerCase().includes(q) ||
      (e.venue || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">Completed Events</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">All events that have concluded.</p>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 mb-8 border dark:border-gray-800">
          <div className="relative">
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search completed events by title or location"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg pl-10 pr-3 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 shadow-sm">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No completed events found</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Concluded events will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e) => (
              <div 
                key={e._id} 
                className="group bg-white dark:bg-gray-900 rounded-3xl shadow-lg hover:shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-all duration-500 transform hover:-translate-y-2"
              >
                <div className="relative w-full h-48 overflow-hidden">
                  {e.bannerImage ? (
                    <img src={e.bannerImage} alt={e.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
                      <svg className="w-12 h-12 text-indigo-200 dark:text-indigo-900/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-500"></div>
                  <div className="absolute top-4 right-4">
                    <AverageRatingBadge eventId={e._id} />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 break-words">{e.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2 h-10 break-words">{e.description || "No description provided for this event."}</p>
                  
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600"></div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Event Concluded</span>
                  </div>

                  <div className="mt-6 pt-6 border-t dark:border-gray-800 flex items-center gap-3">
                    <button
                      className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                      onClick={() => navigate(`/event/${e._id}`)}
                    >
                      Details
                    </button>
                    <button
                      className="flex-1 px-4 py-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-bold hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm flex items-center justify-center gap-2"
                      onClick={() => navigate(`/memory-box/${e._id}`)}
                    >
                      Memories
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}