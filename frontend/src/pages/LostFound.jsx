import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { 
  MapPin, Calendar, Phone, CheckCircle, AlertCircle, Plus, Search,
  X, Image as ImageIcon, Check, Flag, MessageSquare
} from 'lucide-react';
import { CardSkeleton } from '../components/SkeletonLoader';
import { motion, AnimatePresence } from 'framer-motion';

const LostFound = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // URL Action processing
  const searchParams = new URLSearchParams(location.search);
  const actionParam = searchParams.get('action');
  const itemIdParam = searchParams.get('id');

  // Lists & filters states
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, lost, found
  const [filterCategory, setFilterCategory] = useState('');
  const [filterResolved, setFilterResolved] = useState('false'); // false, true, all

  // Modals state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState('lost'); // lost, found
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [flaggedClaimUser, setFlaggedClaimUser] = useState(null);

  // New report form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Electronics',
    description: '',
    location: '',
    date: '',
    contactNumber: ''
  });
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Categories list
  const categories = [
    'Electronics', 'Books', 'Lab Equipment', 'Stationery',
    'Furniture', 'Cycles', 'Accessories', 'Documents', 'Miscellaneous'
  ];

  // Fetch reports on mount/filters change
  useEffect(() => {
    fetchItems();
  }, [filterType, filterCategory, filterResolved]);

  // Handle URL query actions
  useEffect(() => {
    if (actionParam === 'report-lost') {
      setReportType('lost');
      setReportModalOpen(true);
      cleanUrlParams();
    } else if (actionParam === 'report-found') {
      setReportType('found');
      setReportModalOpen(true);
      cleanUrlParams();
    }

    if (itemIdParam) {
      fetchSingleItemDetails(itemIdParam);
    }
  }, [actionParam, itemIdParam]);

  const cleanUrlParams = () => {
    navigate('/lostfound', { replace: true });
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      let url = `/lostfound?search=${search}`;
      if (filterType !== 'all') url += `&type=${filterType}`;
      if (filterCategory) url += `&category=${filterCategory}`;
      if (filterResolved !== 'all') url += `&resolved=${filterResolved}`;

      const response = await api.get(url);
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
      showToast('Could not load items list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleItemDetails = async (id) => {
    try {
      const response = await api.get(`/lostfound/${id}`);
      setSelectedItem(response.data);
      setDetailModalOpen(true);
    } catch (error) {
      console.error('Error fetching item details:', error);
      showToast('Item listing details could not be found.', 'error');
      cleanUrlParams();
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems();
  };

  // Handle image files changes
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
  };

  // Submit report handler
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    const { name, category, description, location: loc, date } = formData;
    if (!name.trim() || !description.trim() || !loc.trim() || !date) {
      showToast('All required fields must be filled', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const uploadData = new FormData();
      uploadData.append('name', name);
      uploadData.append('type', reportType);
      uploadData.append('category', category);
      uploadData.append('description', description);
      uploadData.append('location', loc);
      uploadData.append('date', date);
      uploadData.append('contactNumber', formData.contactNumber);

      for (const img of images) {
        uploadData.append('images', img);
      }

      const response = await api.post('/lostfound', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast(`Successfully reported ${reportType} item!`, 'success');
      setItems(prev => [response.data, ...prev]);
      
      // Close and Reset Form
      setReportModalOpen(false);
      setFormData({
        name: '',
        category: 'Electronics',
        description: '',
        location: '',
        date: '',
        contactNumber: ''
      });
      setImages([]);
    } catch (error) {
      console.error('Error reporting item:', error);
      showToast(error.response?.data?.message || 'Failed to submit report.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Claim click handler
  const handleClaimItem = async (itemId) => {
    try {
      await api.post(`/lostfound/${itemId}/claim`);
      showToast('Claim request sent successfully to the reporter.', 'success');
      fetchSingleItemDetails(itemId); // Refresh detail view
    } catch (error) {
      console.error('Claim error:', error);
      showToast(error.response?.data?.message || 'Could not send claim request.', 'error');
    }
  };

  // Resolve click handler
  const handleResolveItem = async (itemId, claimantId = null) => {
    try {
      const response = await api.put(`/lostfound/${itemId}/resolve`, {
        claimedByUserId: claimantId
      });
      showToast('Item status marked as resolved!', 'success');
      setSelectedItem(response.data.item);
      // Update item in list
      setItems(prev => prev.map(i => i._id === itemId ? response.data.item : i));
    } catch (error) {
      console.error('Resolve error:', error);
      showToast('Failed to resolve item claim.', 'error');
    }
  };

  // Flag Suspicious Claim click handler
  const handleOpenFlagModal = (claimUser) => {
    setFlaggedClaimUser(claimUser);
    setFlagModalOpen(true);
  };

  const handleFlagSubmit = async (e) => {
    e.preventDefault();
    if (!flagReason.trim()) {
      showToast('Please specify a reason for flagging', 'warning');
      return;
    }

    try {
      const response = await api.post(`/lostfound/${selectedItem._id}/report-claim`, {
        reason: flagReason,
        suspiciousUser: flaggedClaimUser.id
      });
      showToast('Claim flagged and reported to admins.', 'success');
      setSelectedItem(response.data.item);
      setFlagModalOpen(false);
      setFlagReason('');
    } catch (error) {
      console.error('Flag claim error:', error);
      showToast('Could not flag claim.', 'error');
    }
  };

  // Delete listing handler
  const handleDeleteListing = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this listing permanently?')) return;

    try {
      await api.delete(`/lostfound/${itemId}`);
      showToast('Listing deleted successfully.', 'success');
      setItems(prev => prev.filter(i => i._id !== itemId));
      setDetailModalOpen(false);
    } catch (error) {
      console.error('Delete listing error:', error);
      showToast('Could not delete listing.', 'error');
    }
  };

  const handleChatReporter = (reporterId, contextItem) => {
    navigate(`/chat?userId=${reporterId}&itemType=Item&itemId=${contextItem._id}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Floating action bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-primary-600 via-accent-600 to-secondary-500 bg-clip-text text-transparent dark:from-primary-400 dark:via-accent-400 dark:to-secondary-400">Lost & Found Hub</h1>
          <p className="text-xs text-slate-400 font-bold mt-1">Report, match, and claim belongings around campus.</p>
        </div>
        <button 
          onClick={() => setReportModalOpen(true)}
          className="px-5 py-2.5 text-xs font-bold rounded-2xl transition-all btn-luxury flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Report Lost/Found Item
        </button>
      </div>

      {/* Filters & Search Block */}
      <div className="p-4 glass-card-premium rounded-3xl flex flex-col md:flex-row gap-4 justify-between items-center border border-slate-200/30 dark:border-white/5 shadow-sm">
        
        {/* Toggle Lost/Found/All */}
        <div className="flex bg-slate-100 dark:bg-dark-900/50 p-1.5 rounded-2xl w-full md:w-auto">
          {['all', 'lost', 'found'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                filterType === t 
                  ? 'bg-white dark:bg-dark-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/20 dark:border-white/5' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {t} Items
            </button>
          ))}
        </div>

        {/* Dynamic Filters Form */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row sm:flex-wrap gap-3 w-full md:w-auto flex-1 max-w-2xl justify-end">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-50 dark:bg-dark-900/40 border border-slate-200/40 dark:border-white/10 text-xs px-3 py-2.5 rounded-2xl focus:outline-none text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-accent-500/50"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={filterResolved}
            onChange={(e) => setFilterResolved(e.target.value)}
            className="bg-slate-50 dark:bg-dark-900/40 border border-slate-200/40 dark:border-white/10 text-xs px-3 py-2.5 rounded-2xl focus:outline-none text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-accent-500/50"
          >
            <option value="false">Active Only</option>
            <option value="true">Resolved Only</option>
            <option value="all">Show All</option>
          </select>

          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full !pl-10 pr-4 py-2.5 rounded-2xl text-xs border border-slate-200/40 dark:border-white/10 bg-slate-50 dark:bg-dark-900/40 focus:outline-none focus:ring-2 focus:ring-accent-500/50 placeholder:text-slate-400"
            />
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-2xl text-xs font-bold transition-all btn-luxury">
            Search
          </button>
        </form>
      </div>

      {/* Listings Display */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : items.length === 0 ? (
        <div className="p-16 border border-dashed border-slate-200/60 dark:border-white/10 rounded-3xl text-center bg-white dark:bg-dark-900/30">
          <MapPin className="w-12 h-12 text-slate-300 dark:text-dark-700 mx-auto mb-3" />
          <h3 className="font-extrabold text-sm">No items found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto font-medium">No reports match your filters. Be the first to share an update!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item._id}
              onClick={() => fetchSingleItemDetails(item._id)}
              className="glass-card-premium card-glow rounded-3xl overflow-hidden flex flex-col border border-slate-200/30 dark:border-white/10 p-4 cursor-pointer shadow-sm relative"
            >
              {/* Type Badge */}
              <div className="absolute top-6 left-6 z-10 flex gap-2">
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                  item.type === 'lost' ? 'bg-red-500/10 text-red-500 border border-red-500/25' : 'bg-green-500/10 text-green-500 border border-green-500/25'
                }`}>
                  {item.type}
                </span>
                {item.resolved && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-200/20 dark:border-white/5">
                    Resolved
                  </span>
                )}
              </div>

              {/* Product Thumbnail */}
              <img 
                src={item.images[0] || 'https://via.placeholder.com/400'} 
                alt={item.name} 
                className="w-full h-44 object-cover rounded-2xl mb-3.5 flex-shrink-0"
              />

              {/* Details */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] text-primary-500 dark:text-primary-400 font-bold tracking-wider block uppercase">{item.category}</span>
                  <h3 className="font-extrabold text-sm line-clamp-1 mt-0.5">{item.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed font-medium">{item.description}</p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-200/20 dark:border-white/5 text-[9px] text-slate-400 font-bold">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {item.location}
                  </span>
                  <span>
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REPORT MODAL */}
      <AnimatePresence>
        {reportModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setReportModalOpen(false)} className="fixed inset-0 bg-black" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl p-6 shadow-2xl relative z-10 overflow-y-auto max-h-[90vh] bg-white/95 dark:bg-dark-950/95 backdrop-blur-2xl border border-slate-200/40 dark:border-white/10 text-slate-800 dark:text-slate-100"
            >
              <button onClick={() => setReportModalOpen(false)} className="absolute top-5 right-5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-900 transition-colors">
                <X className="w-4.5 h-4.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
              </button>

              <h2 className="text-base font-black uppercase tracking-wider mb-5">Report Lost or Found Item</h2>
              
              {/* Type Switcher */}
              <div className="flex bg-slate-100 dark:bg-dark-900 p-1.5 rounded-2xl mb-5">
                <button
                  type="button"
                  onClick={() => setReportType('lost')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    reportType === 'lost' ? 'bg-white dark:bg-dark-800 shadow-sm text-red-500 border border-slate-200/20 dark:border-white/5' : 'text-slate-500'
                  }`}
                >
                  Lost Item
                </button>
                <button
                  type="button"
                  onClick={() => setReportType('found')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    reportType === 'found' ? 'bg-white dark:bg-dark-800 shadow-sm text-green-500 border border-slate-200/20 dark:border-white/5' : 'text-slate-500'
                  }`}
                >
                  Found Item
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold block">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Blue Jansport Backpack"
                    className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200/40 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent-500/50 placeholder:text-slate-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-bold block">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200/40 dark:border-white/10 rounded-2xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent-500/50 text-slate-800 dark:text-white"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-bold block">Date Lost/Found *</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200/40 dark:border-white/10 rounded-2xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent-500/50 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-bold block">Location seen/found *</label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g. Tech Auditorium"
                      className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200/40 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent-500/50 placeholder:text-slate-500 text-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-bold block">Contact Phone (Optional)</label>
                    <input
                      type="text"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200/40 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent-500/50 placeholder:text-slate-500 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold block">Description *</label>
                  <textarea
                    required
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Give a detailed description of the item (color, branding, key features, sticker labels)..."
                    className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200/40 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent-500/50 placeholder:text-slate-500 text-slate-800 dark:text-white"
                  />
                </div>

                {/* Upload Image box */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold block">Upload Images (Max 5)</label>
                  <div className="border border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-4 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-dark-900/40 relative transition-all">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <ImageIcon className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                    <p className="text-[10px] text-slate-400 font-bold">Click to select files, or drag images here.</p>
                    {images.length > 0 && (
                      <p className="text-[10px] text-primary-500 font-black mt-2">{images.length} files selected</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-2xl font-bold text-sm transition-all btn-luxury disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
                >
                  {submitting ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Report Listing'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {detailModalOpen && selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setDetailModalOpen(false)} className="fixed inset-0 bg-black" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative z-10 overflow-y-auto max-h-[90vh] bg-white/95 dark:bg-dark-950/95 backdrop-blur-2xl border border-slate-200/40 dark:border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-800 dark:text-slate-100"
            >
              <button onClick={() => setDetailModalOpen(false)} className="absolute top-5 right-5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-900 transition-colors z-10">
                <X className="w-4.5 h-4.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
              </button>

              {/* Left Column: Image view */}
              <div className="space-y-4">
                <img 
                  src={selectedItem.images[0] || 'https://via.placeholder.com/400'} 
                  alt={selectedItem.name} 
                  className="w-full h-64 object-cover rounded-2xl"
                />
                
                {/* Secondary images */}
                {selectedItem.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {selectedItem.images.slice(1).map((img, idx) => (
                      <img key={idx} src={img} alt="" className="w-full h-12 object-cover rounded-lg border border-slate-250 dark:border-white/5" />
                    ))}
                  </div>
                )}

                {/* Reporter Profile Details Card */}
                <div className="p-3.5 border border-slate-200/40 dark:border-white/5 bg-slate-50 dark:bg-dark-900/30 backdrop-blur-md rounded-2xl space-y-2">
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Reported By</span>
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={selectedItem.reporter?.profilePicture || 'https://via.placeholder.com/150'} 
                      alt="" 
                      className="w-8 h-8 rounded-full object-cover border border-slate-100 dark:border-white/10" 
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold truncate text-slate-700 dark:text-slate-200">{selectedItem.reporter?.name}</h4>
                      <span className="text-[9px] text-slate-400 truncate block font-semibold">{selectedItem.reporter?.department} ({selectedItem.reporter?.year})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Listing info details */}
              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                      selectedItem.type === 'lost' ? 'bg-red-500/10 text-red-500 border border-red-500/25' : 'bg-green-500/10 text-green-500 border border-green-500/25'
                    }`}>
                      {selectedItem.type}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-primary-500/10 text-primary-500 dark:text-primary-400 border border-primary-500/25">
                      {selectedItem.category}
                    </span>
                  </div>

                  <h2 className="text-lg font-black leading-tight text-slate-800 dark:text-white">{selectedItem.name}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">{selectedItem.description}</p>

                  <div className="space-y-2 text-xs pt-3 border-t border-slate-200/20 dark:border-white/5">
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>Seen / Found: <strong className="text-slate-800 dark:text-white">{selectedItem.location}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>Date: <strong className="text-slate-800 dark:text-white">{new Date(selectedItem.date).toLocaleDateString()}</strong></span>
                    </div>
                    {selectedItem.contactNumber && (
                      <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>Phone: <strong className="text-slate-800 dark:text-white">{selectedItem.contactNumber}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Claiming Actions */}
                <div className="pt-4 border-t border-slate-200/20 dark:border-white/5 space-y-3">
                  
                  {/* Item is Resolved status box */}
                  {selectedItem.resolved ? (
                    <div className="p-3.5 bg-slate-50 dark:bg-dark-900 border border-slate-200/40 dark:border-white/5 rounded-2xl flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                      <CheckCircle className="w-5 h-5 text-slate-400" />
                      <span>This report has been resolved and closed.</span>
                    </div>
                  ) : (
                    <>
                      {/* USER IS THE REPORTER */}
                      {user && selectedItem.reporter?._id === user.id ? (
                        <div className="space-y-2">
                          <button
                            onClick={() => handleResolveItem(selectedItem._id)}
                            className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-green-500/10 active:scale-95 transition-all"
                          >
                            <Check className="w-4 h-4" />
                            Mark as Resolved
                          </button>
                          
                          {/* List claims if present */}
                          {selectedItem.suspiciousClaims?.length > 0 && (
                            <div className="border border-red-200 bg-red-50/50 dark:border-red-950/40 dark:bg-red-950/10 p-3.5 rounded-2xl space-y-1.5">
                              <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Banned / Flagged claim warnings
                              </span>
                              {selectedItem.suspiciousClaims.map((claim, idx) => (
                                <p key={idx} className="text-[10px] text-slate-500 font-semibold">
                                  <strong>{claim.user?.name}</strong>: {claim.reason}
                                </p>
                              ))}
                            </div>
                          )}

                          <button
                            onClick={() => handleDeleteListing(selectedItem._id)}
                            className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-2xl text-xs active:scale-95 transition-all"
                          >
                            Delete Listing
                          </button>
                        </div>
                      ) : (
                        /* USER IS A GUEST/VISITOR CLAIMING */
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleClaimItem(selectedItem._id)}
                            className="flex-1 py-2.5 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 btn-luxury"
                          >
                            <Check className="w-4 h-4" />
                            Claim Item
                          </button>
                          
                          <button
                            onClick={() => handleChatReporter(selectedItem.reporter?._id, selectedItem)}
                            className="px-3.5 py-2.5 bg-white dark:bg-dark-900 border border-slate-200/40 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-dark-805 rounded-2xl text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors shadow-sm"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          {/* Flag claim trigger */}
                          {user && (
                            <button
                              onClick={() => handleOpenFlagModal({ id: selectedItem.reporter?._id, name: selectedItem.reporter?.name })}
                              title="Flag suspicious claim process"
                              className="px-3.5 py-2.5 border border-slate-200/40 dark:border-white/10 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-2xl transition-colors"
                            >
                              <Flag className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* ADMIN MODERATOR ACTIONS */}
                      {user && user.role === 'admin' && selectedItem.reporter?._id !== user.id && (
                        <button
                          onClick={() => handleDeleteListing(selectedItem._id)}
                          className="w-full py-2.5 border border-red-500/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-2xl text-xs font-bold transition-all"
                        >
                          Delete Listing (Moderator override)
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLAG SUSPICIOUS MODAL */}
      <AnimatePresence>
        {flagModalOpen && flaggedClaimUser && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setFlagModalOpen(false)} className="fixed inset-0 bg-black" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl p-5 shadow-2xl relative z-10 space-y-4 bg-white dark:bg-dark-950 border border-slate-200/40 dark:border-white/10 text-slate-800 dark:text-slate-100"
            >
              <button onClick={() => setFlagModalOpen(false)} className="absolute top-4 right-4 text-gray-500">
                <X className="w-4.5 h-4.5" />
              </button>

              <h3 className="font-extrabold text-sm text-red-500 flex items-center gap-1.5">
                <Flag className="w-4 h-4" />
                Report Suspicious claim
              </h3>
              <p className="text-[11px] text-slate-400 leading-normal font-medium">
                Flag user claims if they give contradictory descriptions, demand cash finders-fees, or violate academic codes of conduct.
              </p>

              <form onSubmit={handleFlagSubmit} className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold block">Suspicious Student</label>
                  <input
                    type="text"
                    disabled
                    value={flaggedClaimUser.name}
                    className="w-full bg-slate-100 dark:bg-dark-900 border border-slate-250 dark:border-dark-750 rounded-xl p-2 text-xs font-extrabold text-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold block">Reason for flag *</label>
                  <textarea
                    required
                    rows="3"
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    placeholder="Describe why you believe this claim request is fraudulent, spam, or malicious..."
                    className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200/40 dark:border-white/10 rounded-xl p-2 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-500/10 active:scale-95"
                >
                  Flag claim
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LostFound;
