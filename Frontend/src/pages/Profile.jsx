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

function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const { user, loading } = useSelector((state) => state.auth);

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
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

    setProfileForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
    });
  }, [user, navigate]);

  const handleProfileChange = (e) => {
    setProfileForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e) => {
    setPasswordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user?._id) return;

    try {
      dispatch(setLoading(true));

      const res = await axios.put(
        `${API_BASE}/profile/update`,
        {
          userId: user._id,
          name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone,
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        dispatch(setUser(res.data.user));
        toast.success("Profile updated");
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

            <form onSubmit={handleUpdateProfile} className="space-y-4">
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
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
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
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  placeholder="+91 00000 00000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium shadow hover:shadow-lg disabled:opacity-70"
                >
                  {loading ? "Saving..." : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileForm({
                      name: user.name || "",
                      email: user.email || "",
                      phone: user.phone || "",
                    });
                    toast.success("Reset");
                  }}
                  className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>
            </form>
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


