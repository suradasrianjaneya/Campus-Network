import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { 
  MapPin, ShoppingBag, MessageSquare, Plus, PlusCircle, ArrowRight,
  TrendingUp, Activity, Inbox, Search, User, Eye, Tag
} from 'lucide-react';
import { CardSkeleton } from '../components/SkeletonLoader';

const Dashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();

  // Dashboard states
  const [stats, setStats] = useState({
    activeListings: 0,
    lostItems: 0,
    foundItems: 0,
    recentPosts: 0
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    products: [],
    items: [],
    posts: []
  });
  const [searching, setSearching] = useState(false);

  // Parse search query parameter
  const searchParam = new URLSearchParams(location.search).get('search');

  useEffect(() => {
    if (searchParam) {
      setSearchQuery(searchParam);
      handleGlobalSearch(searchParam);
    } else {
      setSearchQuery('');
      fetchDashboardData();
    }
  }, [searchParam]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Parallel fetches for efficiency
      const [productsRes, itemsRes, postsRes] = await Promise.all([
        api.get('/marketplace?status=active'),
        api.get('/lostfound?resolved=false'),
        api.get('/feed')
      ]);

      // Calculate stats based on fetched arrays
      const activeProducts = productsRes.data;
      const activeItems = itemsRes.data;
      const allPosts = postsRes.data;

      setRecentProducts(activeProducts.slice(0, 3));
      setRecentItems(activeItems.slice(0, 3));
      setRecentPosts(allPosts.slice(0, 2));

      setStats({
        activeListings: activeProducts.length,
        lostItems: activeItems.filter(i => i.type === 'lost').length,
        foundItems: activeItems.filter(i => i.type === 'found').length,
        recentPosts: allPosts.length
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showToast('Failed to load dashboard updates.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalSearch = async (query) => {
    setSearching(true);
    try {
      const [productsRes, itemsRes, postsRes] = await Promise.all([
        api.get(`/marketplace?search=${encodeURIComponent(query)}&status=all`),
        api.get(`/lostfound?search=${encodeURIComponent(query)}`),
        api.get(`/feed?search=${encodeURIComponent(query)}`)
      ]);

      setSearchResults({
        products: productsRes.data,
        items: itemsRes.data,
        posts: postsRes.data
      });
    } catch (error) {
      console.error('Error performing search:', error);
      showToast('Search request failed.', 'error');
    } finally {
      setSearching(false);
    }
  };

  const getConditionStyle = (cond) => {
    const styles = {
      'New': 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/25',
      'Like New': 'bg-teal-500/10 text-teal-500 dark:text-teal-400 border border-teal-500/25',
      'Good': 'bg-primary-500/10 text-primary-500 dark:text-primary-400 border border-primary-500/25',
      'Fair': 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/25',
      'Poor': 'bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/25'
    };
    return styles[cond] || 'bg-gray-100 dark:bg-dark-800 text-gray-800 dark:text-gray-300';
  };

  if (searchParam) {
    // Search Results UI Mode
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between border-b border-slate-200/20 dark:border-white/5 pb-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Smart Search Results</h1>
            <p className="text-xs text-slate-400 font-medium mt-1">Showing matches for "{searchParam}"</p>
          </div>
          <Link to="/dashboard" className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-dark-900 border border-slate-200/40 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-dark-800 transition-all">
            Back to Dashboard
          </Link>
        </div>

        {searching ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className="space-y-12">
            {/* Products Matches */}
            <section className="space-y-5">
              <h2 className="text-base font-bold flex items-center gap-2 border-b pb-3 border-slate-200/20 dark:border-white/5">
                <ShoppingBag className="w-4.5 h-4.5 text-primary-500" />
                Marketplace Listings ({searchResults.products.length})
              </h2>
              {searchResults.products.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium pl-2">No marketplace listings found.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.products.map(prod => (
                    <Link to={`/marketplace?id=${prod._id}`} key={prod._id} className="glass-card-premium card-glow rounded-3xl overflow-hidden flex flex-col p-4 border border-slate-200/35 dark:border-white/10">
                      <img src={prod.images[0] || 'https://via.placeholder.com/400'} alt={prod.name} className="w-full h-44 object-cover rounded-2xl mb-4.5" />
                      <div className="flex-1 space-y-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold inline-block ${getConditionStyle(prod.condition)}`}>
                          {prod.condition}
                        </span>
                        <h3 className="font-extrabold text-sm line-clamp-1">{prod.name}</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed">{prod.description}</p>
                      </div>
                      <div className="flex justify-between items-center mt-5 pt-3.5 border-t border-slate-200/20 dark:border-white/5">
                        <span className="font-black text-sm text-primary-500">${prod.price}</span>
                        <span className="text-[10px] font-bold text-slate-400">By {prod.seller?.name}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Lost & Found Matches */}
            <section className="space-y-5">
              <h2 className="text-base font-bold flex items-center gap-2 border-b pb-3 border-slate-200/20 dark:border-white/5">
                <MapPin className="w-4.5 h-4.5 text-secondary-500" />
                Lost & Found Reports ({searchResults.items.length})
              </h2>
              {searchResults.items.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium pl-2">No lost or found items found.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.items.map(item => (
                    <Link to={`/lostfound?id=${item._id}`} key={item._id} className="glass-card-premium card-glow rounded-3xl overflow-hidden flex flex-col p-4 border border-slate-200/35 dark:border-white/10">
                      <img src={item.images[0] || 'https://via.placeholder.com/400'} alt={item.name} className="w-full h-44 object-cover rounded-2xl mb-4.5" />
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                            item.type === 'lost' ? 'bg-red-500/10 text-red-500 border border-red-500/25' : 'bg-green-500/10 text-green-500 border border-green-500/25'
                          }`}>
                            {item.type}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">{item.location}</span>
                        </div>
                        <h3 className="font-extrabold text-sm line-clamp-1">{item.name}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{item.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Social Feed Posts Matches */}
            <section className="space-y-5">
              <h2 className="text-base font-bold flex items-center gap-2 border-b pb-3 border-slate-200/20 dark:border-white/5">
                <MessageSquare className="w-4.5 h-4.5 text-accent-500" />
                Student Feed Posts ({searchResults.posts.length})
              </h2>
              {searchResults.posts.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium pl-2">No social posts found.</p>
              ) : (
                <div className="space-y-4">
                  {searchResults.posts.map(post => (
                    <div key={post._id} className="glass-card-premium card-glow p-5 rounded-3xl border border-slate-200/35 dark:border-white/10">
                      <div className="flex items-center gap-3 mb-4">
                        <img src={post.author?.profilePicture || 'https://via.placeholder.com/150'} alt={post.author?.name} className="w-9 h-9 rounded-full object-cover border border-slate-100 dark:border-white/10" />
                        <div>
                          <h4 className="text-xs font-bold">{post.author?.name}</h4>
                          <span className="text-[9px] text-slate-400 font-medium">{post.author?.department}</span>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-medium">{post.content}</p>
                      <div className="flex gap-4 mt-4 pt-3 border-t border-slate-200/20 dark:border-white/5 text-[10px] text-slate-400 font-bold">
                        <span>{post.likes.length} Likes</span>
                        <span>{post.comments.length} Comments</span>
                        <Link to={`/feed?postId=${post._id}`} className="text-primary-500 ml-auto flex items-center gap-1 hover:underline">
                          View Post <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-primary-600 via-accent-600 to-secondary-500 bg-clip-text text-transparent dark:from-primary-400 dark:via-accent-400 dark:to-secondary-400">Welcome back, {user?.name}!</h1>
          <p className="text-xs text-slate-400 font-bold mt-1">Here is what's happening on campus today.</p>
        </div>
        <div className="text-xs font-bold text-slate-400 bg-white/60 dark:bg-dark-900/30 backdrop-blur-md border border-slate-200/40 dark:border-white/5 px-4.5 py-2.5 rounded-2xl">
          Roll Number: <span className="text-slate-800 dark:text-white">{user?.rollNumber}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 glass-card-premium card-glow rounded-3xl border border-slate-200/30 dark:border-white/5 flex items-center gap-4">
          <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-2xl text-primary-500 shadow-[0_0_15px_rgba(37,99,235,0.1)]">
            <ShoppingBag className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Marketplace</span>
            <span className="text-lg font-black">{stats.activeListings} Active</span>
          </div>
        </div>

        <div className="p-5 glass-card-premium card-glow rounded-3xl border border-slate-200/30 dark:border-white/5 flex items-center gap-4">
          <div className="p-3 bg-secondary-500/10 border border-secondary-500/20 rounded-2xl text-secondary-500 shadow-[0_0_15px_rgba(236,72,153,0.1)]">
            <MapPin className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Lost Items</span>
            <span className="text-lg font-black text-secondary-500">{stats.lostItems} Unsolved</span>
          </div>
        </div>

        <div className="p-5 glass-card-premium card-glow rounded-3xl border border-slate-200/30 dark:border-white/5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <MapPin className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Found Items</span>
            <span className="text-lg font-black text-emerald-500">{stats.foundItems} Active</span>
          </div>
        </div>

        <div className="p-5 glass-card-premium card-glow rounded-3xl border border-slate-200/30 dark:border-white/5 flex items-center gap-4">
          <div className="p-3 bg-accent-500/10 border border-accent-500/20 rounded-2xl text-accent-500 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
            <MessageSquare className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Feed Posts</span>
            <span className="text-lg font-black">{stats.recentPosts} Total</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <section className="glass-card-premium p-6 rounded-3xl border border-slate-200/30 dark:border-white/5 space-y-4">
        <h2 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link to="/lostfound?action=report-lost" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-dashed border-slate-200/50 dark:border-white/10 hover:border-red-500/40 hover:bg-red-500/5 transition-all text-center gap-2 group">
            <PlusCircle className="w-5.5 h-5.5 text-red-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Report Lost Item</span>
          </Link>
          <Link to="/lostfound?action=report-found" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-dashed border-slate-200/50 dark:border-white/10 hover:border-green-500/40 hover:bg-green-500/5 transition-all text-center gap-2 group">
            <PlusCircle className="w-5.5 h-5.5 text-green-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Report Found Item</span>
          </Link>
          <Link to="/marketplace?action=sell" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-dashed border-slate-200/50 dark:border-white/10 hover:border-primary-500/40 hover:bg-primary-500/5 transition-all text-center gap-2 group">
            <PlusCircle className="w-5.5 h-5.5 text-primary-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Sell Product</span>
          </Link>
          <Link to="/feed?action=post" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-dashed border-slate-200/50 dark:border-white/10 hover:border-accent-500/40 hover:bg-accent-500/5 transition-all text-center gap-2 group">
            <PlusCircle className="w-5.5 h-5.5 text-accent-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Write Post</span>
          </Link>
        </div>
      </section>

      {/* Main dashboard content grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (Marketplace & LostFound) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Recent Products */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2">
                <ShoppingBag className="w-4.5 h-4.5 text-primary-500" />
                Featured Marketplace items
              </h2>
              <Link to="/marketplace" className="text-xs font-bold text-primary-500 hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : recentProducts.length === 0 ? (
              <div className="p-8 glass-card rounded-2xl text-center text-slate-400 text-xs font-medium">
                No active marketplace products at the moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {recentProducts.map(prod => (
                  <Link to={`/marketplace?id=${prod._id}`} key={prod._id} className="glass-card-premium card-glow rounded-3xl p-3 border border-slate-200/30 dark:border-white/10 flex flex-col">
                    <img src={prod.images[0] || 'https://via.placeholder.com/400'} alt={prod.name} className="w-full h-32 object-cover rounded-2xl mb-2.5" />
                    <h3 className="font-extrabold text-xs line-clamp-1 flex-1">{prod.name}</h3>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/20 dark:border-white/5">
                      <span className="font-black text-xs text-primary-500">${prod.price}</span>
                      <span className="text-[9px] text-slate-400 font-bold">{prod.condition}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Recent Lost & Found */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2">
                <MapPin className="w-4.5 h-4.5 text-secondary-500" />
                Active Lost & Found Reports
              </h2>
              <Link to="/lostfound" className="text-xs font-bold text-primary-500 hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : recentItems.length === 0 ? (
              <div className="p-8 glass-card rounded-2xl text-center text-slate-400 text-xs font-medium">
                No active reports.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {recentItems.map(item => (
                  <Link to={`/lostfound?id=${item._id}`} key={item._id} className="glass-card-premium card-glow rounded-3xl p-3 border border-slate-200/30 dark:border-white/10 flex flex-col">
                    <img src={item.images[0] || 'https://via.placeholder.com/400'} alt={item.name} className="w-full h-32 object-cover rounded-2xl mb-2.5" />
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-extrabold uppercase ${
                        item.type === 'lost' ? 'bg-red-500/10 text-red-500 border border-red-500/25' : 'bg-green-500/10 text-green-500 border border-green-500/25'
                      }`}>
                        {item.type}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-xs line-clamp-1 flex-1">{item.name}</h3>
                    <span className="text-[9px] text-slate-400 font-bold mt-1.5">{item.location}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column (Announcements / Feed Summary) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2">
              <MessageSquare className="w-4.5 h-4.5 text-accent-500" />
              Recent Updates
            </h2>
            <Link to="/feed" className="text-xs font-bold text-primary-500 hover:underline flex items-center gap-1">
              Social Feed <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-4">
              <div className="h-28 bg-slate-200 dark:bg-dark-900 animate-pulse rounded-2xl" />
              <div className="h-28 bg-slate-200 dark:bg-dark-900 animate-pulse rounded-2xl" />
            </div>
          ) : recentPosts.length === 0 ? (
            <div className="p-8 glass-card rounded-2xl text-center text-slate-400 text-xs font-medium">
              No recent postings.
            </div>
          ) : (
            <div className="space-y-4">
              {recentPosts.map(post => (
                <div key={post._id} className="p-4.5 border border-slate-200/30 dark:border-white/10 rounded-3xl bg-white/70 dark:bg-dark-900/30 backdrop-blur-md shadow-sm space-y-3">
                  <div className="flex items-center gap-2.5">
                    <img src={post.author?.profilePicture || 'https://via.placeholder.com/150'} alt={post.author?.name} className="w-7 h-7 rounded-full object-cover border border-slate-100 dark:border-white/10" />
                    <div>
                      <h4 className="text-xs font-bold">{post.author?.name}</h4>
                      <span className="text-[9px] text-slate-400 font-medium">{post.author?.department}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed font-medium">{post.content}</p>
                  <div className="text-[9px] text-slate-400 font-bold pt-1.5 border-t border-slate-200/10 dark:border-white/5 flex justify-between">
                    <span>{post.likes.length} Likes</span>
                    <span>{post.comments.length} Comments</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
