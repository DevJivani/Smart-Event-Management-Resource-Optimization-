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
      toast.error("Fix validation errors before saving");
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Edit Event</h1>
          <p className="text-gray-600 mt-1">Make changes and preview them before saving.</p>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
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
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 capitalize"
                    >
                      {["upcoming", "ongoing", "completed", "cancelled"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      disabled={!form.isPaid}
                    />
                    <p className="mt-1 text-xs text-gray-500">Enter price only if the event is paid.</p>
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
                    onClick={() => navigate(-1)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-50"
                    onClick={submit}
                    disabled={saving || !isValid}
                  >
                    {saving ? "Saving..." : "Save Changes"}
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
                {changedSummary.length > 0 && (
                  <div className="bg-white rounded-2xl shadow p-5">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Changes</h4>
                    <ul className="text-sm text-gray-700 space-y-2">
                      {changedSummary.slice(0, 8).map((c, idx) => (
                        <li key={idx} className="flex items-center justify-between">
                          <span className="capitalize">{c.field}</span>
                          <span className="text-xs text-gray-500">{String(c.from || "-")} → {String(c.to || "-")}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="bg-white rounded-2xl shadow p-5 border border-red-200">
                  <h4 className="text-sm font-semibold text-red-700 mb-2">Danger Zone</h4>
                  <p className="text-xs text-gray-600 mb-3">Cancel marks the event as cancelled. Delete permanently removes the event.</p>
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
                        <div className="flex flex-col gap-2">
                          <button
                            className="px-3 py-2 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700"
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
                            Activate Event
                          </button>
                          <button
                            className="px-3 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
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
                            Delete Event
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div className="flex flex-col gap-2">
                        <button
                          className="px-3 py-2 rounded-md bg-yellow-100 text-yellow-800 text-sm hover:bg-yellow-200"
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
                          className="px-3 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
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
                          Delete Event
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
