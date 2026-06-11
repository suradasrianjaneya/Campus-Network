import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { 
  User, ShoppingBag, MapPin, MessageSquare, Edit3, Camera, 
  Mail, Calendar, Briefcase, Trash2, Heart, Award, Check
} from 'lucide-react';
import { CardSkeleton } from '../components/SkeletonLoader';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  // Active tab state
  const [activeTab, setActiveTab] = useState('marketplace'); // marketplace, lostfound, feed

  // Profile edit states
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [year, setYear] = useState(user?.year || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.profilePicture || '');
  const [saving, setSaving] = useState(false);

  // User activity states
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  // Departments and Years list
  const departments = [
    'Computer Science', 'Electrical Engineering', 'Mechanical Engineering',
    'Civil Engineering', 'Chemical Engineering', 'Business Administration',
    'Humanities & Sciences', 'Physics & Chemistry'
  ];

  const academicYears = [
    '1st Year', '2nd Year', '3rd Year', '4th Year',
    'Postgraduate', 'Staff / Faculty'
  ];

  useEffect(() => {
    fetchUserActivity();
  }, [user]);

  const fetchUserActivity = async () => {
    if (!user) return;
    setLoadingActivity(true);
    try {
      // Fetch user specific lists from API (using filters on author/seller/reporter)
      const [productsRes, itemsRes, postsRes] = await Promise.all([
        api.get(`/marketplace?status=all`),
        api.get(`/lostfound?resolved=all`),
        api.get(`/feed`)
      ]);

      // Filter local listings by current user ID
      const userProducts = productsRes.data.filter(p => p.seller?._id === user.id);
      const userItems = itemsRes.data.filter(i => i.reporter?._id === user.id);
      const userPosts = postsRes.data.filter(p => p.author?._id === user.id);

      setProducts(userProducts);
      setItems(userItems);
      setPosts(userPosts);
    } catch (error) {
      console.error('Error fetching profile activity:', error);
      showToast('Could not load user activity history.', 'error');
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name is required', 'warning');
      return;
    }

    setSaving(true);
    try {
      const uploadData = new FormData();
      uploadData.append('name', name);
      uploadData.append('bio', bio);
      uploadData.append('department', department);
      uploadData.append('year', year);
      
      if (avatarFile) {
        uploadData.append('profilePicture', avatarFile);
      }

      await updateProfile(uploadData);
      showToast('Profile details updated!', 'success');
      setEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
      showToast(error.message || 'Profile save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await api.delete(`/marketplace/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
      showToast('Product deleted.', 'success');
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this report permanently?')) return;
    try {
      await api.delete(`/lostfound/${id}`);
      setItems(prev => prev.filter(i => i._id !== id));
      showToast('Report deleted.', 'success');
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Delete post?')) return;
    try {
      await api.delete(`/feed/${id}`);
      setPosts(prev => prev.filter(p => p._id !== id));
      showToast('Post deleted.', 'success');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
      
      {/* Profile info column (Columns 1-4) */}
      <div className="lg:col-span-4 space-y-6">
        <div className="glass-card-premium p-6 rounded-3xl border border-slate-200/30 dark:border-white/10 shadow-sm relative text-slate-800 dark:text-slate-100">
          
          {/* Avatar Picture editing */}
          <div className="flex flex-col items-center text-center">
            <div className="relative group mb-5">
              <img 
                src={avatarPreview || 'https://via.placeholder.com/150'} 
                alt={user?.name} 
                className="w-28 h-28 rounded-3xl object-cover border-4 border-slate-50 dark:border-dark-900 shadow-md"
              />
              {editing && (
                <label className="absolute inset-0 bg-black/40 text-white rounded-3xl flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              )}
            </div>

            {!editing ? (
              <>
                <h2 className="text-lg font-black leading-tight flex items-center gap-1.5 justify-center">
                  {user?.name}
                  {user?.role === 'admin' && (
                    <Award className="w-4.5 h-4.5 text-primary-500" title="Admin Moderator" />
                  )}
                </h2>
                <span className="text-[9px] bg-primary-500/10 text-primary-500 dark:text-primary-400 border border-primary-500/20 font-black px-2.5 py-0.5 rounded-full mt-2 block">
                  {user?.rollNumber}
                </span>
                <span className="text-xs text-slate-400 font-bold block mt-1">
                  {user?.department} • {user?.year}
                </span>

                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-350 mt-4 max-w-xs italic font-medium">
                  {user?.bio || 'Add a bio describing your student activities...'}
                </p>

                <button
                  onClick={() => setEditing(true)}
                  className="w-full py-2.5 rounded-2xl border border-slate-200/40 dark:border-white/10 bg-slate-50 hover:bg-slate-100 dark:bg-dark-900/60 dark:hover:bg-dark-900 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 mt-6 shadow-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
              </>
            ) : (
              <form onSubmit={handleProfileSave} className="w-full text-left space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold block">Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200/40 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold block">Department</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200/40 dark:border-white/10 rounded-2xl px-3 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500/50"
                    >
                      {departments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold block">Year</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200/40 dark:border-white/10 rounded-2xl px-3 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500/50"
                    >
                      {academicYears.map((yr) => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold block">Bio</label>
                  <textarea
                    rows="3"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Short student bio..."
                    className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200/40 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500/50 placeholder:text-slate-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 btn-luxury"
                  >
                    {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditing(false); setAvatarPreview(user?.profilePicture); }}
                    className="px-5 py-2.5 rounded-2xl border border-slate-200/40 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-dark-800 text-xs text-slate-500 font-bold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Profile Activity Column (Columns 5-12) */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex bg-white/60 dark:bg-dark-900/45 backdrop-blur-md border border-slate-200/30 dark:border-white/10 p-1.5 rounded-2xl shadow-sm gap-1">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'marketplace' 
                ? 'bg-luxury-gradient text-white shadow-md shadow-primary-500/10 border border-white/5' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-dark-800/40 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Marketplace ({products.length})
          </button>
          
          <button
            onClick={() => setActiveTab('lostfound')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'lostfound' 
                ? 'bg-luxury-gradient text-white shadow-md shadow-primary-500/10 border border-white/5' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-dark-800/40 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Lost & Found ({items.length})
          </button>

          <button
            onClick={() => setActiveTab('feed')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'feed' 
                ? 'bg-luxury-gradient text-white shadow-md shadow-primary-500/10 border border-white/5' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-dark-800/40 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Feed Posts ({posts.length})
          </button>
        </div>

        {/* Tab layouts activity view */}
        <div className="space-y-4">
          {loadingActivity ? (
            <div className="space-y-4">
              <div className="h-24 bg-slate-200 dark:bg-dark-900 animate-pulse rounded-2xl" />
              <div className="h-24 bg-slate-200 dark:bg-dark-900 animate-pulse rounded-2xl" />
            </div>
          ) : activeTab === 'marketplace' ? (
            products.length === 0 ? (
              <div className="p-16 border border-dashed border-slate-200/50 dark:border-white/10 rounded-3xl text-center text-slate-450 bg-white/30 dark:bg-dark-900/20 font-bold text-xs">No marketplace listings created yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.map(prod => (
                  <div key={prod._id} className="p-4 border border-slate-200/30 dark:border-white/10 bg-white dark:bg-dark-800 rounded-3xl flex gap-3.5 relative group hover:-translate-y-1 transition-all duration-300 shadow-sm">
                    <img src={prod.images[0] || 'https://via.placeholder.com/150'} alt="" className="w-20 h-20 object-cover rounded-2xl border border-slate-100 dark:border-white/5" />
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                            prod.status === 'sold' ? 'bg-red-500/10 text-red-500 border border-red-500/25' : 'bg-green-500/10 text-green-500 border border-green-500/25'
                          }`}>
                            {prod.status}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold">{prod.category}</span>
                        </div>
                        <h4 className="font-extrabold text-xs truncate mt-1 text-slate-800 dark:text-slate-200">{prod.name}</h4>
                      </div>
                      <span className="font-black text-xs text-primary-500">${prod.price}</span>
                    </div>

                    <button
                      onClick={() => handleDeleteProduct(prod._id)}
                      className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'lostfound' ? (
            items.length === 0 ? (
              <div className="p-16 border border-dashed border-slate-200/50 dark:border-white/10 rounded-3xl text-center text-slate-450 bg-white/30 dark:bg-dark-900/20 font-bold text-xs">No lost & found reports reported.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map(item => (
                  <div key={item._id} className="p-4 border border-slate-200/30 dark:border-white/10 bg-white dark:bg-dark-800 rounded-3xl flex gap-3.5 relative hover:-translate-y-1 transition-all duration-300 shadow-sm">
                    <img src={item.images[0] || 'https://via.placeholder.com/150'} alt="" className="w-20 h-20 object-cover rounded-2xl border border-slate-100 dark:border-white/5" />
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                            item.type === 'lost' ? 'bg-red-500/10 text-red-500 border border-red-500/25' : 'bg-green-500/10 text-green-500 border border-green-500/25'
                          }`}>
                            {item.type}
                          </span>
                          {item.resolved && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-dark-900 border border-slate-200/20 text-slate-500 font-bold uppercase">Resolved</span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-xs truncate mt-1 text-slate-800 dark:text-slate-200">{item.name}</h4>
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5 font-bold">
                        <MapPin className="w-3 h-3 text-slate-550" />
                        {item.location}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            posts.length === 0 ? (
              <div className="p-16 border border-dashed border-slate-200/50 dark:border-white/10 rounded-3xl text-center text-slate-450 bg-white/30 dark:bg-dark-900/20 font-bold text-xs">No social posts created yet.</div>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <div key={post._id} className="p-5 border border-slate-200/30 dark:border-white/10 bg-white dark:bg-dark-800 rounded-3xl relative shadow-sm hover:-translate-y-1 transition-all duration-300">
                    <span className="text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-slate-50 dark:bg-dark-900 border border-slate-200/40 dark:border-white/10 text-slate-500 mb-2.5 inline-block">
                      {post.category}
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3 font-medium">{post.content}</p>
                    
                    <div className="flex gap-4 mt-3 pt-3 border-t border-slate-200/20 dark:border-white/5 text-[9px] text-slate-400 font-bold">
                      <span>{post.likes.length} Likes</span>
                      <span>{post.comments.length} Comments</span>
                    </div>

                    <button
                      onClick={() => handleDeletePost(post._id)}
                      className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
