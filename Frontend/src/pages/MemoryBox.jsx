import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosInstance from '../utils/axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const MemoryBox = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const certificateRef = useRef(null);
    const { user } = useSelector((state) => state.auth);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [photo, setPhoto] = useState(null);
    const [officialPhotos, setOfficialPhotos] = useState([]);
    const [uploadingOfficial, setUploadingOfficial] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await axiosInstance.get(`/api/v1/memory-box/${eventId}`);
                if (res.data.success) {
                    setData(res.data);
                }
            } catch (err) {
                toast.error(err.response?.data?.message || "Failed to load memory box");
                navigate('/my-events');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [eventId, navigate]);

    const handleOfficialUpload = async (e) => {
        e.preventDefault();
        if (officialPhotos.length === 0) return toast.error("Please select at least one photo");

        try {
            setUploadingOfficial(true);
            const formData = new FormData();
            
            // Convert FileList to Array and append each file
            const filesArray = Array.from(officialPhotos);
            filesArray.forEach(file => {
                formData.append('officialPhotos', file);
            });

            console.log("FormData constructed with", filesArray.length, "files");

            const res = await axiosInstance.post(`/api/v1/memory-box/${eventId}/official`, formData, {
                headers: {
                    'Content-Type': undefined
                }
            });

            if (res.data.success) {
                toast.success("Official photos added successfully!");
                setOfficialPhotos([]);
                // Refresh data
                const updated = await axiosInstance.get(`/api/v1/memory-box/${eventId}`);
                setData(updated.data);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to upload official photos");
        } finally {
            setUploadingOfficial(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!photo) return toast.error("Please select a photo");

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('photo', photo);
            formData.append('message', message);

            const res = await axiosInstance.post(`/api/v1/memory-box/${eventId}/upload`, formData, {
                headers: {
                    'Content-Type': undefined
                }
            });

            if (res.data.success) {
                toast.success("Memory added successfully!");
                setMessage('');
                setPhoto(null);
                // Refresh data
                const updated = await axiosInstance.get(`/api/v1/memory-box/${eventId}`);
                setData(updated.data);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to upload memory");
        } finally {
            setUploading(false);
        }
    };

    const downloadCertificate = async () => {
        if (!certificateRef.current) return;

        try {
            toast.loading("Generating your certificate...", { id: 'cert' });
            
            // Wait a bit for rendering
            await new Promise(resolve => setTimeout(resolve, 500));

            const element = certificateRef.current;
            const isDark = document.documentElement.classList.contains('dark');
            
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                allowTaint: true,
                backgroundColor: isDark ? "#111827" : "#ffffff",
                onclone: (clonedDoc) => {
                    // Find the certificate in the cloned document
                    const clonedElement = clonedDoc.querySelector('.certificate-capture-area');
                    if (clonedElement) {
                        // Ensure visibility
                        clonedElement.style.visibility = 'visible';
                        clonedElement.style.display = 'block';
                        
                        // Targeted cleaning: Only override properties that use oklch
                        // but don't make everything the same color as the background!
                        const allElements = clonedElement.querySelectorAll('*');
                        
                        const fixStyle = (el) => {
                            const style = window.getComputedStyle(el);
                            
                            // Check background
                            if (style.backgroundColor.includes('oklch')) {
                                el.style.backgroundColor = isDark ? "#111827" : "#ffffff";
                            }
                            
                            // Check text color
                            if (style.color.includes('oklch')) {
                                // If it's a heading or has purple class, use purple
                                if (el.tagName === 'H3' || el.classList.contains('text-purple-600')) {
                                    el.style.color = "#9333ea";
                                } else {
                                    el.style.color = isDark ? "#ffffff" : "#111827";
                                }
                            }
                            
                            // Check borders
                            if (style.borderColor.includes('oklch')) {
                                el.style.borderColor = isDark ? "#374151" : "#e5e7eb";
                            }
                        };

                        fixStyle(clonedElement);
                        allElements.forEach(fixStyle);
                    }
                }
            });

            // Check if canvas has content
            if (canvas.width === 0 || canvas.height === 0) {
                throw new Error("Canvas capture failed - empty dimensions");
            }

            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px', // Use pixels for easier scaling
                format: [canvas.width, canvas.height] // Match PDF size to canvas size
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            
            const fileName = `Certificate_${(data?.event?.title || "Event").replace(/[^a-z0-9]/gi, '_')}.pdf`;
            pdf.save(fileName);
            
            toast.success("Certificate downloaded!", { id: 'cert' });
        } catch (error) {
            console.error("Certificate generation error:", error);
            toast.error("Failed to generate PDF. Try switching to Light mode.", { id: 'cert' });
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                {/* Header Section */}
                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[2.5rem] p-10 text-white shadow-2xl mb-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                        <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                    </div>
                    <div className="relative z-10">
                        <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Event Memory Box</span>
                        <h1 className="text-5xl font-black tracking-tight mb-2">{data.event.title}</h1>
                        <p className="text-white/80 text-lg flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(data.event.startDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left Column: Gallery & Upload */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* Organizer Upload Section */}
                        {data.isOrganizer && (
                            <section className="bg-purple-50 dark:bg-purple-900/10 rounded-[2.5rem] p-8 border-2 border-dashed border-purple-200 dark:border-purple-800/50">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                        <span className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white text-sm">📤</span>
                                        Manage Official Gallery
                                    </h2>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">Organizer Only</span>
                                </div>
                                <form onSubmit={handleOfficialUpload} className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1 relative group">
                                        <input 
                                            type="file" 
                                            multiple 
                                            accept="image/*"
                                            onChange={(e) => setOfficialPhotos(e.target.files)}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="h-full py-4 px-6 border-2 border-dashed border-purple-200 dark:border-purple-800 rounded-2xl flex items-center gap-4 group-hover:border-purple-400 transition-colors bg-white dark:bg-gray-900">
                                            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-xs font-bold text-gray-500">
                                                {officialPhotos.length > 0 ? `${officialPhotos.length} photos selected` : "Select Official Photos"}
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={uploadingOfficial}
                                        className="px-8 py-4 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 disabled:opacity-50 shadow-lg shadow-purple-500/20 whitespace-nowrap"
                                    >
                                        {uploadingOfficial ? "Uploading..." : "Upload Gallery"}
                                    </button>
                                </form>
                                <p className="mt-4 text-[10px] text-gray-500 italic">
                                    Note: These photos will appear in the "Official Gallery" for all attendees.
                                </p>
                            </section>
                        )}

                        {/* Official Photos */}
                        <section>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600">📸</span>
                                Official Gallery
                            </h2>
                            {data.event.officialPhotos.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {data.event.officialPhotos.map((url, i) => (
                                        <div key={i} className="aspect-square rounded-3xl overflow-hidden shadow-lg hover:scale-[1.02] transition-transform duration-500 cursor-pointer">
                                            <img src={url} alt="Official" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-10 bg-gray-100 dark:bg-gray-900 rounded-3xl text-center italic text-gray-500">
                                    Organizer hasn't uploaded official photos yet.
                                </div>
                            )}
                        </section>

                        {/* Attendee Moments */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                    <span className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600">✨</span>
                                    Shared Moments
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {data.attendeeGallery.map((entry) => (
                                    entry.photos.map((photo, i) => (
                                        <div key={`${entry._id}-${i}`} className="bg-white dark:bg-gray-900 rounded-3xl p-4 shadow-xl border border-gray-100 dark:border-gray-800">
                                            <div className="aspect-video rounded-2xl overflow-hidden mb-4">
                                                <img src={photo} alt="Memory" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold">
                                                    {entry.userId.profileImage ? <img src={entry.userId.profileImage} className="w-full h-full rounded-full" /> : entry.userId.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-gray-900 dark:text-white">{entry.userId.name}</p>
                                                    {entry.message && <p className="text-[10px] text-gray-500 italic mt-0.5">"{entry.message}"</p>}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ))}
                            </div>
                        </section>
                    </div>

                        {/* Actions & Certificate (Attendees Only) */}
                        <div className="space-y-8">
                            {/* Certificate Card */}
                            {!data.isOrganizer && (
                                <div className="relative group">
                                    <div 
                                        ref={certificateRef} 
                                        className="certificate-capture-area bg-white dark:bg-gray-900 rounded-[2rem] p-8 shadow-2xl border-4 border-double border-purple-100 dark:border-purple-900/30 relative text-center overflow-hidden"
                                        style={{ 
                                            backgroundColor: document.documentElement.classList.contains('dark') ? '#111827' : '#ffffff',
                                            borderColor: document.documentElement.classList.contains('dark') ? '#312e81' : '#f3e8ff' 
                                        }}
                                    >
                                        <div className="absolute top-4 left-4 right-4 bottom-4 border border-purple-50 dark:border-purple-900/10 rounded-[1.5rem] pointer-events-none"></div>
                                        <h3 className="text-lg font-black text-purple-600 uppercase tracking-widest mb-6" style={{ color: '#9333ea' }}>Certificate of Attendance</h3>
                                        <div className="py-6">
                                            <p className="text-gray-500 text-xs italic mb-2" style={{ color: '#6b7280' }}>This certifies that</p>
                                            <p className="text-2xl font-black text-gray-900 dark:text-white border-b-2 border-purple-100 inline-block px-4 pb-1 mb-4" style={{ color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#111827', borderBottomColor: '#f3e8ff' }}>{data.certificateData.userName}</p>
                                            <p className="text-gray-500 text-xs italic mb-2" style={{ color: '#6b7280' }}>successfully attended</p>
                                            <p className="text-lg font-bold text-gray-800 dark:text-gray-200" style={{ color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#1f2937' }}>{data.certificateData.eventTitle}</p>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-6" style={{ color: '#9ca3af' }}>Held on {new Date(data.certificateData.date).toLocaleDateString()}</p>
                                    </div>
                                    <button 
                                        onClick={downloadCertificate}
                                        className="mt-4 w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                                    >
                                        Download PDF
                                    </button>
                                </div>
                            )}

                        {/* Upload Form */}
                        {!data.isOrganizer && (
                            <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 shadow-2xl border border-gray-100 dark:border-gray-800">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">Add your Memory</h3>
                                <form onSubmit={handleUpload} className="space-y-4">
                                    <div className="relative group cursor-pointer">
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={(e) => setPhoto(e.target.files[0])}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                                        />
                                        <div className="py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center gap-2 group-hover:border-purple-400 transition-colors">
                                            <svg className="w-8 h-8 text-gray-300 group-hover:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                            </svg>
                                            <span className="text-xs font-bold text-gray-400">{photo ? photo.name : "Select Photo"}</span>
                                        </div>
                                    </div>
                                    <textarea 
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Add a short caption..."
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all h-24 resize-none"
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={uploading}
                                        className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 disabled:opacity-50 shadow-lg shadow-purple-500/20"
                                    >
                                        {uploading ? "Uploading..." : "Publish Memory"}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default MemoryBox;
