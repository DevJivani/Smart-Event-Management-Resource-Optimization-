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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Completed Events</h1>
          <p className="text-gray-600 mt-1">All events that have concluded.</p>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search completed events by title or location"
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-600">No completed events found.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e) => (
              <div key={e._id} className="bg-white rounded-xl shadow hover:shadow-lg overflow-hidden">
                <div className="h-40 bg-gray-100">
                  {e.bannerImage ? (
                    <img src={e.bannerImage} alt={e.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100" />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{e.title}</h3>
                    <AverageRatingBadge eventId={e._id} />
                  </div>
                  <div className="mt-2 text-sm text-gray-600 line-clamp-2">{e.description || "No description"}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-700">Completed</span>
                  </div>
                  <div className="mt-4">
                    <button
                      className="px-4 py-2 rounded-md border border-gray-300 text-sm"
                      onClick={() => navigate(`/event/${e._id}`)}
                    >
                      View Details
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
