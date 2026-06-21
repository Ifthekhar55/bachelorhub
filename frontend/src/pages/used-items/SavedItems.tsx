import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, Heart, Trash2, Package } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface SavedItem {
  id: string;
  title: string;
  price: number;
  location: string;
  photos: string[];
  isUrgent: boolean;
  createdAt: string;
}

const SavedItems = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchSavedItems();
  }, [user]);

  const fetchSavedItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/used-items/saved/my-items');
      setItems(response.data);
    } catch (error) {
      console.error('Failed to fetch saved items:', error);
      toast.error('Unable to load saved items');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (id: string) => {
    try {
      await api.delete(`/api/used-items/${id}/save`);
      toast.success('Removed from saved items');
      fetchSavedItems();
    } catch (error) {
      console.error('Failed to remove saved item:', error);
      toast.error('Failed to remove saved item');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Saved Items</h1>
            <p className="text-gray-600 dark:text-gray-400">View items you saved for later.</p>
          </div>
          <Link to="/used-items">
            <Button className="bg-green-600 hover:bg-green-700">
              <Package className="w-4 h-4 mr-2" />
              Browse Marketplace
            </Button>
          </Link>
        </div>

        {items.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No saved items yet</h2>
            <p className="text-gray-500 mb-4">Save items from the marketplace to access them later.</p>
            <Link to="/used-items">
              <Button>Explore Used Items</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-6">
            {items.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  <img
                    src={item.photos[0] || 'https://placehold.co/240x180/png?text=No+Image'}
                    alt={item.title}
                    className="w-full lg:w-64 h-44 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">{item.title}</h3>
                        <p className="text-green-600 font-bold">৳{item.price.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">{item.location}</p>
                      </div>
                      {item.isUrgent && <Badge className="bg-red-100 text-red-700">Urgent</Badge>}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/used-item/${item.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={() => handleUnsave(item.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedItems;
