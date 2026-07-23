// src/components/listings/ListingCard.tsx
import { Link } from 'react-router-dom'
import { MapPin, Users, Heart, Star } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'

interface ListingCardProps {
  listing: {
    id: string
    title: string
    location: string
    price: number
    image: string
    verified: boolean
    availableSeats: number
  }
}

const ListingCard = ({ listing }: ListingCardProps) => {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <Link to={`/listing/${listing.id}`}>
          <div className="relative h-48 overflow-hidden">
            <img 
              src={listing.image} 
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {listing.verified && (
              <Badge className="absolute top-2 left-2 bg-green-600 text-white dark:bg-green-700 dark:text-green-50">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Verified
              </Badge>
            )}
          </div>
        </Link>
      </div>
      <CardContent className="p-4">
        <Link to={`/listing/${listing.id}`}>
          <h3 className="font-semibold text-lg mb-1 hover:text-blue-600 transition-colors">
            {listing.title}
          </h3>
        </Link>
        <div className="flex items-center text-gray-500 text-sm mb-2">
          <MapPin className="w-3 h-3 mr-1" />
          {listing.location}
        </div>
        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="text-xl font-bold text-blue-600">
              ৳{listing.price.toLocaleString()}
            </span>
            <span className="text-gray-500 text-sm"> /month</span>
          </div>
          <div className="flex items-center text-gray-500 text-sm">
            <Users className="w-3 h-3 mr-1" />
            {listing.availableSeats} seat{listing.availableSeats > 1 ? 's' : ''}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ListingCard