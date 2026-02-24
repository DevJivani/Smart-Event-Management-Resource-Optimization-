import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";

const formatPrice = (n) => Number(n || 0).toFixed(2);

const MyEvents = () => {
  const { user } = useSelector((state) => state.auth);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/api/v1/booking/my");
        if (res.data.success) {
          setBookings(res.data.bookings || []);
        } else {
          toast.error(res.data.message || "Failed to fetch bookings");
        }
      } catch (e) {
        toast.error(e.response?.data?.message || "Error fetching bookings");
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchBookings();
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold">My Events</h1>
        <p className="mt-2 text-gray-600">Your booked events and tickets.</p>
        <div className="mt-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <h3 className="text-lg font-medium text-gray-900">No bookings yet</h3>
              <p className="mt-1 text-sm text-gray-500">Book tickets to see them here.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {bookings.map((b) => {
                const evt = b.eventId || {};
                const unitPrice = b.ticketId?.price ?? evt.price ?? 0;
                return (
                  <div key={b._id} className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="w-full h-40">
                      {evt.bannerImage ? (
                        <img src={evt.bannerImage} alt={evt.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100" />
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900">{evt.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {evt.venue}
                        {evt.city ? `, ${evt.city}` : ""}
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Date</p>
                          <p className="font-medium">
                            {evt.startDate ? new Date(evt.startDate).toLocaleDateString() : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Time</p>
                          <p className="font-medium">{evt.startTime || "-"}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Ticket</p>
                          <p className="font-medium">{b.ticketId?.ticketType || "Regular"}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Quantity</p>
                          <p className="font-medium">{b.quantity}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Unit Price</p>
                          <p className="font-medium">₹{formatPrice(unitPrice)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total</p>
                          <p className="font-medium">₹{formatPrice(b.totalAmount)}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            b.paymentStatus === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {b.paymentStatus}
                        </span>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm"
                          onClick={() => {
                            const url = `${axiosInstance.defaults.baseURL}/api/v1/booking/${b._id}/invoice`;
                            window.open(url, "_blank");
                          }}
                        >
                          Download Invoice
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyEvents;