import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Droplet, 
  MapPin, 
  Calendar, 
  Phone, 
  AlertTriangle,
  User,
  Building2,
  FileText,
  Clock
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const CreateBloodRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bloodGroup: '',
    unitsNeeded: '1',
    patientName: '',
    hospitalName: '',
    hospitalAddress: '',
    requiredDate: '',
    requiredTime: '',
    contactNumber: user?.phone || '',
    emergencyLevel: 'within_24_hours',
    additionalNotes: '',
    location: '',
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const emergencyLevels = [
    { value: 'urgent', label: '🚨 Urgent (Within Hours)', color: 'text-red-600' },
    { value: 'within_24_hours', label: '⏰ Within 24 Hours', color: 'text-orange-600' },
    { value: 'planned', label: '📅 Planned (1+ days)', color: 'text-blue-600' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to request blood');
      navigate('/login');
      return;
    }

    // Validate required fields
    if (!formData.bloodGroup) {
      toast.error('Please select a blood group');
      return;
    }
    if (!formData.hospitalName) {
      toast.error('Please enter hospital name');
      return;
    }
    if (!formData.hospitalAddress) {
      toast.error('Please enter hospital address');
      return;
    }
    if (!formData.requiredDate || !formData.requiredTime) {
      toast.error('Please select required date and time');
      return;
    }
    if (!formData.contactNumber) {
      toast.error('Please enter contact number');
      return;
    }
    if (!formData.location) {
      toast.error('Please enter location');
      return;
    }

    setLoading(true);
    try {
      const requiredDateTime = new Date(`${formData.requiredDate}T${formData.requiredTime}`);
      
      // ONLY send fields that exist in the Prisma model
      const payload = {
        bloodGroup: formData.bloodGroup,
        unitsNeeded: parseInt(formData.unitsNeeded),
        patientName: formData.patientName || undefined,
        hospitalName: formData.hospitalName,
        hospitalAddress: formData.hospitalAddress,
        requiredDate: requiredDateTime.toISOString(),
        contactNumber: formData.contactNumber,
        emergencyLevel: formData.emergencyLevel,
        additionalNotes: formData.additionalNotes || undefined,
        location: formData.location,
      };

      console.log('Sending payload:', payload);

      const response = await api.post('/api/blood/requests', payload);
      console.log('Response:', response.data);
      
      toast.success('Blood request posted successfully! Donors will be notified.');
      navigate('/blood-requests');
    } catch (error: any) {
      console.error('Failed to create blood request:', error.response?.data || error.message);
      
      // Show specific error message from backend
      const errorMessage = error.response?.data?.error || 'Failed to create blood request';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 dark:bg-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <Droplet className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold dark:text-white">Request Blood</h1>
                <p className="text-gray-500 dark:text-gray-400">Fill in the details to request blood</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Blood Group */}
              <div>
                <Label className="flex items-center gap-2 dark:text-gray-200">
                  <Droplet className="w-4 h-4 text-red-600" />
                  Blood Group *
                </Label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white mt-1"
                  required
                >
                  <option value="">Select Blood Group</option>
                  {bloodGroups.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              {/* Units Needed */}
              <div>
                <Label className="dark:text-gray-200">Number of Units Needed *</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.unitsNeeded}
                  onChange={(e) => setFormData({ ...formData, unitsNeeded: e.target.value })}
                  placeholder="1"
                  required
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Patient Name */}
              <div>
                <Label className="flex items-center gap-2 dark:text-gray-200">
                  <User className="w-4 h-4" />
                  Patient Name (Optional)
                </Label>
                <Input
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  placeholder="Name of the patient (optional)"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Hospital Details */}
              <div>
                <Label className="flex items-center gap-2 dark:text-gray-200">
                  <Building2 className="w-4 h-4" />
                  Hospital Name *
                </Label>
                <Input
                  value={formData.hospitalName}
                  onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                  placeholder="e.g., Dhaka Medical College Hospital"
                  required
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <Label className="dark:text-gray-200">Hospital Address *</Label>
                <Input
                  value={formData.hospitalAddress}
                  onChange={(e) => setFormData({ ...formData, hospitalAddress: e.target.value })}
                  placeholder="Full hospital address"
                  required
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2 dark:text-gray-200">
                    <Calendar className="w-4 h-4" />
                    Required Date *
                  </Label>
                  <Input
                    type="date"
                    value={formData.requiredDate}
                    onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                    required
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2 dark:text-gray-200">
                    <Clock className="w-4 h-4" />
                    Required Time *
                  </Label>
                  <Input
                    type="time"
                    value={formData.requiredTime}
                    onChange={(e) => setFormData({ ...formData, requiredTime: e.target.value })}
                    required
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Emergency Level */}
              <div>
                <Label className="flex items-center gap-2 dark:text-gray-200">
                  <AlertTriangle className="w-4 h-4" />
                  Emergency Level *
                </Label>
                <select
                  value={formData.emergencyLevel}
                  onChange={(e) => setFormData({ ...formData, emergencyLevel: e.target.value })}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white mt-1"
                  required
                >
                  {emergencyLevels.map((level) => (
                    <option key={level.value} value={level.value} className={level.color}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contact Number */}
              <div>
                <Label className="flex items-center gap-2 dark:text-gray-200">
                  <Phone className="w-4 h-4" />
                  Contact Number *
                </Label>
                <Input
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  placeholder="+880XXXXXXXXX"
                  required
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Location */}
              <div>
                <Label className="flex items-center gap-2 dark:text-gray-200">
                  <MapPin className="w-4 h-4" />
                  Location (Area/City) *
                </Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Mirpur, Dhaka"
                  required
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Additional Notes */}
              <div>
                <Label className="flex items-center gap-2 dark:text-gray-200">
                  <FileText className="w-4 h-4" />
                  Additional Notes (Optional)
                </Label>
                <Textarea
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                  placeholder="Any additional information (e.g., special requirements)"
                  rows={3}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Posting...
                    </span>
                  ) : (
                    'Post Blood Request'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/blood-requests')}
                  className="dark:border-gray-600 dark:text-gray-300"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateBloodRequest;