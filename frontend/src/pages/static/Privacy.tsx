import { Shield } from 'lucide-react'

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
          </div>
          
          <div className="space-y-6 text-gray-600">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Information We Collect</h2>
              <p>We collect information you provide directly to us, including:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Name, email address, phone number</li>
                <li>NID or identification documents for verification</li>
                <li>Property listings and rental preferences</li>
                <li>Payment information (processed securely through third-party gateways)</li>
                <li>Communication history and messages</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">How We Use Your Information</h2>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>To provide and improve our services</li>
                <li>To verify user identities and prevent fraud</li>
                <li>To facilitate communication between users</li>
                <li>To send notifications about listings and messages</li>
                <li>To analyze platform usage and improve user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Information Sharing</h2>
              <p>We do not sell your personal information. We may share information:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>With other users as necessary for rental transactions</li>
                <li>With service providers who assist our operations</li>
                <li>When required by law or to protect rights and safety</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Security</h2>
              <p>We implement industry-standard security measures to protect your data, including encryption, secure servers, and regular security audits. However, no method of transmission over the internet is 100% secure.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your account</li>
                <li>Opt out of marketing communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Cookies and Tracking</h2>
              <p>We use cookies to enhance your experience, remember preferences, and analyze site traffic. You can control cookie settings through your browser.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Children's Privacy</h2>
              <p>Our services are not directed to individuals under 18. We do not knowingly collect information from minors.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Changes to This Policy</h2>
              <p>We may update this privacy policy periodically. We will notify users of significant changes via email or platform notification.</p>
            </section>

            <div className="border-t pt-6 mt-6">
              <p className="text-sm text-gray-500">Last updated: July 1, 2026</p>
              <p className="text-sm text-gray-500 mt-2">For privacy concerns, contact: supportbachelorhub@gmail.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Privacy