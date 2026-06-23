import React, { useState, useEffect } from 'react'

interface FilterSidebarProps {
  filters: Record<string, unknown>
  setFilters: (filters: Record<string, unknown>) => void
}

const FilterSidebar = ({ filters, setFilters }: FilterSidebarProps) => {
  const [budget, setBudget] = useState<number>((filters.budget as number) || 8000)
  const [location, setLocation] = useState<string>((filters.location as string) || '')
  const [roomType, setRoomType] = useState<string>((filters.roomType as string) || '')
  const [gender, setGender] = useState<string>((filters.gender as string) || '')
  const [facilities, setFacilities] = useState<Record<string, boolean>>({
    wifi: false,
    bath: false,
    ac: false,
    kitchen: false,
  })

  useEffect(() => {
    const activeFacilities = Object.keys(facilities).filter((k) => facilities[k])
    setFilters({ ...filters, budget, roomType, gender, facilities: activeFacilities, location })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budget, roomType, gender, facilities, location])

  const toggleFacility = (key: string) => {
    setFacilities((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Filters</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Budget Range</label>
        <input
          type="range"
          min={2000}
          max={20000}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full mt-2"
        />
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">৳ {budget}</div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Room Type</label>
        <select value={roomType} onChange={(e) => setRoomType(e.target.value)} className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">Any</option>
          <option value="single">Single</option>
          <option value="shared">Shared</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, Area"
          className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Gender Preference</label>
        <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">Any</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Facilities</label>
        <div className="flex flex-col gap-2 mt-2">
          <label className="inline-flex items-center text-gray-900 dark:text-gray-100">
            <input type="checkbox" checked={facilities.wifi} onChange={() => toggleFacility('wifi')} className="mr-2" />
            WiFi
          </label>
          <label className="inline-flex items-center text-gray-900 dark:text-gray-100">
            <input type="checkbox" checked={facilities.bath} onChange={() => toggleFacility('bath')} className="mr-2" />
            Attached Bath
          </label>
          <label className="inline-flex items-center text-gray-900 dark:text-gray-100">
            <input type="checkbox" checked={facilities.ac} onChange={() => toggleFacility('ac')} className="mr-2" />
            AC
          </label>
          <label className="inline-flex items-center text-gray-900 dark:text-gray-100">
            <input type="checkbox" checked={facilities.kitchen} onChange={() => toggleFacility('kitchen')} className="mr-2" />
            Kitchen
          </label>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setFilters({})}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Reset
        </button>
        <button
          onClick={() => setFilters({ ...filters, budget, roomType, gender })}
          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white rounded text-sm"
        >
          Apply
        </button>
      </div>
    </div>
  )
}

export default FilterSidebar
