import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4 text-green-500">BachelorHub</h3>
            <p className="text-gray-400">Find verified bachelor accommodations across Bangladesh.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/feed" className="hover:text-white">Find House</Link></li>
              <li><Link to="/homechef" className="hover:text-white">Homechef</Link></li>
              <li><Link to="/used-items" className="hover:text-white">Used Items</Link></li>
              <li><Link to="/community" className="hover:text-white">Community</Link></li>
              <li><Link to="/blood-requests" className="hover:text-white">Need Blood?</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/terms" className="hover:text-white">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/help" className="hover:text-white">Help & Support</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Email: supportbachelorhub@gmail.com</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400">
          <p>Made with <Heart className="inline w-4 h-4 text-red-500" /> for Bangladeshi students & professionals</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer