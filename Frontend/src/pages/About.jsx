import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import axiosInstance from '../utils/axios'

const About = () => {
  const [stats, setStats] = useState({ eventsHosted: 0, activeUsers: 0, satisfactionRate: 99 })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosInstance.get('/api/v1/event/stats')
        if (res.data?.success) {
          setStats(res.data.stats)
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors flex flex-col">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-16 flex-grow">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-12 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">About EventHub</h1>
            <p className="text-purple-100 text-lg max-w-2xl mx-auto">
              Empowering people to create, discover, and attend the world's most incredible events.
            </p>
          </div>
          
          <div className="p-8 md:p-12 space-y-12 text-gray-700 dark:text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Our Mission
              </h2>
              <p>
                EventHub was founded with a simple goal: to make event management and ticket booking accessible to everyone. 
                Whether you're an organizer planning a large conference or a user looking for the next local meetup, 
                our platform provides the tools you need to connect with your community.
              </p>
            </section>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-[#0a0c1b] p-10 rounded-3xl text-center border border-gray-800 transform hover:scale-105 transition-all duration-300 shadow-xl shadow-purple-500/5">
                <div className="text-5xl font-extrabold text-[#7c3aed] mb-3">
                  {stats.eventsHosted >= 1000 ? `${(stats.eventsHosted / 1000).toFixed(1)}k+` : `${stats.eventsHosted}+`}
                </div>
                <div className="text-gray-400 font-bold uppercase tracking-wider text-xs">Events Hosted</div>
              </div>
              
              <div className="bg-[#0a0c1b] p-10 rounded-3xl text-center border border-gray-800 transform hover:scale-105 transition-all duration-300 shadow-xl shadow-blue-500/5">
                <div className="text-5xl font-extrabold text-blue-500 mb-3">
                  {stats.activeUsers >= 1000 ? `${(stats.activeUsers / 1000).toFixed(1)}k+` : `${stats.activeUsers}+`}
                </div>
                <div className="text-gray-400 font-bold uppercase tracking-wider text-xs">Active Users</div>
              </div>

              <div className="bg-[#0a0c1b] p-10 rounded-3xl text-center border border-gray-800 transform hover:scale-105 transition-all duration-300 shadow-xl shadow-emerald-500/5">
                <div className="text-5xl font-extrabold text-emerald-500 mb-3">
                  {stats.satisfactionRate}%
                </div>
                <div className="text-gray-400 font-bold uppercase tracking-wider text-xs">Satisfaction Rate</div>
              </div>
            </div>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                For Organizers & Attendees
              </h2>
              <p>
                For organizers, we offer a powerful dashboard to create events, manage bookings, and generate invoices. 
                For attendees, we provide a seamless browsing experience, easy ticket booking, and a secure way to manage 
                all their upcoming events.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default About