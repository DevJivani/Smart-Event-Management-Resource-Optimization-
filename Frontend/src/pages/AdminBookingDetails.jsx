import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, Navigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";
import StatusBadge from "../components/StatusBadge.jsx";

const fmt = (n) => Number(n || 0).toFixed(2);
const fmtDt = (d) => {
  if (!d) return "-";
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return "-";
  return `${t.toLocaleDateString()} ${t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const AdminBookingDetails = () => {
  const { user, role } = useSelector((s) => s.auth);
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/api/v1/booking/admin/${bookingId}`);
        if (res.data?.success) {
          setBooking(res.data.booking);
          setPayments(res.data.payments || []);
        } else {
          toast.error(res.data?.message || "Failed to load booking");
        }
      } catch (e) {
        toast.error(e.response?.data?.message || "Error loading booking");
      } finally {
        setLoading(false);
      }
    };
    if (bookingId) load();
  }, [bookingId]);

  if (!user) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/" replace />;

  const evt = booking?.eventId || {};
  const usr = booking?.userId || {};
  const org = evt?.createdBy || {};
  const qty = booking?.quantity || 1;
  const unit = booking?.ticketId?.price ?? evt?.price ?? 0;
  const total = booking?.totalAmount ?? unit * qty;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
          <p className="text-gray-600 mt-2">Full user and organizer details</p>
        </div>
      </div>
      <main className="max-w-7xl mx-auto p-8">
        <div className="mb-6">
          <Link to="/admin/bookings" className="text-sm text-indigo-600">&larr; Back to Booked Tickets</Link>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : !booking ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">Booking not found</h3>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900">Event</h2>
              <div className="mt-4 space-y-2 text-sm">
                <p><span className="font-medium text-gray-700">Title:</span> {evt.title || "-"}</p>
                <p><span className="font-medium text-gray-700">Venue:</span> {evt.venue}{evt.city ? `, ${evt.city}` : ""}</p>
                <p><span className="font-medium text-gray-700">Date:</span> {evt.startDate ? new Date(evt.startDate).toLocaleDateString() : "-"}</p>
                <p><span className="font-medium text-gray-700">Time:</span> {evt.startTime || "-"}</p>
                <p><span className="font-medium text-gray-700">Price:</span> ₹{fmt(unit)}</p>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">Organizer</h3>
              <div className="mt-2 space-y-1 text-sm">
                <p><span className="font-medium text-gray-700">Name:</span> {org.name || "-"}</p>
                <p><span className="font-medium text-gray-700">Email:</span> {org.email || "-"}</p>
                <p><span className="font-medium text-gray-700">Phone:</span> {org.phone || "-"}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900">Attendee</h2>
              <div className="mt-4 space-y-2 text-sm">
                <p><span className="font-medium text-gray-700">Name:</span> {usr.name || "-"}</p>
                <p><span className="font-medium text-gray-700">Email:</span> {usr.email || "-"}</p>
                <p><span className="font-medium text-gray-700">Phone:</span> {usr.phone || "-"}</p>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">Booking</h3>
              <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Quantity</p>
                  <p className="font-medium">{qty}</p>
                </div>
                <div>
                  <p className="text-gray-500">Unit Price</p>
                  <p className="font-medium">₹{fmt(unit)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total</p>
                  <p className="font-medium">₹{fmt(total)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Payment</p>
                  <div className="mt-0.5">
                    <StatusBadge value={booking.paymentStatus} />
                  </div>
                </div>
                <div>
                  <p className="text-gray-500">Booked At</p>
                  <p className="font-medium">{fmtDt(booking.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Ticket Type</p>
                  <p className="font-medium">{booking.ticketId?.ticketType || "Regular"}</p>
                </div>
              </div>
              <div className="mt-6 bg-gray-50 border rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h4>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => toast.success("Marked as paid (UI only)")}
                  >
                    Mark as Paid
                  </button>
                  <button
                    className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                    onClick={() => toast.success("Refund initiated (UI only)")}
                  >
                    Refund
                  </button>
                  {usr?.email ? (
                    <a
                      href={`mailto:${usr.email}?subject=Regarding your booking`}
                      className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Contact Attendee
                    </a>
                  ) : null}
                  <button
                    className="px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-black"
                    onClick={() => {
                      navigator.clipboard?.writeText(booking._id || "");
                      toast.success("Booking ID copied");
                    }}
                  >
                    Copy Booking ID
                  </button>
                </div>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">Payment History</h3>
              {payments.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">No payment records found.</p>
              ) : (
                <div className="mt-2 space-y-3">
                  {payments.map((p) => (
                    <div key={p._id} className="relative pl-6">
                      <div className="absolute left-0 top-2 w-2 h-2 rounded-full bg-indigo-400"></div>
                      <div className="border rounded-lg p-3 text-sm bg-white shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <StatusBadge value={(p.paymentStatus || "").toLowerCase() === "success" ? "paid" : p.paymentStatus} size="xs" />
                            <span className="text-gray-700 font-medium">{p.paymentMethod || "-"}</span>
                          </div>
                          <span className="text-gray-600">{fmtDt(p.paymentDate || p.createdAt)}</span>
                        </div>
                        <div className="mt-2 grid sm:grid-cols-3 gap-3">
                          <div>
                            <p className="text-gray-500">Transaction ID</p>
                            <p className="font-medium break-all">{p.transactionId || "-"}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Amount</p>
                            <p className="font-medium">₹{fmt(p.amount ?? total)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Recorded</p>
                            <p className="font-medium">{fmtDt(p.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <button
                  className="px-4 py-2 rounded-md bg-indigo-600 text-white"
                  onClick={() => {
                    const url = `${axiosInstance.defaults.baseURL}/api/v1/booking/${booking._id}/invoice`;
                    window.open(url, "_blank");
                  }}
                >
                  Open Invoice
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminBookingDetails;