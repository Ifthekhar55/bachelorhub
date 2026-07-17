import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Grid, List, MapPin, Clock, Heart, MessageCircle, 
  Zap, PlusCircle, X, Filter, SlidersHorizontal, ChevronDown,
  DollarSign, Tag, Star, Shield, TrendingUp, Eye, MoreVertical
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../../components/ui/sheet';
import { Badge } from '../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface UsedItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  subCategory: string;
  condition: string;
  location: string;
  contactNumber: string;
  isNegotiable: boolean;
  isUrgent: boolean;
  deliveryOption: string;
  photos: string[];
  seller: {
    id: string;
    name: string;
    email: string;
    phone: string;
    isVerified: boolean;
    profilePhoto: string;
    createdAt: string;
    rating: number;
    listingsCount: number;
  };
  createdAt: string;
  viewCount: number;
  isSaved?: boolean;
  _count: {
    savedBy: number;
  };
}

const UsedItems = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [items, setItems] = useState<UsedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    location: '',
    condition: '',
    sortBy: 'newest',
  });

  // Sort options
  const sortOptions = [
    { label: 'Newest', value: 'newest' },
    { label: 'Oldest', value: 'oldest' },
    { label: 'Price: Low-High', value: 'price_asc' },
    { label: 'Price: High-Low', value: 'price_desc' },
  ];

  // Categories with subcategories
  const categories = {
    'Furniture': ['Bed', 'Mattress', 'Table', 'Chair', 'Wardrobe', 'Bookshelf'],
    'Electronics': ['Laptop', 'Monitor', 'Router', 'Fan', 'Refrigerator', 'Television'],
    'Kitchen': ['Rice Cooker', 'Blender', 'Induction Cooker', 'Gas Stove', 'Plates & Utensils'],
    'Home Appliances': ['Iron', 'Water Filter', 'Vacuum Cleaner'],
    'Study Items': ['Books', 'Notes', 'Calculator'],
    'Miscellaneous': ['Bicycle', 'Gym Equipment', 'Musical Instruments'],
    'Moving Out Sale': ['Complete Room Package'],
    'Room Setup Bundle': ['Bed + Table + Chair + Fan'],
  };

  const conditions = [
    { label: 'All Conditions', value: '' },
    { label: 'New', value: 'new' },
    { label: 'Like New', value: 'like_new' },
    { label: 'Good', value: 'good' },
    { label: 'Fair', value: 'fair' },
  ];

  useEffect(() => {
    const timer = setTimeout(() => fetchItems(), 500);
    return () => clearTimeout(timer);
  }, [filters, searchTerm, selectedCategory, selectedSubCategory]);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const sortButton = document.getElementById('sort-dropdown-button');
      const sortMenu = document.getElementById('sort-dropdown-menu');
      if (sortButton && sortMenu && !sortButton.contains(e.target as Node) && !sortMenu.contains(e.target as Node)) {
        setShowSortDropdown(false);
      }
    };
    
    if (showSortDropdown) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showSortDropdown]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedSubCategory) params.append('subCategory', selectedSubCategory);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.location) params.append('location', filters.location);
      if (filters.condition) params.append('condition', filters.condition);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (searchTerm) params.append('search', searchTerm);

      const response = await api.get(`/api/used-items?${params.toString()}`);
      setItems(response.data?.items || []);
    } catch (error) {
      console.error('Failed to fetch items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async (itemId: string) => {
    if (!user) {
      toast.error('Please login to save items');
      navigate('/login');
      return;
    }
    try {
      await api.post(`/api/used-items/${itemId}/save`);
      toast.success('Item saved to favorites!');
      fetchItems();
    } catch (error) {
      toast.error('Failed to save item');
    }
  };

  const handleReport = async (itemId: string, reason: string) => {
    if (!user) {
      toast.error('Please login to report');
      navigate('/login');
      return;
    }
    try {
      await api.post(`/api/used-items/${itemId}/report`, { reason });
      toast.success('Report submitted. We will review it.');
    } catch (error) {
      toast.error('Failed to submit report');
    }
  };



  const getConditionBadge = (condition: string) => {
    const colors: Record<string, string> = {
      new: 'bg-green-100 text-green-700',
      like_new: 'bg-blue-100 text-blue-700',
      good: 'bg-yellow-100 text-yellow-700',
      fair: 'bg-orange-100 text-orange-700',
    };
    return colors[condition] || 'bg-gray-100 text-gray-700';
  };

  const clearAllFilters = () => {
    setSelectedCategory('');
    setSelectedSubCategory('');
    setFilters({
      minPrice: '',
      maxPrice: '',
      location: '',
      condition: '',
      sortBy: 'newest',
    });
    setSearchTerm('');
  };

  const hasActiveFilters = selectedCategory || selectedSubCategory || filters.condition || 
    filters.minPrice || filters.maxPrice || filters.location || searchTerm;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Used Items Marketplace</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Buy and sell pre-loved items at affordable prices
            </p>
          </div>
          <Link to="/post-used-item">
            <Button className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
              <PlusCircle className="w-4 h-4 mr-2" />
              Sell Item
            </Button>
          </Link>
        </div>

        {/* Categories Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 pb-2 min-w-max">
            <Button 
              variant={selectedCategory === '' ? 'default' : 'outline'}
              onClick={() => { setSelectedCategory(''); setSelectedSubCategory(''); }}
              className="rounded-full"
            >
              All Items
            </Button>
            {Object.keys(categories).map(cat => (
              <Button 
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
                className="rounded-full"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Subcategories (if category selected) */}
        {selectedCategory && categories[selectedCategory as keyof typeof categories] && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {categories[selectedCategory as keyof typeof categories].map(sub => (
                <Badge 
                  key={sub}
                  variant={selectedSubCategory === sub ? 'default' : 'outline'}
                  className="cursor-pointer px-3 py-1 text-sm"
                  onClick={() => setSelectedSubCategory(sub === selectedSubCategory ? '' : sub)}
                >
                  {sub}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search items (e.g., 'Chair', 'Laptop', 'Fan')..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 w-full"
              />
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <Button 
                  id="sort-dropdown-button"
                  variant="outline" 
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="h-11 gap-2 bg-white dark:bg-gray-800"
                >
                  <TrendingUp className="w-4 h-4" />
                  {sortOptions.find(opt => opt.value === filters.sortBy)?.label || 'Sort By'}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                </Button>
                
                {showSortDropdown && (
                  <div id="sort-dropdown-menu" className="absolute top-full mt-1 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-max">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilters({ ...filters, sortBy: option.value });
                          setShowSortDropdown(false);
                        }}
                        className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          filters.sortBy === option.value 
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium' 
                            : 'text-gray-700 dark:text-gray-300'
                        } ${option === sortOptions[0] ? 'rounded-t-lg' : ''} ${option === sortOptions[sortOptions.length - 1] ? 'rounded-b-lg' : ''}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)} 
                className="h-11 gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {hasActiveFilters && <Badge className="ml-1 bg-green-600 text-white text-xs">!</Badge>}
              </Button>

              
            </div>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-2">Condition</label>
                    <select
                      value={filters.condition}
                      onChange={(e) => setFilters({...filters, condition: e.target.value})}
                      className="w-full p-2 border rounded-lg dark:bg-gray-800"
                    >
                      {conditions.map(cond => (
                        <option key={cond.value} value={cond.value}>{cond.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2">Price Range (BDT)</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2">Location</label>
                    <Input
                      placeholder="Dhaka, Chattogram..."
                      value={filters.location}
                      onChange={(e) => setFilters({...filters, location: e.target.value})}
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <Button onClick={() => setShowFilters(false)} className="flex-1">
                      Apply Filters
                    </Button>
                    {hasActiveFilters && (
                      <Button variant="outline" onClick={clearAllFilters}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Active Filters Tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="text-sm text-gray-500">Active filters:</span>
            {selectedCategory && (
              <Badge variant="secondary" className="gap-1">
                {selectedCategory}
                {selectedSubCategory && `: ${selectedSubCategory}`}
                <button onClick={() => { setSelectedCategory(''); setSelectedSubCategory(''); }}>×</button>
              </Badge>
            )}
            {filters.condition && (
              <Badge variant="secondary" className="gap-1">
                {conditions.find(c => c.value === filters.condition)?.label}
                <button onClick={() => setFilters({...filters, condition: ''})}>×</button>
              </Badge>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <Badge variant="secondary" className="gap-1">
                ৳{filters.minPrice || '0'} - ৳{filters.maxPrice || '∞'}
                <button onClick={() => setFilters({...filters, minPrice: '', maxPrice: ''})}>×</button>
              </Badge>
            )}
            {filters.location && (
              <Badge variant="secondary" className="gap-1">
                📍 {filters.location}
                <button onClick={() => setFilters({...filters, location: ''})}>×</button>
              </Badge>
            )}
            {searchTerm && (
              <Badge variant="secondary" className="gap-1">
                🔍 "{searchTerm}"
                <button onClick={() => setSearchTerm('')}>×</button>
              </Badge>
            )}
          </div>
        )}

        {/* Items Grid/List */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No items found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
            <Button variant="outline" onClick={clearAllFilters}>Clear All Filters</Button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
          }>
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.5) }}
              >
                <Card 
                  className={`relative overflow-hidden hover:shadow-xl transition-all duration-300 ${
                    viewMode === 'list' ? 'flex flex-col sm:flex-row' : ''
                  }`}
                >
                  {item.seller?.id === user?.id && (
                    <div className="absolute top-3 right-3 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="More actions"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onSelect={() => { navigate(`/edit-used-item/${item.id}`); }}>
                            Edit Item
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={async () => {
                            if (!window.confirm('Delete this item? This action cannot be undone.')) return
                            try {
                              await api.delete(`/api/used-items/${item.id}`)
                              setItems(prev => prev.filter(i => i.id !== item.id))
                              toast.success('Item deleted')
                            } catch (err) {
                              console.error('Failed to delete item', err)
                              toast.error('Failed to delete item')
                            }
                          }}>
                            Delete Item
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}

                  {/* Image Section */}
                  <div 
                    className={`relative ${viewMode === 'list' ? 'sm:w-48 h-48' : 'h-48'} bg-gray-100 dark:bg-gray-800 hover:opacity-90 transition-opacity`}
                  >
                    <img
                      src={item.photos?.[0] || 'https://placehold.co/400x300/png?text=No+Image'}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSaveItem(item.id); }}
                        className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-md hover:scale-110 transition-transform"
                      >
                        <Heart className={`w-4 h-4 ${item.isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                      </button>
                      {item.isUrgent && (
                        <Badge className="bg-red-500 text-white border-none">
                          <Zap className="w-3 h-3 mr-1" />
                          Urgent Sale
                        </Badge>
                      )}
                      {item.category === 'Moving Out Sale' && (
                        <Badge className="bg-purple-500 text-white border-none">
                          🚚 Moving Out Sale
                        </Badge>
                      )}
                      {item.category === 'Room Setup Bundle' && (
                        <Badge className="bg-orange-500 text-white border-none">
                          🎁 Bundle Deal
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Content Section */}
                  <div className="p-4 flex-1">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-semibold text-lg line-clamp-1 flex-1 hover:text-green-600 transition-colors">{item.title}</h3>
                      <Badge className={getConditionBadge(item.condition)}>
                        {item.condition.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <MapPin className="w-3 h-3" />
                      <span>{item.location}</span>
                    </div>
                    
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-2xl font-bold text-green-600">৳{item.price.toLocaleString()}</span>
                      {item.isNegotiable && (
                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">Negotiable</span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{item.viewCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        <span>{item._count?.savedBy || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-4 pb-4">
                    <div className="flex items-center justify-between gap-3 pt-3 border-t dark:border-gray-700">
                      <div className="flex items-center gap-2 flex-1">
                          <Avatar className="w-6 h-6">
                            {item.seller.profilePhoto ? (
                              <AvatarImage src={item.seller.profilePhoto} />
                            ) : null}
                            <AvatarFallback>{item.seller.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium truncate">{item.seller.name}</span>
                            {item.seller.isVerified && (
                              <Shield className="w-3 h-3 text-green-600 flex-shrink-0" aria-label="Verified Seller" role="img" />
                            )}
                          </div>
                          <div className="flex items-center gap-0.5 text-xs text-gray-500">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span>{item.seller.rating || 4.5}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg min-w-max gap-1.5 transition-all hover:shadow-md whitespace-nowrap"
                          onClick={() => navigate(`/used-item/${item.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsedItems;