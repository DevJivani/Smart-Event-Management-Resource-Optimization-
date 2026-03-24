import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axios";
import { toast } from "react-hot-toast";
import Navbar from "../components/Navbar";
import { setUser, setLoading } from "../redux/authSlice";
import { toggleTheme } from "../redux/themeSlice";

const Settings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading } = useSelector((state) => state.auth);
  const theme = useSelector((state) => state.theme);
  const mode = theme?.mode || 'light';

  const [settings, setSettings] = useState({
    emailNotifications: user?.emailNotifications ?? true,
    publicProfile: user?.publicProfile ?? false,
    twoFactorAuth: user?.twoFactorAuth ?? false,
  });

  useEffect(() => {
    if (user) {
      setSettings({
        emailNotifications: user.emailNotifications ?? true,
        publicProfile: user.publicProfile ?? false,
        twoFactorAuth: user.twoFactorAuth ?? false,
      });
    }
  }, [user]);

  const handleToggle = async (name) => {
    const newValue = !settings[name];
    setSettings((prev) => ({ ...prev, [name]: newValue }));

    try {
      const res = await axiosInstance.put("/api/v1/user/settings", {
        [name]: newValue,
      });

      if (res.data.success) {
        dispatch(setUser(res.data.user));
        toast.success(`${name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} updated`);
      }
    } catch (error) {
      // Revert state on error
      setSettings((prev) => ({ ...prev, [name]: !newValue }));
      toast.error(error.response?.data?.message || "Failed to update setting");
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) {
      return;
    }

    try {
      dispatch(setLoading(true));
      const res = await axiosInstance.delete(`/api/v1/user/account`);
      if (res.data.success) {
        toast.success("Account deleted successfully");
        dispatch(setUser(null));
        navigate("/login");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete account");
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors group"
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <div className="flex flex-col items-center md:items-start text-white">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Settings</h1>
            <p className="text-white/80 text-lg max-w-2xl">
              Customize your experience and manage your account preferences.
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {/* Appearance Section */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 md:p-8 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1m-16 0H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.243 17.657l.707.707M7.071 7.071l.707.707M8 12a4 4 0 118 0 4 4 0 01-8 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Appearance</h2>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div>
              <p className="font-bold text-gray-900 dark:text-white">Dark Mode</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark themes</p>
            </div>
            <button
              onClick={() => dispatch(toggleTheme())}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
                mode === 'dark' ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  mode === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 md:p-8 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 rounded-2xl transition-colors cursor-pointer" onClick={() => handleToggle('emailNotifications')}>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Email Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Receive event updates and reminders via email</p>
              </div>
              <div className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${settings.emailNotifications ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </div>
          </div>
        </section>

        {/* Account Privacy Section */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 md:p-8 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy & Security</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 rounded-2xl transition-colors cursor-pointer" onClick={() => handleToggle('publicProfile')}>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Public Profile</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Allow others to see your attended events and reviews</p>
              </div>
              <div className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${settings.publicProfile ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings.publicProfile ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 rounded-2xl transition-colors cursor-pointer" onClick={() => handleToggle('twoFactorAuth')}>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security to your account</p>
              </div>
              <div className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${settings.twoFactorAuth ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </div>
          </div>
        </section>

        {/* Danger Zone Section */}
        <section className="bg-red-50 dark:bg-red-950/20 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30 p-6 md:p-8 transition-colors">
          <div className="flex items-center gap-3 mb-6 text-red-600 dark:text-red-400">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">Danger Zone</h2>
          </div>

          <div className="p-4 bg-white dark:bg-gray-900/50 rounded-2xl border border-red-100 dark:border-red-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="font-bold text-gray-900 dark:text-white">Delete Account</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Once you delete your account, there is no going back. Please be certain.</p>
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              Delete Account
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Settings;