import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col transition-colors duration-300">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-16 flex-grow">
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-12 transition-all">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">Terms and Conditions</h1>
          
          <div className="space-y-10 text-gray-600 dark:text-gray-400 leading-relaxed">
            <p className="text-sm italic font-medium text-purple-600 dark:text-purple-400">Last Updated: March 19, 2026</p>
            
            <section className="group">
              <h2 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                1. Acceptance of Terms
              </h2>
              <div className="p-6 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/50 group-hover:border-indigo-100 dark:group-hover:border-indigo-900/30 transition-all">
                <p>
                  By accessing or using EventHub, you agree to be bound by these terms and conditions. 
                  If you do not agree to these terms, please do not use our services.
                </p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400"></span>
                2. Use of the Services
              </h2>
              <div className="space-y-4">
                <p>
                  You must be at least 18 years old to use our services. You are responsible for maintaining the 
                  confidentiality of your account and password and for restricting access to your devices.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-purple-50/30 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/20">
                    <p className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-1">Organizers</p>
                    <p className="text-sm">Responsible for the accuracy and legality of the events they create.</p>
                  </div>
                  <div className="p-4 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/20">
                    <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1">Users</p>
                    <p className="text-sm">Responsible for the information they provide during booking.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
                3. Ticket Bookings and Payments
              </h2>
              <div className="space-y-4">
                <p>
                  All bookings are subject to availability. Prices for tickets are set by organizers and are inclusive of 
                  all applicable taxes unless otherwise stated.
                </p>
                <p className="flex items-start gap-3 text-sm italic">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Payments are processed via secure third-party payment gateways. Refunds and cancellations are subject 
                  to the specific event's policy as defined by the organizer.
                </p>
              </div>
            </section>

            <section className="group">
              <h2 className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400"></span>
                4. Prohibited Conduct
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  "Fraudulent event creation",
                  "Illegal use of services",
                  "Harassment of others",
                  "Unauthorized system access"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 p-3 rounded-xl bg-rose-50/30 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 text-sm font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="group">
              <h2 className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400"></span>
                5. Limitation of Liability
              </h2>
              <p className="p-6 bg-amber-50/30 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20 text-sm">
                EventHub is not responsible for the content of events, the actions of organizers, 
                or any issues arising from event attendance. We provide the platform only to facilitate connections.
              </p>
            </section>

            <section className="group">
              <h2 className="text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-600 dark:bg-gray-400"></span>
                6. Changes to Terms
              </h2>
              <p>
                We reserve the right to modify these terms at any time. Your continued use of the services 
                following any such changes constitutes your acceptance of the new terms.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default TermsConditions