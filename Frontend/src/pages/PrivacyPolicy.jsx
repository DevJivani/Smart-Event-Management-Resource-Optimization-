import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-16 flex-grow">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b border-gray-100 pb-6">Privacy Policy</h1>
          
          <div className="space-y-10 text-gray-600 leading-relaxed">
            <p className="text-sm italic">Last Updated: March 19, 2026</p>
            
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
              <p className="mb-4">
                We collect information you provide directly to us when you create an account, update your profile, 
                book a ticket, or communicate with us. This may include:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Name, email address, and phone number</li>
                <li>Profile picture and role (Organizer/User)</li>
                <li>Payment information (processed securely via third-party providers)</li>
                <li>Booking history and event preferences</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <p className="mb-4">We use the information we collect to:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information, including booking confirmations and invoices</li>
                <li>Send technical notices, updates, security alerts, and support messages</li>
                <li>Communicate with you about events, promotions, and news</li>
                <li>Monitor and analyze trends, usage, and activities in connection with our services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">3. Sharing of Information</h2>
              <p>
                We do not share your personal information with third parties except as described in this policy. 
                For example, when you book a ticket, the event organizer will receive your name, email, and phone number 
                to facilitate event attendance and communication.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">4. Security</h2>
              <p>
                We take reasonable measures to help protect information about you from loss, theft, misuse, 
                and unauthorized access, disclosure, alteration, and destruction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">5. Your Choices</h2>
              <p>
                You may update, correct, or delete information about you at any time by logging into your 
                online account or by contacting us.
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