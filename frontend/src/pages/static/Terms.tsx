import { ScrollText } from 'lucide-react'

const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <ScrollText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Terms & Conditions</h1>
          </div>
          
          <div className="space-y-6 text-gray-600">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p>By accessing and using BachelorHub, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our platform.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. User Accounts</h2>
              <p>You must be at least 18 years old to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Listing and Rental Agreements</h2>
              <p>Landlords are responsible for the accuracy of their listings. Tenants should verify all information independently. BachelorHub is not a party to any rental agreement between users.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Verification Process</h2>
              <p>We verify user identities through phone number verification and email confirmation, but we cannot guarantee the absolute accuracy of all information. Users should exercise due diligence.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Prohibited Activities</h2>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Posting false or misleading information</li>
                <li>Harassing other users</li>
                <li>Using the platform for illegal activities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Payments and Refunds</h2>
              <p>All payments for boosts and premium features are non-refundable. Rental deposits and payments are handled directly between landlords and tenants.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Termination</h2>
              <p>We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activities.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Limitation of Liability</h2>
              <p>BachelorHub is not liable for any disputes, losses, or damages arising from user interactions or rental agreements.</p>
            </section>

            <div className="border-t pt-6 mt-6">
              <p className="text-sm text-gray-500">Last updated: July 1, 2026</p>
              <p className="text-sm text-gray-500 mt-2">For questions, contact: supportbachelorhub@gmail.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Terms