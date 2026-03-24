import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import axiosInstance from "../utils/axios";
import { toast } from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const OrganizerScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      #reader {
        border: none !important;
        background-color: transparent !important;
      }
      #reader__status_span {
        display: none !important;
      }
      #reader__dashboard_section_csr button {
        background-color: #4f46e5 !important;
        color: white !important;
        padding: 0.5rem 1rem !important;
        border-radius: 0.75rem !important;
        font-weight: 700 !important;
        border: none !important;
        cursor: pointer !important;
        transition: all 0.2s !important;
        margin: 0.5rem !important;
        text-transform: uppercase !important;
        font-size: 0.75rem !important;
        letter-spacing: 0.05em !important;
      }
      #reader__dashboard_section_csr button:hover {
        background-color: #4338ca !important;
        transform: translateY(-1px) !important;
      }
      #reader__scan_region {
        background: transparent !important;
      }
      #reader__scan_region video {
        border-radius: 1.5rem !important;
      }
      .scanner-line {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg, transparent, #4f46e5, transparent);
        animation: scan 2s linear infinite;
        z-index: 10;
      }
      @keyframes scan {
        0% { top: 0; }
        100% { top: 100%; }
      }
      body.dark #reader__dashboard_section_swaplink {
        color: #9ca3af !important;
      }
      #reader__dashboard_section_swaplink {
        color: #6b7280 !important;
      }
    `;
    document.head.appendChild(style);

    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    });

    scanner.render(onScanSuccess, onScanError);

    async function onScanSuccess(decodedText) {
      if (isVerifying) return;
      
      // Stop scanning while verifying
      if (scanner.getState() === "SCANNING") {
        scanner.pause();
      }
      setIsVerifying(true);
      setError(null);

      try {
        const res = await axiosInstance.post("/api/v1/booking/verify-ticket", {
          ticketSecret: decodedText
        });

        if (res.data.success) {
          setScanResult(res.data.booking);
          toast.success(res.data.message);
        }
      } catch (err) {
        const errMsg = err.response?.data?.message || "Invalid ticket or verification failed";
        setError(errMsg);
        toast.error(errMsg);
        
        if (err.response?.data?.booking) {
            setScanResult(err.response.data.booking);
        }
      } finally {
        setIsVerifying(false);
        // Resume scanning after a delay
        setTimeout(() => {
            if (scanner) scanner.resume();
        }, 3000);
      }
    }

    function onScanError(err) {
      // console.warn(err);
    }

    return () => {
      document.head.removeChild(style);
      scanner.clear().catch(e => console.error("Failed to clear scanner", e));
    };
  }, []);

  const resetScan = () => {
    setScanResult(null);
    setError(null);
  };
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      
      {/* Header Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="absolute inset-0 bg-slate-950">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-purple-600/20" />
          <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(circle_at_50%_50%,#4f46e5,transparent_70%)]" />
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Organizer Tools
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Ticket <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Scanner</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            Real-time ticket verification for your events. Ensure a smooth entry process for your attendees.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 -mt-12 pb-20 relative z-10">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left Column: Scanner */}
          <div className="lg:col-span-7 space-y-6 scanner-container">
            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden group">
              <div className="relative aspect-square md:aspect-video bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden">
                <div id="reader" className="w-full h-full"></div>
                
                {/* Custom Scanner Overlay UI */}
                {!scanResult && !isVerifying && (
                  <div className="absolute inset-0 pointer-events-none z-20">
                    <div className="scanner-line" />
                  </div>
                )}

                {/* Status Overlay */}
                {isVerifying && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-white font-black text-xl tracking-tight">Verifying...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scanning Guide - Desktop Only */}
            <div className="hidden lg:block bg-white dark:bg-gray-900 rounded-[2rem] p-8 shadow-xl border border-gray-100 dark:border-gray-800">
              <h4 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Pro Tips for Faster Scanning
              </h4>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xs font-black">01</div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed">Maintain steady hands and good lighting.</p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xs font-black">02</div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed">Ask attendees to increase screen brightness.</p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xs font-black">03</div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed">Distance should be about 15-20cm from camera.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Results & Info */}
          <div className="lg:col-span-5 space-y-6">
            {scanResult ? (
              <div className={`bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-2xl border-2 transition-all duration-500 ${error ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-emerald-500 ring-4 ring-emerald-500/10'}`}>
                <div className="flex items-center justify-center mb-8 relative">
                  <div className={`absolute inset-0 blur-3xl opacity-20 ${error ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                  <div className={`relative w-24 h-24 rounded-3xl flex items-center justify-center rotate-12 transition-transform duration-500 group-hover:rotate-0 ${error ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}>
                    {error ? (
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                    ) : (
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    )}
                  </div>
                </div>

                <div className="text-center mb-10">
                  <h2 className={`text-3xl font-black mb-3 ${error ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {error ? 'Invalid Ticket' : 'Entry Approved'}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-xs">{error || 'Ticket has been successfully verified'}</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-4">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Attendee</span>
                      <span className="text-sm font-black text-gray-900 dark:text-white">{scanResult.userId?.name || 'Unknown User'}</span>
                    </div>
                    <div className="h-px bg-gray-200 dark:bg-gray-700 w-full" />
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Event</span>
                      <span className="text-sm font-black text-gray-900 dark:text-white text-right ml-4 line-clamp-1 max-w-[150px]">{scanResult.eventId?.title}</span>
                    </div>
                    <div className="h-px bg-gray-200 dark:bg-gray-700 w-full" />
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Quantity</span>
                      <span className="text-sm font-black text-gray-900 dark:text-white">{scanResult.quantity} Person{scanResult.quantity > 1 ? 's' : ''}</span>
                    </div>
                    <div className="h-px bg-gray-200 dark:bg-gray-700 w-full" />
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${scanResult.checkInStatus === 'checked-in' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                        {scanResult.checkInStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={resetScan}
                  className="w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10 dark:shadow-white/10 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Scan Next Ticket
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-12 shadow-xl border border-gray-100 dark:border-gray-800 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full animate-pulse" />
                  <div className="relative w-28 h-28 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 border-2 border-dashed border-indigo-200 dark:border-indigo-800">
                    <svg className="w-12 h-12 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                  </div>
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Ready to Scan</h3>
                <p className="text-gray-500 dark:text-gray-400 font-bold max-w-[200px] leading-relaxed">Position a ticket QR code within the frame to verify entry.</p>
              </div>
            )}

            {/* Stats Card - Placeholder for future improvements */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative flex items-center justify-between">
                <div>
                  <h4 className="text-indigo-100 font-black text-xs uppercase tracking-[0.2em] mb-2">Live Session</h4>
                  <p className="text-2xl font-black tracking-tight">Active Scanning</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black block leading-none">0%</span>
                  <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Attendance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrganizerScanner;