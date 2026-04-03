import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";

export default function OrganizerEventEdit() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, role } = useSelector((s) => s.auth);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [event, setEvent] = useState(null);
  const [categories, setCategories] = useState([]);
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
    status: "upcoming",
    isPaid: false,
    price: "0",
  });
  const [bannerPreview, setBannerPreview] = useState("");
  const bannerFileRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [eRes, cRes] = await Promise.all([
          axiosInstance.get(`/api/v1/event/${eventId}`),
          axiosInstance.get(`/api/v1/event/categories`),
        ]);
        if (!eRes.data?.success) throw new Error(eRes.data?.message || "Failed to load event");
        const ev = eRes.data.event;
        setEvent(ev);
        setForm({
          title: ev.title || "",
          description: ev.description || "",
          categoryId: ev.categoryId?._id || "",
          startDate: ev.startDate ? new Date(ev.startDate).toISOString().slice(0, 10) : "",
          endDate: ev.endDate ? new Date(ev.endDate).toISOString().slice(0, 10) : "",
          startTime: ev.startTime || "",
          endTime: ev.endTime || "",
          venue: ev.venue || "",
          city: ev.city || "",
          totalSeats: ev.totalSeats?.toString() || "",
          status: ev.status || "upcoming",
          isPaid: !!ev.isPaid,
          price: (ev.price ?? 0).toString(),
        });
        setBannerPreview(ev.bannerImage || "");
        if (cRes.data?.success) setCategories(cRes.data.categories || []);
      } catch (e) {
        toast.error(e.response?.data?.message || e.message || "Error loading edit data");
      } finally {
        setLoading(false);
      }
    };
    if (eventId) load();
  }, [eventId]);

  const canEdit = role === "organizer" && user?._id && event;
  const changedSummary = useMemo(() => {
    if (!event) return [];
    const entries = [];
    const compare = (k, v) => {
      const prev = (k === "categoryId") ? (event.categoryId?._id || "") : (event[k] ?? "");
      if ((prev ?? "")?.toString() !== (v ?? "")?.toString()) {
        entries.push({ field: k, from: prev, to: v });
      }
    };
    Object.entries(form).forEach(([k, v]) => compare(k, v));
    return entries;
  }, [form, event]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setBannerPreview(url);
  };

  useEffect(() => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.startDate) errs.startDate = "Start date is required";
    if (!form.venue.trim()) errs.venue = "Venue is required";
    if (!form.city.trim()) errs.city = "City is required";
    const seats = Number(form.totalSeats || 0);
    if (Number.isNaN(seats) || seats <= 0) errs.totalSeats = "Total seats must be greater than 0";
    if (form.isPaid) {
      const price = Number(form.price || 0);
      if (Number.isNaN(price) || price <= 0) errs.price = "Price must be greater than 0 for paid events";
      if (!user?.upiId) errs.upiId = "You must set your UPI ID in your profile for a paid event.";
    }
    if (form.endDate && form.startDate) {
      try {
        const sd = new Date(form.startDate);
        const ed = new Date(form.endDate);
        if (ed < sd) errs.endDate = "End date cannot be earlier than start date";
      } catch {
        // ignore parsing issues
      }
    }
    setErrors(errs);
    setIsValid(Object.keys(errs).length === 0);
  }, [form]);

  const submit = async () => {
    if (!canEdit) {
      toast.error("Not allowed");
      return;
    }
    if (!isValid) {
      if (errors.upiId) {
        toast.error(errors.upiId);
      } else {
        toast.error("Fix validation errors before saving");
      }
      return;
    }
    try {
      setSaving(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      const file = bannerFileRef.current?.files?.[0];
      if (file) fd.append("bannerImage", file);
      const res = await axiosInstance.put(
        `/api/v1/event/${eventId}/organizer/${user._id}`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (res.data?.success) {
        toast.success("Event updated");
        navigate(`/organizer/events/${eventId}`);
      } else {
        toast.error(res.data?.message || "Failed to update");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Error updating event");
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
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Edit Event</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Refine your event details. Changes are visible immediately after saving.</p>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-6 py-10">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-10">
            <section className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border dark:border-gray-800 p-8 space-y-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center text-sm">1</span>
                    General Info
                  </h3>
                  <div className="grid gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Event Title</label>
                      <input
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        placeholder="Event title"
                      />
                      {errors.title && <p className="mt-2 text-xs font-medium text-red-500">{errors.title}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                      <textarea
                        rows={5}
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                        placeholder="Event description"
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
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Current Status</label>
                        <select
                          value={form.status}
                          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all capitalize"
                        >
                          {["upcoming", "ongoing", "completed", "cancelled"].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 pt-4">
                    <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center text-sm">2</span>
                    Schedule
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
                    Venue & Pricing
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Venue</label>
                      <input
                        value={form.venue}
                        onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                        placeholder="Venue name"
                      />
                      {errors.venue && <p className="mt-2 text-xs font-medium text-red-500">{errors.venue}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">City</label>
                      <input
                        value={form.city}
                        onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                        placeholder="City"
                      />
                      {errors.city && <p className="mt-2 text-xs font-medium text-red-500">{errors.city}</p>}
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Total Capacity</label>
                      <input
                        type="number"
                        min="0"
                        value={form.totalSeats}
                        onChange={(e) => setForm((f) => ({ ...f, totalSeats: e.target.value }))}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                      {errors.totalSeats && <p className="mt-2 text-xs font-medium text-red-500">{errors.totalSeats}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Type</label>
                      <select
                        value={form.isPaid ? "paid" : "free"}
                        onChange={(e) => setForm((f) => ({ ...f, isPaid: e.target.value === "paid" }))}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                      >
                        <option value="free">Free</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={form.price}
                        onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
                        disabled={!form.isPaid}
                      />
                      {errors.price && <p className="mt-2 text-xs font-medium text-red-500">{errors.price}</p>}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 pt-4">
                    <span className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center text-sm">4</span>
                    Media
                  </h3>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Update Banner</label>
                    <input
                      type="file"
                      accept="image/*"
                      ref={bannerFileRef}
                      onChange={handleFile}
                      className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-600 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50 transition-all cursor-pointer"
                    />
                  </div>

                  <div className="flex gap-4 pt-8">
                    <button
                      className="flex-1 px-6 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                      onClick={() => navigate(-1)}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      className="flex-[2] px-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 transition-all transform hover:-translate-y-0.5 active:scale-95"
                      onClick={submit}
                      disabled={saving || !isValid}
                    >
                      {saving ? "Saving Changes..." : "Save Changes"}
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
                  <div className="h-48 bg-gray-100 dark:bg-gray-800">
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
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2">{form.title || "Untitled Event"}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{form.description || "No description"}</p>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Date</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{form.startDate || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Time</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{form.startTime || "-"}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Venue</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{[form.venue, form.city].filter(Boolean).join(", ") || "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>  

                {changedSummary.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border dark:border-gray-800 p-6">
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Pending Changes ({changedSummary.length})</h4>
                    <div className="space-y-3">
                      {changedSummary.slice(0, 5).map((c, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400 capitalize">{c.field}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 line-through truncate max-w-[60px]">{String(c.from || "-")}</span>
                            <svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" /></svg>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[80px]">{String(c.to || "-")}</span>
                          </div>
                        </div>
                      ))}
                      {changedSummary.length > 5 && <p className="text-[10px] text-center text-gray-400 pt-2">+ {changedSummary.length - 5} more changes</p>}
                    </div>
                  </div>
                )}

                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border-2 border-red-50 dark:border-red-900/20 p-6">
                  <h4 className="text-sm font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth="2" /></svg>
                    Danger Zone
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">Changes here are irreversible. Please proceed with caution.</p>
                  
                  {(() => {
                    const currentStatus = (form.status || event?.status || "upcoming").toLowerCase();
                    const isCancelled = currentStatus === "cancelled";
                    const computeReopenStatus = () => {
                      try {
                        const sd = form.startDate ? new Date(form.startDate + "T" + (form.startTime || "00:00")) : null;
                        const ed = form.endDate ? new Date(form.endDate + "T" + (form.endTime || "23:59")) : null;
                        const now = new Date();
                        if (sd && now >= sd && (!ed || now <= ed)) return "ongoing";
                        return "upcoming";
                      } catch {
                        return "upcoming";
                      }
                    };
                    if (isCancelled) {
                      return (
                        <div className="flex flex-col gap-3">
                          <button
                            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
                            onClick={async () => {
                              const next = computeReopenStatus();
                              try {
                                const res = await axiosInstance.put(
                                  `/api/v1/event/${eventId}/organizer/${user._id}`,
                                  { status: next }
                                );
                                if (res.data?.success) {
                                  toast.success(`Event reopened as ${next}`);
                                  navigate(`/organizer/events/${eventId}`);
                                } else {
                                  toast.error(res.data?.message || "Failed to reopen");
                                }
                              } catch (e) {
                                toast.error(e.response?.data?.message || "Error reopening event");
                              }
                            }}
                          >
                            Re-activate Event
                          </button>
                          <button
                            className="w-full py-3 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition-all"
                            onClick={async () => {
                              if (!window.confirm("This will delete the event permanently. Continue?")) return;
                              try {
                                const res = await axiosInstance.delete(`/api/v1/event/${eventId}/organizer/${user._id}`);
                                if (res.data?.success) {
                                  toast.success("Event deleted");
                                  navigate("/organizer");
                                } else {
                                  toast.error(res.data?.message || "Failed to delete");
                                }
                              } catch (e) {
                                toast.error(e.response?.data?.message || "Error deleting event");
                              }
                            }}
                          >
                            Permanently Delete
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div className="flex flex-col gap-3">
                        <button
                          className="w-full py-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-all"
                          onClick={async () => {
                            try {
                              const res = await axiosInstance.put(
                                `/api/v1/event/${eventId}/organizer/${user._id}`,
                                { status: "cancelled" }
                              );
                              if (res.data?.success) {
                                toast.success("Event cancelled");
                                navigate(`/organizer/events/${eventId}`);
                              } else {
                                toast.error(res.data?.message || "Failed to cancel");
                              }
                            } catch (e) {
                              toast.error(e.response?.data?.message || "Error cancelling event");
                            }
                          }}
                        >
                          Cancel Event
                        </button>
                        <button
                          className="w-full py-3 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition-all"
                          onClick={async () => {
                            if (!window.confirm("This will delete the event permanently. Continue?")) return;
                            try {
                              const res = await axiosInstance.delete(`/api/v1/event/${eventId}/organizer/${user._id}`);
                              if (res.data?.success) {
                                toast.success("Event deleted");
                                navigate("/organizer");
                              } else {
                                toast.error(res.data?.message || "Failed to delete");
                              }
                            } catch (e) {
                              toast.error(e.response?.data?.message || "Error deleting event");
                            }
                          }}
                        >
                          Permanently Delete
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}