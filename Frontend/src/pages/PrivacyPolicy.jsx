import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col transition-colors duration-300">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-16 flex-grow">
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-12 transition-all">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">Privacy Policy</h1>
          
          <div className="space-y-10 text-gray-600 dark:text-gray-400 leading-relaxed">
            <p className="text-sm italic font-medium text-indigo-600 dark:text-indigo-400">Last Updated: March 19, 2026</p>
            
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm">1</span>
                Information We Collect
              </h2>
              <p>
                We collect information you provide directly to us when you create an account, update your profile, 
                book a ticket, or communicate with us. This may include:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {[
                  "Name, email, and phone number",
                  "Profile picture and account role",
                  "Secure payment information",
                  "Booking and event history"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 text-sm">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm">2</span>
                How We Use Your Information
              </h2>
              <p>We use the information we collect to:</p>
              <div className="grid gap-3 mt-4">
                {[
                  "Maintain and improve our platform services",
                  "Process secure transactions and send confirmations",
                  "Send critical technical and security updates",
                  "Communicate event promotions and personalized news",
                  "Analyze platform usage to enhance user experience"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-800/50 hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-colors group">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform" />
                    <p className="text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm">3</span>
                Sharing of Information
              </h2>
              <p className="p-5 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/20 text-emerald-800 dark:text-emerald-300 italic text-sm leading-relaxed">
                We do not share your personal information with third parties except as described in this policy. 
                For example, when you book a ticket, the event organizer will receive your name, email, and phone number 
                to facilitate event attendance and communication.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm">4</span>
                Data Security
              </h2>
              <p>
                We take rigorous measures to help protect information about you from loss, theft, misuse, 
                and unauthorized access. All sensitive data is encrypted using industry-standard protocols.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center text-sm">5</span>
                Your Choices
              </h2>
              <p>
                You may update, correct, or delete your account information at any time by logging into your 
                profile or by contacting our support team directly.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default PrivacyPolicy