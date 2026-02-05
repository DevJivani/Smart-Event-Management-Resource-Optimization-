import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";

const EditEventModal = ({ event, onClose, onSave }) => {
    const { user } = useSelector((state) => state.auth);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: event.title,
        description: event.description || "",
        categoryId: event.categoryId?._id || "",
        startDate: event.startDate?.split("T")[0] || "",
        endDate: event.endDate?.split("T")[0] || "",
        startTime: event.startTime || "",
        endTime: event.endTime || "",
        venue: event.venue,
        city: event.city || "",
        totalSeats: event.totalSeats,
        status: event.status,
        bannerImage: null,
    });

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axiosInstance.get("/api/v1/event/categories");
                
                if (response.data.success) {
                    setCategories(response.data.categories);
                } else {
                    console.error("Failed to fetch categories:", response.data.message);
                    toast.error(response.data.message || "Failed to fetch categories");
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
                toast.error(error.response?.data?.message || "Failed to fetch categories");
            }
        };

        fetchCategories();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, files } = e.target;

        if (type === "file") {
            setFormData({ ...formData, [name]: files[0] });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (
            !formData.title ||
            !formData.categoryId ||
            !formData.startDate ||
            !formData.endDate ||
            !formData.venue ||
            !formData.totalSeats
        ) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            setLoading(true);

            const data = new FormData();
            data.append("title", formData.title);
            data.append("description", formData.description);
            data.append("categoryId", formData.categoryId);
            data.append("startDate", formData.startDate);
            data.append("endDate", formData.endDate);
            data.append("startTime", formData.startTime);
            data.append("endTime", formData.endTime);
            data.append("venue", formData.venue);
            data.append("city", formData.city);
            data.append("totalSeats", formData.totalSeats);
            data.append("status", formData.status);
            if (formData.bannerImage) {
                data.append("bannerImage", formData.bannerImage);
            }

            const response = await axiosInstance.put(
                `/api/v1/event/${event._id}/organizer/${user._id}`,
                data,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (response.data.success) {
                toast.success("Event updated successfully!");
                onSave();
            } else {
                toast.error(response.data.message || "Failed to update event");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Error updating event");
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Edit Event</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900">
                            Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Event title"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows="3"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Event description"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900">
                            Category *
                        </label>
                        <select
                            name="categoryId"
                            value={formData.categoryId}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select Category</option>
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900">
                            Start Date *
                        </label>
                        <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900">
                            End Date *
                        </label>
                        <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Start Time */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900">
                            Start Time
                        </label>
                        <input
                            type="time"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* End Time */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900">
                            End Time
                        </label>
                        <input
                            type="time"
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Venue */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900">
                            Venue *
                        </label>
                        <input
                            type="text"
                            name="venue"
                            value={formData.venue}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Venue name"
                        />
                    </div>

                    {/* City */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900">
                            City
                        </label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="City name"
                        />
                    </div>

                    {/* Total Seats */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900">
                            Total Seats *
                        </label>
                        <input
                            type="number"
                            name="totalSeats"
                            value={formData.totalSeats}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Number of seats"
                            min="1"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900">
                            Status
                        </label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="upcoming">Upcoming</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Banner Image */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900">
                            Banner Image
                        </label>
                        {event.bannerImage && (
                            <div className="mt-2 mb-4">
                                <img
                                    src={event.bannerImage}
                                    alt="Current banner"
                                    className="h-32 w-full object-cover rounded-lg"
                                />
                                <p className="text-sm text-gray-500 mt-2">
                                    Current banner image. Upload a new one to replace.
                                </p>
                            </div>
                        )}
                        <input
                            type="file"
                            name="bannerImage"
                            onChange={handleInputChange}
                            accept="image/*"
                            className="mt-1 block w-full"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? "Updating..." : "Update Event"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditEventModal;
