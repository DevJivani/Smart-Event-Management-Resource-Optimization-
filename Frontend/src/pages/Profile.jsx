import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Navbar from "../components/Navbar";
import { setLoading, setUser } from "../redux/authSlice";

const API_BASE = "http://localhost:3000/api/v1/user";
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

  // Guard
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const initialForm = {
      name: user.name || "",
      phone: user.phone || "",
    };
    setProfileForm(initialForm);
    setOriginalProfileForm(initialForm);
  }, [user, navigate]);

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

      const res = await axios.put(
        `${API_BASE}/profile/update`,
        {
          userId: user._id,
          name: profileForm.name,
          phone: profileForm.phone,
        },
        { withCredentials: true }
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
      const res = await axios.post(`${API_BASE}/profile/image`, form, {
        withCredentials: true,
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
    <div className="min-h-screen bg-gray-50">
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
                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
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
                <button
                  type="button"
                  onClick={handlePickAvatar}
                  className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-white/90 text-purple-600 flex items-center justify-center shadow-md"
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
          <section className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Account details
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Update your basic profile information.
            </p>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    disabled={!isEditMode}
                    className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm ${
                      isEditMode ? "bg-white" : "bg-gray-50 cursor-not-allowed"
                    }`}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <div className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm flex items-center">
                    <span className="font-medium text-gray-900 capitalize">
                      {user.role === "organizer" ? "Organizer" : "User / Attendee"}
                    </span>
                    <span className={`ml-2 px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                      user.role === "organizer" 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-green-100 text-green-800"
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                  {isEditMode && (
                    <span className="text-xs text-gray-500 font-normal ml-1">
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
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm ${
                      isEditMode 
                        ? `bg-white border-gray-200 ${profileForm.phone.length === 10 ? "border-green-300" : "border-gray-200"}` 
                        : "bg-gray-50 cursor-not-allowed border-gray-200"
                    }`}
                    placeholder="10 digit number"
                  />
                  {isEditMode && profileForm.phone && (
                    <div className="absolute right-4 top-3 text-sm font-medium">
                      {profileForm.phone.length === 10 ? (
                        <span className="text-green-600">✓ {profileForm.phone.length}/10</span>
                      ) : (
                        <span className="text-orange-600">{profileForm.phone.length}/10</span>
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
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium shadow hover:shadow-lg transition-all duration-200 flex items-center gap-2"
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
                      className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-medium shadow hover:shadow-lg disabled:opacity-70 transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={handleEditToggle}
                      className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200 flex items-center gap-2"
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
          <section className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Profile summary
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold overflow-hidden">
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
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Keep your information up to date so we can personalize your
              event experience.
            </p>
          </section>
        </div>

        {/* Security section */}
        <section className="bg-white rounded-2xl shadow-md p-6 max-w-2xl">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Security
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Change your password regularly to keep your account safe.
          </p>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                placeholder="Enter current password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                placeholder="Enter new password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium shadow hover:shadow-lg disabled:opacity-70"
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


