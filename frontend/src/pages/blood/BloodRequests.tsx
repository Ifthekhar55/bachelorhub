import { useState, useEffect, type MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  MapPin,
  Clock,
  Heart,
  Phone,
  Navigation,
  Share2,
  AlertTriangle,
  Users,
  Plus,
  Droplet,
  Shield,
  MoreVertical,
  Trash2,
  Edit2,
  LogIn,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface BloodRequest {
  id: string;
  bloodGroup: string;
  unitsNeeded: number;
  patientName: string;
  hospitalName: string;
  hospitalAddress: string;
  requiredDate: string;
  emergencyLevel: 'urgent' | 'within_24_hours' | 'planned';
  contactNumber: string;
  additionalNotes: string;
  location: string;
  status: string;
  requester: {
    id: string;
    name: string;
    phone: string;
    isVerified: boolean;
    profilePhoto?: string;
  };
  donorResponses: any[];
  createdAt: string;
  views: number;
}

const BloodRequests = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    bloodGroup: '',
    emergencyLevel: '',
    location: '',
  });
  const [hasDonorProfile, setHasDonorProfile] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  
  const emergencyLevels = [
    { value: '', label: '📋 All Levels' },
    { value: 'urgent', label: '🚨 Urgent' },
    { value: 'within_24_hours', label: '⏰ Within 24 Hours' },
    { value: 'planned', label: '📅 Planned' },
  ];

  // ============ AUTHENTICATION CHECK ============
  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      toast.error('Please log in to view blood requests', {
        duration: 3000,
        icon: '🔴',
      });
      navigate('/login', { 
        state: { 
          from: '/blood-requests',
          message: 'Please log in to view blood requests' 
        } 
      });
      return;
    }

    // If authenticated, fetch data
    fetchRequests();
    checkDonorProfile();
  }, [isAuthenticated, user]);

  // Fetch requests when filters change (only if authenticated)
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchRequests();
    }
  }, [filters]);

  const fetchRequests = async () => {
    // Don't fetch if not authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.bloodGroup) params.append('bloodGroup', filters.bloodGroup);
      if (filters.emergencyLevel) params.append('emergencyLevel', filters.emergencyLevel);
      if (filters.location) params.append('location', filters.location);

      const response = await api.get(`/api/blood/requests?${params.toString()}`);
      setRequests(response.data.data || []);
    } catch (error: any) {
      console.error('Failed to fetch blood requests:', error);
      
      // If 401, redirect to login
      if (error?.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
        return;
      }
      
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const checkDonorProfile = async () => {
    // Don't check if not authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      const response = await api.get('/api/blood/donor-profile');
      setHasDonorProfile(!!response.data);
    } catch (error) {
      setHasDonorProfile(false);
    }
  };

  const getEmergencyBadge = (level: string) => {
    const colors = {
      urgent: 'bg-red-500 text-white',
      within_24_hours: 'bg-orange-500 text-white',
      planned: 'bg-blue-500 text-white',
    };
    return colors[level as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  const getEmergencyLabel = (level: string) => {
    const labels = {
      urgent: '🚨 Urgent',
      within_24_hours: '⏰ Within 24 Hours',
      planned: '📅 Planned',
    };
    return labels[level as keyof typeof labels] || level;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-500 text-white',
      donor_found: 'bg-blue-500 text-white',
      completed: 'bg-gray-500 text-white',
      expired: 'bg-red-500 text-white',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  const handleRespond = async (requestId: string) => {
    if (!user || !isAuthenticated) {
      toast.error('Please login to respond');
      navigate('/login');
      return;
    }

    if (!hasDonorProfile) {
      toast.error('Please create a donor profile first');
      navigate('/donor-profile');
      return;
    }

    try {
      await api.post(`/api/blood/requests/${requestId}/respond`, {
        status: 'interested',
        message: 'I can help with this blood request.',
      });
      toast.success('Response sent! The requester will be notified.');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to respond to request');
    }
  };

  const handleEdit = (e: MouseEvent<HTMLButtonElement>, request: BloodRequest) => {
    e.stopPropagation();
    setOpenMenuId(null);
    navigate('/create-blood-request', { state: { request } });
  };

  const handleDelete = async (e: MouseEvent<HTMLButtonElement>, requestId: string) => {
    e.stopPropagation();
    setOpenMenuId(null);
    if (!confirm('Are you sure you want to delete this request?')) return;
    try {
      await api.delete(`/api/blood/requests/${requestId}`);
      setRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success('Request deleted');
    } catch (err) {
      console.error('Failed to delete request', err);
      toast.error('Failed to delete request');
    }
  };

  const handleShare = (request: BloodRequest) => {
    const text = `🚨 URGENT BLOOD NEEDED\nGroup: ${request.bloodGroup}\nHospital: ${request.hospitalName}\nLocation: ${request.location}\nContact: ${request.contactNumber}\n\nPlease help save a life!`;
    navigator.clipboard.writeText(text);
    toast.success('Request details copied to clipboard');
  };

  const handleClearFilters = () => {
    setFilters({
      bloodGroup: '',
      emergencyLevel: '',
      location: '',
    });
    setSearchTerm('');
  };

  const hasActiveFilters = filters.bloodGroup || filters.emergencyLevel || filters.location || searchTerm;

  // ============ SHOW LOADING ============
  if (loading && isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading blood requests...</p>
        </div>
      </div>
    );
  }

  // ============ SHOW LOGIN REQUIRED ============
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="p-12 text-center">
            <div className="text-6xl mb-6">🔴</div>
            <h1 className="text-3xl font-bold mb-4">Login Required</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Please log in to view and respond to blood requests. Help save lives by connecting with those in need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate('/login', { state: { from: '/blood-requests' } })}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Login to Continue
              </Button>
              <Button 
                onClick={() => navigate('/register')}
                variant="outline"
                className="px-8 py-3 text-lg"
              >
                Create Account
              </Button>
            </div>
            <div className="mt-6">
              <p className="text-sm text-gray-500">
                Don't have an account?{' '}
                <Link to="/register" className="text-red-600 hover:underline font-medium">
                  Sign up now
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ============ MAIN RENDER (Authenticated) ============
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Droplet className="w-8 h-8 text-red-500" />
              Need Blood?
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Connect with blood donors in your area</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link to="/create-blood-request">
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="w-4 h-4 mr-2" />
                Request Blood
              </Button>
            </Link>
            <Link to="/donor-profile">
              <Button variant="outline">
                <Heart className="w-4 h-4 mr-2" />
                Become a Donor
              </Button>
            </Link>
          </div>
        </div>

        {/* Emergency Alert Banner */}
        {requests.filter(r => r.emergencyLevel === 'urgent' && r.status === 'active').length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
              <div>
                <p className="font-semibold text-red-700 dark:text-red-400">
                  {requests.filter(r => r.emergencyLevel === 'urgent' && r.status === 'active').length} Emergency Blood Requests
                </p>
                <p className="text-sm text-red-600 dark:text-red-300">Urgent help needed - Check below</p>
              </div>
            </div>
            <Badge className="bg-red-500 text-white animate-pulse">Urgent</Badge>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by hospital or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Blood Group Dropdown - Native HTML Select */}
            <div>
              <select
                value={filters.bloodGroup}
                onChange={(e) => setFilters({ ...filters, bloodGroup: e.target.value })}
                className="w-full h-10 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">🩸 All Groups</option>
                {bloodGroups.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            {/* Emergency Level Dropdown - Native HTML Select */}
            <div>
              <select
                value={filters.emergencyLevel}
                onChange={(e) => setFilters({ ...filters, emergencyLevel: e.target.value })}
                className="w-full h-10 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {emergencyLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClearFilters} className="whitespace-nowrap">
                Clear Filters
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500">Active filters:</span>
              {filters.bloodGroup && (
                <Badge variant="secondary" className="gap-1">
                  Blood: {filters.bloodGroup}
                  <button onClick={() => setFilters({ ...filters, bloodGroup: '' })} className="ml-1 hover:text-red-500">×</button>
                </Badge>
              )}
              {filters.emergencyLevel && (
                <Badge variant="secondary" className="gap-1">
                  {emergencyLevels.find(l => l.value === filters.emergencyLevel)?.label || filters.emergencyLevel}
                  <button onClick={() => setFilters({ ...filters, emergencyLevel: '' })} className="ml-1 hover:text-red-500">×</button>
                </Badge>
              )}
              {filters.location && (
                <Badge variant="secondary" className="gap-1">
                  📍 {filters.location}
                  <button onClick={() => setFilters({ ...filters, location: '' })} className="ml-1 hover:text-red-500">×</button>
                </Badge>
              )}
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  🔍 "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-red-500">×</button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
            <TabsTrigger value="all">All Requests</TabsTrigger>
            <TabsTrigger value="urgent">Urgent</TabsTrigger>
            <TabsTrigger value="nearby">Nearby</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-6xl mb-4">🩸</div>
                <h3 className="text-xl font-semibold mb-2">No blood requests found</h3>
                <p className="text-gray-500">Be the first to request blood when needed.</p>
                <Link to="/create-blood-request">
                  <Button className="mt-4 bg-red-600 hover:bg-red-700">Request Blood</Button>
                </Link>
              </div>
            ) : (
              requests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className={`relative p-6 hover:shadow-lg transition cursor-pointer ${
                      request.emergencyLevel === 'urgent' ? 'border-l-4 border-l-red-500' : ''
                    }`}
                    onClick={() => navigate(`/blood-request/${request.id}`)}
                  >
                    {user?.id === request.requester.id && (
                      <div className="absolute top-4 right-4 md:left-1/2 md:right-auto z-20 md:-translate-x-1/2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === request.id ? null : request.id); }}
                          className="p-2 rounded-full bg-white shadow-sm hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                          aria-label="More options"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                        </button>
                        {openMenuId === request.id && (
                          <div onClick={(e) => e.stopPropagation()} className="mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                            <button onClick={(e) => handleEdit(e, request)} className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                              <Edit2 className="w-4 h-4" /> Edit
                            </button>
                            <button onClick={(e) => handleDelete(e, request.id)} className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600">
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      {/* Left Section */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className={getEmergencyBadge(request.emergencyLevel)}>
                            {getEmergencyLabel(request.emergencyLevel)}
                          </Badge>
                          <Badge className={getStatusBadge(request.status)}>
                            {request.status.toUpperCase()}
                          </Badge>
                          {request.requester.isVerified && (
                            <Shield className="w-4 h-4 text-green-500" aria-label="Verified Requester" role="img" />
                          )}
                        </div>

                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl font-bold text-red-600">{request.bloodGroup}</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-600">{request.unitsNeeded} unit(s) needed</span>
                        </div>

                        <h3 className="text-lg font-semibold mb-2">{request.patientName || 'Patient'}</h3>
                        
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{request.hospitalName} - {request.hospitalAddress}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Required: {new Date(request.requiredDate).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{request.donorResponses.length} donors interested</span>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button 
                            size="sm" 
                            className="bg-red-600 hover:bg-red-700"
                            onClick={(e) => { e.stopPropagation(); handleRespond(request.id); }}
                          >
                            <Heart className="w-4 h-4 mr-1" />
                            I'm Interested
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${request.contactNumber}`; }}
                          >
                            <Phone className="w-4 h-4 mr-1" />
                            Call
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps?q=${encodeURIComponent(request.location)}`); }}
                          >
                            <Navigation className="w-4 h-4 mr-1" />
                            Maps
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); handleShare(request); }}
                          >
                            <Share2 className="w-4 h-4 mr-1" />
                            Share
                          </Button>
                        </div>
                      </div>

                      {/* Right Section - Requester Info */}
                      <div className="md:text-right border-t md:border-t-0 pt-4 md:pt-0">
                        <div className="flex items-center gap-2 justify-end">
                          <Avatar className="w-10 h-10">
                            {request.requester?.profilePhoto ? (
                              <AvatarImage src={request.requester.profilePhoto} />
                            ) : null}
                            <AvatarFallback>{request.requester.name?.[0] ?? 'U'}</AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="text-sm text-gray-500">Posted by</div>
                        <div className="font-medium">{request.requester.name}</div>
                        <div className="text-sm text-gray-500">{request.requester.phone}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(request.createdAt).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          {request.views} views
                        </div>
                      </div>
                    </div>

                    {request.additionalNotes && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">📝 {request.additionalNotes}</p>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          <TabsContent value="urgent">
            <div className="space-y-4">
              {requests.filter(r => r.emergencyLevel === 'urgent' && r.status === 'active').length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-semibold mb-2">No urgent requests</h3>
                  <p className="text-gray-500">All emergency requests have been handled.</p>
                </div>
              ) : (
                requests.filter(r => r.emergencyLevel === 'urgent' && r.status === 'active').map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="relative p-6 border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-900/10 cursor-pointer"
                      onClick={() => navigate(`/blood-request/${request.id}`)}
                    >
                      {user?.id === request.requester.id && (
                        <div className="absolute top-4 right-4 md:left-1/2 md:right-auto z-20 md:-translate-x-1/2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === request.id ? null : request.id); }}
                            className="p-2 rounded-full bg-white shadow-sm hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                            aria-label="More options"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                          </button>
                          {openMenuId === request.id && (
                            <div onClick={(e) => e.stopPropagation()} className="mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                              <button onClick={(e) => handleEdit(e, request)} className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                                <Edit2 className="w-4 h-4" /> Edit
                              </button>
                              <button onClick={(e) => handleDelete(e, request.id)} className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600">
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                        <Badge className="bg-red-500 text-white">URGENT</Badge>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl font-bold text-red-600">{request.bloodGroup}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-600">{request.unitsNeeded} unit(s) needed</span>
                          </div>
                          <h3 className="text-lg font-semibold mb-2">{request.patientName || 'Patient'}</h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{request.hospitalName} - {request.hospitalAddress}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>Required: {new Date(request.requiredDate).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button 
                              size="sm" 
                              className="bg-red-600 hover:bg-red-700"
                              onClick={(e) => { e.stopPropagation(); handleRespond(request.id); }}
                            >
                              <Heart className="w-4 h-4 mr-1" />
                              I'm Interested
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${request.contactNumber}`; }}
                            >
                              <Phone className="w-4 h-4 mr-1" />
                              Call
                            </Button>
                          </div>
                        </div>
                        <div className="md:text-right">
                          <div className="text-sm text-gray-500">Posted by</div>
                          <div className="font-medium">{request.requester.name}</div>
                          <div className="text-sm text-gray-500">{request.requester.phone}</div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="nearby">
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-6xl mb-4">📍</div>
              <h3 className="text-xl font-semibold mb-2">Nearby Requests</h3>
              <p className="text-gray-500">Enable location to see requests near you</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        toast.success('Location enabled!');
                      },
                      (error) => {
                        toast.error('Unable to get location. Please enable location access.');
                      }
                    );
                  } else {
                    toast.error('Geolocation is not supported by your browser.');
                  }
                }}
              >
                Enable Location
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{requests.length}</div>
            <div className="text-sm text-gray-500">Total Requests</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {requests.filter(r => r.emergencyLevel === 'urgent' && r.status === 'active').length}
            </div>
            <div className="text-sm text-gray-500">Active Urgent</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {requests.reduce((acc, r) => acc + r.donorResponses.length, 0)}
            </div>
            <div className="text-sm text-gray-500">Interested Donors</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">24/7</div>
            <div className="text-sm text-gray-500">Emergency Support</div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BloodRequests;