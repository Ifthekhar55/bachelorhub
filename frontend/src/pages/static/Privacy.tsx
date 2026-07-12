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
            <p><strong>Effective Date:</strong> July 4, 2026</p>
            <p>This Privacy Policy explains how BachelorHub (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, stores, and protects your personal information when you use our mobile application and website.</p>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
              <p>We may collect information that you provide directly to us, including your name, email address, phone number, profile details, messages, rental or booking requests, listing information, and payment-related information. We may also collect technical information such as device information, IP address, app usage data, crash logs, and analytics data.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
              <p>We use your information to create and manage your account, provide and improve our services, verify user identity, prevent fraud and abuse, communicate with you, process bookings, send service notifications, and comply with legal obligations.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Information Sharing</h2>
              <p>We do not sell your personal information. We may share your information with trusted service providers that help us operate the app, such as hosting, analytics, cloud storage, support, and payment processing services. We may also share information with other users when necessary to complete a booking or listing. We may disclose information when required by law or to protect the rights, safety, or security of our users.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Retention</h2>
              <p>We retain personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. If you request deletion of your account, we will remove or anonymize your personal data where required by applicable law, except where retention is required for legal or operational reasons.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Security</h2>
              <p>We use commercially reasonable security measures to protect your information, including secure servers and encryption where appropriate. However, no method of transmission over the internet or electronic storage is completely secure, and we cannot guarantee absolute security.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Your Rights</h2>
              <p>Depending on your location, you may have rights to access, correct, delete, or restrict the use of your personal information, and to withdraw consent where applicable. To exercise these rights, please contact us using the details below.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Children&apos;s Privacy</h2>
              <p>BachelorHub is not intended for children under the age required by applicable law. We do not knowingly collect personal information from children.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. Any material changes will be posted in the app or on our website, and the effective date will be updated accordingly.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy or your personal information, please contact us at:</p>
              <p>Email: supportbachelorhub@gmail.com</p>
            </section>

            <div className="border-t pt-6 mt-6">
              <p className="text-sm text-gray-500">Last updated: July 4, 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Privacy