import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Edit2, Trash2, Eye, CheckCircle, XCircle, 
  Package, TrendingUp, Eye as EyeIcon, MoreVertical
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface MyListing {
  id: string;
  title: string;
  price: number;
  photos: string[];
  location: string;
  isSold: boolean;
  isUrgent: boolean;
  viewCount: number;
  createdAt: string;
  _count: {
    savedBy: number;
  };
}

const MyListings = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [listings, setListings] = useState<MyListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMyListings();
  }, [user]);

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/used-items/my-listings');
      setListings(response.data);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
      toast.error('Failed to load your listings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this listing?')) {
      try {
        await api.delete(`/api/used-items/${id}`);
        toast.success('Listing deleted successfully');
        fetchMyListings();
      } catch (error) {
        toast.error('Failed to delete listing');
      }
    }
  };

  const handleMarkAsSold = async (id: string, isSold: boolean) => {
    try {
      await api.patch(`/api/used-items/${id}/status`, { status: isSold ? 'active' : 'sold' });
      toast.success(isSold ? 'Item marked as available' : 'Item marked as sold');
      fetchMyListings();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const activeListings = listings.filter(l => !l.isSold);
  const soldListings = listings.filter(l => l.isSold);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Listings</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage all your posted items
            </p>
          </div>
          <Link to="/post-used-item">
            <Button className="bg-green-600 hover:bg-green-700">
              <Package className="w-4 h-4 mr-2" />
              Post New Item
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="active">
              Active ({activeListings.length})
            </TabsTrigger>
            <TabsTrigger value="sold">
              Sold ({soldListings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeListings.length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No active listings</h3>
                <p className="text-gray-500 mb-4">You haven't posted any items yet.</p>
                <Link to="/post-used-item">
                  <Button>Post Your First Item</Button>
                </Link>
              </Card>
            ) : (
              activeListings.map((listing) => (
                <Card key={listing.id} className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={listing.photos[0] || 'https://placehold.co/100x100/png?text=No+Image'}
                      alt={listing.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{listing.title}</h3>
                          <p className="text-green-600 font-bold">৳{listing.price.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">{listing.location}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/used-item/${listing.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/edit-used-item/${listing.id}`)}
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-green-600"
                            onClick={() => handleMarkAsSold(listing.id, false)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark as Sold
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600"
                            onClick={() => handleDelete(listing.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <EyeIcon className="w-3 h-3" />
                          {listing.viewCount} views
                        </span>
                        <span>•</span>
                        <span>Posted {new Date(listing.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="sold" className="space-y-4">
            {soldListings.length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No sold items</h3>
                <p className="text-gray-500">Items you mark as sold will appear here.</p>
              </Card>
            ) : (
              soldListings.map((listing) => (
                <Card key={listing.id} className="p-4 opacity-75">
                  <div className="flex gap-4">
                    <img
                      src={listing.photos[0] || 'https://placehold.co/100x100/png?text=No+Image'}
                      alt={listing.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{listing.title}</h3>
                          <p className="text-green-600 font-bold">৳{listing.price.toLocaleString()}</p>
                          <Badge className="bg-gray-500 text-white">Sold</Badge>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleMarkAsSold(listing.id, true)}
                        >
                          <Package className="w-4 h-4 mr-1" />
                          Relist Item
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyListings;