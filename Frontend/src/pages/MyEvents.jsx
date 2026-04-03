import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";
import Footer from "../components/Footer";
import { QRCodeSVG } from "qrcode.react";

const formatPrice = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

const MyEvents = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

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
                const isCompleted = evt.startDate && new Date(evt.startDate) < new Date();
                return (
                  <div key={b._id} className="bg-white rounded-xl shadow overflow-hidden flex flex-col h-full">
                    <div className="w-full h-40">
                      {evt.bannerImage ? (
                        <img src={evt.bannerImage} alt={evt.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100" />
                      )}
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold text-gray-900">{evt.title}</h3>
                        {isCompleted && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded">Completed</span>
                        )}
                      </div>
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
                          <p className="font-bold text-blue-600">₹{formatPrice(b.totalAmount)}</p>
                        </div>
                      </div>
                      <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-3 mt-auto">
                        <button
                          onClick={() => setSelectedTicket(b)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          View Ticket
                        </button>
                        {isCompleted ? (
                          <button
                            onClick={() => navigate(`/memory-box/${evt._id}`)}
                            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors flex items-center justify-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Memory Box
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const url = `${axiosInstance.defaults.baseURL}/api/v1/booking/${b._id}/invoice`;
                              window.open(url, "_blank");
                            }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                          >
                            Invoice
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Ticket QR Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTicket(null)} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white text-center shrink-0">
              <button 
                onClick={() => setSelectedTicket(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/40 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
              </div>
              <h2 className="text-2xl font-black mb-1">Entry Ticket</h2>
              <p className="text-white/70 text-sm font-bold uppercase tracking-widest">#{selectedTicket._id.toString().slice(-8)}</p>
            </div>
            
            <div className="p-8 flex flex-col items-center overflow-y-auto">
              <div className="p-4 bg-white rounded-3xl shadow-xl mb-8 border border-gray-100 shrink-0">
                <QRCodeSVG 
                  value={selectedTicket.ticketSecret || selectedTicket._id} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              
              <div className="w-full space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">{selectedTicket.eventId?.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">{selectedTicket.eventId?.venue}, {selectedTicket.eventId?.city}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Attendee</span>
                    <span className="text-sm font-black text-gray-900 dark:text-white">{user.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Quantity</span>
                    <span className="text-sm font-black text-gray-900 dark:text-white">{selectedTicket.quantity} Person{selectedTicket.quantity > 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-400">Please present this QR code at the event entrance for verification.</p>
                </div>
              </div>
            </div>
            
            <div className="px-8 pb-8 mt-auto shrink-0">
              <button 
                onClick={() => window.print()}
                className="w-full py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-black rounded-2xl hover:scale-[1.02] transition-transform active:scale-100"
              >
                Print Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MyEvents;