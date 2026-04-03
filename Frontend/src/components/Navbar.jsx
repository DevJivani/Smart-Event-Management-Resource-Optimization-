import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../utils/axios";
import { setUser, setLoading } from "../redux/authSlice";
import { toast } from "react-hot-toast";
import { toggleTheme } from "../redux/themeSlice";
import "./LogoutButton.css";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const theme = useSelector((state) => state.theme);
  const mode = theme?.mode || 'light';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    dispatch(setLoading(true));
    try {
      await axiosInstance.get("/api/v1/user/logout");

      dispatch(setUser(null));
      navigate("/login");
    } catch (error) {
      console.log(error);
    } finally {
      dispatch(setLoading(false));
      setIsProfileOpen(false);
      setIsLoggingOut(false);
    }
  };

  const handleLogoutClick = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      handleLogout();
    }, 1500);
  };

  const fetchNotifications = async () => {
    try {
      if (!user) return;
      const res = await axiosInstance.get("/api/v1/notification/my");
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markRead = async (id) => {
    try {
      const res = await axiosInstance.patch(`/api/v1/notification/${id}/read`);
      if (res.data?.success) {
        setNotifications((list) =>
          list.map((n) => (String(n._id) === String(id) ? { ...n, isRead: true } : n))
        );
      }
    } catch {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      const res = await axiosInstance.patch(`/api/v1/notification/read-all`);
      if (res.data?.success) {
        setNotifications((list) => list.map((n) => ({ ...n, isRead: true })));
      }
    } catch {
      // ignore
    }
  };

  const deleteNotification = async (id) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/notification/${id}`);
      if (res.data?.success) {
        setNotifications((list) => list.filter((n) => String(n._id) !== String(id)));
      }
    } catch {
      // ignore
    }
  };

  // Lightweight fetch on open
  if (isNotifOpen && notifications.length === 0 && user) {
    void fetchNotifications();
  }
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const onFocus = () => fetchNotifications();
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchNotifications();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    const intervalId = setInterval(fetchNotifications, 15000);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(intervalId);
    };
  }, [user]);

  const navLinks =
    user?.role === "organizer"
      ? [
          { name: "Booked Tickets", path: "/organizer/bookings" },
          { name: "Events", path: "/organizer" },
          { name: "Scan Tickets", path: "/organizer/scanner" },
          { name: "Vouchers", path: "/organizer/vouchers" },
          { name: "Messages", path: "/organizer/messages" },
          { name: "Create Event", path: "/organizer/events/create" },
        ]
      : user?.role === "admin"
      ? [
          { name: "Dashboard", path: "/admin" },
          { name: "Booked Tickets", path: "/admin/bookings" },
          { name: "User Details", path: "/admin/users" },
          { name: "Organizer Details", path: "/admin/organizers" },
          { name: "Review", path: "/admin/reviews" },
        ]
      : [
          { name: "Home", path: "/" },
          { name: "Events", path: "/dashboard" },
          ...(user?.role === "user" ? [
            { name: "My Events", path: "/my-events" },
            { name: "Messages", path: "/messages" },
            { name: "Chats", path: "/chat" }
          ] : []),
          { name: "About", path: "/about" },
          { name: "Contact", path: "/contact" },
        ];

  // Ensure "Completed" link is present for organizer/admin only
  const displayLinks = (() => {
    const links = [...navLinks];
    if (user && user.role !== "user") {
      links.splice(2, 0, { name: "Completed", path: "/completed-events" });
    }
    return links;
  })();

  const isActivePath = (path) => location.pathname === path;
  const isOrganizerPage = location.pathname.startsWith('/organizer');
  const isProfilePage = location.pathname === '/profile';
  const isSettingsPage = location.pathname === '/settings';
  const isCompletedEventsPage = location.pathname === '/completed-events';
  const isChatPage = location.pathname.startsWith('/chat');
  const showSimpleLogout = (isOrganizerPage || isCompletedEventsPage || isChatPage || isSettingsPage || isProfilePage) && user?.role === 'organizer';

  const getBrandRedirectPath = () => {
    if ((isOrganizerPage || isCompletedEventsPage) && user?.role === "organizer") return "/organizer";
    if ((location.pathname.startsWith("/admin") || isCompletedEventsPage) && user?.role === "admin") return "/admin";
    return "/";
  };

  return (
    <nav className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to={getBrandRedirectPath()} className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              EventHub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3 ml-12">
            {displayLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-center leading-tight transition-all duration-300 ${
                  isActivePath(link.path)
                    ? "bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 text-purple-600 dark:text-purple-400 shadow-sm border border-purple-100/50 dark:border-purple-800/20"
                    : "text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-50/80 dark:hover:bg-gray-900/80"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Side - Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center gap-4 ml-8">
            {/* Theme Toggle Button */}
            <button
              onClick={() => dispatch(toggleTheme())}
              className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-center group"
              title={mode === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {mode === 'dark' ? (
                <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8a4 4 0 100 8 4 4 0 000-8z M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M4.93 19.07l1.41-1.41 M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {!user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsNotifOpen((o) => !o);
                      setIsProfileOpen(false);
                      if (!isNotifOpen) fetchNotifications();
                    }}
                    className="p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 relative transition-all duration-200 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 group"
                    title="Notifications"
                  >
                    <svg className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold ring-2 ring-white dark:ring-gray-950">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest text-[10px]">Notifications</span>
                        <button
                          className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                          onClick={markAllRead}
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-80 overflow-auto custom-scrollbar">
                        {(notifications || []).length === 0 ? (
                          <div className="px-4 py-8 text-sm text-gray-500 dark:text-gray-400 text-center italic">No new notifications</div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n._id} className="px-4 py-4 border-b border-gray-50 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-semibold truncate ${n.isRead ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-gray-100"}`}>{n.title}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                                  <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                  <button
                                    onClick={() => deleteNotification(n._id)}
                                    className="text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                                    title="Delete notification"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                  {!n.isRead && (
                                    <button
                                      className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                                      onClick={() => markRead(n._id)}
                                    >
                                      New
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-3 p-1.5 pr-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 group"
                  >
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform duration-200">
                      {user?.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.name || "Profile"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (user?.name?.charAt(0).toUpperCase() || "U")
                      )}
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[100px]">{user?.name || "User"}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-widest">{user?.role || "Member"}</p>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isProfileOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 py-3 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                      <div className="px-4 py-3 mb-2 border-b border-gray-50 dark:border-gray-800">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{user?.email}</p>
                      </div>
                      
                      <div className="space-y-1 px-2">
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl transition-all duration-200 group"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          My Profile
                        </Link>
                        
                        {user?.role === 'organizer' ? (
                          <Link
                            to="/organizer"
                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl transition-all duration-200 group"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            Events
                          </Link>
                        ) : (
                          <Link
                            to="/my-events"
                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl transition-all duration-200 group"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            My Events
                          </Link>
                        )}

                        <Link
                          to="/settings"
                          className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl transition-all duration-200 group"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          Settings
                        </Link>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800 px-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 group"
                        >
                          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 group-hover:bg-red-100 dark:group-hover:bg-red-900/40 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          </div>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {!showSimpleLogout ? (
                  <button
                    onClick={handleLogoutClick}
                    className={`logoutButton ${isLoggingOut ? "logging-out" : ""}`}
                    title="Logout"
                  >
                    <svg class="doorway" viewBox="0 0 100 100">
                      <path d="M93.4 86.3H58.6c-1.9 0-3.4-1.5-3.4-3.4V17.1c0-1.9 1.5-3.4 3.4-3.4h34.8c1.9 0 3.4 1.5 3.4 3.4v65.8c0 1.9-1.5 3.4-3.4 3.4z" />
                      <path class="bang" d="M40.5 43.7L26.6 31.4l-2.5 6.7zM41.9 50.4l-19.5-4-1.4 6.3zM40 57.4l-17.7 3.9 3.9 5.7z" />
                    </svg>
                    <svg class="figure" viewBox="0 0 100 100">
                      <circle cx="52.1" cy="32.4" r="6.4" />
                      <path d="M50.7 62.8c-1.2 2.5-3.6 5-7.2 4-3.2-.9-4.9-3.5-4-7.8.7-3.4 3.1-13.8 4.1-15.8 1.7-3.4 1.6-4.6 7-3.7 4.3.7 4.6 2.5 4.3 5.4-.4 3.7-2.8 15.1-4.2 17.9z" />
                      <g class="arm1">
                        <path d="M55.5 56.5l-6-9.5c-1-1.5-.6-3.5.9-4.4 1.5-1 3.7-1.1 4.6.4l6.1 10c1 1.5.3 3.5-1.1 4.4-1.5.9-3.5.5-4.5-.9z" />
                        <path class="wrist1" d="M69.4 59.9L58.1 58c-1.7-.3-2.9-1.9-2.6-3.7.3-1.7 1.9-2.9 3.7-2.6l11.4 1.9c1.7.3 2.9 1.9 2.6 3.7-.4 1.7-2 2.9-3.8 2.6z" />
                      </g>
                      <g class="arm2">
                        <path d="M34.2 43.6L45 40.3c1.7-.6 3.5.3 4 2 .6 1.7-.3 4-2 4.5l-10.8 2.8c-1.7.6-3.5-.3-4-2-.6-1.6.3-3.4 2-4z" />
                        <path class="wrist2" d="M27.1 56.2L32 45.7c.7-1.6 2.6-2.3 4.2-1.6 1.6.7 2.3 2.6 1.6 4.2L33 58.8c-.7 1.6-2.6 2.3-4.2 1.6-1.7-.7-2.4-2.6-1.7-4.2z" />
                      </g>
                      <g class="leg1">
                        <path d="M52.1 73.2s-7-5.7-7.9-6.5c-.9-.9-1.2-3.5-.1-4.9 1.1-1.4 3.8-1.9 5.2-.9l7.9 7c1.4 1.1 1.7 3.5.7 4.9-1.1 1.4-4.4 1.5-5.8.4z" />
                        <path class="calf1" d="M52.6 84.4l-1-12.8c-.1-1.9 1.5-3.6 3.5-3.7 2-.1 3.7 1.4 3.8 3.4l1 12.8c.1 1.9-1.5 3.6-3.5 3.7-2 0-3.7-1.5-3.8-3.4z" />
                      </g>
                      <g class="leg2">
                        <path d="M37.8 72.7s1.3-10.2 1.6-11.4 2.4-2.8 4.1-2.6c1.7.2 3.6 2.3 3.4 4l-1.8 11.1c-.2 1.7-1.7 3.3-3.4 3.1-1.8-.2-4.1-2.4-3.9-4.2z" />
                        <path class="calf2" d="M29.5 82.3l9.6-10.9c1.3-1.4 3.6-1.5 5.1-.1 1.5 1.4.4 4.9-.9 6.3l-8.5 9.6c-1.3 1.4-3.6 1.5-5.1.1-1.4-1.3-1.5-3.5-.2-5z" />
                      </g>
                    </svg>
                    <svg class="door" viewBox="0 0 100 100">
                      <path d="M93.4 86.3H58.6c-1.9 0-3.4-1.5-3.4-3.4V17.1c0-1.9 1.5-3.4 3.4-3.4h34.8c1.9 0 3.4 1.5 3.4 3.4v65.8c0 1.9-1.5 3.4-3.4 3.4z" />
                      <circle cx="66" cy="50" r="3.7" />
                    </svg>
                    <span class="button-text">Log Out</span>
                  </button>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="p-2.5 bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 flex items-center justify-center group"
                    title="Logout"
                  >
                    <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => dispatch(toggleTheme())}
              className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors border border-gray-100 dark:border-gray-700 flex items-center justify-center"
            >
              {mode === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8a4 4 0 100 8 4 4 0 000-8z M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M4.93 19.07l1.41-1.41 M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 animate-in slide-in-from-top duration-200">
          <div className="px-4 py-3 space-y-1">
            {displayLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActivePath(link.path)
                    ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800">
            {!user ? (
              <div className="space-y-3">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-3 border-2 border-purple-200 dark:border-purple-900/50 text-purple-600 dark:text-purple-400 font-medium rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-xl shadow-lg"
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-2 py-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold shadow-md">
                    {user?.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.name || "Profile"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (user?.name?.charAt(0).toUpperCase() || "U")
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                </div>
                
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Profile
                </Link>

                {user?.role !== 'organizer' && (
                  <Link
                    to="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </Link>
                )}
                
                {!showSimpleLogout ? (
                  <button
                    onClick={handleLogoutClick}
                    className={`logoutButton ${isLoggingOut ? "logging-out" : ""} flex items-center gap-3 w-full px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors`}
                  >
                    <div className="relative w-[130px] h-[40px]">
                      <svg class="doorway" viewBox="0 0 100 100" style={{ width: '24px', height: '24px', position: 'absolute', top: '8px', left: '12px' }}>
                        <path d="M93.4 86.3H58.6c-1.9 0-3.4-1.5-3.4-3.4V17.1c0-1.9 1.5-3.4 3.4-3.4h34.8c1.9 0 3.4 1.5 3.4 3.4v65.8c0 1.9-1.5 3.4-3.4 3.4z" />
                        <path class="bang" d="M40.5 43.7L26.6 31.4l-2.5 6.7zM41.9 50.4l-19.5-4-1.4 6.3zM40 57.4l-17.7 3.9 3.9 5.7z" />
                      </svg>
                      <svg class="figure" viewBox="0 0 100 100" style={{ width: '22px', height: '22px', position: 'absolute', top: '14px', left: '12px' }}>
                        <circle cx="52.1" cy="32.4" r="6.4" />
                        <path d="M50.7 62.8c-1.2 2.5-3.6 5-7.2 4-3.2-.9-4.9-3.5-4-7.8.7-3.4 3.1-13.8 4.1-15.8 1.7-3.4 1.6-4.6 7-3.7 4.3.7 4.6 2.5 4.3 5.4-.4 3.7-2.8 15.1-4.2 17.9z" />
                        <g class="arm1">
                          <path d="M55.5 56.5l-6-9.5c-1-1.5-.6-3.5.9-4.4 1.5-1 3.7-1.1 4.6.4l6.1 10c1 1.5.3 3.5-1.1 4.4-1.5.9-3.5.5-4.5-.9z" />
                          <path class="wrist1" d="M69.4 59.9L58.1 58c-1.7-.3-2.9-1.9-2.6-3.7.3-1.7 1.9-2.9 3.7-2.6l11.4 1.9c1.7.3 2.9 1.9 2.6 3.7-.4 1.7-2 2.9-3.8 2.6z" />
                        </g>
                        <g class="arm2">
                          <path d="M34.2 43.6L45 40.3c1.7-.6 3.5.3 4 2 .6 1.7-.3 4-2 4.5l-10.8 2.8c-1.7.6-3.5-.3-4-2-.6-1.6.3-3.4 2-4z" />
                          <path class="wrist2" d="M27.1 56.2L32 45.7c.7-1.6 2.6-2.3 4.2-1.6 1.6.7 2.3 2.6 1.6 4.2L33 58.8c-.7 1.6-2.6 2.3-4.2 1.6-1.7-.7-2.4-2.6-1.7-4.2z" />
                        </g>
                        <g class="leg1">
                          <path d="M52.1 73.2s-7-5.7-7.9-6.5c-.9-.9-1.2-3.5-.1-4.9 1.1-1.4 3.8-1.9 5.2-.9l7.9 7c1.4 1.1 1.7 3.5.7 4.9-1.1 1.4-4.4 1.5-5.8.4z" />
                          <path class="calf1" d="M52.6 84.4l-1-12.8c-.1-1.9 1.5-3.6 3.5-3.7 2-.1 3.7 1.4 3.8 3.4l1 12.8c.1 1.9-1.5 3.6-3.5 3.7-2 0-3.7-1.5-3.8-3.4z" />
                        </g>
                        <g class="leg2">
                          <path d="M37.8 72.7s1.3-10.2 1.6-11.4 2.4-2.8 4.1-2.6c1.7.2 3.6 2.3 3.4 4l-1.8 11.1c-.2 1.7-1.7 3.3-3.4 3.1-1.8-.2-4.1-2.4-3.9-4.2z" />
                          <path class="calf2" d="M29.5 82.3l9.6-10.9c1.3-1.4 3.6-1.5 5.1-.1 1.5 1.4.4 4.9-.9 6.3l-8.5 9.6c-1.3 1.4-3.6 1.5-5.1.1-1.4-1.3-1.5-3.5-.2-5z" />
                        </g>
                      </svg>
                      <svg class="door" viewBox="0 0 100 100" style={{ width: '24px', height: '24px', position: 'absolute', top: '8px', left: '12px' }}>
                        <path d="M93.4 86.3H58.6c-1.9 0-3.4-1.5-3.4-3.4V17.1c0-1.9 1.5-3.4 3.4-3.4h34.8c1.9 0 3.4 1.5 3.4 3.4v65.8c0 1.9-1.5 3.4-3.4 3.4z" />
                        <circle cx="66" cy="50" r="3.7" />
                      </svg>
                      <span class="button-text">Sign Out</span>
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
                  >
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;