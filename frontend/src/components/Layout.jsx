import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { 
  Home, Search, Bell, Moon, Sun, LogOut, Menu, X, 
  MapPin, ShoppingBag, MessageSquare, User, Settings, ShieldAlert,
  ChevronDown, CheckCircle, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { socket, notifications, setNotifications, unreadCount, setUnreadCount } = useSocket();
  const { showToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  // Load notifications from DB on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications');
        setNotifications(response.data);
        const unread = response.data.filter(n => !n.read).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    if (user) {
      fetchNotifications();
    }
  }, [user, setNotifications, setUnreadCount]);

  // Hook up Socket notification listener
  useEffect(() => {
    if (!socket) return;

    socket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // If notification is not about chat OR we are not on the chat page, toast it!
      if (notification.type !== 'message' || !location.pathname.startsWith('/chat')) {
        showToast(notification.content, 'info');
      }
    });

    socket.on('message', (message) => {
      // If not on chat page, or not chatting with this sender, toast!
      const params = new URLSearchParams(location.search);
      const activeChatUserId = params.get('userId');

      if (!location.pathname.startsWith('/chat') || activeChatUserId !== message.sender.id) {
        showToast(`New message from ${message.sender.name}: "${message.content.substring(0, 30)}${message.content.length > 30 ? '...' : ''}"`, 'info');
      }
    });

    return () => {
      socket.off('notification');
      socket.off('message');
    };
  }, [socket, location.pathname, location.search, showToast, setNotifications, setUnreadCount]);

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      showToast('All notifications marked as read', 'success');
    } catch (error) {
      console.error('Error marking notifications read:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
      showToast('Notifications cleared', 'success');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const handleNotificationClick = async (noti) => {
    setNotiOpen(false);
    try {
      if (!noti.read) {
        await api.put(`/notifications/${noti._id}/read`);
        setNotifications(prev => prev.map(n => n._id === noti._id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      navigate(noti.link);
    } catch (error) {
      console.error('Error reading notification:', error);
      navigate(noti.link);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/dashboard?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <Home className="w-5 h-5" /> },
    { name: 'Lost & Found', path: '/lostfound', icon: <MapPin className="w-5 h-5" /> },
    { name: 'Marketplace', path: '/marketplace', icon: <ShoppingBag className="w-5 h-5" /> },
    { name: 'Student Feed', path: '/feed', icon: <MessageSquare className="w-5 h-5" /> },
    { name: 'Chat Messenger', path: '/chat', icon: <MessageSquare className="w-5 h-5" /> },
    { name: 'My Profile', path: '/profile', icon: <User className="w-5 h-5" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" /> },
  ];

  if (user && user.role === 'admin') {
    navigationItems.push({ name: 'Admin Control', path: '/admin', icon: <ShieldAlert className="w-5 h-5" /> });
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 text-slate-800 dark:text-slate-100 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white/70 dark:bg-dark-950/30 backdrop-blur-2xl border-r border-slate-200/25 dark:border-white/5 fixed h-full z-20">
        <div className="h-20 flex items-center px-6 border-b border-slate-200/35 dark:border-white/5">
          <Link to="/dashboard" className="text-lg font-extrabold tracking-wider bg-gradient-to-r from-primary-500 via-accent-500 to-secondary-500 bg-clip-text text-transparent flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-luxury-gradient text-white shadow-md shadow-primary-500/10 flex items-center justify-center font-sans text-sm">🎓</span>
            <span>CampusConnect</span>
          </Link>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`group flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all duration-300 ${
                  isActive 
                    ? 'bg-luxury-gradient text-white shadow-lg shadow-primary-500/15 border border-white/10' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-dark-900/30 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary-500'}`}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200/35 dark:border-white/5">
          <button 
            onClick={logout}
            className="flex items-center gap-3.5 w-full px-4 py-3 rounded-2xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
          >
            <LogOut className="w-4.5 h-4.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Sidebar - Mobile / Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-64 bg-white/95 dark:bg-dark-950/95 backdrop-blur-2xl border-r border-slate-200/40 dark:border-white/10 z-50 flex flex-col lg:hidden"
            >
              <div className="h-20 flex items-center justify-between px-6 border-b border-slate-200/35 dark:border-white/5">
                <span className="text-lg font-extrabold tracking-wider bg-gradient-to-r from-primary-500 via-accent-500 to-secondary-500 bg-clip-text text-transparent flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-luxury-gradient text-white shadow shadow-primary-500/10 text-xs">🎓</span>
                  CampusConnect
                </span>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-900 transition-colors">
                  <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                </button>
              </div>

              <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                {navigationItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all ${
                        isActive 
                          ? 'bg-luxury-gradient text-white shadow-lg shadow-primary-500/15' 
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-dark-900/30 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {item.icon}
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-200/35 dark:border-white/5">
                <button 
                  onClick={() => { setSidebarOpen(false); logout(); }}
                  className="flex items-center gap-3.5 w-full px-4 py-3 rounded-2xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/25 transition-all"
                >
                  <LogOut className="w-4.5 h-4.5" />
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64">
        {/* Top Navbar */}
        <header className="h-16 bg-white/70 dark:bg-dark-950/20 backdrop-blur-xl border-b border-slate-200/25 dark:border-white/5 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-900/50 lg:hidden text-slate-500 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Bar */}
            <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center gap-2 max-w-md w-full relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search lost items, marketplace, posts..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl border border-slate-200/40 dark:border-white/5 bg-slate-100/50 dark:bg-dark-900/30 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </form>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-2xl border border-slate-200/40 dark:border-white/5 bg-white dark:bg-dark-900/30 hover:bg-slate-50 dark:hover:bg-dark-900 text-slate-500 dark:text-slate-400 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button 
                onClick={() => { setNotiOpen(!notiOpen); setUserMenuOpen(false); }}
                className="p-2.5 rounded-2xl border border-slate-200/40 dark:border-white/5 bg-white dark:bg-dark-900/30 hover:bg-slate-50 dark:hover:bg-dark-900 text-slate-500 dark:text-slate-400 transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-luxury-gradient text-white text-[9px] font-extrabold rounded-full w-4.5 h-4.5 flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notiOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setNotiOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] dark:shadow-none border border-slate-200/35 dark:border-white/10 bg-white/95 dark:bg-dark-950/95 backdrop-blur-2xl py-3.5 z-30"
                    >
                      <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100 dark:border-white/5">
                        <span className="font-bold text-xs">Notifications ({unreadCount})</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={markAllAsRead} 
                            disabled={unreadCount === 0}
                            className="text-[10px] text-primary-500 hover:text-primary-600 disabled:opacity-50 font-bold"
                          >
                            Mark read
                          </button>
                          <span className="text-gray-300 dark:text-dark-700">|</span>
                          <button 
                            onClick={clearAllNotifications}
                            disabled={notifications.length === 0}
                            className="text-[10px] text-red-500 hover:text-red-600 disabled:opacity-50 font-bold"
                          >
                            Clear all
                          </button>
                        </div>
                      </div>
                      
                      <div className="max-h-80 overflow-y-auto pt-2 divide-y divide-slate-100/50 dark:divide-white/5">
                        {notifications.length === 0 ? (
                          <div className="py-10 text-center text-slate-400 text-xs font-semibold">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((noti) => (
                            <div
                              key={noti._id}
                              onClick={() => handleNotificationClick(noti)}
                              className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-dark-900/30 cursor-pointer transition-colors ${
                                !noti.read ? 'bg-primary-500/5 dark:bg-primary-500/10' : ''
                              }`}
                            >
                              <img 
                                src={noti.sender?.profilePicture || 'https://via.placeholder.com/150'} 
                                alt={noti.sender?.name} 
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5 border border-slate-100 dark:border-white/10"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-700 dark:text-slate-200 line-clamp-2 leading-relaxed">
                                  {noti.content}
                                </p>
                                <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                                  {new Date(noti.createdAt).toLocaleDateString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              {!noti.read && (
                                <span className="w-2 h-2 rounded-full bg-luxury-gradient flex-shrink-0 mt-2.5" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Menu Dropdown */}
            <div className="relative">
              <button 
                onClick={() => { setUserMenuOpen(!userMenuOpen); setNotiOpen(false); }}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl border border-slate-200/40 dark:border-white/5 bg-white dark:bg-dark-900/30 hover:bg-slate-50 dark:hover:bg-dark-900 transition-colors"
              >
                <img 
                  src={user?.profilePicture || 'https://via.placeholder.com/150'} 
                  alt={user?.name} 
                  className="w-7 h-7 rounded-xl object-cover border border-slate-100 dark:border-white/10"
                />
                <span className="hidden sm:inline text-xs font-bold">{user?.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setUserMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-3 w-48 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] dark:shadow-none border border-slate-200/35 dark:border-white/10 bg-white/95 dark:bg-dark-950/95 backdrop-blur-2xl py-2 z-30"
                    >
                      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-white/5">
                        <p className="text-xs font-bold truncate">{user?.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                      </div>
                      
                      <div className="py-1">
                        <Link 
                          to="/profile" 
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-900/40"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          My Profile
                        </Link>
                        <Link 
                          to="/settings" 
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-900/40"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          Settings
                        </Link>
                      </div>
                      
                      <hr className="my-1 border-slate-100 dark:border-white/5" />
                      <div className="py-1">
                        <button 
                          onClick={() => { setUserMenuOpen(false); logout(); }}
                          className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
