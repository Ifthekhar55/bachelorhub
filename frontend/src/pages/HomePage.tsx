// src/pages/HomePage.tsx
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, MapPin, Users, Shield, CreditCard, Headphones } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import ListingCard from '../components/listings/ListingCard'
import api from '../services/api'
import heroRoom from '../assets/hero-room.jpg'

type RecommendedListing = {
  id: string
  title: string
  location: string
  price: number
  image: string
  verified: boolean
  availableSeats: number
}

const normalizeRecommendedListing = (listing: any): RecommendedListing => {
  const rawPrice = listing.rent ?? listing.priceValue ?? listing.price ?? '0'
  const price = typeof rawPrice === 'number' ? rawPrice : Number(String(rawPrice).replace(/,/g, '')) || 0

  return {
    id: String(listing.id) || String(Date.now()),
    title: listing.title || 'Untitled Property',
    location: listing.location || 'Unknown location',
    price,
    image:
      Array.isArray(listing.photos) && listing.photos.length > 0
        ? listing.photos[0]
        : listing.image || 'https://placehold.co/400x300?text=No+Image',
    verified: Boolean(listing.verified || listing.landlord?.isVerified),
    availableSeats: typeof listing.availableSeats === 'number' ? listing.availableSeats : 1,
  }
}

const HomePage = () => {
  const features = [
    { icon: Shield, title: 'Verified Properties', description: 'Manually Verified' },
    { icon: Users, title: 'NID Verified Owners', description: 'Trusted & Secure' },
    { icon: CreditCard, title: 'Secure Payments', description: 'bKash, Nagad, Card' },
    { icon: Headphones, title: 'Customer Support', description: '24/7 Assistance' },
  ]

  const [recommendedListings, setRecommendedListings] = useState<RecommendedListing[]>([])

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await api.get('/api/listings')
        const listings = Array.isArray(response.data) ? response.data : []
        setRecommendedListings(listings.map(normalizeRecommendedListing).slice(0, 4))
      } catch (error) {
        console.error('Failed to load recommended listings', error)
        setRecommendedListings([])
      }
    }

    fetchListings()
  }, [])

  return (
    <div>
      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row items-center justify-between px-[8%] py-[60px] gap-[50px]">
      
      {/* Left Content */}
      <div className="flex-1">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-5">
          Safe Homes.
          <br />
          <span className="text-green-600">Better Living.</span>
        </h1>

        <p className="text-gray-500 text-lg mb-8">
          Find verified bachelor accommodations across Bangladesh.
        </p>
      </div>

      {/* Right Image */}
      <div className="flex-1">
        <img
          src={heroRoom}
          alt="Room"
          className="w-full rounded-[25px]"
        />
      </div>

    </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recommended Listings */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Recommended for you</h2>
            <Link to="/feed">
              <Button variant="ghost" className="text-blue-600">
                View all →
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedListings.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ListingCard listing={listing} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage