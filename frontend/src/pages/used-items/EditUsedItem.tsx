import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Card } from '../../components/ui/card';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface EditUsedItemForm {
  title: string;
  description: string;
  price: string;
  category: string;
  condition: string;
  location: string;
  contactNumber: string;
  isNegotiable: boolean;
  isUrgent: boolean;
  deliveryOption: string;
}

const EditUsedItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [formData, setFormData] = useState<EditUsedItemForm>({
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
      setPhotos((prev) => [...prev, ...acceptedFiles]);
    },
  });

  useEffect(() => {
    if (!id) {
      navigate('/my-listings');
      return;
    }
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/used-items/${id}`);
      const item = response.data.item;
      setFormData({
        title: item.title || '',
        description: item.description || '',
        price: String(item.price || ''),
        category: item.category || '',
        condition: item.condition || '',
        location: item.location || '',
        contactNumber: item.contact || '',
        isNegotiable: item.negotiable || false,
        isUrgent: item.isUrgent || false,
        deliveryOption: item.delivery || 'both',
      });
      setExistingPhotos(item.photos || []);
    } catch (error) {
      console.error('Failed to fetch item:', error);
      toast.error('Failed to load item for editing');
      navigate('/my-listings');
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = (index: number) => {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to edit an item');
      navigate('/login');
      return;
    }

    if (!id) return;

    setSaving(true);
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

    formDataObj.append('existingPhotos', JSON.stringify(existingPhotos));
    photos.forEach((photo) => {
      formDataObj.append('photos', photo);
    });

    try {
      await api.put(`/api/used-items/${id}`, formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Item updated successfully');
      navigate('/my-listings');
    } catch (error) {
      console.error('Failed to update item:', error);
      toast.error('Failed to update item');
    } finally {
      setSaving(false);
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
      <div className="container mx-auto px-4 max-w-3xl">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6">Edit Item</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>Title *</Label>
              <Input
                placeholder="e.g., Used Study Table"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe your item..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (BDT) *</Label>
                <Input
                  type="number"
                  placeholder="5000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Category *</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
              <div>
                <Label>Condition *</Label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
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

              <div>
                <Label>Location *</Label>
                <Input
                  placeholder="Dhaka, Mirpur"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Contact Number *</Label>
              <Input
                placeholder="+880XXXXXXXXX"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                required
              />
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isNegotiable}
                  onChange={(e) => setFormData({ ...formData, isNegotiable: e.target.checked })}
                />
                <span>Price Negotiable</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isUrgent}
                  onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                />
                <span>Urgent Sale</span>
              </label>
            </div>

            <div>
              <Label>Delivery/Pickup Option</Label>
              <select
                value={formData.deliveryOption}
                onChange={(e) => setFormData({ ...formData, deliveryOption: e.target.value })}
                className="w-full p-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="both">Both (Pickup & Delivery)</option>
                <option value="pickup">Pickup Only</option>
                <option value="delivery">Delivery Only</option>
              </select>
            </div>

            {existingPhotos.length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">Existing photos. Remove any you no longer want.</p>
                <div className="grid grid-cols-3 gap-3">
                  {existingPhotos.map((photo, index) => (
                    <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                      <img
                        src={photo}
                        alt={`Existing ${index + 1}`}
                        className="w-full h-28 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingPhoto(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label>Upload New Photos</Label>
              <div
                {...getRootProps()}
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-green-500 transition"
              >
                <input {...getInputProps()} />
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Drag & drop photos here, or click to select</p>
                <p className="text-sm text-gray-400">New photos will be added to the existing ones</p>
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
              <Button type="submit" disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/my-listings')}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default EditUsedItem;
