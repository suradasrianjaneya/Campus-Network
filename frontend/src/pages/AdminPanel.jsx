import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { 
  ShieldAlert, Users, ShoppingBag, MapPin, MessageSquare, 
  Check, Trash2, ShieldOff, AlertTriangle, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Guard routing just in case
  useEffect(() => {
    if (user && user.role !== 'admin') {
      showToast('Unauthorized access denied.', 'error');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Admin states
  const [metrics, setMetrics] = useState(null);
  const [flaggedItems, setFlaggedItems] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users')
      ]);

      setMetrics(statsRes.data.metrics);
      setFlaggedItems(statsRes.data.flaggedItems);
      setUsersList(usersRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      showToast('Could not load administration console updates.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (targetUserId) => {
    try {
      const response = await api.put(`/admin/users/${targetUserId}/ban`);
      showToast(response.data.message, 'success');
      
      // Update local list
      setUsersList(prev => prev.map(u => 
        u._id === targetUserId ? { ...u, banned: !u.banned } : u
      ));
    } catch (error) {
      console.error('Ban error:', error);
      showToast(error.response?.data?.message || 'Could not update user status.', 'error');
    }
  };

  const handleDeleteListing = async (itemId) => {
    if (!window.confirm('Delete this listing permanently due to suspicious/spam reports?')) return;
    try {
      await api.delete(`/lostfound/${itemId}`);
      showToast('Listing removed successfully.', 'success');
      setFlaggedItems(prev => prev.filter(i => i._id !== itemId));
    } catch (error) {
      console.error('Delete flag item error:', error);
      showToast('Could not delete listing.', 'error');
    }
  };

  // Filter user list by search input
  const filteredUsers = usersList.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.rollNumber.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col justify-center items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-bold tracking-wider uppercase animate-pulse">Loading Admin Console...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-slate-850 dark:text-slate-100">
          <ShieldAlert className="w-8 h-8 text-secondary-500 animate-pulse" />
          <span className="text-gradient">Admin Moderation Panel</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">Monitor system analytics, flag suspicious activities, and moderate student posts.</p>
      </div>

      {/* Metrics Widgets */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="glass-card-premium p-5 rounded-3xl text-center flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 card-glow">
            <div className="w-10 h-10 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black block uppercase tracking-wider">Total Users</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white mt-1 block">{metrics.totalUsers}</span>
            </div>
          </div>

          <div className="glass-card-premium p-5 rounded-3xl text-center flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 card-glow">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-5 h-5 text-teal-500" />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black block uppercase tracking-wider">Market Items</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white mt-1 block">{metrics.activeProducts} / {metrics.totalProducts}</span>
            </div>
          </div>

          <div className="glass-card-premium p-5 rounded-3xl text-center flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 card-glow">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black block uppercase tracking-wider">Lost Items</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white mt-1 block">{metrics.lostItems}</span>
            </div>
          </div>

          <div className="glass-card-premium p-5 rounded-3xl text-center flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 card-glow">
            <div className="w-10 h-10 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black block uppercase tracking-wider">Found Items</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white mt-1 block">{metrics.foundItems}</span>
            </div>
          </div>

          <div className="glass-card-premium p-5 rounded-3xl text-center flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 card-glow">
            <div className="w-10 h-10 rounded-2xl bg-accent-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Check className="w-5 h-5 text-accent-500" />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black block uppercase tracking-wider">Items Resolved</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white mt-1 block">{metrics.resolvedItems}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main split dashboard view */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* User directory management table (Columns 1-7) */}
        <div className="xl:col-span-7 glass-card-premium p-6 rounded-3xl flex flex-col h-[520px] overflow-hidden relative">
          <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
            <h2 className="text-xs font-black tracking-widest uppercase text-slate-450 dark:text-slate-500">Student Directory</h2>
            
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search by name, roll no, email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="bg-slate-50 dark:bg-dark-900/60 border border-slate-200/50 dark:border-white/10 rounded-2xl px-4 py-2 text-xs text-slate-800 dark:text-white max-w-xs w-full focus:ring-2 focus:ring-accent-500/50 focus:outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/40 dark:border-white/5 text-slate-450 dark:text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Roll No</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-white/5">
                {filteredUsers.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/40 dark:hover:bg-dark-900/20 transition-colors">
                    <td className="py-3.5 pr-2">
                      <div className="flex items-center gap-3">
                        <img src={item.profilePicture || 'https://via.placeholder.com/150'} alt="" className="w-8 h-8 rounded-xl object-cover border border-slate-200/30 dark:border-white/10" />
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-850 dark:text-slate-200 truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{item.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 font-bold text-slate-600 dark:text-slate-400">{item.rollNumber}</td>
                    <td className="py-3.5 text-slate-500 dark:text-slate-400 truncate max-w-[120px] font-semibold">{item.department}</td>
                    <td className="py-3.5 text-right">
                      {item.role === 'admin' ? (
                        <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-primary-500/10 text-primary-500 border border-primary-500/20 font-black uppercase">System Admin</span>
                      ) : (
                        <button
                          onClick={() => handleToggleBan(item._id)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition-all cursor-pointer ${
                            item.banned 
                              ? 'bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-500/20' 
                              : 'border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white dark:hover:bg-red-950/40'
                          }`}
                        >
                          {item.banned ? 'Banned' : 'Ban User'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Flagged Suspicious Claims review logs (Columns 8-12) */}
        <div className="xl:col-span-5 glass-card-premium p-6 rounded-3xl flex flex-col h-[520px] overflow-hidden relative">
          <h2 className="text-xs font-black tracking-widest uppercase text-slate-450 dark:text-slate-500 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4.5 h-4.5 text-secondary-500 animate-bounce" />
            Flagged claim reports
          </h2>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {flaggedItems.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center text-slate-400 dark:text-slate-550 text-xs font-bold">
                No active flags or warnings found on lost item claim requests.
              </div>
            ) : (
              flaggedItems.map((item) => (
                <div key={item._id} className="p-4 border border-amber-500/25 bg-amber-500/5 dark:border-white/10 dark:bg-dark-900/40 rounded-2xl space-y-3 relative group hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase bg-secondary-500/10 text-secondary-600 dark:text-secondary-400 border border-secondary-500/20">
                        {item.type} Item
                      </span>
                      <h4 className="font-extrabold text-xs mt-2.5 text-slate-800 dark:text-white">{item.name}</h4>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold mt-0.5">Reporter: {item.reporter?.name}</p>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => navigate(`/lostfound?id=${item._id}`)}
                        title="View detail report page"
                        className="p-2 bg-slate-50 dark:bg-dark-800/80 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-750 text-slate-500 dark:text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors border border-slate-200/40 dark:border-white/5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteListing(item._id)}
                        title="Delete listing override"
                        className="p-2 bg-red-50 dark:bg-red-950/40 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/60 text-red-500 hover:text-red-600 transition-colors border border-red-200/20 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Claims flagged list */}
                  <div className="border-t border-slate-200/20 dark:border-white/5 pt-2.5 space-y-2">
                    {item.suspiciousClaims.map((claim, idx) => (
                      <div key={idx} className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-dark-950/50 border border-slate-150/40 dark:border-white/5 p-2.5 rounded-xl leading-relaxed">
                        <strong className="text-secondary-500 font-extrabold">@{claim.user?.name} flagged:</strong>
                        <p className="mt-0.5 font-medium italic">{claim.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
