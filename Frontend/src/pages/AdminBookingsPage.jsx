import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";

const fmtCurrency = (n) => Number(n || 0).toFixed(2);
const fmtDateTime = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const AdminBookingsPage = () => {
  const { user, role } = useSelector((s) => s.auth);
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const endpoints = [
          "/api/v1/booking/admin/all",
          "/api/v1/admin/bookings",
          "/api/v1/admin/booking/all",
          "/api/v1/booking/all",
        ];
        let data = null;
        for (const ep of endpoints) {
          try {
            const res = await axiosInstance.get(ep);
            if (res.data?.success) {
              data =
                res.data.bookings ||
                res.data.data ||
                res.data.items ||
                res.data.results ||
                res.data.result ||
                [];
              setSource(ep);
              break;
            }
          } catch {
            void 0;
          }
        }
        if (!data) throw new Error("No booking endpoint responded");
        setRaw(data);
      } catch (e) {
        toast.error(e.response?.data?.message || "Failed to fetch bookings");
        setRaw([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const rows = useMemo(() => {
    return (raw || []).map((b) => {
      const evt = b.eventId || b.event || b.eventRef || {};
      const usr = b.userId || b.user || b.attendee || b.customer || {};
      const qty = b.quantity ?? b.qty ?? 1;
      const unit = b.ticketId?.price ?? evt.price ?? b.unitPrice ?? 0;
      const total = b.totalAmount ?? unit * qty;
      const pay = (b.paymentStatus || b.status || "pending").toLowerCase();
      const created = b.createdAt || b.created_on || b.date || b.time || b.updatedAt;
      return {
        id: b._id || b.id,
        eventTitle: evt.title || "-",
        venue: evt.venue || "",
        city: evt.city || "",
        userName: usr.name || usr.fullName || "-",
        userEmail: usr.email || usr.contact || "",
        quantity: qty,
        unitPrice: unit,
        total,
        paymentStatus: pay,
        createdAt: created,
      };
    }).sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return tb - ta;
    });
  }, [raw]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const qOk = q
        ? (r.eventTitle || "").toLowerCase().includes(q) ||
          (r.userEmail || "").toLowerCase().includes(q) ||
          (r.userName || "").toLowerCase().includes(q)
        : true;
      const sOk = status === "all" ? true : (r.paymentStatus || "").toLowerCase() === status;
      return qOk && sOk;
    });
  }, [rows, query, status]);

  if (!user) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Booked Tickets</h1>
          <p className="text-gray-600 mt-2">All bookings across the platform.</p>
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
                placeholder="Search by event title or user email"
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
                <option value="failed">Failed</option>
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
            {source ? <span> • Source: {source}</span> : null}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">No bookings found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting the search or filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
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
                    <td className="px-6 py-4 text-sm text-gray-900">₹{fmtCurrency(r.unitPrice)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{fmtCurrency(r.total)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{fmtDateTime(r.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        (r.paymentStatus || "").toLowerCase() === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : (r.paymentStatus || "").toLowerCase() === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {r.paymentStatus || "pending"}
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

export default AdminBookingsPage;