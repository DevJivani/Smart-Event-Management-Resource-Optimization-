import axios from "axios";

const axiosInstance = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true,
});

// Add a response interceptor to handle errors globally
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
        
        if (error.response?.status === 403 && error.response?.data?.isBlocked) {
            // Handle blocked user
            localStorage.removeItem("token");
            // We can toast the message here if needed, but let's just let the UI handle the redirect
            window.location.href = "/login?blocked=true";
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;