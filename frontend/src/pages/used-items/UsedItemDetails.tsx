import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, Clock, Heart, MessageCircle, Flag, 
  Share2, ChevronLeft, ChevronRight, Shield, Star, 
  CheckCircle, Zap, Truck, Home, Package, X,
  Send, Image, Navigation, DollarSign, TrendingDown, Trash2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { buildShareUrl } from '../../utils/share';

interface UsedItemDetail {
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
    reviewsCount: number;
    listingsCount: number;
  };
  createdAt: string;
  viewCount: number;
  isSaved: boolean;
  _count: {
    savedBy: number;
  };
  similarItems: SimilarItem[];
  reviews?: ReviewItem[];
}

interface SimilarItem {
  id: string;
  title: string;
  price: number;
  photos: string[];
  location: string;
}

interface ReviewItem {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
    profilePhoto?: string | null;
  };
}

interface RecentViewedItem {
  id: string;
  title: string;
  location: string;
  price: number;
  photo?: string;
}

const UsedItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fetchedIds = useRef<Set<string>>(new Set());
  const [item, setItem] = useState<UsedItemDetail | null>(null);
  const [similarItems, setSimilarItems] = useState<SimilarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  useEffect(() => {
    if (!id || fetchedIds.current.has(id)) return;
    fetchedIds.current.add(id);
    fetchItemDetails();
  }, [id]);

  const saveRecentlyViewedItem = (item: UsedItemDetail) => {
    try {
      const raw = localStorage.getItem('recentlyViewedItems');
      const current: RecentViewedItem[] = raw ? JSON.parse(raw) : [];
      const next: RecentViewedItem[] = [
        {
          id: item.id,
          title: item.title,
          location: item.location,
          price: item.price,
          photo: item.photos[0],
        },
        ...current.filter((existing) => existing.id !== item.id),
      ].slice(0, 8);
      localStorage.setItem('recentlyViewedItems', JSON.stringify(next));
    } catch (error) {
      console.error('Failed to save recently viewed item:', error);
    }
  };

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/used-items/${id}`);
      const payload = response.data;
      const backendItem = payload.item ?? payload;
      const { savedBy, ...backendItemWithoutSavedBy } = backendItem;
      const preparedItem: UsedItemDetail = {
        ...backendItemWithoutSavedBy,
        contactNumber: backendItem.contact ?? backendItem.contactNumber,
        deliveryOption: backendItem.delivery ?? backendItem.deliveryOption,
        isNegotiable: backendItem.negotiable ?? backendItem.isNegotiable,
        isUrgent: backendItem.isUrgent ?? backendItem.isUrgent,
        isSaved: backendItem.isSaved ?? false,
      };
      setItem(preparedItem);
      setSimilarItems(payload.similarItems || []);
      setReviews(payload.reviews || []);
      saveRecentlyViewedItem(preparedItem);
    } catch (error) {
      console.error('Failed to fetch item:', error);
      toast.error('Failed to load item details');
      navigate('/used-items');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async () => {
    if (!user) {
      toast.error('Please login to save items');
      navigate('/login');
      return;
    }

    try {
      if (item?.isSaved) {
        await api.delete(`/api/used-items/${id}/save`);
        toast.success('Item removed from favorites');
      } else {
        await api.post(`/api/used-items/${id}/save`);
        toast.success('Item saved to favorites!');
      }
      fetchItemDetails();
    } catch (error) {
      console.error('Save toggle failed', error);
      toast.error('Failed to update favorite status');
    }
  };

  const handleReport = async () => {
    if (!reportReason) {
      toast.error('Please select a reason');
      return;
    }
    try {
      await api.post(`/api/used-items/${id}/report`, { reason: reportReason });
      toast.success('Report submitted successfully');
      setShowReportDialog(false);
      setReportReason('');
    } catch (error) {
      toast.error('Failed to submit report');
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      toast.error('Please enter a message');
      return;
    }
    setSending(true);
    try {
      await api.post(`/api/used-items/${id}/message`, { message: messageText });
      toast.success('Message sent to seller');
      setShowMessageDialog(false);
      setMessageText('');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleContactSeller = () => {
    if (!item?.seller.id) return;
    navigate('/messenger', { state: { contactChatId: item.seller.id } });
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Please login to leave a review');
      navigate('/login');
      return;
    }

    if (!reviewComment.trim()) {
      toast.error('Please enter a short review comment');
      return;
    }

    if (!item?.seller.id) return;

    setSubmittingReview(true);
    try {
      await api.post(`/api/used-items/${id}/review`, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      toast.success('Review submitted successfully');
      setShowReviewDialog(false);
      setReviewComment('');
      setReviewRating(5);
      fetchItemDetails();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) {
      toast.error('Please login to delete your review');
      navigate('/login');
      return;
    }

    setDeletingReviewId(reviewId);
    try {
      await api.delete(`/api/used-items/${id}/review/${reviewId}`);
      toast.success('Review deleted successfully');
      fetchItemDetails();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete review');
    } finally {
      setDeletingReviewId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading item details...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Item Not Found</h2>
          <p className="text-gray-500 mb-4">The item you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/used-items')}>Back to Marketplace</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/used-items')}
          className="flex items-center gap-2 text-gray-600 hover:text-green-600 mb-6 transition"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Marketplace
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              {/* Main Image */}
              <div className="relative h-96 bg-gray-100">
                <img
                  src={item.photos[currentImageIndex] || 'https://placehold.co/800x600/png?text=No+Image'}
                  alt={item.title}
                  className="w-full h-full object-contain"
                />
                {item.photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(prev => prev === 0 ? item.photos.length - 1 : prev - 1)}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/75"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(prev => prev === item.photos.length - 1 ? 0 : prev + 1)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/75"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
              
              {/* Thumbnails */}
              {item.photos.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {item.photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                        currentImageIndex === index ? 'border-green-500' : 'border-transparent'
                      }`}
                    >
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Description */}
            <Card className="p-6 mt-6">
              <Tabs defaultValue="description">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="seller">Seller Info</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="pt-4">
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {item.description}
                  </p>
                </TabsContent>
                <TabsContent value="details" className="pt-4 space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Condition</span>
                    <span className="font-medium capitalize">{item.condition.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Category</span>
                    <span className="font-medium">{item.category}</span>
                  </div>
                  {item.subCategory && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Subcategory</span>
                      <span className="font-medium">{item.subCategory}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Delivery Option</span>
                    <span className="font-medium capitalize">{item.deliveryOption}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Price Negotiable</span>
                    <span className="font-medium">{item.isNegotiable ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Posted on</span>
                    <span className="font-medium">{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Views</span>
                    <span className="font-medium">{item.viewCount}</span>
                  </div>
                </TabsContent>
                <TabsContent value="seller" className="pt-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={item.seller.profilePhoto} />
                      <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl">
                        {item.seller.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{item.seller.name}</h3>
                        {item.seller.isVerified && (
                          <Shield className="w-4 h-4 text-green-600" aria-label="Verified Seller" role="img" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{item.seller.rating || 'New'} rating</span>
                        <span>•</span>
                        <span>{item.seller.listingsCount} listings</span>
                        <span>•</span>
                        <span>Member since {new Date(item.seller.createdAt).getFullYear()}</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={handleContactSeller}>
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Message
                        </Button>
                        {user && user.id !== item.seller.id ? (
                          <Button size="sm" onClick={() => setShowReviewDialog(true)}>
                            Give Review
                          </Button>
                        ) : !user ? (
                          <Button size="sm" onClick={() => navigate('/login')}>
                            Give Review
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="reviews" className="pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">Recent Reviews</h3>
                      <p className="text-sm text-gray-500">Real feedback from buyers about this seller.</p>
                    </div>
                    {user && user.id !== item.seller.id ? (
                      <Button size="sm" onClick={() => setShowReviewDialog(true)}>Give Review</Button>
                    ) : !user ? (
                      <Button size="sm" variant="outline" onClick={() => navigate('/login')}>Give Review</Button>
                    ) : null}
                  </div>

                  {reviews.length > 0 ? (
                    <div className="space-y-3">
                      {reviews.map(review => (
                        <div key={review.id} className="rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={review.reviewer.profilePhoto || undefined} />
                                <AvatarFallback>{review.reviewer.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{review.reviewer.name}</p>
                                <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-yellow-500">
                                {Array.from({ length: 5 }).map((_, index) => (
                                  <Star key={index} className={`w-4 h-4 ${index < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                                ))}
                              </div>
                              {user?.id === review.reviewer.id && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteReview(review.id)}
                                  disabled={deletingReviewId === review.id}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  {deletingReviewId === review.id ? 'Deleting...' : 'Delete'}
                                </Button>
                              )}
                            </div>
                          </div>
                          {review.comment && <p className="mt-3 text-sm text-gray-600">{review.comment}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                      No reviews yet for this seller.
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </Card>

            {/* Similar Items */}
            {similarItems && similarItems.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Similar Items You Might Like</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {similarItems.map(similar => (
                    <Card 
                      key={similar.id}
                      className="cursor-pointer hover:shadow-lg transition"
                      onClick={() => navigate(`/used-item/${similar.id}`)}
                    >
                      <img
                        src={similar.photos[0] || 'https://placehold.co/400x300/png?text=No+Image'}
                        alt={similar.title}
                        className="w-full h-32 object-cover rounded-t-lg"
                      />
                      <div className="p-2">
                        <h4 className="font-semibold text-sm line-clamp-1">{similar.title}</h4>
                        <p className="text-green-600 font-bold text-sm">৳{similar.price.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{similar.location}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Buy/Sell Card */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              {/* Price */}
              <div className="mb-4">
                <div className="text-3xl font-bold text-green-600">৳{item.price.toLocaleString()}</div>
                {item.isNegotiable && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <DollarSign className="w-4 h-4" />
                    Price Negotiable
                  </div>
                )}
              </div>

              {/* Urgent Badge */}
              {item.isUrgent && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="font-semibold text-red-600">Urgent Sale!</p>
                    <p className="text-xs text-red-500">Seller needs to sell within 3 days</p>
                  </div>
                </div>
              )}

              {/* Delivery Option */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Delivery/Pickup</span>
                </div>
                <p className="text-sm capitalize">{item.deliveryOption}</p>
              </div>

              {/* Location */}
              <div className="mb-4 flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{item.location}</span>
              </div>

              {/* Posted Date */}
              <div className="mb-4 flex items-center gap-2 text-gray-500 text-sm">
                <Clock className="w-4 h-4" />
                <span>Posted {new Date(item.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleContactSeller}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Seller
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleSaveItem}
                >
                  <Heart className={`w-4 h-4 mr-2 ${item.isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                  {item.isSaved ? 'Saved to Favorites' : 'Save to Favorites'}
                </Button>

                <Button 
                  variant="ghost" 
                  className="w-full text-red-600 hover:text-red-700"
                  onClick={() => setShowReportDialog(true)}
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Report Item
                </Button>
              </div>

              {/* Share */}
              <div className="mt-4 pt-4 border-t">
                <Button variant="ghost" className="w-full" onClick={() => {
                  const shareUrl = buildShareUrl(`/used-item/${item.id}`)
                  navigator.share?.({
                    title: item.title,
                    text: `Check out this item for ৳${item.price}`,
                    url: shareUrl,
                  });
                }}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share this item
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">Select a reason</option>
              <option value="scam">Scam or Fraud</option>
              <option value="fake_product">Fake Product</option>
              <option value="wrong_information">Wrong Information</option>
              <option value="inappropriate">Inappropriate Content</option>
              <option value="other">Other</option>
            </select>
            <div className="flex gap-2">
              <Button onClick={handleReport} className="flex-1 bg-red-600">Submit Report</Button>
              <Button variant="outline" onClick={() => setShowReportDialog(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message to {item.seller.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder={`Hi, I'm interested in your "${item.title}"...`}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button onClick={handleSendMessage} disabled={sending} className="flex-1">
                <Send className="w-4 h-4 mr-2" />
                {sending ? 'Sending...' : 'Send Message'}
              </Button>
              <Button variant="outline" onClick={() => setShowMessageDialog(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Write a review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Rating</label>
              <div className="flex items-center gap-2 mt-2">
                {Array.from({ length: 5 }).map((_, index) => {
                  const value = index + 1;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setReviewRating(value)}
                      className="text-2xl text-yellow-500"
                    >
                      <Star className={`w-6 h-6 ${value <= reviewRating ? 'fill-current' : 'text-gray-300'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Comment</label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience with this seller"
                className="mt-2 min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitReview} disabled={submittingReview}>
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsedItemDetail;