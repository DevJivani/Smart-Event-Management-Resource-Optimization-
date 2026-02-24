import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";
import QRCode from "qrcode";

const formatPrice = (n) => Number(n || 0).toFixed(2);

const methodFields = {
  UPI: [{ name: "upiId", label: "UPI ID", type: "text", placeholder: "name@bank" }],
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
  const [submitting, setSubmitting] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

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

  const maxQty = useMemo(() => Math.max(1, Number(event?.availableSeats || 1)), [event]);
  const unitPrice = useMemo(() => Number(event?.price || 0), [event]);
  const total = useMemo(() => unitPrice * (quantity || 1), [unitPrice, quantity]);

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
    (details.attendeePhone || "").trim().length >= 10 &&
    details.acceptTerms === true;

  useEffect(() => {
    const buildUpiUrl = () => {
      const pa = encodeURIComponent((details.upiId || "").trim());
      const pn = encodeURIComponent((details.attendeeName || "").trim() || "Attendee");
      const am = encodeURIComponent(Number(total || 0).toFixed(2));
      const tn = encodeURIComponent(`Booking: ${event?.title || "Event"}`);
      if (!pa) return "";
      return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&tn=${tn}`;
    };
    const regenerate = async () => {
      if (paymentMethod !== "UPI") {
        setQrDataUrl("");
        return;
      }
      const url = buildUpiUrl();
      if (!url) {
        setQrDataUrl("");
        return;
      }
      try {
        const dataUrl = await QRCode.toDataURL(url, {
          margin: 1,
          scale: 6,
          color: { dark: "#000000", light: "#ffffff" }
        });
        setQrDataUrl(dataUrl);
      } catch {
        setQrDataUrl("");
      }
    };
    regenerate();
  }, [paymentMethod, details.upiId, details.attendeeName, total, event?.title]);

  const handleDetailChange = (name, value) => {
    setDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleBook = async () => {
    try {
      if (!canBook || !attendeeValid) return;
      setSubmitting(true);
      const payload = {
        eventId,
        quantity,
        paymentMethod,
        paymentDetails: details
      };
      const resp = await axiosInstance.post("/api/v1/booking/create", payload);
      if (resp.data.success) {
        toast.success("Booking confirmed");
        const invoiceUrl = `${axiosInstance.defaults.baseURL}/api/v1/booking/${resp.data.booking._id}/invoice`;
        window.open(invoiceUrl, "_blank");
        navigate("/dashboard");
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto p-6">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : !event ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-900">Event not found</h2>
            <p className="mt-2 text-gray-600">Please go back and select a valid event.</p>
            <button className="mt-6 px-4 py-2 bg-gray-800 text-white rounded-md" onClick={() => navigate(-1)}>
              Go Back
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              {event.bannerImage ? (
                <img src={event.bannerImage} alt={event.title} className="w-full h-56 object-cover" />
              ) : (
                <div className="w-full h-56 bg-gray-200"></div>
              )}
              <div className="p-6 space-y-3">
                <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {event.effectiveStatus || event.status}
                  </span>
                  {event.isPaid ? (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                      ₹{formatPrice(unitPrice)} per ticket
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Free</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                  <div>
                    <p className="font-semibold">Date</p>
                    <p>{new Date(event.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Time</p>
                    <p>{event.startTime || "TBA"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Venue</p>
                    <p>
                      {event.venue}
                      {event.city ? `, ${event.city}` : ""}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Seats</p>
                    <p>
                      {event.availableSeats} / {event.totalSeats}
                    </p>
                  </div>
                </div>
                {event.description && <p className="mt-2 text-gray-600">{event.description}</p>}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className={`h-1.5 flex-1 rounded ${step >= 1 ? "bg-indigo-600" : "bg-gray-200"}`} />
                <div className={`h-1.5 flex-1 rounded ${step >= 2 ? "bg-indigo-600" : "bg-gray-200"}`} />
                <div className={`h-1.5 flex-1 rounded ${step >= 3 ? "bg-indigo-600" : "bg-gray-200"}`} />
              </div>
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900">Attendee Details</h2>
                  {!canBook && <p className="text-sm text-red-600">Booking is unavailable for this event.</p>}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      value={details.attendeeName}
                      onChange={(e) => handleDetailChange("attendeeName", e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={details.attendeeEmail}
                        onChange={(e) => handleDetailChange("attendeeEmail", e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="tel"
                        value={details.attendeePhone}
                        onChange={(e) => handleDetailChange("attendeePhone", e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Promo Code</label>
                    <input
                      type="text"
                      value={details.promoCode}
                      onChange={(e) => handleDetailChange("promoCode", e.target.value)}
                      placeholder="Enter code"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      rows={3}
                      value={details.notes}
                      onChange={(e) => handleDetailChange("notes", e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={details.acceptTerms}
                      onChange={(e) => handleDetailChange("acceptTerms", e.target.checked)}
                    />
                    <span>I agree to the terms and conditions</span>
                  </label>
                  <div className="flex justify-between mt-4">
                    <button
                      className="px-4 py-2 rounded-md bg-gray-100"
                      onClick={() => navigate(-1)}
                    >
                      Back
                    </button>
                    <button
                      className="px-4 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-50"
                      onClick={() => setStep(2)}
                      disabled={!attendeeValid || !canBook}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900">Tickets & Payment</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity</label>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={!canBook}
                      >
                        −
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
                        className="w-16 text-center px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={!canBook}
                      />
                      <button
                        className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
                        onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                        disabled={!canBook}
                      >
                        +
                      </button>
                      <span className="text-sm text-gray-500">Max {maxQty}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      {Object.keys(methodFields).map((m) => (
                        <button
                          key={m}
                          type="button"
                          className={`px-3 py-2 rounded-md border ${
                            paymentMethod === m ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-300"
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
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {qrDataUrl ? (
                          <img src={qrDataUrl} alt="UPI QR" className="w-28 h-28 rounded border" />
                        ) : (
                          <div className="w-28 h-28 bg-gray-200 rounded border" />
                        )}
                        <div className="text-sm text-gray-700">
                          <p className="font-semibold">Scan with your UPI app</p>
                          <p className="text-xs text-gray-500 mt-1">Amount: ₹{formatPrice(total)}</p>
                          {details.upiId && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">{details.upiId}</span>
                              <button
                                type="button"
                                className="text-xs px-2 py-1 rounded bg-indigo-600 text-white"
                                onClick={() => {
                                  const link = `upi://pay?pa=${details.upiId}&pn=${details.attendeeName || "Attendee"}&am=${Number(total || 0).toFixed(2)}&tn=${encodeURIComponent(`Booking: ${event?.title || "Event"}`)}`;
                                  navigator.clipboard?.writeText(link);
                                  toast.success("UPI link copied");
                                }}
                              >
                                Copy Link
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {fields.length > 0 && (
                    <div className="space-y-4">
                      {fields.map((f) => (
                        <div key={f.name}>
                          <label className="block text-sm font-medium text-gray-700">{f.label}</label>
                          {f.type === "select" ? (
                            <select
                              value={details[f.name] || ""}
                              onChange={(e) => handleDetailChange(f.name, e.target.value)}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              disabled={!canBook}
                            >
                              <option value="">Select</option>
                              {(f.options || []).map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={f.type}
                              value={details[f.name] || ""}
                              onChange={(e) => handleDetailChange(f.name, e.target.value)}
                              placeholder={f.placeholder}
                              maxLength={f.maxLength}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              disabled={!canBook}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t pt-4">
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-xl font-bold text-gray-900">₹{formatPrice(total)}</p>
                    </div>
                    <div className="flex gap-3">
                      <button className="px-4 py-2 rounded-md bg-gray-100" onClick={() => setStep(1)}>
                        Back
                      </button>
                      <button
                        className="px-4 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-50"
                        onClick={() => setStep(3)}
                        disabled={!canBook || quantity < 1 || quantity > maxQty}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900">Review & Confirm</h2>
                  <div className="border rounded-lg p-4">
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Event</p>
                        <p className="font-semibold">{event.title}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Date</p>
                        <p className="font-semibold">{new Date(event.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Attendee</p>
                        <p className="font-semibold">{details.attendeeName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Contact</p>
                        <p className="font-semibold">{details.attendeeEmail} • {details.attendeePhone}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Quantity</p>
                        <p className="font-semibold">{quantity}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Payment Method</p>
                        <p className="font-semibold">{paymentMethod}</p>
                      </div>
                    </div>
                    {details.promoCode && <p className="text-xs text-gray-500 mt-2">Promo code captured: {details.promoCode}</p>}
                    {details.notes && <p className="text-xs text-gray-500 mt-1">Notes: {details.notes}</p>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-2xl font-bold text-gray-900">₹{formatPrice(total)}</p>
                    </div>
                    <div className="flex gap-3">
                      <button className="px-4 py-2 rounded-md bg-gray-100" onClick={() => setStep(2)}>
                        Back
                      </button>
                      <button
                        className="px-5 py-2.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleBook}
                        disabled={!canBook || submitting || !attendeeValid}
                      >
                        {submitting ? "Processing..." : "Confirm Booking"}
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