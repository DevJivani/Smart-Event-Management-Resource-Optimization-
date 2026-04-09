import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axios";
import { setUser } from "../redux/authSlice";
import toast from "react-hot-toast";

const LoginSuccess = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axiosInstance.get("/api/v1/user/me");
        if (res.data?.success) {
          dispatch(setUser(res.data.user));
          toast.success("Login successful!");
          
          // Redirect based on role
          const role = res.data.user.role;
          if (role === "admin") navigate("/admin/dashboard");
          else if (role === "organizer") navigate("/organizer/dashboard");
          else navigate("/dashboard");
        } else {
          toast.error("Failed to get user details");
          navigate("/login");
        }
      } catch (error) {
        console.error("SSO Login Error:", error);
        toast.error("Authentication failed. Please try again.");
        navigate("/login");
      }
    };

    fetchUser();
  }, [dispatch, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050505]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Completing login...</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Please wait while we sync your account.</p>
      </div>
    </div>
  );
};

export default LoginSuccess;
