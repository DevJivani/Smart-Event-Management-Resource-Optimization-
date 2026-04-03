import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import Navbar from "../components/Navbar";
import { setLoading, setUser } from "../redux/authSlice";
import axiosInstance from "../utils/axios";

const PENDING_IMAGE_KEY = "eventhub_pending_profile_image";

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// Password strength checker: at least 8 chars, uppercase, lowercase, digit, special char
const isStrongPassword = (password) => {
  if (!password || typeof password !== "string") return false;
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;
  return strongRegex.test(password);
};

function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const { user, loading } = useSelector((state) => state.auth);

  const [isEditMode, setIsEditMode] = useState(false);
  const [originalProfileForm, setOriginalProfileForm] = useState({
    name: "",
    phone: "",
  });

  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [eligibleVouchers, setEligibleVouchers] = useState([]);
  const [fetchingVouchers, setFetchingVouchers] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);

  // Guard
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const initialForm = {
      name: user.name || "",
      phone: user.phone || "",
      upiId: user.upiId || "",
    };
    setProfileForm(initialForm);
    setOriginalProfileForm(initialForm);
    setSelectedInterests(user.interests || []);
  }, [user, navigate]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosInstance.get("/api/v1/event/categories");
        if (res.data.success) {
          setCategories(res.data.categories || []);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const toggleInterest = (categoryId) => {
    setSelectedInterests((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getBadgeIcon = (iconName) => {
    switch (iconName) {
      case "medal": return "🏅";
      case "trophy": return "🏆";
      case "crown": return "👑";
      default: return "🌟";
    }
  };

  const handleUpdateInterests = async () => {
    try {
      dispatch(setLoading(true));
      const res = await axiosInstance.put(
        "/api/v1/user/profile/update",
        {
          userId: user._id,
          interests: selectedInterests,
        }
      );
      if (res.data.success) {
        dispatch(setUser(res.data.user));
        toast.success("Interests updated successfully");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update interests");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const fetchEligibleVouchers = async () => {
    try {
      setFetchingVouchers(true);
      const res = await axiosInstance.get("/api/v1/voucher/eligible");
      if (res.data.success) {
        setEligibleVouchers(res.data.vouchers || []);
      }
    } catch (error) {
      console.error("Error fetching vouchers", error);
    } finally {
      setFetchingVouchers(false);
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setBookingLoading(true);
        const res = await axiosInstance.get("/api/v1/booking/my");
        if (res.data.success) {
          setBookings(res.data.bookings || []);
        }
      } catch {
        // ignore
      } finally {
        setBookingLoading(false);
      }
    };
    if (user) {
      fetchBookings();
      fetchEligibleVouchers();
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    
    // Phone number validation - only digits and max 10 digits
    if (name === "phone") {
      const phoneValue = value.replace(/\D/g, ""); // Remove non-digits
      if (phoneValue.length <= 10) {
        setProfileForm((prev) => ({ ...prev, [name]: phoneValue }));
      }
      return;
    }
    
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // Switching from edit to view mode - reset changes
      setProfileForm(originalProfileForm);
    }
    setIsEditMode(!isEditMode);
  };

  const handleResetForm = () => {
    setProfileForm(originalProfileForm);
    toast.success("Form reset to original values");
  };

  const handlePasswordChange = (e) => {
    setPasswordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdateProfile = async (e) => {
    if (e) e.preventDefault();
    if (!user?._id) return;

    // Validation - check if fields are empty
    if (!profileForm.name || !profileForm.name.trim()) {
      toast.error("Full name cannot be empty");
      return;
    }

    if (!profileForm.phone || !profileForm.phone.trim()) {
      toast.error("Phone number cannot be empty");
      return;
    }

    // Validate phone number is exactly 10 digits
    if (profileForm.phone.length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }

    // Validate phone number contains only digits
    if (!/^\d{10}$/.test(profileForm.phone)) {
      toast.error("Phone number must contain only digits");
      return;
    }

    try {
      dispatch(setLoading(true));

      const res = await axiosInstance.put(
        "/api/v1/user/profile/update",
        {
          userId: user._id,
          name: profileForm.name,
          phone: profileForm.phone,
          upiId: profileForm.upiId,
        }
      );

      if (res.data.success) {
        dispatch(setUser(res.data.user));
        setOriginalProfileForm(profileForm); // Update original form with new values
        setIsEditMode(false); // Exit edit mode
        toast.success("Profile updated successfully");
      } else {
        toast.error(res.data.message || "Failed to update profile");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!user?._id) return;

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error("Please fill all password fields");
      return;
    }

    // Validate strong password
    if (!isStrongPassword(passwordForm.newPassword)) {
      toast.error("New password must be at least 8 characters and include uppercase, lowercase, number, and special character");
      return;
    }

    try {
      dispatch(setLoading(true));

      const res = await axios.put(
        `${API_BASE}/password/update`,
        {
          userId: user._id,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success("Password updated");
        setPasswordForm({ currentPassword: "", newPassword: "" });
      } else {
        toast.error(res.data.message || "Failed to change password");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handlePickAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    if (!user?._id) return;

    try {
      const base64 = await fileToBase64(file);
      localStorage.setItem(PENDING_IMAGE_KEY, base64);
    } catch (err) {
      console.warn("Could not store image in localStorage", err);
    }

    const form = new FormData();
    form.append("profileImage", file);
    form.append("userId", user._id);

    try {
      dispatch(setLoading(true));
      const res = await axiosInstance.post("/api/v1/user/profile/image", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        localStorage.removeItem(PENDING_IMAGE_KEY);
        dispatch(setUser(res.data.user));
        toast.success("Profile photo updated");
      } else {
        toast.error(res.data.message || "Upload failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed");
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (!user) return null;

  const avatarUrl = avatarPreview || user.profileImage || null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      {/* hero similar to Home */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-8 text-white">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden backdrop-blur-sm">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 absolute -bottom-2 -right-2">
                  <button
                    type="button"
                    onClick={handlePickAvatar}
                    className="w-9 h-9 rounded-xl bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-md border border-gray-100 dark:border-gray-700 hover:scale-110 transition-transform"
                    title="Change photo"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 7h4l2-2h6l2 2h4v14H3V7z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 17a4 4 0 100-8 4 4 0 000 8z"
                      />
                    </svg>
                  </button>
                    <button
                      type="button"
                      onClick={() => navigate("/settings")}
                      className="w-9 h-9 rounded-xl bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-md border border-gray-100 dark:border-gray-700 hover:scale-110 transition-transform"
                      title="Account Settings"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarSelected}
                />
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-1">
                  My Profile
                </h1>
                <p className="text-white/80 text-sm">
                  Manage your personal information and account security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* content similar feel to Home cards */}
      <main className="max-w-7xl mx-auto px-4 py-10 space-y-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Account details */}
          <section className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 transition-colors duration-300">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              Account details
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Update your basic profile information.
            </p>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    disabled={!isEditMode}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-all ${
                      isEditMode 
                        ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white" 
                        : "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    }`}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <div className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-sm flex items-center">
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {user.role === "organizer" ? "Organizer" : "User / Attendee"}
                    </span>
                    <span className={`ml-2 px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                      user.role === "organizer" 
                        ? "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400" 
                        : "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400"
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>

              {user.role === "organizer" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    UPI ID (for receiving payments)
                    {isEditMode && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-1">
                        (e.g., name@bank)
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="upiId"
                    value={profileForm.upiId}
                    onChange={handleProfileChange}
                    disabled={!isEditMode}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-all ${
                      isEditMode 
                        ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white" 
                        : "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    }`}
                    placeholder="name@bank"
                  />
                  {isEditMode && (
                    <p className="mt-1.5 text-[10px] text-gray-500 dark:text-gray-400 italic">
                      This ID will be used to generate the payment QR code for your events.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                  {isEditMode && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-1">
                      (10 digits only)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    disabled={!isEditMode}
                    maxLength="10"
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-all ${
                      isEditMode 
                        ? `bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white ${profileForm.phone.length === 10 ? "border-green-300 dark:border-green-900/50" : ""}` 
                        : "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    }`}
                    placeholder="10 digit number"
                  />
                  {isEditMode && profileForm.phone && (
                    <div className="absolute right-4 top-3 text-sm font-medium">
                      {profileForm.phone.length === 10 ? (
                        <span className="text-green-600 dark:text-green-400">✓ {profileForm.phone.length}/10</span>
                      ) : (
                        <span className="text-orange-600 dark:text-orange-400">{profileForm.phone.length}/10</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                {!isEditMode ? (
                  <button
                    type="button"
                    onClick={handleEditToggle}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleUpdateProfile}
                      disabled={loading}
                      className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 disabled:opacity-70 transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={handleEditToggle}
                      className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-900/50 hover:text-red-700 dark:hover:text-red-400 transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Summary card */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 transition-colors duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Profile summary
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold overflow-hidden shadow-sm">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (user.name?.charAt(0).toUpperCase() || "U")
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Keep your information up to date so we can personalize your
              event experience.
            </p>
          </section>
        </div>

        {/* Interests Section (Attendees Only) */}
        {user?.role !== 'organizer' && (
          <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 transition-colors duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Interests</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Select categories to get better event recommendations</p>
              </div>
              <button
                type="button"
                onClick={handleUpdateInterests}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium shadow-md transition-all disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Interests"}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => toggleInterest(cat._id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                    selectedInterests.includes(cat._id)
                      ? "bg-purple-600 border-purple-600 text-white shadow-md scale-105"
                      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-purple-300 dark:hover:border-purple-700"
                  }`}
                >
                  {cat.name}
                  {selectedInterests.includes(cat._id) && (
                    <span className="ml-2">✓</span>
                  )}
                </button>
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-gray-500 italic">Loading categories...</p>
              )}
            </div>
          </section>
        )}

        {/* Digital Event Passport Section */}
        {user?.role !== 'organizer' && (
          <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 md:p-8 transition-colors duration-300">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Digital Event Passport</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Your journey through events, stamps, and achievements.</p>
              </div>
              <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-xl text-sm font-bold border border-indigo-100 dark:border-indigo-800">
                {user.stamps?.length || 0} Stamps Earned
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Badges Column */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  Unlocked Badges
                </h3>
                {user.badges?.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {user.badges.map((badge, idx) => (
                      <div key={idx} className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex flex-col items-center text-center group hover:scale-105 transition-all">
                        <span className="text-4xl mb-2 group-hover:animate-bounce">{getBadgeIcon(badge.icon)}</span>
                        <p className="font-bold text-gray-900 dark:text-white text-xs">{badge.name}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{badge.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Attend events to unlock special badges!</p>
                  </div>
                )}
              </div>

              {/* Passport Stamps Column */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  Recent Stamps
                </h3>
                {user.stamps?.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {user.stamps.slice().reverse().map((stamp, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center text-xl shadow-sm border border-indigo-100 dark:border-indigo-800">
                          ✈️
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">Event Visited</p>
                          <p className="text-[10px] text-gray-500">{new Date(stamp.at).toLocaleDateString()} at {new Date(stamp.at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Your passport is empty. Start attending events!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Eligible Rewards Section */}
            {eligibleVouchers.length > 0 && (
              <div className="mt-12 border-t border-gray-100 dark:border-gray-800 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                    </span>
                    Available Rewards & Offers
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Showing offers you are eligible for</p>
                </div>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {eligibleVouchers.map((voucher) => (
                    <div key={voucher._id} className={`relative overflow-hidden border rounded-2xl p-5 group transition-all hover:shadow-md ${
                      voucher.requiredBadge 
                        ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5 border-emerald-200/50 dark:border-emerald-800/30' 
                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                    }`}>
                      {voucher.requiredBadge && (
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                      )}
                      
                      <div className="flex items-center gap-2 mb-2">
                        {voucher.requiredBadge ? (
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-md border border-emerald-200/50 dark:border-emerald-700/50">
                            {voucher.requiredBadge} Reward
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-[10px] font-bold rounded-md border border-gray-200 dark:border-gray-600">
                            General Offer
                          </span>
                        )}
                      </div>
                      
                      <h4 className={`text-2xl font-black mb-1 ${voucher.requiredBadge ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                        {voucher.discountType === "percentage" ? `${voucher.discountValue}%` : `₹${voucher.discountValue}`} OFF
                      </h4>
                      
                      <div className="flex items-center justify-between gap-2 mb-3 mt-4">
                        <div className="flex-1 bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                          <span className="font-mono text-sm font-bold tracking-widest text-gray-900 dark:text-white">
                            {voucher.code}
                          </span>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(voucher.code);
                            toast.success("Code copied!");
                          }}
                          className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
                          title="Copy Code"
                        >
                          <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-1 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 italic">Valid until {new Date(voucher.expiryDate).toLocaleDateString()}</p>
                        {voucher.eventId && (
                          <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold max-w-[100px] truncate" title={voucher.eventId.title}>
                            {voucher.eventId.title}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Security section */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 max-w-2xl transition-colors duration-300">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            Security
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Change your password regularly to keep your account safe.
          </p>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-all"
                placeholder="Enter current password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New password
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-all"
                placeholder="Enter new password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 disabled:opacity-70 transition-all"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        </section>

      </main>
    </div>
  );
}

export default Profile;