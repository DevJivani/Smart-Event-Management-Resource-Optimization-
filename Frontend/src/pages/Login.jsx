import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../utils/axios";
import { toast } from "react-hot-toast";
import { setLoading, setUser } from "../redux/authSlice";
import { useNavigate, Link, useLocation } from 'react-router-dom';

const Login = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLocalLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("blocked") === "true") {
      toast.error("Your account has been blocked by the admin. Please contact support.");
      // Clean up the URL
      navigate("/login", { replace: true });
    }
  }, [location, navigate]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "user"
  });

  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [emailFor2FA, setEmailFor2FA] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setLocalLoading(true);

    try {
      const res = await axiosInstance.post(
        "/api/v1/user/verify-2fa",
        { email: emailFor2FA, otp }
      );

      if (res.data.success) {
        dispatch(setUser(res.data.loggedInUser));
        toast.success(res.data.message || "Login successful!");
        const role = res.data.loggedInUser?.role;
        if (role === 'organizer') navigate('/organizer');
        else if (role === 'user') navigate('/dashboard');
        else if (role === 'admin') navigate('/admin');
        else navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSubmit = async (e) => {
     e.preventDefault();
     setLocalLoading(true);
 
     try {
       const res = await axiosInstance.post(
         "/api/v1/user/login",
         formData
       );
 
       if (res.data.success) {
         if (res.data.twoFactorRequired) {
           setTwoFactorStep(true);
           setEmailFor2FA(res.data.email);
           toast.success("Verification code sent to your email");
           return;
         }
         
         dispatch(setUser(res.data.loggedInUser));
         toast.success("Login successful!");
         // Redirect based on role
         const role = res.data.loggedInUser?.role;
         if (role === 'organizer') navigate('/organizer');
         else if (role === 'user') navigate('/dashboard');
         else if (role === 'admin') navigate('/admin');
         else navigate('/');
       }
     } catch (error) {
       toast.error(error.response?.data?.message || "Login failed");
     } finally {
       setLocalLoading(false);
     }
   };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Decorative Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-700 via-indigo-600 to-blue-500 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-blue-400/10 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          {/* Event Icon */}
          <div className="mb-8">
            <svg className="w-24 h-24 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold mb-4 text-center">Welcome Back!</h1>
          <p className="text-xl text-white/80 text-center max-w-md mb-8">
            Manage your events, connect with attendees, and create unforgettable experiences.
          </p>
          
          {/* Feature List */}
          <div className="space-y-4 text-white/90">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Create & Manage Events</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Track Registrations</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Real-time Analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Form Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              {twoFactorStep ? "Two-Step Verification" : "Sign In"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {twoFactorStep 
                ? `Enter the code sent to ${emailFor2FA}` 
                : "Access your event management dashboard"}
            </p>
          </div>

          {twoFactorStep ? (
            /* 2FA Form */
            <form onSubmit={handleVerify2FA} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Verification Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength="6"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm font-bold tracking-widest text-center"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  "Verify & Sign In"
                )}
              </button>

              <button
                type="button"
                onClick={() => setTwoFactorStep(false)}
                className="w-full text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Go back to login
              </button>
            </form>
          ) : (
            /* Login Form */
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  placeholder="you@example.com"
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  placeholder="Enter your password"
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Login as
              </label>
              <div className="space-y-2">
                <label className="flex items-center p-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-all" style={{borderColor: formData.role === "user" ? "#7c3aed" : ""}}>
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    checked={formData.role === "user"}
                    onChange={handleChange}
                    className="w-4 h-4 text-purple-600 border-gray-300 dark:border-gray-600 focus:ring-purple-500"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">User / Attendee</p>
                  </div>
                </label>
                <label className="flex items-center p-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-all" style={{borderColor: formData.role === "organizer" ? "#7c3aed" : ""}}>
                  <input
                    type="radio"
                    name="role"
                    value="organizer"
                    checked={formData.role === "organizer"}
                    onChange={handleChange}
                    className="w-4 h-4 text-purple-600 border-gray-300 dark:border-gray-600 focus:ring-purple-500"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Organizer</p>
                  </div>
                </label>
                <label className="flex items-center p-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-all" style={{borderColor: formData.role === "admin" ? "#7c3aed" : ""}}>
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={formData.role === "admin"}
                    onChange={handleChange}
                    className="w-4 h-4 text-purple-600 border-gray-300 dark:border-gray-600 focus:ring-purple-500"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Admin</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-purple-600 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500" />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>

            {/* Google SSO Button */}
            <div className="mt-4">
              <a
                href="http://localhost:3000/api/v1/user/auth/google"
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.273 0 3.191 2.727 1.245 6.691l4.021 3.074z"
                  />
                  <path
                    fill="#34A853"
                    d="M16.04 18.013c-1.09.593-2.325.896-3.618.896-2.496 0-4.59-1.615-5.334-3.834L3.03 18.15c1.928 3.841 5.891 6.445 10.47 6.445 2.902 0 5.564-1.04 7.618-2.768l-5.078-3.814z"
                  />
                  <path
                    fill="#4285F4"
                    d="M22.545 12.273c0-.83-.075-1.636-.211-2.414H12v4.575h5.92c-.254 1.378-1.032 2.541-2.2 3.32l5.078 3.814c2.972-2.736 4.685-6.768 4.685-11.5c0-.604-.047-1.196-.138-1.795z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M7.088 15.075A7.07 7.07 0 0 1 6.545 12c0-1.09.255-2.12.709-3.034L3.233 5.892C2.182 7.636 1.545 9.718 1.545 12c0 2.282.637 4.364 1.688 6.109l3.855-3.034z"
                  />
                </svg>
                <span>Continue with Google</span>
              </a>
            </div>
          </form>
          )}

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400">New to EventHub?</span>
            </div>
          </div>

          {/* Register Link */}
          <Link
            to="/register"
            className="w-full py-3 px-4 border-2 border-purple-200 dark:border-purple-900/50 text-purple-600 dark:text-purple-400 font-semibold rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>Create an Account</span>
          </Link>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            By signing in, you agree to our{" "}
            <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;