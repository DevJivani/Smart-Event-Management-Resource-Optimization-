import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "../utils/axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const AdBanner = () => {
  const { user } = useSelector((state) => state.auth);
  const [ads, setAds] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);

  const storageKey = user ? `adDismissed_${user._id}` : "adDismissed_guest";

  const fetchAds = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/api/v1/voucher/advertised");
      if (res.data.success && res.data.vouchers.length > 0) {
        setAds(res.data.vouchers);
        setIsVisible(true);
      }
    } catch (error) {
      console.error("Failed to fetch ads", error);
    }
  }, []);

  useEffect(() => {
    const adDismissed = localStorage.getItem(storageKey);
    if (!adDismissed) {
      fetchAds();
    } else {
      setIsVisible(false);
    }
  }, [storageKey, fetchAds]);

  useEffect(() => {
    if (ads.length > 1) {
      const interval = setInterval(() => {
        setIsFading(true);
        setTimeout(() => {
          setCurrentAdIndex((prevIndex) => (prevIndex + 1) % ads.length);
          setIsFading(false);
        }, 500);
      }, 6000);

      return () => clearInterval(interval);
    }
  }, [ads.length]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(storageKey, "true");
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Promo code copied!");
  };

  const handleClaimClick = (e) => {
    if (currentAd.eventIds && currentAd.eventIds.length > 1) {
      e.preventDefault();
      setShowEventsModal(true);
    }
  };

  if (!isVisible || ads.length === 0) return null;

  const currentAd = ads[currentAdIndex];
  const discountText = currentAd.discountType === "percentage" ? `${currentAd.discountValue}%` : `₹${currentAd.discountValue}`;

  return (
    <div className="relative group overflow-hidden bg-[#0a0a0a] border-b border-white/5 shadow-2xl">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-[-50%] left-[-10%] w-[100%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-600/40 via-transparent to-transparent animate-[pulse_8s_infinite]"></div>
        <div className="absolute bottom-[-50%] right-[-10%] w-[100%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-600/40 via-transparent to-transparent animate-[pulse_12s_infinite] delay-700"></div>
      </div>

      <div className="max-w-7xl mx-auto relative px-4 py-4 sm:px-6 lg:px-8">
        <div className={`flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-500 ${isFading ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
          
          {/* Left Content */}
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-yellow-400 blur-lg opacity-30 animate-pulse"></div>
              <div className="relative w-12 h-12 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-2xl flex items-center justify-center shadow-xl rotate-3">
                <svg className="w-7 h-7 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-md text-[10px] font-black uppercase tracking-tighter text-white/90">
                  Exclusive Deal
                </span>
                {currentAd.eventIds && currentAd.eventIds.length === 1 && (
                  <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded-md text-[10px] font-bold text-indigo-300">
                    {currentAd.eventIds[0].title}
                  </span>
                )}
                {currentAd.eventIds && currentAd.eventIds.length > 1 && (
                  <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded-md text-[10px] font-bold text-emerald-300">
                    {currentAd.eventIds.length} Events
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">
                Get <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">{discountText} OFF</span>
                <span className="text-white/60 text-sm ml-2 font-medium">
                  {currentAd.eventIds && currentAd.eventIds.length > 0 ? "on selected events!" : "on any event!"}
                </span>
              </h2>
            </div>
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex-1 md:flex-none flex items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-1 pr-3 hover:border-white/20 transition-all group/code">
              <div className="bg-white text-black px-4 py-2 rounded-xl font-mono text-sm font-black tracking-widest shadow-lg">
                {currentAd.code}
              </div>
              <button 
                onClick={() => copyCode(currentAd.code)}
                className="ml-3 text-white/40 hover:text-white transition-colors"
                title="Copy Code"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-1 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Link 
                to={currentAd.eventIds && currentAd.eventIds.length === 1 ? `/event/${currentAd.eventIds[0]._id}` : "/dashboard"}
                onClick={handleClaimClick}
                className="whitespace-nowrap px-6 py-3 bg-white text-black rounded-2xl font-black text-sm hover:bg-yellow-400 transition-all shadow-xl active:scale-95"
              >
                Claim Now
              </Link>
              <button 
                onClick={handleDismiss}
                className="p-3 text-white/30 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
                title="Dismiss"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Progress Bar (for multiple ads) */}
      {ads.length > 1 && (
        <div className="absolute bottom-0 left-0 h-[2px] bg-white/10 w-full">
          <div 
            key={currentAdIndex}
            className="h-full bg-gradient-to-r from-yellow-400 to-amber-600 animate-[progress_6s_linear_infinite]"
            style={{ width: '0%' }}
          ></div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}} />

      {/* Multiple Events Selection Modal */}
      {showEventsModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={() => setShowEventsModal(false)}></div>
            
            <div className="relative bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-8 text-white">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Select an Event</h3>
                    <p className="text-white/70 text-sm mt-1">This discount is valid for all events listed below.</p>
                  </div>
                  <button onClick={() => setShowEventsModal(false)} className="p-2 hover:bg-white/20 rounded-2xl transition-all">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-3 bg-white/10 rounded-2xl p-4 border border-white/10">
                  <div className="bg-white text-indigo-600 px-3 py-1.5 rounded-xl font-mono text-sm font-black tracking-widest">
                    {currentAd.code}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/90">Copy this code for checkout</p>
                </div>
              </div>

              <div className="p-8">
                <div className="grid gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {currentAd.eventIds.map((event) => (
                    <Link
                      key={event._id}
                      to={`/event/${event._id}`}
                      onClick={() => setShowEventsModal(false)}
                      className="group flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-3xl border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
                    >
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                        {event.bannerImage ? (
                          <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            🖼️
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {event.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.994 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          View Details & Book
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center text-indigo-600 shadow-sm border border-gray-100 dark:border-gray-700 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdBanner;