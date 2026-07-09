import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MoreVertical, Edit2, Trash2, Share2 } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../components/ui/dropdown-menu";
import { Button } from "../../components/ui/button";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import { buildShareUrl } from '../../utils/share';

interface House {
  id: string;
  title: string;
  location: string;
  price: string;
  priceValue: number;
  image: string;
  features: string[];
  facilities?: string[];
  rent?: string;
  roomType: "single" | "shared";
  gender: "male" | "female" | "any";
  authorId?: string;
  author?: string;
}

const normalizeListing = (listing: any): House => {
  const rawPrice = listing.priceValue ?? listing.rent ?? listing.price ?? 0
  const features = listing.features ?? listing.facilities ?? []

  return {
    id: String(listing.id) || String(Date.now()),
    title: listing.title || 'Untitled Listing',
    location: listing.location || 'Unknown location',
    price: String(Number(rawPrice) || 0),
    priceValue:
      typeof listing.priceValue === 'number'
        ? listing.priceValue
        : Number(rawPrice) || 0,
    features,
    image:
      Array.isArray(listing.photos) && listing.photos.length > 0
        ? listing.photos[0]
        : listing.image || 'https://placehold.co/400x300?text=No+Image',
    roomType: listing.roomType || 'any',
    gender: listing.gender || listing.genderPreference || 'any',
    authorId: listing.landlordId || listing.authorId,
    author: listing.author,
  }
}



const FindHouse: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [budget, setBudget] = useState<number>(10000);
  const [searchLocation, setSearchLocation] = useState("");
  const [roomType, setRoomType] = useState<string>("any");
  const [gender, setGender] = useState<string>("any");
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [listings, setListings] = useState<House[]>([]);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await api.get('/api/listings');
        const listings = Array.isArray(response.data) ? response.data : [];
        setListings(listings.map(normalizeListing));
      } catch (error) {
        console.error('Failed to fetch listings:', error);
        setListings([]);
      }
    };

    fetchListings();
  }, []);

  const handleDeleteListing = async (id: string) => {
    if (!window.confirm("Delete this listing? This action cannot be undone."))
      return;

    try {
      await api.delete(`/api/listings/${id}`);
      setListings((prev) => prev.filter((l) => l.id !== id));
      toast.success('Listing deleted successfully');
    } catch (error) {
      console.error('Failed to delete listing:', error);
      toast.error('Failed to delete listing');
    }
  };

  const handleShareListing = async (house: House) => {
    const url = buildShareUrl(`/listing/${house.id}`);
    const text = `Check out this listing on BachelorHub: ${house.title} - ${url}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: house.title, text, url });
        return;
      } catch (e) {
        console.warn('Web share failed', e);
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success('Listing link copied to clipboard');
    } catch (err) {
      console.error('Share failed', err);
      toast.error('Unable to share listing');
    }
  };

  const handleBudgetChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setBudget(Number(e.target.value));
  };

  const toggleFacility = (facility: string) => {
    setSelectedFacilities((current) =>
      current.includes(facility)
        ? current.filter((item) => item !== facility)
        : [...current, facility]
    );
  };

  const filteredHouses = useMemo(() => {
    return listings
      .filter((house) => {
        if (
          searchLocation.trim() &&
          !house.location
            .toLowerCase()
            .includes(searchLocation.toLowerCase())
        ) {
          return false;
        }

        if (roomType !== "any" && house.roomType !== roomType) {
          return false;
        }

        if (gender !== "any" && house.gender !== gender) {
          return false;
        }

        if (house.priceValue > budget) {
          return false;
        }

        if (selectedFacilities.length > 0) {
          return selectedFacilities.every((facility) =>
            house.features.includes(facility)
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") {
          return a.priceValue - b.priceValue;
        }
        if (sortBy === "price_desc") {
          return b.priceValue - a.priceValue;
        }
        return 0;
      });
  }, [listings, searchLocation, roomType, gender, budget, selectedFacilities, sortBy]);

  return (
    <div className="bg-gray-50 py-8">
      <section className="container mx-auto grid gap-8 px-4 md:grid-cols-4">
        {/* Sidebar */}
        <aside className="md:col-span-1">
          <div className="sticky top-24 space-y-5 rounded-2xl bg-white p-6 shadow-lg">
            {/* Search */}
            <div>
              <label className="font-medium">Search Location</label>

              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 w-5 -translate-y-1/2 text-gray-400" />

                <input
                  type="text"
                  placeholder="Enter location"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="font-medium">
                Budget: ৳ {budget.toLocaleString()}
              </label>

              <input
                type="range"
                min="1000"
                max="20000"
                step="500"
                value={budget}
                onChange={handleBudgetChange}
                className="mt-2 w-full"
              />

              <p className="mt-1 text-sm text-gray-500">
                ৳ {(1000).toLocaleString()} - ৳{" "}
                {budget}
              </p>
            </div>

            {/* Room Type */}
            <div className="mt-5">
              <label className="font-medium">Room Type</label>

              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="mt-2 w-full rounded-lg border p-3"
              >
                <option value="any">Any</option>
                <option value="single">Single</option>
                <option value="shared">Shared</option>
              </select>
            </div>

            {/* Gender */}
            <div className="mt-5">
              <label className="font-medium">
                Gender Preference
              </label>

              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="mt-2 w-full rounded-lg border p-3"
              >
                <option value="any">Any</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* Facilities */}
            <div className="mt-5">
              <label className="font-medium">Facilities</label>

              <div className="mt-3 flex flex-col gap-3">
                {[
                  "WiFi",
                  "Attached Bath",
                  "AC",
                  "Kitchen",
                ].map((facility) => (
                  <label
                    key={facility}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFacilities.includes(facility)}
                      onChange={() => toggleFacility(facility)}
                    />
                    {facility}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Listings */}
        <div className="md:col-span-3">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-bold">
              Available Houses
            </h2>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border p-2"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price Low-High</option>
              <option value="price_desc">Price High-Low</option>
            </select>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredHouses.length === 0 ? (
              <div className="col-span-full rounded-2xl bg-white p-10 text-center shadow-lg">
                <p className="text-lg font-semibold">
                  No houses match your filters.
                </p>
                <p className="mt-2 text-gray-500">
                  Adjust the location, budget, or filter options
                  to see more results.
                </p>
              </div>
            ) : (
              filteredHouses.map((house) => {
                return (
                  <div
                    key={house.id}
                    className="overflow-hidden rounded-2xl bg-white shadow-lg transition duration-300 hover:-translate-y-2 relative"
                  >
                    <img
                      src={house.image}
                      alt={house.title}
                      className="h-56 w-full object-cover"
                      loading="lazy"
                    />

                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <span className="rounded-lg bg-green-100 px-3 py-1 text-xs text-green-700">
                          ✓ Verified
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleShareListing(house)}>
                              <Share2 className="w-4 h-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            {house.authorId === user?.id && (
                              <>
                                <DropdownMenuItem onClick={() => navigate(`/edit-listing/${house.id}`)}>
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleDeleteListing(house.id)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <h3 className="text-lg font-bold">
                        {house.title}
                      </h3>

                      <p className="mt-1 text-gray-600">
                        📍 {house.location}
                      </p>

                      <div className="my-4 flex flex-wrap gap-2">
                        {(house.features ?? []).map((feature) => (
                          <span
                            key={feature}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      <div className="mb-4 flex items-center gap-1">
                        <h4 className="text-2xl font-bold text-green-700">
                          ৳ {house.price}
                        </h4>

                        <span className="text-gray-500">
                          /month
                        </span>
                      </div>

                      <button 
                        onClick={() => navigate(`/listing/${house.id}`)}
                        className="w-full rounded-lg bg-green-700 py-3 text-white transition hover:bg-green-800"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </section>
    </div>
  )
};

export default FindHouse;
