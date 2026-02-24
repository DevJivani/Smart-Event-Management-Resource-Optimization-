import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";

const fmt = (n) => Number(n || 0).toFixed(2);
const fmtDt = (d) => {
  if (!d) return "-";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "-";
  return `${x.toLocaleDateString()} ${x.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const OrganizerBookings = () => {
  const { user } = useSelector((s) => s.auth);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    const run = async () => {
      if (!user?._id) return;
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/api/v1/booking/organizer/${user._id}`);
        if (res.data?.success) {
          const data = res.data.bookings || [];
          const normalized = data.map((b) => {
            const evt = b.eventId || {};
            const usr = b.userId || {};
            const qty = b.quantity ?? 1;
            const unit = b.ticketId?.price ?? evt.price ?? 0;
            const total = b.totalAmount ?? unit * qty;
            return {
              id: b._id,
              eventTitle: evt.title || "-",
              venue: evt.venue || "",
              city: evt.city || "",
              userName: usr.name || "-",
              userEmail: usr.email || "",
              quantity: qty,
              unitPrice: unit,
              total,
              paymentStatus: (b.paymentStatus || "pending").toLowerCase(),
              createdAt: b.createdAt,
            };
          });
          setRows(normalized);
        } else {
          toast.error(res.data?.message || "Failed to fetch bookings");
        }
      } catch (e) {
        toast.error(e.response?.data?.message || "Error fetching bookings");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user?._id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => {
        const qOk = q
          ? (r.eventTitle || "").toLowerCase().includes(q) ||
            (r.userEmail || "").toLowerCase().includes(q) ||
            (r.userName || "").toLowerCase().includes(q)
          : true;
        const sOk = status === "all" ? true : (r.paymentStatus || "") === status;
        return qOk && sOk;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [rows, query, status]);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "organizer") return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Booked Tickets</h1>
          <p className="text-gray-600 mt-2">Bookings for your events</p>
        </div>
      </div>
      <main className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="grid sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2 relative">
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <input
                type="text"
                placeholder="Search by event or attendee"
                className="w-full border border-gray-300 rounded-lg pl-10 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">All payments</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="flex items-center">
              <button
                className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={() => window.location.reload()}
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <span className="font-medium text-gray-700">{filtered.length}</span> records
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">No bookings found</h3>
            <p className="mt-1 text-sm text-gray-500">Your event bookings will show here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booked At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">{r.eventTitle}</div>
                      <div className="text-xs text-gray-500">
                        {r.venue}{r.city ? `, ${r.city}` : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{r.userName}</div>
                      <div className="text-xs text-gray-500">{r.userEmail}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{r.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">₹{fmt(r.unitPrice)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{fmt(r.total)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{fmtDt(r.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        r.paymentStatus === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {r.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {r.id && (
                        <button
                          className="text-xs px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                          onClick={() => {
                            const url = `${axiosInstance.defaults.baseURL}/api/v1/booking/${r.id}/invoice`;
                            window.open(url, "_blank");
                          }}
                        >
                          Invoice
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default OrganizerBookings;