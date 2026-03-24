import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-16 flex-grow">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b border-gray-100 pb-6">Terms and Conditions</h1>
          
          <div className="space-y-10 text-gray-600 leading-relaxed">
            <p className="text-sm italic font-medium">Last Updated: March 19, 2026</p>
            
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wider text-sm">1. Acceptance of Terms</h2>
              <p>
                By accessing or using EventHub, you agree to be bound by these terms and conditions. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wider text-sm">2. Use of the Services</h2>
              <p className="mb-4">
                You must be at least 18 years old to use our services. You are responsible for maintaining the 
                confidentiality of your account and password and for restricting access to your computer or mobile device.
              </p>
              <p>
                Organizers are responsible for the accuracy and legality of the events they create. 
                Users are responsible for the information they provide during booking.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wider text-sm">3. Ticket Bookings and Payments</h2>
              <p className="mb-4">
                All bookings are subject to availability. Prices for tickets are set by organizers and are inclusive of 
                all applicable taxes unless otherwise stated.
              </p>
              <p>
                Payments are processed via secure third-party payment gateways. Refunds and cancellations are subject 
                to the specific event's policy as defined by the organizer.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wider text-sm">4. Prohibited Conduct</h2>
              <p className="mb-4">You agree not to:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Create fraudulent events or provide false booking information</li>
                <li>Use the services for any illegal purpose</li>
                <li>Harass other users or organizers</li>
                <li>Attempt to gain unauthorized access to our systems</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wider text-sm">5. Limitation of Liability</h2>
              <p>
                EventHub is not responsible for the content of events, the actions of organizers, 
                or any issues arising from event attendance. We provide the platform only to facilitate connections.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wider text-sm">6. Changes to Terms</h2>
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