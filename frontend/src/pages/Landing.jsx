import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ShoppingBag, MessageSquare, Shield, Users, ArrowRight } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-dark-950 text-white overflow-hidden relative font-sans">
      {/* Background decorations */}
      <div className="absolute top-[-25%] left-[-15%] w-[70%] h-[70%] rounded-full bg-primary-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-20%] w-[60%] h-[60%] rounded-full bg-accent-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[20%] w-[50%] h-[50%] rounded-full bg-secondary-500/10 blur-[130px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-white/5 relative z-10">
        <Link to="/" className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-primary-400 via-accent-400 to-secondary-400 bg-clip-text text-transparent flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-luxury-gradient text-white shadow shadow-primary-500/10 text-xs">🎓</span>
          CampusConnect
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-semibold hover:text-primary-300 transition-colors">
            Sign In
          </Link>
          <Link to="/signup" className="px-5 py-2.5 text-sm font-bold rounded-2xl transition-all btn-luxury">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-32 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
        <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-accent-300"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-luxury-gradient animate-pulse" />
            Exclusive to College Students
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black tracking-tight leading-none"
          >
            The Ultimate Hub for <br />
            <span className="bg-gradient-to-r from-primary-400 via-accent-400 to-secondary-400 bg-clip-text text-transparent">
              Campus Life.
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-400 text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium"
          >
            Connect with peers, trade marketplace products, recover lost items, share student updates, and chat in real-time. Built specifically for your college ecosystem.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4"
          >
            <Link to="/signup" className="px-8 py-4 rounded-2xl font-bold transition-all btn-luxury flex items-center justify-center gap-2 group">
              Join Campus Hub
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login" className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl font-bold transition-all flex items-center justify-center">
              Sign In to Account
            </Link>
          </motion.div>
        </div>

        {/* Hero Features Visualizer */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-5 grid grid-cols-2 gap-4 relative"
        >
          {/* Glass Card 1 */}
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4 hover:border-primary-500/40 transition-all hover:-translate-y-1 duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-primary-500/15 flex items-center justify-center text-primary-400 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base">Lost & Found</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">Report items, claim matches, and trigger alerts in real-time.</p>
          </div>
          {/* Glass Card 2 */}
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4 hover:border-secondary-500/40 transition-all hover:-translate-y-1 duration-300 group mt-6">
            <div className="w-12 h-12 rounded-2xl bg-secondary-500/15 flex items-center justify-center text-secondary-400 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base">Marketplace</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">Buy and sell textbooks, electronics, and supplies peer-to-peer.</p>
          </div>
          {/* Glass Card 3 */}
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4 hover:border-accent-500/40 transition-all hover:-translate-y-1 duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-accent-500/15 flex items-center justify-center text-accent-400 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base">Student Feed</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">Post updates, academic events, questions, and college news.</p>
          </div>
          {/* Glass Card 4 */}
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4 hover:border-primary-500/40 transition-all hover:-translate-y-1 duration-300 group mt-6">
            <div className="w-12 h-12 rounded-2xl bg-primary-500/15 flex items-center justify-center text-primary-400 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base">Moderated</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">Admin oversight ensures zero spam and a secure community.</p>
          </div>
        </motion.div>
      </section>

      {/* Stats Counter Section */}
      <section className="bg-dark-950 py-16 relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">3,200+</p>
            <p className="text-slate-500 text-xs uppercase tracking-wider font-bold">Active Students</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-accent-400 to-secondary-400 bg-clip-text text-transparent">1,500+</p>
            <p className="text-slate-500 text-xs uppercase tracking-wider font-bold">Deals Completed</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-secondary-400 to-primary-400 bg-clip-text text-transparent">850+</p>
            <p className="text-slate-500 text-xs uppercase tracking-wider font-bold">Lost Items Recovered</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-primary-400 via-accent-400 to-secondary-400 bg-clip-text text-transparent">15k+</p>
            <p className="text-slate-500 text-xs uppercase tracking-wider font-bold">Messages Exchanged</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
