import React from 'react'

const ListingCardList = ({ listing }: { listing: any }) => {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h3 className="text-lg font-semibold mb-2">{listing?.title ?? 'Listing'}</h3>
      <p className="text-sm text-gray-500">{listing?.location ?? 'Location not available'}</p>
    </div>
  )
}

export default ListingCardList
