import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";
import StatusBadge from "../components/StatusBadge.jsx";

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
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showCols, setShowCols] = useState({
    event: true,
    user: true,
    quantity: true,
    unitPrice: true,
    total: true,
    createdAt: true,
    paymentStatus: true,
    actions: true,
  });

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

  useEffect(() => {
    setPage(1);
  }, [filtered, pageSize, sortBy, sortDir]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const sb = (sortBy || "").toLowerCase();
    const sd = (sortDir || "asc").toLowerCase();
    const factor = sd === "desc" ? -1 : 1;
    arr.sort((a, b) => {
      const va = a[sb];
      const vb = b[sb];
      if (sb === "quantity" || sb === "unitPrice" || sb === "total") {
        return (Number(va || 0) - Number(vb || 0)) * factor;
      }
      if (sb === "createdAt") {
        const ta = new Date(va || 0).getTime();
        const tb = new Date(vb || 0).getTime();
        return (ta - tb) * factor;
      }
      const sa = (va || "").toString().toLowerCase();
      const sbv = (vb || "").toString().toLowerCase();
      if (sa < sbv) return -1 * factor;
      if (sa > sbv) return 1 * factor;
      return 0;
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const headerButton = (label, key) => (
    <button
      className="flex items-center gap-1 group"
      onClick={() => {
        if (sortBy === key) {
          setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
          setSortBy(key);
          setSortDir("asc");
        }
      }}
      title={`Sort by ${label}`}
    >
      <span className="text-left">{label}</span>
      <span className="text-gray-400 group-hover:text-gray-600 text-xs">
        {sortBy === key ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </button>
  );

  if (!user) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Booked Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">All bookings across the platform.</p>
        </div>
      </div>
      <main className="max-w-7xl mx-auto p-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 mb-6 border dark:border-gray-800">
          <div className="grid sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2 relative">
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <input
                type="text"
                placeholder="Search by event title or user email"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg pl-10 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white transition-colors"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                <option value="all">All payments</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="flex items-center">
              <button
                className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md"
                onClick={() => window.location.reload()}
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-200">{filtered.length}</span> records
            {source ? <span> • Source: {source}</span> : null}
          </div>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t dark:border-gray-800">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Columns:</span>
              {[
                ["event", "Event"],
                ["user", "User"],
                ["quantity", "Qty"],
                ["unitPrice", "Unit Price"],
                ["total", "Total"],
                ["createdAt", "Booked At"],
                ["paymentStatus", "Payment"],
                ["actions", "Actions"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 dark:border-gray-700 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-800"
                    checked={showCols[key]}
                    onChange={(e) => setShowCols((c) => ({ ...c, [key]: e.target.checked }))}
                  />
                  <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{label}</span>
                </label>
              ))}
            </div>
            <div>
              <button
                className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-gray-800 text-white hover:bg-black dark:hover:bg-gray-700 text-sm font-bold shadow-md transition-all flex items-center gap-2"
                onClick={() => {
                  const cols = [];
                  if (showCols.event) cols.push("Event");
                  if (showCols.user) {
                    cols.push("User Name");
                    cols.push("User Email");
                  }
                  if (showCols.quantity) cols.push("Qty");
                  if (showCols.unitPrice) cols.push("Unit Price");
                  if (showCols.total) cols.push("Total");
                  if (showCols.createdAt) cols.push("Booked At");
                  if (showCols.paymentStatus) cols.push("Payment");
                  const lines = [cols.join(",")];
                  sorted.forEach((r) => {
                    const vals = [];
                    if (showCols.event) vals.push(JSON.stringify(r.eventTitle ?? ""));
                    if (showCols.user) {
                      vals.push(JSON.stringify(r.userName ?? ""));
                      vals.push(JSON.stringify(r.userEmail ?? ""));
                    }
                    if (showCols.quantity) vals.push(String(r.quantity ?? ""));
                    if (showCols.unitPrice) vals.push(String(fmtCurrency(r.unitPrice ?? 0)));
                    if (showCols.total) vals.push(String(fmtCurrency(r.total ?? 0)));
                    if (showCols.createdAt) vals.push(JSON.stringify(fmtDateTime(r.createdAt)));
                    if (showCols.paymentStatus) vals.push(JSON.stringify(r.paymentStatus ?? ""));
                    lines.push(vals.join(","));
                  });
                  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "bookings.csv";
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth="2" /></svg>
                Export CSV
              </button>
            </div>
          </div>
        </div>
        <StatsBar rows={filtered} />

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-12 text-center border dark:border-gray-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No bookings found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting the search or filter.</p>
          </div>
        ) : (
          <div className="overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-sm border dark:border-gray-800">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    {showCols.event && (
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{headerButton("Event", "eventTitle")}</th>
                    )}
                    {showCols.user && (
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{headerButton("User", "userName")}</th>
                    )}
                    {showCols.quantity && (
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{headerButton("Qty", "quantity")}</th>
                    )}
                    {showCols.unitPrice && (
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{headerButton("Unit Price", "unitPrice")}</th>
                    )}
                    {showCols.total && (
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{headerButton("Total", "total")}</th>
                    )}
                    {showCols.createdAt && (
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{headerButton("Booked At", "createdAt")}</th>
                    )}
                    {showCols.paymentStatus && (
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{headerButton("Payment", "paymentStatus")}</th>
                    )}
                    {showCols.actions && <th className="px-6 py-4"></th>}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                  {pageRows.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      {showCols.event && (
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{r.eventTitle}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {r.venue}{r.city ? `, ${r.city}` : ""}
                          </div>
                        </td>
                      )}
                      {showCols.user && (
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white font-medium">{r.userName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{r.userEmail}</div>
                        </td>
                      )}
                      {showCols.quantity && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{r.quantity}</td>
                      )}
                      {showCols.unitPrice && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">₹{fmtCurrency(r.unitPrice)}</td>
                      )}
                      {showCols.total && (
                        <td className="px-6 py-4 text-sm font-bold text-indigo-600 dark:text-indigo-400">₹{fmtCurrency(r.total)}</td>
                      )}
                      {showCols.createdAt && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{fmtDateTime(r.createdAt)}</td>
                      )}
                      {showCols.paymentStatus && (
                        <td className="px-6 py-4">
                          <StatusBadge value={r.paymentStatus} />
                        </td>
                      )}
                      {showCols.actions && (
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {r.id && (
                              <>
                                <button
                                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
                                  onClick={() => {
                                    const url = `${axiosInstance.defaults.baseURL}/api/v1/booking/${r.id}/invoice`;
                                    window.open(url, "_blank");
                                  }}
                                >
                                  Invoice
                                </button>
                                <a
                                  href={`/admin/bookings/${r.id}`}
                                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 dark:bg-gray-800 text-white hover:bg-black dark:hover:bg-gray-700 transition-colors shadow-sm"
                                >
                                  Details
                                </a>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-6 bg-gray-50/50 dark:bg-gray-800/30 border-t dark:border-gray-800">
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Page <span className="text-gray-900 dark:text-white font-bold">{page}</span> of <span className="text-gray-900 dark:text-white font-bold">{totalPages}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-30 transition-all"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="2" /></svg>
                  </button>
                  <button
                    className="p-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-30 transition-all"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="2" /></svg>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-1.5 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminBookingsPage;

function StatsBar({ rows }) {
  const total = rows.length;
  const paid = rows.filter((r) => (r.paymentStatus || "").toLowerCase() === "paid");
  const pending = rows.filter((r) => (r.paymentStatus || "").toLowerCase() === "pending");
  const revenue = paid.reduce((sum, r) => sum + Number(r.total || 0), 0);
  return (
    <div className="grid sm:grid-cols-4 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border dark:border-gray-800 transition-colors">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Total Bookings</p>
        <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{total}</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border dark:border-gray-800 transition-colors">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Paid</p>
        <div className="flex items-center justify-between">
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{paid.length}</p>
          <StatusBadge value="paid" size="xs" />
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border dark:border-gray-800 transition-colors">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Pending</p>
        <div className="flex items-center justify-between">
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{pending.length}</p>
          <StatusBadge value="pending" size="xs" />
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border dark:border-gray-800 transition-colors">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Revenue (Paid)</p>
        <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">₹{fmtCurrency(revenue)}</p>
      </div>
    </div>
  );
}