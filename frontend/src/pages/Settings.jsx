import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { 
  Settings, Sun, Moon, Sparkles, User, Shield, Info, 
  Download, ArrowRight, Laptop, HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SettingsPage = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const handlePWAPrompt = () => {
    showToast('PWA support is active! If your browser supports it, click the install icon in the URL address bar to install standalone CampusConnect app.', 'info', 5000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-primary-600 via-accent-600 to-secondary-500 bg-clip-text text-transparent dark:from-primary-400 dark:via-accent-400 dark:to-secondary-400">System Settings</h1>
        <p className="text-xs text-slate-400 font-bold mt-1">Configure theme, update preferences, and install the mobile app.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Navigation Sidebar shortcut cards (Left) */}
        <div className="md:col-span-1 space-y-4">
          <div className="p-4 glass-card-premium border border-slate-200/30 dark:border-white/10 rounded-3xl flex items-center gap-3">
            <img src={user?.profilePicture || 'https://via.placeholder.com/150'} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-white/10" />
            <div className="min-w-0">
              <h3 className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">{user?.name}</h3>
              <Link to="/profile" className="text-[10px] text-primary-500 hover:underline flex items-center gap-0.5 mt-0.5 font-bold">
                Update Profile <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
          
          <div className="p-4 border border-slate-200/20 dark:border-white/5 bg-slate-50/50 dark:bg-dark-900/30 backdrop-blur-md rounded-3xl text-[11px] text-slate-400 space-y-1.5 font-bold">
            <p><strong>Casing:</strong> Web Application</p>
            <p><strong>Environment:</strong> Localhost Dev</p>
            <p><strong>DB Connectivity:</strong> MongoDB</p>
          </div>
        </div>

        {/* Right Settings controls (Columns 2-3) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Theme customizer */}
          <section className="glass-card-premium rounded-3xl p-6 border border-slate-200/30 dark:border-white/10 shadow-sm space-y-4">
            <h2 className="text-[10px] font-bold tracking-wider uppercase text-slate-400 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-primary-500" />
              Appearance & Theme
            </h2>
            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Dark Color Mode</p>
                <p className="text-slate-450 mt-0.5 font-medium">Reduce eye strain during night hours on campus.</p>
              </div>
              
              <button 
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2.5 border rounded-2xl border-slate-200/40 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-dark-900 transition-colors font-bold text-xs bg-white dark:bg-dark-900 text-slate-700 dark:text-slate-200 shadow-sm"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-slate-500" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* PWA Settings */}
          <section className="glass-card-premium rounded-3xl p-6 border border-slate-200/30 dark:border-white/10 shadow-sm space-y-4">
            <h2 className="text-[10px] font-bold tracking-wider uppercase text-slate-400 flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-500" />
              Progressive Web App (PWA)
            </h2>
            <div className="flex items-center justify-between text-xs flex-wrap gap-4">
              <div className="max-w-md">
                <p className="font-bold text-slate-800 dark:text-slate-200">Mobile Standalone Application</p>
                <p className="text-slate-455 mt-0.5 leading-relaxed font-medium">Install CampusConnect on your device home screen to access fast caching and offline feeds views.</p>
              </div>
              
              <button 
                onClick={handlePWAPrompt}
                className="px-5 py-2.5 text-white rounded-2xl font-bold flex items-center gap-1.5 transition-all btn-luxury"
              >
                <Download className="w-4 h-4" />
                Install App
              </button>
            </div>
          </section>

          {/* Account credentials info summary */}
          <section className="glass-card-premium rounded-3xl p-6 border border-slate-200/30 dark:border-white/10 shadow-sm space-y-4">
            <h2 className="text-[10px] font-bold tracking-wider uppercase text-slate-400 flex items-center gap-2">
              <User className="w-4 h-4 text-teal-500" />
              Account Credentials
            </h2>
            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 border-b border-slate-200/20 dark:border-white/5 pb-2.5 font-medium">
                <span className="text-slate-400">FullName</span>
                <span className="col-span-2 font-bold text-slate-700 dark:text-slate-250">{user?.name}</span>
              </div>
              <div className="grid grid-cols-3 border-b border-slate-200/20 dark:border-white/5 pb-2.5 font-medium">
                <span className="text-slate-400">Roll Number</span>
                <span className="col-span-2 font-bold text-slate-700 dark:text-slate-250 font-mono">{user?.rollNumber}</span>
              </div>
              <div className="grid grid-cols-3 border-b border-slate-200/20 dark:border-white/5 pb-2.5 font-medium">
                <span className="text-slate-400">College Email</span>
                <span className="col-span-2 font-bold text-slate-700 dark:text-slate-250">{user?.email}</span>
              </div>
              <div className="grid grid-cols-3 font-medium">
                <span className="text-slate-400">Role Status</span>
                <span className="col-span-2 font-black text-primary-500 uppercase tracking-wider bg-gradient-to-r from-primary-500 via-accent-500 to-secondary-500 bg-clip-text text-transparent">{user?.role}</span>
              </div>
            </div>
          </section>

          {/* Help Center */}
          <section className="glass-card-premium rounded-3xl p-6 border border-slate-200/30 dark:border-white/10 shadow-sm space-y-4">
            <h2 className="text-[10px] font-bold tracking-wider uppercase text-slate-400 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-500" />
              Support & Help Desk
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-350 leading-normal font-medium">
              For security, policy infractions, or lost item claim verification disputes, email college support at <strong className="text-slate-800 dark:text-white">support@college.edu</strong> or contact the admin panel.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
