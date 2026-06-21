import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Card } from '../../components/ui/card';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const PostUsedItem = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: '',
    location: '',
    contactNumber: '',
    isNegotiable: false,
    isUrgent: false,
    deliveryOption: 'both',
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    onDrop: (acceptedFiles) => {
      setPhotos([...photos, ...acceptedFiles]);
    },
  });

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to post an item');
      navigate('/login');
      return;
    }

    setLoading(true);
    const formDataObj = new FormData();
    formDataObj.append('title', formData.title);
    formDataObj.append('description', formData.description);
    formDataObj.append('price', formData.price);
    formDataObj.append('category', formData.category);
    formDataObj.append('condition', formData.condition);
    formDataObj.append('location', formData.location);
    formDataObj.append('contactNumber', formData.contactNumber);
    formDataObj.append('isNegotiable', String(formData.isNegotiable));
    formDataObj.append('isUrgent', String(formData.isUrgent));
    formDataObj.append('deliveryOption', formData.deliveryOption);
    photos.forEach(photo => {
      formDataObj.append('photos', photo);
    });

    try {
      await api.post('/api/used-items', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Item posted successfully!');
      navigate('/used-items');
    } catch (error) {
      console.error('Failed to post item:', error);
      toast.error('Failed to post item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6">Sell an Item</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <Label>Title *</Label>
              <Input
                placeholder="e.g., Used Study Table"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe your item..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Price */}
              <div>
                <Label>Price (BDT) *</Label>
                <Input
                  type="number"
                  placeholder="5000"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required
                />
              </div>

              {/* Category */}
              <div>
                <Label>Category *</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800"
                  required
                >
                  <option value="">Select category</option>
                  <option value="furniture">Furniture</option>
                  <option value="electronics">Electronics</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="home_appliances">Home Appliances</option>
                  <option value="study_items">Study Items</option>
                  <option value="miscellaneous">Miscellaneous</option>
                  <option value="moving_out_sale">Moving Out Sale</option>
                  <option value="room_setup_bundle">Room Setup Bundle</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Condition */}
              <div>
                <Label>Condition *</Label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({...formData, condition: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800"
                  required
                >
                  <option value="">Select condition</option>
                  <option value="new">New</option>
                  <option value="like_new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <Label>Location *</Label>
                <Input
                  placeholder="Dhaka, Mirpur"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  required
                />
              </div>
            </div>

            {/* Contact Number */}
            <div>
              <Label>Contact Number *</Label>
              <Input
                placeholder="+880XXXXXXXXX"
                value={formData.contactNumber}
                onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                required
              />
            </div>

            {/* Options */}
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isNegotiable}
                  onChange={(e) => setFormData({...formData, isNegotiable: e.target.checked})}
                />
                <span>Price Negotiable</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isUrgent}
                  onChange={(e) => setFormData({...formData, isUrgent: e.target.checked})}
                />
                <span>Urgent Sale (Need to sell within 3 days)</span>
              </label>
            </div>

            {/* Delivery Option */}
            <div>
              <Label>Delivery/Pickup Option</Label>
              <select
                value={formData.deliveryOption}
                onChange={(e) => setFormData({...formData, deliveryOption: e.target.value})}
                className="w-full p-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="both">Both (Pickup & Delivery)</option>
                <option value="pickup">Pickup Only</option>
                <option value="delivery">Delivery Only</option>
              </select>
            </div>

            {/* Photos */}
            <div>
              <Label>Photos</Label>
              <div
                {...getRootProps()}
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-green-500 transition"
              >
                <input {...getInputProps()} />
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Drag & drop photos here, or click to select</p>
                <p className="text-sm text-gray-400">Upload up to 10 photos</p>
              </div>
              
              {photos.length > 0 && (
                <div className="grid grid-cols-4 gap-4 mt-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Preview ${index}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
                {loading ? 'Posting...' : 'Post Item'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/used-items')}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default PostUsedItem;