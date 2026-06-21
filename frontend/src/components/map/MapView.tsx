import React from 'react'

const MapView = ({ listings }: { listings: any[] }) => {
  return (
    <div className="h-full w-full bg-slate-100 flex items-center justify-center text-gray-500">
      <div>
        <p className="text-lg font-medium">Map placeholder</p>
        <p>{listings?.length ?? 0} listings available</p>
      </div>
    </div>
  )
}

export default MapView
