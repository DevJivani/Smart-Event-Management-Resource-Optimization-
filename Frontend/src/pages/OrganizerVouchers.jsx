import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";

const OrganizerVouchers = () => {
  const { user } = useSelector((state) => state.auth);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    expiryDate: "",
    usageLimit: "",
    minAmount: 0,
    maxDiscount: "",
    eventIds: [],
    requiredBadge: "",
  });

  const [categories, setCategories] = useState([]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/v1/voucher/get");
      if (response.data.success) {
        setVouchers(response.data.vouchers);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching vouchers");
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await axiosInstance.get(`/api/v1/event/organizer/${user._id}`);
      if (response.data.success) {
        setEvents(response.data.events);
      }
    } catch (error) {
      console.error("Error fetching events", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get("/api/v1/event/categories");
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories", error);
    }
  };

  useEffect(() => {
    fetchVouchers();
    fetchEvents();
    fetchCategories();
  }, []);

  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        eventIds: formData.eventIds.length === 0 ? [] : formData.eventIds,
        requiredBadge: formData.requiredBadge === "" ? null : formData.requiredBadge,
      };

      const response = isEditing 
        ? await axiosInstance.put(`/api/v1/voucher/update/${editingId}`, dataToSubmit)
        : await axiosInstance.post("/api/v1/voucher/create", dataToSubmit);

      if (response.data.success) {
        toast.success(isEditing ? "Voucher updated successfully" : "Voucher created successfully");
        setShowModal(false);
        setIsEditing(false);
        setEditingId(null);
        fetchVouchers();
        setFormData({
          code: "",
          discountType: "percentage",
          discountValue: "",
          expiryDate: "",
          usageLimit: "",
          minAmount: 0,
          maxDiscount: "",
          eventIds: [],
          requiredBadge: "",
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Error ${isEditing ? "updating" : "creating"} voucher`);
    }
  };

  const handleEditClick = (voucher) => {
    setIsEditing(true);
    setEditingId(voucher._id);
    setFormData({
      code: voucher.code,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      expiryDate: new Date(voucher.expiryDate).toISOString().split('T')[0],
      usageLimit: voucher.usageLimit || "",
      minAmount: voucher.minAmount,
      maxDiscount: voucher.maxDiscount || "",
      eventIds: voucher.eventIds?.map(e => e._id) || [],
      requiredBadge: voucher.requiredBadge || "",
    });
    setShowModal(true);
  };

  const handleDeleteVoucher = async (id) => {
    if (!window.confirm("Are you sure you want to delete this voucher?")) return;
    try {
      const response = await axiosInstance.delete(`/api/v1/voucher/delete/${id}`);
      if (response.data.success) {
        toast.success("Voucher deleted successfully");
        fetchVouchers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting voucher");
    }
  };

  const handleToggleAdvertise = async (voucher) => {
    try {
      const newStatus = !voucher.isAdvertised;
      const response = await axiosInstance.put(`/api/v1/voucher/update/${voucher._id}`, { isAdvertised: newStatus });
      if (response.data.success) {
        toast.success(newStatus ? "Voucher is now advertised!" : "Advertisement stopped.");
        fetchVouchers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating advertisement status");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Manage Vouchers</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Create and distribute discount codes for your events.</p>
          </div>
          <button
            onClick={() => {
              setIsEditing(false);
              setEditingId(null);
              setFormData({
                code: "",
                discountType: "percentage",
                discountValue: "",
                expiryDate: "",
                usageLimit: "",
                minAmount: 0,
                maxDiscount: "",
                eventId: "",
                requiredBadge: "",
              });
              setShowModal(true);
            }}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Voucher
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 shadow-sm border dark:border-gray-800 overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Code</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Discount</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Expiry</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Usage</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Event</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Requirement</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                  {vouchers.map((voucher) => (
                    <tr key={voucher._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {voucher.isAdvertised ? (
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-md text-[10px] font-bold border border-purple-200 dark:border-purple-800 flex items-center gap-1 w-max">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                            Live Ad
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md text-[10px] font-bold border border-gray-200 dark:border-gray-700">
                            Hidden
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-bold border border-indigo-100 dark:border-indigo-900/50">
                          {voucher.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                        {voucher.discountType === "percentage" ? `${voucher.discountValue}% OFF` : `₹${voucher.discountValue} OFF`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {new Date(voucher.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{voucher.usedCount} used</span>
                          <span className="text-xs text-gray-500 dark:text-gray-500">Limit: {voucher.usageLimit || "∞"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {voucher.eventIds && voucher.eventIds.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{voucher.eventIds.length} Events</span>
                            <span className="text-[10px] text-gray-400 truncate max-w-[150px]">
                              {voucher.eventIds.map(e => e?.title).filter(Boolean).join(", ")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">All My Events</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {voucher.requiredBadge ? (
                          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md text-[10px] font-bold border border-emerald-100 dark:border-emerald-800">
                            {voucher.requiredBadge}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs italic">No Badge</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleToggleAdvertise(voucher)}
                            className={`p-2 rounded-lg transition-all ${
                              voucher.isAdvertised 
                                ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40" 
                                : "text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            }`}
                            title={voucher.isAdvertised ? "Stop Advertising" : "Advertise Voucher"}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEditClick(voucher)}
                            className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                            title="Edit Voucher"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteVoucher(voucher._id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            title="Delete Voucher"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {vouchers.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-300 dark:text-gray-600 mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 font-medium">No vouchers found. Create your first voucher!</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>
            
            <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white flex justify-between items-center">
                <h3 className="text-xl font-bold">{isEditing ? "Edit Voucher" : "Create New Voucher"}</h3>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateVoucher} className="p-8 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Voucher Code</label>
                  <input
                    type="text"
                    required
                    placeholder="E.G. SUMMER2024"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono uppercase"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Type</label>
                    <select
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Value</label>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Usage Limit</label>
                    <input
                      type="number"
                      placeholder="Unlimited"
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Min Spend</label>
                    <input
                      type="number"
                      placeholder="₹0"
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={formData.minAmount}
                      onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Applicable Events (Optional)</label>
                  <div className="max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-2">
                    {events.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No events found</p>
                    ) : (
                      events.map((event) => (
                        <label key={event._id} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            checked={formData.eventIds?.includes(event._id) || false}
                            onChange={(e) => {
                              const currentIds = formData.eventIds || [];
                              const newEventIds = e.target.checked
                                ? [...currentIds, event._id]
                                : currentIds.filter(id => id !== event._id);
                              setFormData({ ...formData, eventIds: newEventIds });
                            }}
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 transition-colors">{event.title}</span>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 ml-1 italic">Leave empty to apply to all your events.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Required Badge (Optional)</label>
                  <select
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={formData.requiredBadge}
                    onChange={(e) => setFormData({ ...formData, requiredBadge: e.target.value })}
                  >
                    <option value="">No Badge Required</option>
                    {categories.flatMap((cat) => [
                      { value: `${cat.name} Enthusiast`, label: `${cat.name} Enthusiast (5 events)` },
                      { value: `${cat.name} Expert`, label: `${cat.name} Expert (10 events)` },
                      { value: `${cat.name} Legend`, label: `${cat.name} Legend (20 events)` },
                    ]).map((badge) => (
                      <option key={badge.value} value={badge.value}>{badge.label}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-500 mt-1 ml-1 italic">Target loyal attendees with category-specific badges.</p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all transform hover:-translate-y-0.5 active:scale-95"
                  >
                    {isEditing ? "Update Voucher" : "Create Voucher"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerVouchers;