import { useMemo, useState } from "react";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";

const formatPrice = (n) => Number(n || 0).toFixed(2);

const methodFields = {
  UPI: [
    { name: "upiId", label: "UPI ID", type: "text", placeholder: "name@bank" },
  ],
  Card: [
    { name: "cardNumber", label: "Card Number", type: "text", placeholder: "1234 5678 9012 3456", maxLength: 19 },
    { name: "nameOnCard", label: "Name on Card", type: "text", placeholder: "Full Name" },
    { name: "expiryMonth", label: "Expiry Month", type: "text", placeholder: "MM", maxLength: 2 },
    { name: "expiryYear", label: "Expiry Year", type: "text", placeholder: "YY", maxLength: 2 },
    { name: "cvv", label: "CVV", type: "password", placeholder: "***", maxLength: 4 },
  ],
  NetBanking: [
    { name: "bankName", label: "Bank", type: "select", options: ["HDFC", "ICICI", "SBI", "Axis", "Kotak"] },
  ],
  Wallet: [
    { name: "walletProvider", label: "Wallet", type: "select", options: ["Paytm", "PhonePe", "Amazon Pay", "Freecharge"] },
    { name: "walletNumber", label: "Wallet Number", type: "text", placeholder: "Registered mobile/email" },
  ],
};

const BookingModal = ({ event, onClose, onBooked }) => {
  const [step, setStep] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(false);

  const maxQty = Math.max(1, Number(event?.availableSeats || 1));
  const unitPrice = Number(event?.price || 0);
  const total = useMemo(() => unitPrice * (quantity || 1), [unitPrice, quantity]);

  const canContinueStep1 = quantity >= 1 && quantity <= maxQty;

  const canContinueStep2 = () => {
    const fields = methodFields[paymentMethod] || [];
    for (const f of fields) {
      const v = (details[f.name] || "").toString().trim();
      if (!v) return false;
      if (paymentMethod === "Card" && f.name === "cardNumber") {
        const digits = v.replace(/\s+/g, "");
        if (digits.length < 12) return false;
      }
      if (f.name === "expiryMonth") {
        const mm = Number(v);
        if (!(mm >= 1 && mm <= 12)) return false;
      }
      if (f.name === "expiryYear") {
        const yy = Number(v);
        if (!(yy >= 0 && yy <= 99)) return false;
      }
      if (f.name === "cvv") {
        if (!(v.length >= 3 && v.length <= 4)) return false;
      }
    }
    return true;
  };

  const handleBook = async () => {
    try {
      setLoading(true);
      const payload = {
        eventId: event._id,
        quantity,
        paymentMethod,
        paymentDetails: details,
      };
      const resp = await axiosInstance.post("/api/v1/booking/create", payload);
      if (resp.data.success) {
        toast.success("Booking confirmed");
        const invoiceUrl = `${axiosInstance.defaults.baseURL}/api/v1/booking/${resp.data.booking._id}/invoice`;
        onBooked?.();
        onClose();
        window.open(invoiceUrl, "_blank");
      } else {
        toast.error(resp.data.message || "Booking failed");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Error creating booking");
    } finally {
      setLoading(false);
    }
  };

  const fields = methodFields[paymentMethod] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white">{event.title}</h3>
              <p className="text-white/80 mt-1">₹{formatPrice(unitPrice)} per ticket</p>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">×</button>
          </div>
          <div className="mt-4 flex gap-2">
            <div className={`h-1.5 flex-1 rounded ${step >= 1 ? "bg-white" : "bg-white/40"}`} />
            <div className={`h-1.5 flex-1 rounded ${step >= 2 ? "bg-white" : "bg-white/40"}`} />
            <div className={`h-1.5 flex-1 rounded ${step >= 3 ? "bg-white" : "bg-white/40"}`} />
          </div>
        </div>

        <div className="p-6 space-y-6">
          {step === 1 && (
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <div className="mt-2 flex items-center">
                  <button
                    className="px-3 py-2 border rounded-l-md text-gray-700"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={maxQty}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(maxQty, Math.max(1, Number(e.target.value || 1))))}
                    className="w-full px-3 py-2 border-t border-b text-center"
                  />
                  <button
                    className="px-3 py-2 border rounded-r-md text-gray-700"
                    onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Available: {maxQty}</p>
              </div>
              <div className="flex flex-col justify-center">
                <div className="text-gray-700">Total</div>
                <div className="text-3xl font-extrabold">₹{formatPrice(total)}</div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {["UPI", "Card", "NetBanking", "Wallet"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`px-3 py-2 rounded-lg border ${paymentMethod === m ? "border-indigo-600 text-indigo-600" : "border-gray-300 text-gray-700"} bg-white hover:border-indigo-400`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {fields.map((f) =>
                  f.type === "select" ? (
                    <div key={f.name}>
                      <label className="block text-sm font-medium text-gray-700">{f.label}</label>
                      <select
                        value={details[f.name] || ""}
                        onChange={(e) => setDetails({ ...details, [f.name]: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select</option>
                        {f.options.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div key={f.name}>
                      <label className="block text-sm font-medium text-gray-700">{f.label}</label>
                      <input
                        type={f.type}
                        value={details[f.name] || ""}
                        maxLength={f.maxLength}
                        placeholder={f.placeholder}
                        onChange={(e) => setDetails({ ...details, [f.name]: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-900">{event.title}</div>
                  <div className="text-gray-700">₹{formatPrice(unitPrice)} × {quantity}</div>
                </div>
                <div className="mt-2 text-sm text-gray-600">{event.venue}{event.city ? `, ${event.city}` : ""}</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm text-gray-600">Payment: {paymentMethod}</div>
                  <div className="text-xl font-extrabold">₹{formatPrice(total)}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg">Cancel</button>
          <div className="flex gap-3">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700">
                Back
              </button>
            )}
            {step < 3 && (
              <button
                onClick={() => setStep(step + 1)}
                disabled={(step === 1 && !canContinueStep1) || (step === 2 && !canContinueStep2())}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50"
              >
                Continue
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleBook}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50"
              >
                {loading ? "Processing..." : "Pay & Download Invoice"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;