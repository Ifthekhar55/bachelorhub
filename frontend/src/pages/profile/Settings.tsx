import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon,
  Mail,
  Phone,
  Lock,
  Bell,
  Shield,
  Globe,
  MapPin,
  Eye,
  Users,
  FileText,
  Trash2,
  ChevronRight,
  Save,
  X,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'
import { toast } from 'react-hot-toast'

interface SettingsData {
  // Account
  currentPassword: string
  newPassword: string
  confirmPassword: string
  newEmail: string
  newPhone: string

  // Notifications
  messageNotifications: boolean
  bookingNotifications: boolean
  listingUpdates: boolean
  promotionalNotifications: boolean

  // Privacy & Security
  profileVisibility: 'public' | 'private' | 'friends'
  blockedUsers: string[]

  // Preferences
  language: string
  locationPreference: string
}

const Settings = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const [settings, setSettings] = useState<SettingsData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    newEmail: '',
    newPhone: '',
    messageNotifications: true,
    bookingNotifications: true,
    listingUpdates: true,
    promotionalNotifications: true,
    profileVisibility: 'public',
    blockedUsers: [],
    language: 'en',
    locationPreference: '',
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/users/settings')
      const data = response.data
      setSettings({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        newEmail: data.email || '',
        newPhone: data.phone || '',
        messageNotifications: data.notifications?.messageNotifications ?? true,
        bookingNotifications: data.notifications?.bookingNotifications ?? true,
        listingUpdates: data.notifications?.listingUpdates ?? true,
        promotionalNotifications: data.notifications?.promotionalNotifications ?? true,
        profileVisibility: data.privacy?.profileVisibility ?? 'public',
        blockedUsers: data.privacy?.blockedUsers ?? [],
        language: data.preferences?.language ?? 'en',
        locationPreference: data.preferences?.locationPreference ?? '',
      })
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      await api.put('/api/users/settings', {
        email: settings.newEmail,
        phone: settings.newPhone,
        notifications: {
          messageNotifications: settings.messageNotifications,
          bookingNotifications: settings.bookingNotifications,
          listingUpdates: settings.listingUpdates,
          promotionalNotifications: settings.promotionalNotifications,
        },
        privacy: {
          profileVisibility: settings.profileVisibility,
          blockedUsers: settings.blockedUsers,
        },
        preferences: {
          language: settings.language,
          locationPreference: settings.locationPreference,
        },
      })
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!settings.currentPassword || !settings.newPassword || !settings.confirmPassword) {
      toast.error('Please fill all password fields')
      return
    }

    if (settings.newPassword !== settings.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (settings.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    try {
      setSaving(true)
      await api.post('/api/users/change-password', {
        currentPassword: settings.currentPassword,
        newPassword: settings.newPassword,
      })
      toast.success('Password changed successfully')
      setSettings({
        ...settings,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error) {
      console.error('Failed to change password:', error)
      toast.error('Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    try {
      setSaving(true)
      await api.delete('/api/users/account')
      toast.success('Account deleted successfully')
      logout()
      navigate('/')
    } catch (error) {
      console.error('Failed to delete account:', error)
      toast.error('Failed to delete account')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account, notifications, privacy, and preferences
          </p>
        </motion.div>

        {/* Settings Tabs */}
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-8">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="legal">Legal</TabsTrigger>
            <TabsTrigger value="danger">Danger</TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email & Phone
              </h2>

              <div className="space-y-6">
                {/* Change Email */}
                <div>
                  <Label htmlFor="email">Current Email</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {user?.email}
                  </p>
                </div>

                <div>
                  <Label htmlFor="newEmail">New Email Address</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    placeholder="Enter new email address"
                    value={settings.newEmail}
                    onChange={(e) =>
                      setSettings({ ...settings, newEmail: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>

                {/* Change Phone */}
                <div>
                  <Label htmlFor="phone">Current Phone</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {user?.phone || 'Not set'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="newPhone">New Phone Number</Label>
                  <Input
                    id="newPhone"
                    type="tel"
                    placeholder="Enter new phone number"
                    value={settings.newPhone}
                    onChange={(e) =>
                      setSettings({ ...settings, newPhone: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Change Password
              </h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="Enter current password"
                    value={settings.currentPassword}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        currentPassword: e.target.value,
                      })
                    }
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={settings.newPassword}
                    onChange={(e) =>
                      setSettings({ ...settings, newPassword: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={settings.confirmPassword}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="mt-2"
                  />
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={saving}
                  className="w-full"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Update Password
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </h2>

              <div className="space-y-4">
                {/* Message Notifications */}
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium">Message Notifications</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive notifications when someone messages you
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.messageNotifications}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        messageNotifications: e.target.checked,
                      })
                    }
                    className="w-5 h-5"
                  />
                </div>

                {/* Booking Notifications */}
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium">Booking Notifications</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive notifications about bookings and confirmations
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.bookingNotifications}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        bookingNotifications: e.target.checked,
                      })
                    }
                    className="w-5 h-5"
                  />
                </div>

                {/* Listing Updates */}
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium">Listing Updates</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive notifications about your listings
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.listingUpdates}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        listingUpdates: e.target.checked,
                      })
                    }
                    className="w-5 h-5"
                  />
                </div>

                {/* Promotional Notifications */}
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium">Promotional Notifications</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive promotional offers and updates
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.promotionalNotifications}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        promotionalNotifications: e.target.checked,
                      })
                    }
                    className="w-5 h-5"
                  />
                </div>

                <Button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </Card>

          </TabsContent>

          {/* Privacy & Security */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Profile Visibility
              </h2>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="public"
                    name="visibility"
                    value="public"
                    checked={settings.profileVisibility === 'public'}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        profileVisibility: e.target.value as 'public' | 'private' | 'friends',
                      })
                    }
                  />
                  <Label htmlFor="public">
                    <span className="font-medium">Public</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Anyone can see your profile
                    </p>
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="friends"
                    name="visibility"
                    value="friends"
                    checked={settings.profileVisibility === 'friends'}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        profileVisibility: e.target.value as 'public' | 'private' | 'friends',
                      })
                    }
                  />
                  <Label htmlFor="friends">
                    <span className="font-medium">Friends Only</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Only your friends can see your profile
                    </p>
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="private"
                    name="visibility"
                    value="private"
                    checked={settings.profileVisibility === 'private'}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        profileVisibility: e.target.value as 'public' | 'private' | 'friends',
                      })
                    }
                  />
                  <Label htmlFor="private">
                    <span className="font-medium">Private</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Only you can see your profile
                    </p>
                  </Label>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Blocked Users
              </h2>

              {settings.blockedUsers.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">
                  You haven't blocked anyone yet
                </p>
              ) : (
                <div className="space-y-2">
                  {settings.blockedUsers.map((userId, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <span className="text-sm">{userId}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSettings({
                            ...settings,
                            blockedUsers: settings.blockedUsers.filter(
                              (_, i) => i !== index
                            ),
                          })
                        }}
                      >
                        Unblock
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Card>
          </TabsContent>

          {/* Preferences */}
          <TabsContent value="preferences" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Preferences
              </h2>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    value={settings.language}
                    onChange={(e) =>
                      setSettings({ ...settings, language: e.target.value })
                    }
                    className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  >
                    <option value="en">English</option>
                    <option value="bn">বাংলা (Bangla)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="location">Location Preference</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Dhaka, Bangladesh"
                    value={settings.locationPreference}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        locationPreference: e.target.value,
                      })
                    }
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Used to filter listings and recommendations
                  </p>
                </div>

                <Button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Legal */}
          <TabsContent value="legal" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Legal Documents
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => window.open('/privacy', '_blank')}
                >
                  <div>
                    <p className="font-medium">Privacy Policy</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Read our privacy policy
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => window.open('/terms', '_blank')}
                >
                  <div>
                    <p className="font-medium">Terms & Conditions</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Read our terms and conditions
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Danger Zone */}
          <TabsContent value="danger" className="space-y-6">
            <Card className="p-6 border-red-200 dark:border-red-900">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </h2>

              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900 mb-6">
                <p className="text-red-800 dark:text-red-200 text-sm">
                  <strong>Warning:</strong> This action cannot be undone. Deleting your account
                  will permanently remove all your data, listings, messages, and activity.
                </p>
              </div>

              {!showDeleteConfirm ? (
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              ) : (
                <div className="space-y-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900">
                  <p className="font-medium text-red-700 dark:text-red-300">
                    To confirm account deletion, type <strong>DELETE</strong>:
                  </p>
                  <Input
                    placeholder="Type DELETE to confirm"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="border-red-300"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={handleDeleteAccount}
                      disabled={saving}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {saving ? 'Deleting...' : 'Delete Account'}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        setDeleteConfirmText('')
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Settings
