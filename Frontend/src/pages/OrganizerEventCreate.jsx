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
  const [showGuide, setShowGuide] = useState(false);
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
      if (!user?.upiId) errs.upiId = "You must set your UPI ID in your profile to create a paid event.";
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
      if (errors.upiId) {
        toast.error(errors.upiId);
      } else {
        toast.error("Fix validation errors before creating");
      }
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Create New Event</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Bring your event to life. Fill in the details below to get started.</p>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-3 gap-10">
          <section className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border dark:border-gray-800 p-8 space-y-8">
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center text-sm">1</span>
                  Basic Information
                </h3>
                <div className="grid gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Event Title</label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      placeholder="Give your event a catchy name"
                    />
                    {errors.title && <p className="mt-2 text-xs font-medium text-red-500 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      {errors.title}
                    </p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                    <textarea
                      rows={5}
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                      placeholder="Tell people what your event is about..."
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                      <select
                        value={form.categoryId}
                        onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                      >
                        <option value="">Select Category</option>
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                      {errors.categoryId && <p className="mt-2 text-xs font-medium text-red-500">{errors.categoryId}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Pricing Model</label>
                      <select
                        value={form.isPaid ? "paid" : "free"}
                        onChange={(e) => setForm((f) => ({ ...f, isPaid: e.target.value === "paid" }))}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                      >
                        <option value="free">Free Event</option>
                        <option value="paid">Paid Event</option>
                      </select>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 pt-4">
                  <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center text-sm">2</span>
                  Date & Time
                </h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Start Date</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    {errors.startDate && <p className="mt-2 text-xs font-medium text-red-500">{errors.startDate}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">End Date</label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    {errors.endDate && <p className="mt-2 text-xs font-medium text-red-500">{errors.endDate}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Start Time</label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">End Time</label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 pt-4">
                  <span className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center text-sm">3</span>
                  Location & Capacity
                </h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Venue Name</label>
                    <input
                      value={form.venue}
                      onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="E.G. Grand Ballroom"
                    />
                    {errors.venue && <p className="mt-2 text-xs font-medium text-red-500">{errors.venue}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">City</label>
                    <input
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="E.G. Mumbai"
                    />
                    {errors.city && <p className="mt-2 text-xs font-medium text-red-500">{errors.city}</p>}
                  </div>
                </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Total Capacity</label>
                      <input
                        type="number"
                        min="0"
                        value={form.totalSeats}
                        onChange={(e) => setForm((f) => ({ ...f, totalSeats: e.target.value }))}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                        placeholder="Number of available tickets"
                      />
                      {errors.totalSeats && <p className="mt-2 text-xs font-medium text-red-500">{errors.totalSeats}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Ticket Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={form.price}
                        onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="0"
                        disabled={!form.isPaid}
                      />
                      {errors.price && <p className="mt-2 text-xs font-medium text-red-500">{errors.price}</p>}
                      {errors.upiId && <p className="mt-2 text-xs font-medium text-red-500 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        {errors.upiId}
                      </p>}
                    </div>
                  </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 pt-4">
                  <span className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center text-sm">4</span>
                  Media & Banner
                </h3>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Event Banner</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-200 dark:border-gray-700 border-dashed rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600 dark:text-gray-400">
                        <label className="relative cursor-pointer bg-white dark:bg-gray-900 rounded-md font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus-within:outline-none">
                          <span>Upload a file</span>
                          <input
                            type="file"
                            accept="image/*"
                            ref={bannerFileRef}
                            onChange={handleFile}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-8">
                  <button
                    className="flex-1 px-6 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    onClick={() => navigate("/organizer")}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-[2] px-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 transition-all transform hover:-translate-y-0.5 active:scale-95"
                    onClick={submit}
                    disabled={saving}
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Event...
                      </span>
                    ) : "Publish Event"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <aside className="lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border dark:border-gray-800 overflow-hidden">
                <div className="p-5 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                  <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-widest text-xs">Live Preview</h4>
                </div>
                <div className="h-48 bg-gray-100 dark:bg-gray-800 relative">
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center text-gray-300 dark:text-gray-700">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-6 space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2">{form.title || "Your Event Title"}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{form.description || "Describe your event to attract attendees..."}</p>
                  
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="font-medium">{form.startDate || "Date TBD"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="font-medium">{form.startTime || "Time TBD"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="font-medium line-clamp-1">{[form.venue, form.city].filter(Boolean).join(", ") || "Location TBD"}</span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Ticket Price</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {form.isPaid ? `₹${form.price || "0"}` : "FREE"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl">
                <h4 className="font-bold mb-2">Need Help?</h4>
                <p className="text-indigo-100 text-xs leading-relaxed mb-4">Check our organizer guide for tips on how to create a successful event.</p>
                <button 
                  onClick={() => setShowGuide(true)}
                  className="w-full py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-xs font-bold transition-all border border-white/20"
                >
                  Read Organizer Guide
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Organizer Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-10 text-white relative flex-shrink-0 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-400/20 rounded-full -ml-12 -mb-12 blur-2xl"></div>
              
              <button 
                onClick={() => setShowGuide(false)}
                className="absolute top-6 right-6 p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-all border border-white/20 z-10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Organizer's Guide</h2>
                  <p className="text-indigo-100 text-sm font-medium mt-1">Master the art of event creation</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 sm:p-10 space-y-10 overflow-y-auto scrollbar-hide flex-1">
              <div className="grid gap-10">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm">1</div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">Captivate with Content</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      Use a <span className="text-indigo-600 dark:text-indigo-400 font-bold underline decoration-2 underline-offset-4">catchy title</span> and a detailed description. 
                      Explain exactly what attendees will experience, learn, or gain.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm">2</div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">Visual Storytelling</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      Upload a high-quality banner image. Events with vibrant visuals get <span className="text-purple-600 dark:text-purple-400 font-bold italic">70% more engagement</span>. 
                      Recommended size: 1200x630px.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm">3</div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">UPI & Payment Logic</h4>
                    <div className="p-5 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl space-y-4">
                      <div className="flex gap-3">
                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Set your UPI ID in your profile before creating a paid event.</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">A unique QR code is generated for your UPI ID during booking.</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 underline decoration-emerald-500/30">You must manually verify the UTR/Transaction ID in your dashboard.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 pb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm">4</div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">Review & Publish</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      Check your live preview on the right. Once you hit publish, our admins will review and approve your event within 24 hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex-shrink-0">
              <button 
                onClick={() => setShowGuide(false)}
                className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 uppercase tracking-widest text-xs"
              >
                Got it, let's create!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}