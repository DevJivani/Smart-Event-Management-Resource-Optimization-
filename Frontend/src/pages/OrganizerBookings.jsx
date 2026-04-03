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
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
              userName: usr.name || "Unknown User",
              userEmail: usr.email || "No Email",
              userPhone: usr.phone || usr.phoneNumber || "No Phone Number",
              userRole: usr.role || "user",
              quantity: qty,
              unitPrice: unit,
              total,
              discount: b.discountAmount || 0,
              bookingStatus: b.bookingStatus || "confirmed",
              paymentStatus: (b.paymentStatus || "pending").toLowerCase(),
              transactionId: b.transactionId || null,
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
        const sOk =
          status === "all"
            ? true
            : status === "awaiting-verification"
            ? r.bookingStatus === "awaiting-verification"
            : (r.paymentStatus || "") === status;
        return qOk && sOk;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [rows, query, status]);

  const totalRevenue = useMemo(() => {
    return rows
      .filter((r) => r.paymentStatus === "paid")
      .reduce((sum, r) => sum + (r.total || 0), 0);
  }, [rows]);

  const totalPages = useMemo(() => Math.ceil(filtered.length / itemsPerPage), [filtered, itemsPerPage]);
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, status, itemsPerPage]);

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Event Title",
      "Attendee Name",
      "Attendee Email",
      "Attendee Phone",
      "Quantity",
      "Unit Price",
      "Total Amount",
      "Discount",
      "Booking Status",
      "Payment Status",
      "Transaction ID",
      "Booked At"
    ];

    const csvContent = [
      headers.join(","),
      ...filtered.map(r => [
        `"${r.eventTitle}"`,
        `"${r.userName}"`,
        `"${r.userEmail}"`,
        `"${r.userPhone}"`,
        r.quantity,
        r.unitPrice,
        r.total,
        r.discount,
        r.bookingStatus,
        r.paymentStatus,
        `"${r.transactionId || ""}"`,
        `"${fmtDt(r.createdAt)}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bookings_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully");
  };

  const handleVerifyPayment = async (bookingId, status) => {
    let reason = "";
    if (status === 'cancelled') {
      reason = window.prompt("Please enter the reason for rejection (e.g., Payment not found):");
      if (reason === null) return; // Cancel if prompt is dismissed
    }

    try {
      const res = await axiosInstance.post(`/api/v1/booking/verify-payment/${bookingId}`, { 
        status,
        reason: reason || "Payment verification failed"
      });
      if (res.data.success) {
        toast.success(`Booking ${status === 'confirmed' ? 'approved' : 'rejected'} successfully`);
        // Refresh the list
        setRows((prev) => 
          prev.map((r) => r.id === bookingId ? { ...r, bookingStatus: status, paymentStatus: status === 'confirmed' ? 'paid' : 'pending' } : r)
        );
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Verification failed");
    }
  };

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "organizer") return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Booked Tickets</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Bookings for your events</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-800 flex flex-col items-end min-w-[200px]">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Revenue</span>
                <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">₹{fmt(totalRevenue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto p-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 mb-6 border dark:border-gray-800">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 relative">
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <input
                type="text"
                placeholder="Search by event or attendee"
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
                <option value="awaiting-verification">Awaiting Verification</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-200">{filtered.length}</span> records
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-12 text-center border dark:border-gray-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No bookings found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your event bookings will show here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl shadow-sm border dark:border-gray-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Attendee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Booked At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                {pageRows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{r.eventTitle}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {r.venue}{r.city ? `, ${r.city}` : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">{r.userName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{r.userEmail}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{r.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">₹{fmt(r.unitPrice)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">₹{fmt(r.total)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{fmtDt(r.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full text-center ${
                          r.paymentStatus === "paid"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : r.bookingStatus === "awaiting-verification"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}>
                          {r.bookingStatus === "awaiting-verification" ? "Awaiting Verification" : r.paymentStatus}
                        </span>
                        {r.bookingStatus === "awaiting-verification" && (
                          <div className="flex gap-1 mt-1">
                            <button 
                              onClick={() => handleVerifyPayment(r.id, "confirmed")}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] py-1 px-2 rounded transition-colors"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleVerifyPayment(r.id, "cancelled")}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[10px] py-1 px-2 rounded transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {r.id && (
                          <button
                            className="text-xs px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
                            onClick={() => {
                              const url = `${axiosInstance.defaults.baseURL}/api/v1/booking/${r.id}/invoice`;
                              window.open(url, "_blank");
                            }}
                          >
                            Invoice
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedUser(r)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                          title="View Attendee Details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-900 rounded-xl p-4 border dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Page <span className="font-bold text-gray-900 dark:text-white">{currentPage}</span> of <span className="font-bold text-gray-900 dark:text-white">{totalPages || 1}</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Attendee Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden transform transition-all border dark:border-gray-800">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-10 sm:px-8 text-white relative flex-shrink-0">
              <button 
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors z-10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl font-bold mb-4 shadow-lg border border-white/30">
                  {selectedUser.userName.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-2xl font-bold">{selectedUser.userName}</h2>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium mt-2 capitalize">
                  {selectedUser.userRole}
                </span>
              </div>
            </div>
            
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto scrollbar-hide flex-1">
              <div className="grid grid-cols-1 gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Email Address</p>
                    <p className="text-gray-900 dark:text-white font-medium">{selectedUser.userEmail}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Phone Number</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {selectedUser.userPhone === "No Phone Number" ? (
                        <span className="text-amber-500 dark:text-amber-400 italic text-sm">Not provided by user</span>
                      ) : (
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">{selectedUser.userPhone}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Booking ID</p>
                    <p className="text-gray-900 dark:text-white font-mono text-sm">{selectedUser.id}</p>
                  </div>
                </div>

                {selectedUser.transactionId && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Transaction ID / UTR</p>
                      <p className="text-amber-600 dark:text-amber-400 font-bold font-mono text-sm">{selectedUser.transactionId}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Booking Details</p>
                    <div className="text-sm text-gray-900 dark:text-gray-200 mt-1 space-y-1">
                      <p><span className="text-gray-500 dark:text-gray-400 font-semibold">Event:</span> {selectedUser.eventTitle}</p>
                      <p><span className="text-gray-500 dark:text-gray-400 font-semibold">Venue:</span> {selectedUser.venue}, {selectedUser.city}</p>
                      <p><span className="text-gray-500 dark:text-gray-400 font-semibold">Quantity:</span> {selectedUser.quantity} Tickets</p>
                      <p><span className="text-gray-500 dark:text-gray-400 font-semibold">Unit Price:</span> ₹{fmt(selectedUser.unitPrice)}</p>
                      <p><span className="text-gray-500 dark:text-gray-400 font-semibold">Discount:</span> ₹{fmt(selectedUser.discount)}</p>
                      <p><span className="text-gray-500 dark:text-gray-400 font-semibold">Final Amount:</span> <span className="font-bold text-indigo-600 dark:text-indigo-400">₹{fmt(selectedUser.total)}</span></p>
                      <p><span className="text-gray-500 dark:text-gray-400 font-semibold">Booking Date:</span> {fmtDt(selectedUser.createdAt)}</p>
                      <div className="flex gap-2 mt-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          selectedUser.paymentStatus === "paid" 
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" 
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                        }`}>
                          {selectedUser.paymentStatus}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          selectedUser.bookingStatus === "confirmed" 
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" 
                            : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                        }`}>
                          {selectedUser.bookingStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="w-full py-3 bg-gray-900 dark:bg-gray-800 text-white rounded-2xl font-bold hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors shadow-lg"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerBookings;