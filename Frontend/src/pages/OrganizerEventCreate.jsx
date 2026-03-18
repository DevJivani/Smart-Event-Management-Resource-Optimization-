import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";

export default function OrganizerEventCreate() {
  const navigate = useNavigate();
  const { user, role } = useSelector((s) => s.auth);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    venue: "",
    city: "",
    totalSeats: "",
    isPaid: false,
    price: "0",
  });
  const [bannerPreview, setBannerPreview] = useState("");
  const bannerFileRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosInstance.get(`/api/v1/event/categories`);
        if (res.data?.success) setCategories(res.data.categories || []);
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  useEffect(() => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.categoryId) errs.categoryId = "Category is required";
    if (!form.startDate) errs.startDate = "Start date is required";
    if (!form.endDate) errs.endDate = "End date is required";
    if (!form.venue.trim()) errs.venue = "Venue is required";
    if (!form.city.trim()) errs.city = "City is required";
    const seats = Number(form.totalSeats || 0);
    if (Number.isNaN(seats) || seats <= 0) errs.totalSeats = "Total seats must be greater than 0";
    if (form.isPaid) {
      const price = Number(String(form.price || "0").replace(/,/g, "").replace(/[^\d.]/g, ""));
      if (!Number.isFinite(price) || price <= 0) errs.price = "Price must be greater than 0 for paid events";
    }
    try {
      const sd = new Date(form.startDate);
      const ed = new Date(form.endDate);
      if (ed < sd) errs.endDate = "End date cannot be earlier than start date";
    } catch {
      // ignore
    }
    setErrors(errs);
    setIsValid(Object.keys(errs).length === 0);
  }, [form]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBannerPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!user || role !== "organizer") {
      toast.error("Only organizers can create events");
      return;
    }
    if (!isValid) {
      toast.error("Fix validation errors before creating");
      return;
    }
    try {
      setSaving(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("organizerId", user._id);
      const file = bannerFileRef.current?.files?.[0];
      if (file) fd.append("bannerImage", file);
      const res = await axiosInstance.post(`/api/v1/event/create`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success) {
        toast.success("Event created");
        const id = res.data?.event?._id;
        navigate(id ? `/organizer/events/${id}` : "/organizer");
      } else {
        toast.error(res.data?.message || "Failed to create event");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Error creating event");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Create Event</h1>
          <p className="text-gray-600 mt-1">Fill in the details and preview before publishing.</p>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Event title"
                />
                {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Event description"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.categoryId && <p className="mt-1 text-xs text-red-600">{errors.categoryId}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paid</label>
                  <select
                    value={form.isPaid ? "paid" : "free"}
                    onChange={(e) => setForm((f) => ({ ...f, isPaid: e.target.value === "paid" }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                  {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                  {errors.endDate && <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                  <input
                    value={form.venue}
                    onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Venue name"
                  />
                  {errors.venue && <p className="mt-1 text-xs text-red-600">{errors.venue}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="City"
                  />
                  {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Seats</label>
                  <input
                    type="number"
                    min="0"
                    value={form.totalSeats}
                    onChange={(e) => setForm((f) => ({ ...f, totalSeats: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                  <p className="mt-1 text-xs text-gray-500">Must be a positive number.</p>
                  {errors.totalSeats && <p className="mt-1 text-xs text-red-600">{errors.totalSeats}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    disabled={!form.isPaid}
                  />
                  <p className="mt-1 text-xs text-gray-500">Set only for paid events.</p>
                  {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={bannerFileRef}
                  onChange={handleFile}
                  className="block w-full text-sm text-gray-700"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded-md border border-gray-300"
                  onClick={() => navigate("/organizer")}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-50"
                  onClick={submit}
                  disabled={saving || !isValid}
                >
                  {saving ? "Creating..." : "Create Event"}
                </button>
              </div>
            </div>
          </section>
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="h-40 bg-gray-100">
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100" />
                  )}
                </div>
                <div className="p-5 text-sm">
                  <p className="text-xs text-gray-500">Preview</p>
                  <p className="mt-1 text-base font-semibold text-gray-900">{form.title || "Untitled Event"}</p>
                  <p className="mt-2 text-gray-600 line-clamp-3">{form.description || "No description"}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="font-medium text-gray-900">{form.startDate || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Time</p>
                      <p className="font-medium text-gray-900">{form.startTime || "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Venue</p>
                      <p className="font-medium text-gray-900">{[form.venue, form.city].filter(Boolean).join(", ") || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
