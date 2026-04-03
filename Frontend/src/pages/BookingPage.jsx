import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";
import QRCode from "qrcode";

const formatPrice = (n) => Number(n || 0).toFixed(2);

const methodFields = {
  UPI: [], // No input needed, we generate QR for organizer
  Card: [
    { name: "cardNumber", label: "Card Number", type: "text", placeholder: "1234 5678 9012 3456", maxLength: 19 },
    { name: "nameOnCard", label: "Name on Card", type: "text", placeholder: "Full Name" },
    { name: "expiryMonth", label: "Expiry Month", type: "text", placeholder: "MM", maxLength: 2 },
    { name: "expiryYear", label: "Expiry Year", type: "text", placeholder: "YY", maxLength: 2 },
    { name: "cvv", label: "CVV", type: "password", placeholder: "***", maxLength: 4 }
  ],
  NetBanking: [{ name: "bankName", label: "Bank", type: "select", options: ["HDFC", "ICICI", "SBI", "Axis", "Kotak"] }],
  Wallet: [
    { name: "walletProvider", label: "Wallet", type: "select", options: ["Paytm", "PhonePe", "Amazon Pay", "Freecharge"] },
    { name: "walletNumber", label: "Wallet Number", type: "text", placeholder: "Registered mobile/email" }
  ]
};

const BookingPage = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const { eventId } = useParams();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [details, setDetails] = useState({
    attendeeName: "",
    attendeeEmail: "",
    attendeePhone: "",
    notes: "",
    promoCode: "",
    acceptTerms: false
  });
  const [discount, setDiscount] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookingInfo, setBookingInfo] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/api/v1/event/${eventId}`);
        if (res.data.success) {
          setEvent(res.data.event);
        } else {
          toast.error(res.data.message || "Failed to load event");
        }
      } catch (e) {
        toast.error(e.response?.data?.message || "Error loading event");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    } else if (user.role !== "user") {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const generateQrCode = async () => {
      if (bookingInfo && bookingInfo.totalAmount) {
        // Use the organizer's UPI ID returned from the backend
        const pa = (bookingInfo.organizerUpiId || "").trim();
        const pn = bookingInfo.organizerName || "Organizer";
        const am = Number(bookingInfo.totalAmount).toFixed(2);
        const tn = `Booking-${bookingInfo._id}`;
        const upiUrl = `upi://pay?pa=${pa}&pn=${pn}&am=${am}&tn=${tn}`;
        
        try {
          const dataUrl = await QRCode.toDataURL(upiUrl, {
            margin: 1,
            scale: 6,
            color: { dark: "#000000", light: "#ffffff" }
          });
          setQrDataUrl(dataUrl);
        } catch (err) {
          console.error("Failed to generate QR code", err);
          setQrDataUrl("");
        }
      }
    };
    generateQrCode();
  }, [bookingInfo]);

  const maxQty = useMemo(() => Math.max(1, Number(event?.availableSeats || 1)), [event]);
  const unitPrice = useMemo(() => Number(event?.price || 0), [event]);
  const subtotal = useMemo(() => unitPrice * (quantity || 1), [unitPrice, quantity]);
  const total = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount]);

  const canBook =
    !!event &&
    event.isPaid &&
    !event.isDisabled &&
    (event.effectiveStatus === "upcoming" || event.effectiveStatus === "ongoing") &&
    event.availableSeats > 0;

  const fields = methodFields[paymentMethod] || [];

  const attendeeValid =
    (details.attendeeName || "").trim().length >= 2 &&
    (details.attendeeEmail || "").includes("@") &&
    (details.attendeePhone || "").trim().length === 10 &&
    details.acceptTerms === true;

  const handleDetailChange = (name, value) => {
    if (name === "attendeePhone") {
      const v = value.replace(/\D/g, "").slice(0, 10);
      setDetails((prev) => ({ ...prev, [name]: v }));
      return;
    }
    setDetails((prev) => ({ ...prev, [name]: value }));
    if (name === "promoCode") {
      setDiscount(0);
      setAppliedVoucher(null);
    }
  };

  const handleApplyVoucher = async () => {
    if (!details.promoCode) return;
    try {
      const resp = await axiosInstance.post("/api/v1/voucher/validate", {
        code: details.promoCode,
        eventId,
        amount: subtotal
      });
      if (resp.data.success) {
        setDiscount(resp.data.discount);
        setAppliedVoucher(details.promoCode);
        toast.success(`Voucher applied! Discount: ₹${formatPrice(resp.data.discount)}`);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Invalid voucher code");
      setDiscount(0);
      setAppliedVoucher(null);
    }
  };

  const pollPaymentStatus = (bookingId) => {
    const interval = setInterval(async () => {
      try {
        const res = await axiosInstance.get(`/api/v1/booking/payment-status/${bookingId}`);
        if (res.data.success && res.data.paymentStatus === "paid") {
          clearInterval(interval);
          toast.success("Payment confirmed! Your booking is complete.");
          const invoiceUrl = `${axiosInstance.defaults.baseURL}/api/v1/booking/${bookingId}/invoice`;
          window.open(invoiceUrl, "_blank");
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error polling for payment status:", error);
      }
    }, 3000);

    setTimeout(() => {
      clearInterval(interval);
    }, 300000); // 5 minutes timeout
  };

  const handleConfirmPayment = async () => {
    if (!bookingInfo?._id) return;
    try {
      setConfirming(true);
      const res = await axiosInstance.post(`/api/v1/booking/confirm-payment/${bookingInfo._id}`, {
        transactionId
      });
      if (res.data.success) {
        toast.success("Payment submitted for verification!");
        // Redirect to a pending state or dashboard
        setStep(5); // New step for submission success
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit payment");
    } finally {
      setConfirming(false);
    }
  };

  const handleBook = async () => {
    if (!canBook || !attendeeValid) return;
    setSubmitting(true);
    try {
      const payload = {
        eventId,
        quantity,
        paymentMethod,
        paymentDetails: details,
        voucherCode: appliedVoucher,
      };
      const resp = await axiosInstance.post("/api/v1/booking/create", payload);

      if (resp.data.success) {
        if (paymentMethod === "UPI" && (resp.data.booking.paymentStatus === "pending" || resp.data.paymentStatus === "pending")) {
          // Merge booking data with organizer details for the QR code
          const combinedBookingInfo = {
            ...(resp.data.booking || {}),
            organizerUpiId: resp.data.organizerUpiId,
            organizerName: resp.data.organizerName
          };
          setBookingInfo(combinedBookingInfo);
          setStep(4);
          pollPaymentStatus(combinedBookingInfo._id || resp.data.bookingId);
        } else {
          const booking = resp.data.booking || resp.data;
          toast.success("Booking confirmed");
          const invoiceUrl = `${axiosInstance.defaults.baseURL}/api/v1/booking/${booking._id}/invoice`;
          window.open(invoiceUrl, "_blank");
          navigate("/dashboard");
        }
      } else {
        toast.error(resp.data.message || "Booking failed");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Error creating booking");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      <main className="max-w-6xl mx-auto p-6">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          </div>
        ) : !event ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl shadow border border-gray-100 dark:border-gray-800 transition-colors">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Event not found</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Please go back and select a valid event.</p>
            <button className="mt-6 px-6 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-900 transition-all" onClick={() => navigate(-1)}>
              Go Back
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-colors">
              {event.bannerImage ? (
                <img src={event.bannerImage} alt={event.title} className="w-full h-56 object-cover" />
              ) : (
                <div className="w-full h-56 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30"></div>
              )}
              <div className="p-8 space-y-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{event.title}</h1>
                <div className="flex flex-wrap gap-3">
                  <span className="px-3 py-1 text-xs font-bold rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                    {event.effectiveStatus || event.status}
                  </span>
                  {event.isPaid ? (
                    <span className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                      ₹{formatPrice(unitPrice)} per ticket
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-xs font-bold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">Free</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-6 border-t dark:border-gray-800 pt-6 text-sm">
                  <div>
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Date</p>
                    <p className="font-bold text-gray-900 dark:text-white mt-0.5">{new Date(event.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Time</p>
                    <p className="font-bold text-gray-900 dark:text-white mt-0.5">{event.startTime || "TBA"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Venue</p>
                    <p className="font-bold text-gray-900 dark:text-white mt-0.5">
                      {event.venue}
                      {event.city ? `, ${event.city}` : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Seats</p>
                    <p className="font-bold text-gray-900 dark:text-white mt-0.5">
                      {event.availableSeats} / {event.totalSeats}
                    </p>
                  </div>
                </div>
                {event.description && <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{event.description}</p>}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-800 transition-colors">
              <div className="flex items-center gap-3 mb-8">
                <div className={`h-2 flex-1 rounded-full transition-all duration-300 ${step >= 1 ? "bg-indigo-600" : "bg-gray-100 dark:bg-gray-800"}`} />
                <div className={`h-2 flex-1 rounded-full transition-all duration-300 ${step >= 2 ? "bg-indigo-600" : "bg-gray-100 dark:bg-gray-800"}`} />
                <div className={`h-2 flex-1 rounded-full transition-all duration-300 ${step >= 3 ? "bg-indigo-600" : "bg-gray-100 dark:bg-gray-800"}`} />
                <div className={`h-2 flex-1 rounded-full transition-all duration-300 ${step >= 4 ? "bg-indigo-600" : "bg-gray-100 dark:bg-gray-800"}`} />
              </div>
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Attendee Details</h2>
                  {!canBook && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30">Booking is unavailable for this event.</p>}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={details.attendeeName}
                      onChange={(e) => handleDetailChange("attendeeName", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={details.attendeeEmail}
                        onChange={(e) => handleDetailChange("attendeeEmail", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Phone <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-1">(10 digits)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={details.attendeePhone}
                          onChange={(e) => handleDetailChange("attendeePhone", e.target.value)}
                          maxLength="10"
                          placeholder="10-digit number"
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all ${
                            details.attendeePhone?.length === 10 ? "border-green-300 dark:border-green-900/50" : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {details.attendeePhone?.length > 0 && (
                          <span className={`absolute right-4 top-3.5 text-[10px] font-bold ${
                            details.attendeePhone.length === 10 ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"
                          }`}>
                            {details.attendeePhone.length}/10
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Promo Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={details.promoCode}
                        onChange={(e) => handleDetailChange("promoCode", e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
                        disabled={appliedVoucher}
                      />
                      <button
                        type="button"
                        onClick={handleApplyVoucher}
                        className={`px-6 py-3 rounded-xl font-bold transition-all ${
                          appliedVoucher
                            ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 cursor-default"
                            : "bg-gray-900 dark:bg-gray-800 text-white hover:bg-black dark:hover:bg-gray-700"
                        }`}
                        disabled={!details.promoCode || appliedVoucher}
                      >
                        {appliedVoucher ? "Applied" : "Apply"}
                      </button>
                    </div>
                    {appliedVoucher && (
                      <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Discount of ₹{formatPrice(discount)} applied!
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Special Notes</label>
                    <textarea
                      rows={3}
                      value={details.notes}
                      onChange={(e) => handleDetailChange("notes", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
                      placeholder="Any special requests or notes?"
                    />
                  </div>                  <label className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={details.acceptTerms}
                      onChange={(e) => handleDetailChange("acceptTerms", e.target.checked)}
                      className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-700 rounded focus:ring-indigo-500 bg-white dark:bg-gray-800"
                    />
                    <span className="group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">I agree to the terms and conditions and privacy policy of EventHub.</span>
                  </label>
                  <div className="flex justify-between items-center mt-8 pt-6 border-t dark:border-gray-800">
                    <button
                      className="px-6 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                      onClick={() => navigate(-1)}
                    >
                      Back
                    </button>
                    <button
                      className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:grayscale disabled:hover:translate-y-0"
                      onClick={() => setStep(2)}
                      disabled={!attendeeValid || !canBook}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tickets & Payment</h2>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Number of Tickets</label>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-2xl p-1 border border-gray-200 dark:border-gray-700">
                        <button
                          className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-all disabled:opacity-30"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          disabled={!canBook || quantity <= 1}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" /></svg>
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={maxQty}
                          value={quantity}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            if (!Number.isNaN(v)) setQuantity(Math.min(maxQty, Math.max(1, v)));
                          }}
                          className="w-16 text-center font-bold text-lg bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white"
                          disabled={!canBook}
                        />
                        <button
                          className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-all disabled:opacity-30"
                          onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                          disabled={!canBook || quantity >= maxQty}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        </button>
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Available Seats</p>
                        <p className="text-gray-900 dark:text-white font-bold text-lg">{maxQty}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Payment Method</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.keys(methodFields).map((m) => (
                        <button
                          key={m}
                          type="button"
                          className={`px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                            paymentMethod === m 
                              ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400" 
                              : "border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-700"
                          }`}
                          onClick={() => setPaymentMethod(m)}
                          disabled={!canBook}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  {paymentMethod === "UPI" && (
                    <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="bg-indigo-600 p-3 rounded-xl text-white">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">Real-time QR Generation</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">A unique UPI QR code will be generated for the organizer's account after you confirm the booking.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {fields.length > 0 && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {fields.map((f) => (
                        <div key={f.name} className={f.name === "cardNumber" || f.name === "upiId" ? "sm:col-span-2" : ""}>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{f.label}</label>
                          {f.type === "select" ? (
                            <select
                              value={details[f.name] || ""}
                              onChange={(e) => handleDetailChange(f.name, e.target.value)}
                              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
                              disabled={!canBook}
                            >
                              <option value="">Select {f.label}</option>
                              {(f.options || []).map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={f.type}
                              value={details[f.name] || ""}
                              onChange={(e) => handleDetailChange(f.name, e.target.value)}
                              placeholder={f.placeholder}
                              maxLength={f.maxLength}
                              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
                              disabled={!canBook}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t dark:border-gray-800 pt-8">
                    <div>
                      {discount > 0 && (
                        <div className="mb-1">
                          <p className="text-xs text-gray-400 dark:text-gray-500 line-through font-bold">₹{formatPrice(subtotal)}</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Save ₹{formatPrice(discount)}</p>
                        </div>
                      )}
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Total Amount</p>
                      <p className="text-3xl font-black text-gray-900 dark:text-white">₹{formatPrice(total)}</p>
                    </div>
                    <div className="flex gap-3">
                      <button className="px-6 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all" onClick={() => setStep(1)}>
                        Back
                      </button>
                      <button
                        className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:grayscale disabled:hover:translate-y-0"
                        onClick={() => setStep(3)}
                        disabled={!canBook || quantity < 1 || quantity > maxQty}
                      >
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {step === 4 && bookingInfo && (
                 <div className="text-center space-y-6">
                   <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Scan to Complete Payment</h2>
                   <p className="text-gray-600 dark:text-gray-400">Scan the QR code with your UPI app to complete the booking.</p>
                   {qrDataUrl ? (
                     <img src={qrDataUrl} alt="UPI QR Code" className="mx-auto w-64 h-64" />
                   ) : (
                     <div className="animate-pulse w-64 h-64 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto"></div>
                   )}
                   <p className="text-lg font-bold text-gray-900 dark:text-white">Amount: ₹{formatPrice(bookingInfo.totalAmount)}</p>
                   
                   <div className="max-w-xs mx-auto space-y-4 pt-4">
                     <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase text-left mb-1">
                         Transaction ID / UTR <span className="text-red-500">*</span>
                       </label>
                       <input 
                         type="text"
                         value={transactionId}
                         onChange={(e) => setTransactionId(e.target.value)}
                         placeholder="Enter 12-digit UTR number"
                         className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-800 text-sm"
                         required
                       />
                       <p className="text-[10px] text-gray-400 mt-1 text-left italic">Compulsory for payment verification</p>
                     </div>
                     <button
                       onClick={handleConfirmPayment}
                       disabled={confirming || !transactionId.trim()}
                       className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:grayscale"
                     >
                       {confirming ? "Verifying..." : "I have Paid"}
                     </button>
                   </div>

                   <div className="flex items-center justify-center gap-2 pt-4">
                     <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                     <p className="text-gray-500 dark:text-gray-400">Waiting for payment confirmation...</p>
                   </div>
                 </div>
               )}
               {step === 5 && (
                 <div className="text-center space-y-6 py-10">
                   <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                     <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                   </div>
                   <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Submitted!</h2>
                   <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                     Your payment is now being verified by the organizer. You will receive an email once your booking is confirmed.
                   </p>
                   <button 
                     onClick={() => navigate("/dashboard")}
                     className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all"
                   >
                     Go to Dashboard
                   </button>
                 </div>
               )}
              {step === 3 && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Review & Confirm</h2>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 space-y-6 transition-colors">
                    <div className="grid sm:grid-cols-2 gap-y-6 gap-x-8 text-sm">
                      <div>
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Event</p>
                        <p className="font-bold text-gray-900 dark:text-white text-base">{event.title}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Date</p>
                        <p className="font-bold text-gray-900 dark:text-white text-base">{new Date(event.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Attendee</p>
                        <p className="font-bold text-gray-900 dark:text-white text-base">{details.attendeeName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Contact Info</p>
                        <p className="font-bold text-gray-900 dark:text-white">{details.attendeeEmail}</p>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">{details.attendeePhone}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Tickets</p>
                        <p className="font-bold text-gray-900 dark:text-white text-base">{quantity} × ₹{formatPrice(unitPrice)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Payment</p>
                        <p className="font-bold text-gray-900 dark:text-white text-base">{paymentMethod}</p>
                      </div>
                    </div>
                    {appliedVoucher && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.266 0 .52.105.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" /></svg>
                          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">Voucher: {appliedVoucher}</span>
                        </div>
                        <span className="text-xs text-emerald-700 dark:text-emerald-400 font-black">-₹{formatPrice(discount)}</span>
                      </div>
                    )}
                    {details.notes && (
                      <div className="pt-4 border-t dark:border-gray-700">
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Additional Notes</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{details.notes}"</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t dark:border-gray-800 pt-8">
                    <div>
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Final Total</p>
                      <p className="text-4xl font-black text-gray-900 dark:text-white">₹{formatPrice(total)}</p>
                    </div>
                    <div className="flex gap-3">
                      <button className="px-6 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all" onClick={() => setStep(2)}>
                        Back
                      </button>
                      <button
                        className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:grayscale disabled:hover:translate-y-0 flex items-center gap-2"
                        onClick={handleBook}
                        disabled={!canBook || submitting || !attendeeValid}
                      >
                        {submitting ? (
                          <>
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <span>Confirm Booking</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BookingPage;