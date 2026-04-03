import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import axiosInstance from '../utils/axios'
import Navbar from './Navbar'
import Footer from './Footer'
import AdBanner from './AdBanner'

function Home() {
  const { user } = useSelector((state) => state.auth)
  const [events, setEvents] = useState([])
  const [recommendedEvents, setRecommendedEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [recLoading, setRecLoading] = useState(false)
  const [smartQuery, setSmartQuery] = useState('')
  const [smartResults, setSmartResults] = useState(null)
  const [isSmartSearching, setIsSmartSearching] = useState(false)

  const handleSmartSearch = async (e) => {
    e.preventDefault()
    if (!smartQuery.trim()) return
    
    try {
      setIsSmartSearching(true)
      const res = await axiosInstance.get(`/api/v1/event/smart-search?query=${encodeURIComponent(smartQuery)}`)
      if (res.data?.success) {
        setSmartResults({
          events: res.data.events,
          analysis: res.data.analysis
        })
      }
    } catch (err) {
      console.error("Smart search error:", err)
    } finally {
      setIsSmartSearching(false)
    }
  }
  const HERO_INTERVAL_MS = 5000
  const OVERLAY_OPACITY = 0.55
  const heroImages = useMemo(() => ([
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCheO4nEcrgJAf77m6kqtR78RqiMUPJNjx5g&s",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT34uyl3kTD_iX6L9o9d5dFsqFTN3l7YJ8gpg&s",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWi3Fwgprbaesm51BHv8UgGO7BAWyp4697AA&s",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSbASCgJ_-HlYbBxqls5M2u56ph5_RfmZEFdA&s",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQST9pII9PS4-dArOJEo3J9jzyjCYVZYwbFZw&s",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_SJN4SiD6YVz4CczBxAk4lqXqXDzEVzOlPA&s",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_CaFgI3fUu2XfFQdN76YutQi4ipjwkeIFMA&s"
  ]), [])
  const [heroIndex, setHeroIndex] = useState(0)
  const [prevHeroIndex, setPrevHeroIndex] = useState(null)
  const [showCurrent, setShowCurrent] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setPrevHeroIndex(heroIndex)
      setHeroIndex((i) => (i + 1) % heroImages.length)
    }, HERO_INTERVAL_MS)
    return () => clearInterval(id)
  }, [heroImages.length, heroIndex])

  useEffect(() => {
    setShowCurrent(false)
    const raf = requestAnimationFrame(() => setShowCurrent(true))
    return () => cancelAnimationFrame(raf)
  }, [heroIndex])

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setRecLoading(true)
        const res = await axiosInstance.get('/api/v1/event/recommendations')
        if (res.data?.success) {
          setRecommendedEvents(res.data.events || [])
        }
      } catch (err) {
        console.error("Error fetching recommendations:", err)
      } finally {
        setRecLoading(false)
      }
    }
    fetchRecommendations()
  }, [user])

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        setLoading(true)
        const res = await axiosInstance.get('/api/v1/event')
        if (res.data?.success) {
          const list = (res.data.events || [])
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 6)
          setEvents(list)
        } else {
          setEvents([])
        }
      } catch {
        setEvents([])
      } finally {
        setLoading(false)
      }
    }
    fetchLatest()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      <AdBanner />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background image layer */}
        <div className="absolute inset-0">
          {prevHeroIndex !== null && (
            <img
              src={heroImages[prevHeroIndex]}
              alt="Previous event background"
              className="w-full h-full object-cover"
            />
          )}
          <img
            key={heroIndex}
            src={heroImages[heroIndex]}
            alt="Event background"
            className={`w-full h-full object-cover transition-opacity duration-700 ease-in-out ${showCurrent ? 'opacity-100' : 'opacity-0'}`}
          />
        </div>
        {/* Overlay for readability */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(17, 24, 39, ${OVERLAY_OPACITY})` }}
        >
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32">
          <div className="text-center text-white">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Find and Attend
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200">
                Events You’ll Love
              </span>
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
              Discover concerts, workshops, meetups, and more. Filter by status, price, and location,
              and book your seat in seconds.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/events" 
                className="px-10 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black shadow-2xl shadow-purple-500/40 transform hover:-translate-y-1 transition-all duration-300"
              >
                Explore All Events
              </Link>
            </div>

            {/* Smart Search Bar */}
            <div className="mt-12 max-w-2xl mx-auto w-full group">
              <form onSubmit={handleSmartSearch} className="relative">
                <input 
                  type="text" 
                  value={smartQuery}
                  onChange={(e) => setSmartQuery(e.target.value)}
                  placeholder="e.g. 'I want a music event under ₹1000 this weekend'"
                  className="w-full px-8 py-6 bg-white/10 backdrop-blur-2xl border-2 border-white/20 rounded-[2rem] text-white placeholder:text-white/50 focus:outline-none focus:border-purple-400/50 focus:bg-white/20 transition-all duration-500 text-lg shadow-2xl"
                />
                <button 
                  type="submit"
                  disabled={isSmartSearching}
                  className="absolute right-3 top-3 bottom-3 px-8 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-[1.5rem] font-bold shadow-xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSmartSearching ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>Smart Find</span>
                    </>
                  )}
                </button>
              </form>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest mr-2">Try:</span>
                {["Music under 500", "Workshops tonight", "Events in Mumbai"].map(hint => (
                  <button 
                    key={hint}
                    onClick={() => { setSmartQuery(hint); handleSmartSearch({ preventDefault: () => {} }) }}
                    className="text-white/60 hover:text-white text-xs font-medium bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 transition-colors"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Search Results */}
      {smartResults && (
        <section className="py-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col mb-10 text-center">
              <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 px-4 py-2 rounded-full mx-auto mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                <span className="text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-widest">AI Intelligence</span>
              </div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white">{smartResults.analysis}</h2>
              <button 
                onClick={() => setSmartResults(null)}
                className="mt-4 text-gray-400 hover:text-red-500 text-sm font-bold uppercase tracking-widest flex items-center gap-2 mx-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Results
              </button>
            </div>

            {smartResults.events.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {smartResults.events.map((event) => (
                  <div 
                    key={event._id} 
                    onClick={() => window.location.href = `/event/${event._id}`}
                    className="group bg-gray-50 dark:bg-gray-800/50 rounded-[2.5rem] p-4 border border-gray-100 dark:border-gray-700 hover:border-purple-500/30 transition-all duration-500 hover:shadow-2xl flex flex-col cursor-pointer"
                  >
                    {/* ... similar card UI as recommended ... */}
                    <div className="relative h-48 w-full rounded-[2rem] overflow-hidden mb-4">
                      {event.bannerImage ? (
                        <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                      ) : (
                        <div className="w-full h-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                          <svg className="w-10 h-10 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 line-clamp-2">{event.title}</h3>
                    <div className="mt-auto flex items-center justify-between text-[10px] font-bold text-gray-500">
                      <span>{event.city || "Venue"}</span>
                      <span className="text-purple-600 font-black">₹{event.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 text-lg">I couldn't find any events matching that specific request. Try something broader!</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Recommended for You Section */}
      {recommendedEvents.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-900/10 dark:to-transparent">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col mb-10">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                  Personalized
                </span>
                <div className="h-px flex-1 bg-indigo-100 dark:bg-indigo-900/20"></div>
              </div>
              <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Recommended for You</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Based on your interests and past bookings.</p>
            </div>

            <div className="flex overflow-x-auto pb-8 gap-6 custom-scrollbar scroll-smooth snap-x">
              {recommendedEvents.map((event) => (
                <div 
                  key={event._id} 
                  onClick={() => window.location.href = `/event/${event._id}`}
                  className="flex-shrink-0 w-[320px] snap-start group relative bg-white dark:bg-gray-900 rounded-[2rem] p-3 border border-gray-100 dark:border-gray-800 hover:border-indigo-500/30 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(79,70,229,0.1)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col cursor-pointer overflow-hidden"
                >
                  {/* Image Container */}
                  <div className="relative h-48 w-full rounded-[1.5rem] overflow-hidden">
                    {event.bannerImage ? (
                      <img 
                        src={event.bannerImage} 
                        alt={event.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
                        <svg className="h-10 w-10 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <div className="px-3 py-1.5 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl rounded-xl border border-white/20 shadow-xl font-black text-[10px] text-indigo-600 dark:text-indigo-400">
                        {event.isPaid ? `₹${Number(event.price || 0).toLocaleString()}` : "FREE"}
                      </div>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="px-4 py-5 flex flex-col flex-1">
                    <div className="mb-3">
                      <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1">
                        {event.categoryId?.name}
                      </p>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="text-[10px] font-bold truncate max-w-[100px]">{event.city || "Online"}</span>
                      </div>
                      <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        {new Date(event.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Latest Events</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Don't miss out on these upcoming experiences.</p>
            </div>
            <Link to="/dashboard" className="group flex items-center gap-2 px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold rounded-2xl hover:bg-indigo-600 hover:text-white transition-all duration-300">
              View All
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm p-12 text-center text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              No events found.
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <div 
                  key={event._id} 
                  onClick={() => window.location.href = `/event/${event._id}`}
                  className="group relative bg-white dark:bg-gray-900 rounded-[2rem] p-3 border border-gray-100 dark:border-gray-800 hover:border-indigo-500/30 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(79,70,229,0.1)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col h-full cursor-pointer overflow-hidden"
                >
                  {/* Image Container */}
                  <div className="relative h-56 w-full rounded-[1.5rem] overflow-hidden">
                    {event.bannerImage ? (
                      <img 
                        src={event.bannerImage} 
                        alt={event.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
                        <svg className="h-12 w-12 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Floating Price */}
                    <div className="absolute top-4 right-4">
                      <div className="px-4 py-2 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl font-black text-xs text-indigo-600 dark:text-indigo-400">
                        {event.isPaid ? `₹${Number(event.price || 0).toLocaleString()}` : "FREE"}
                      </div>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="px-5 py-6 flex flex-col flex-1">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                          {new Date(event.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-5 border-t border-gray-50 dark:border-gray-800">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="text-xs font-bold truncate max-w-[120px]">{event.city || "Online"}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-black text-xs group-hover:gap-2 transition-all">
                        <span>Details</span>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-4">
              Why Attendees Love EventHub
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover and book experiences effortlessly with features designed for attendees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-2xl hover:shadow-lg dark:hover:shadow-purple-500/10 transition-all duration-300 border border-purple-100/50 dark:border-purple-800/20">
              <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Personalized Discoveries</h3>
              <p className="text-gray-600 dark:text-gray-400">
                See events that match your interests and location, curated for you.
              </p>
            </div>

            <div className="p-8 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-2xl hover:shadow-lg dark:hover:shadow-emerald-500/10 transition-all duration-300 border border-emerald-100/50 dark:border-emerald-800/20">
              <div className="w-14 h-14 bg-emerald-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Simple, Secure Booking</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Book seats in seconds with clear pricing and instant ticket confirmation.
              </p>
            </div>

            <div className="p-8 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 rounded-2xl hover:shadow-lg dark:hover:shadow-orange-500/10 transition-all duration-300 border border-orange-100/50 dark:border-orange-800/20">
              <div className="w-14 h-14 bg-orange-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Live Updates & Reminders</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get status changes, seat availability, and timely reminders for your bookings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Attend Your Next Event?
          </h2>
          <p className="text-xl text-white/80 mb-10">
            Browse the latest events and book your seat in seconds.
          </p>
          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Browse Events
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Sign In to Book
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Home