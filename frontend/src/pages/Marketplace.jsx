import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { 
  ShoppingBag, Tag, DollarSign, Heart, MessageSquare, Plus, Search,
  X, Image as ImageIcon, Check, CheckCircle, ShieldAlert, Award
} from 'lucide-react';
import { CardSkeleton } from '../components/SkeletonLoader';
import { motion, AnimatePresence } from 'framer-motion';

const Marketplace = () => {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // URL query strings processing
  const searchParams = new URLSearchParams(location.search);
  const actionParam = searchParams.get('action');
  const productIdParam = searchParams.get('id');

  // Lists & filters states
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');

  // Modals state
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Wishlist list (holds product IDs)
  const [wishlistIds, setWishlistIds] = useState(user?.wishlist || []);

  // New product form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Electronics',
    description: '',
    price: '',
    condition: 'New'
  });
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Categories list
  const categories = [
    'Electronics', 'Books', 'Lab Equipment', 'Stationery',
    'Furniture', 'Cycles', 'Accessories', 'Miscellaneous'
  ];

  const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

  // Fetch products on filter changes
  useEffect(() => {
    fetchProducts();
  }, [filterCategory, filterCondition, filterStatus]);

  // Sync wishlist ids from user state
  useEffect(() => {
    if (user?.wishlist) {
      setWishlistIds(user.wishlist);
    }
  }, [user]);

  // Handle URL actions
  useEffect(() => {
    if (actionParam === 'sell') {
      setSellModalOpen(true);
      cleanUrlParams();
    }

    if (productIdParam) {
      fetchSingleProductDetails(productIdParam);
    }
  }, [actionParam, productIdParam]);

  const cleanUrlParams = () => {
    navigate('/marketplace', { replace: true });
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/marketplace?search=${search}&status=${filterStatus}`;
      if (filterCategory) url += `&category=${filterCategory}`;
      if (filterCondition) url += `&condition=${filterCondition}`;
      if (minPrice) url += `&minPrice=${minPrice}`;
      if (maxPrice) url += `&maxPrice=${maxPrice}`;

      const response = await api.get(url);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      showToast('Could not load products.', 'error');
    }
    setLoading(false);
  };

  const fetchSingleProductDetails = async (id) => {
    try {
      const response = await api.get(`/marketplace/${id}`);
      setSelectedProduct(response.data);
      setDetailModalOpen(true);
    } catch (error) {
      console.error('Error fetching product details:', error);
      showToast('Product details not found.', 'error');
      cleanUrlParams();
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  // Image change handler
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
  };

  // Submit product listing
  const handleSellSubmit = async (e) => {
    e.preventDefault();
    const { name, category, description, price, condition } = formData;
    
    if (!name.trim() || !description.trim() || !price || !condition) {
      showToast('Please fill out all required fields', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const uploadData = new FormData();
      uploadData.append('name', name);
      uploadData.append('category', category);
      uploadData.append('description', description);
      uploadData.append('price', price);
      uploadData.append('condition', condition);

      for (const img of images) {
        uploadData.append('images', img);
      }

      const response = await api.post('/marketplace', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast('Product listed successfully!', 'success');
      setProducts(prev => [response.data, ...prev]);
      
      // Reset Modal & Form
      setSellModalOpen(false);
      setFormData({
        name: '',
        category: 'Electronics',
        description: '',
        price: '',
        condition: 'New'
      });
      setImages([]);
    } catch (error) {
      console.error('Error creating marketplace product:', error);
      showToast(error.response?.data?.message || 'Could not list product.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Wishlist toggle handler
  const toggleWishlist = async (productId, e) => {
    if (e) e.stopPropagation(); // Avoid triggering click events on card
    try {
      const response = await api.post(`/marketplace/${productId}/wishlist`);
      
      // Update local storage/context user wishlist
      const updatedWishlist = response.data.wishlist;
      setUser(prev => ({ ...prev, wishlist: updatedWishlist }));
      setWishlistIds(updatedWishlist);

      showToast(
        response.data.isWishlisted 
          ? 'Added to wishlist!' 
          : 'Removed from wishlist', 
        'info'
      );
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      showToast('Could not edit wishlist.', 'error');
    }
  };

  // Mark product as sold
  const handleMarkAsSold = async (productId) => {
    try {
      const response = await api.put(`/marketplace/${productId}/sold`);
      showToast('Item marked as sold!', 'success');
      setSelectedProduct(response.data.product);
      setProducts(prev => prev.map(p => p._id === productId ? response.data.product : p));
    } catch (error) {
      console.error('Error marking product sold:', error);
      showToast('Could not update status.', 'error');
    }
  };

  // Delete listing handler
  const handleDeleteListing = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this listing permanently?')) return;

    try {
      await api.delete(`/marketplace/${productId}`);
      showToast('Listing deleted successfully.', 'success');
      setProducts(prev => prev.filter(p => p._id !== productId));
      setDetailModalOpen(false);
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('Could not delete product.', 'error');
    }
  };

  const handleChatSeller = (sellerId, contextProduct) => {
    navigate(`/chat?userId=${sellerId}&itemType=Product&itemId=${contextProduct._id}`);
  };

  const getConditionStyle = (cond) => {
    const styles = {
      'New': 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/25',
      'Like New': 'bg-teal-500/10 text-teal-500 dark:text-teal-400 border border-teal-500/25',
      'Good': 'bg-primary-500/10 text-primary-500 dark:text-primary-400 border border-primary-500/25',
      'Fair': 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/25',
      'Poor': 'bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/25'
    };
    return styles[cond] || 'bg-gray-100 dark:bg-dark-800 text-gray-800 dark:text-gray-350';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-primary-600 via-accent-600 to-secondary-500 bg-clip-text text-transparent dark:from-primary-400 dark:via-accent-400 dark:to-secondary-400">Campus Marketplace</h1>
          <p className="text-xs text-slate-400 font-bold mt-1">Buy and sell supplies peer-to-peer within the college student body.</p>
        </div>
        <button 
          onClick={() => setSellModalOpen(true)}
          className="px-5 py-2.5 text-xs font-bold rounded-2xl transition-all btn-luxury flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Marketplace Listing
        </button>
      </div>

      {/* Filters Form Panel */}
      <div className="p-4 glass-card-premium rounded-3xl flex flex-col xl:flex-row gap-4 justify-between items-center border border-slate-200/30 dark:border-white/5 shadow-sm">
        
        {/* Category horizontal scrolling buttons */}
        <div className="flex gap-2 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 scrollbar-thin">
          <button
            onClick={() => setFilterCategory('')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterCategory === '' 
                ? 'bg-luxury-gradient text-white shadow-md shadow-primary-500/15 border border-white/10' 
                : 'bg-slate-100 dark:bg-dark-900/50 text-slate-500 hover:text-slate-900 dark:hover:text-white border border-transparent'
            }`}
          >
            All Items
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterCategory === c 
                  ? 'bg-luxury-gradient text-white shadow-md shadow-primary-500/15 border border-white/10' 
                  : 'bg-slate-100 dark:bg-dark-900/50 text-slate-500 hover:text-slate-900 dark:hover:text-white border border-transparent'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Search & Price fields filters */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto flex-1 justify-end max-w-4xl">
          <select
            value={filterCondition}
            onChange={(e) => setFilterCondition(e.target.value)}
            className="bg-slate-50 dark:bg-dark-900/40 border border-slate-200/40 dark:border-white/10 text-xs px-3 py-2.5 rounded-2xl focus:outline-none text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-accent-500/50"
          >
            <option value="">Any Condition</option>
            {conditions.map((cond) => (
              <option key={cond} value={cond}>{cond}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 dark:bg-dark-900/40 border border-slate-200/40 dark:border-white/10 text-xs px-3 py-2.5 rounded-2xl focus:outline-none text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-accent-500/50"
          >
            <option value="active">Active Listings</option>
            <option value="sold">Sold Items</option>
            <option value="all">Show All</option>
          </select>

          {/* Price Range inputs */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-dark-900/40 border border-slate-200/40 dark:border-white/10 px-4 py-2 rounded-2xl text-xs text-slate-600 dark:text-slate-300 focus-within:ring-2 focus-within:ring-accent-500/50">
            <input
              type="number"
              placeholder="Min $"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-12 bg-transparent focus:outline-none placeholder:text-slate-400 font-semibold text-center"
            />
            <span className="text-slate-300 dark:text-dark-600 font-bold">-</span>
            <input
              type="number"
              placeholder="Max $"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-12 bg-transparent focus:outline-none placeholder:text-slate-400 font-semibold text-center"
            />
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs border border-slate-200/40 dark:border-white/10 bg-slate-50 dark:bg-dark-900/40 focus:outline-none focus:ring-2 focus:ring-accent-500/50 placeholder:text-slate-400"
            />
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-2xl text-xs font-bold transition-all btn-luxury">
            Search
          </button>
        </form>
      </div>

      {/* Grid of Listings */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : products.length === 0 ? (
        <div className="p-16 border border-dashed border-slate-200/60 dark:border-white/10 rounded-3xl text-center bg-white dark:bg-dark-900/30">
          <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-dark-700 mx-auto mb-3" />
          <h3 className="font-extrabold text-sm">No listings found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto font-medium">Try resetting filters or post something you'd like to sell.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((prod) => {
            const isWishlisted = wishlistIds.includes(prod._id);
            return (
              <div
                key={prod._id}
                onClick={() => fetchSingleProductDetails(prod._id)}
                className="glass-card-premium card-glow rounded-3xl overflow-hidden flex flex-col border border-slate-200/30 dark:border-white/10 p-4 cursor-pointer shadow-sm relative"
              >
                {/* Wishlist Heart Toggle */}
                {user && prod.seller?._id !== user.id && (
                  <button
                    onClick={(e) => toggleWishlist(prod._id, e)}
                    className="absolute top-6 right-6 z-10 p-2 rounded-xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-md shadow border border-slate-200/30 dark:border-white/5 hover:bg-white dark:hover:bg-dark-700 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                  </button>
                )}

                {/* Sold badge */}
                {prod.status === 'sold' && (
                  <span className="absolute top-6 left-6 z-10 text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase bg-red-500/10 text-red-500 border border-red-500/25">
                    Sold
                  </span>
                )}

                {/* Image */}
                <img 
                  src={prod.images[0] || 'https://via.placeholder.com/400'} 
                  alt={prod.name} 
                  className="w-full h-44 object-cover rounded-2xl mb-3.5 flex-shrink-0"
                />

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] text-primary-500 dark:text-primary-400 font-bold tracking-wider block uppercase">{prod.category}</span>
                    <h3 className="font-extrabold text-sm line-clamp-1 mt-0.5">{prod.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed font-medium">{prod.description}</p>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-200/20 dark:border-white/5">
                    <span className="font-black text-sm text-primary-500">${prod.price}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${getConditionStyle(prod.condition)}`}>
                      {prod.condition}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE LISTING MODAL */}
      <AnimatePresence>
        {sellModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setSellModalOpen(false)} className="fixed inset-0 bg-black" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl p-6 shadow-2xl relative z-10 overflow-y-auto max-h-[90vh] bg-white/95 dark:bg-dark-950/95 backdrop-blur-2xl border border-slate-200/40 dark:border-white/10 text-slate-800 dark:text-slate-100"
            >
              <button onClick={() => setSellModalOpen(false)} className="absolute top-5 right-5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-900 transition-colors">
                <X className="w-4.5 h-4.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
              </button>

              <h2 className="text-base font-black uppercase tracking-wider mb-5 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary-500" />
                Create Marketplace Listing
              </h2>

              <form onSubmit={handleSellSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold block">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Scientific Calculator TI-84 Plus"
                    className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200/40 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent-500/50 placeholder:text-slate-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 space-y-1.5">
                    <label className="text-xs text-slate-400 font-bold block">Price ($) *</label>
                    <div className="relative">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="35"
                        className="w-full pl-7 bg-slate-50 dark:bg-dark-900 border border-slate-200/40 dark:border-white/10 rounded-2xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent-500/50 text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="col-span-1 space-y-1.5">
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

                  <div className="col-span-1 space-y-1.5">
                    <label className="text-xs text-slate-400 font-bold block">Condition *</label>
                    <select
                      value={formData.condition}
                      onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200/40 dark:border-white/10 rounded-2xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent-500/50 text-slate-800 dark:text-white"
                    >
                      {conditions.map((cond) => (
                        <option key={cond} value={cond}>{cond}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold block">Description *</label>
                  <textarea
                    required
                    rows="4"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the product details (branding, age, battery health, damage if any, transaction meeting spots)..."
                    className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200/40 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent-500/50 placeholder:text-slate-500 text-slate-800 dark:text-white"
                  />
                </div>

                {/* Upload Image box */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold block">Upload Product Images (Max 5)</label>
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
                    'Publish Listing'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {detailModalOpen && selectedProduct && (
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
                  src={selectedProduct.images[0] || 'https://via.placeholder.com/400'} 
                  alt={selectedProduct.name} 
                  className="w-full h-64 object-cover rounded-2xl"
                />
                
                {/* Secondary images */}
                {selectedProduct.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {selectedProduct.images.slice(1).map((img, idx) => (
                      <img key={idx} src={img} alt="" className="w-full h-12 object-cover rounded-lg border border-slate-250 dark:border-white/5" />
                    ))}
                  </div>
                )}

                {/* Seller Profile Details Card */}
                <div className="p-3.5 border border-slate-200/40 dark:border-white/5 bg-slate-50 dark:bg-dark-900/30 backdrop-blur-md rounded-2xl space-y-2">
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Seller Profile</span>
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={selectedProduct.seller?.profilePicture || 'https://via.placeholder.com/150'} 
                      alt="" 
                      className="w-8 h-8 rounded-full object-cover border border-slate-100 dark:border-white/10" 
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold truncate text-slate-700 dark:text-slate-200">{selectedProduct.seller?.name}</h4>
                      <span className="text-[9px] text-slate-400 truncate block font-semibold">{selectedProduct.seller?.department} ({selectedProduct.seller?.year})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Listing info details */}
              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {selectedProduct.status === 'sold' && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase bg-red-500/10 text-red-500 border border-red-500/25">
                        Sold
                      </span>
                    )}
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-primary-500/10 text-primary-500 dark:text-primary-400 border border-primary-500/25">
                      {selectedProduct.category}
                    </span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${getConditionStyle(selectedProduct.condition)}`}>
                      {selectedProduct.condition}
                    </span>
                  </div>

                  <h2 className="text-lg font-black leading-tight text-slate-800 dark:text-white">{selectedProduct.name}</h2>
                  <div className="text-xl font-black text-primary-500">${selectedProduct.price}</div>
                  <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">{selectedProduct.description}</p>
                </div>

                {/* Selling Actions */}
                <div className="pt-4 border-t border-slate-200/20 dark:border-white/5 space-y-3">
                  
                  {selectedProduct.status === 'sold' ? (
                    <div className="p-3.5 bg-slate-50 dark:bg-dark-900 border border-slate-200/40 dark:border-white/5 rounded-2xl flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                      <CheckCircle className="w-5 h-5 text-slate-400" />
                      <span>This item has been sold and closed.</span>
                    </div>
                  ) : (
                    <>
                      {/* USER IS THE SELLER */}
                      {user && selectedProduct.seller?._id === user.id ? (
                        <div className="space-y-2">
                          <button
                            onClick={() => handleMarkAsSold(selectedProduct._id)}
                            className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-green-500/10 active:scale-95 transition-all"
                          >
                            <Check className="w-4 h-4" />
                            Mark as Sold
                          </button>
                          
                          <button
                            onClick={() => handleDeleteListing(selectedProduct._id)}
                            className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-2xl text-xs active:scale-95 transition-all"
                          >
                            Delete Listing
                          </button>
                        </div>
                      ) : (
                        /* USER IS A BUYER / GUEST */
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleChatSeller(selectedProduct.seller?._id, selectedProduct)}
                            className="flex-1 py-2.5 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 btn-luxury"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Chat with Seller
                          </button>
                          
                          <button
                            onClick={(e) => toggleWishlist(selectedProduct._id, e)}
                            className="px-3.5 py-2.5 border border-slate-200/40 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-dark-805 rounded-2xl text-slate-700 dark:text-slate-200 transition-all shadow-sm"
                          >
                            <Heart className={`w-4 h-4 ${wishlistIds.includes(selectedProduct._id) ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                          </button>
                        </div>
                      )}

                      {/* ADMIN MODERATOR ACTIONS */}
                      {user && user.role === 'admin' && selectedProduct.seller?._id !== user.id && (
                        <button
                          onClick={() => handleDeleteListing(selectedProduct._id)}
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
    </div>
  );
};

export default Marketplace;
