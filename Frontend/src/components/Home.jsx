import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import axiosInstance from '../utils/axios'
import Navbar from './Navbar'
import Footer from './Footer'

function Home() {
  const { user } = useSelector((state) => state.auth)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
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
              <>
                <Link
                  to="/dashboard"
                  className="px-8 py-4 bg-white text-purple-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Browse Events
                </Link>
                {user ? (
                  <Link
                    to="/profile"
                    className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200"
                  >
                    My Profile
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200"
                  >
                    Sign In to Book
                  </Link>
                )}
              </>
            </div>
          </div>
        </div>
      </section>

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