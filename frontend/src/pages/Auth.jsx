import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Shield, Mail, Lock, User, IdCard, BookOpen, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

const Auth = () => {
  const { login, register, token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const isSignup = location.pathname === '/signup';

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    department: '',
    year: '',
    email: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);

  // Pre-fill email if Remember Me was checked previously
  useEffect(() => {
    if (!isSignup) {
      const savedEmail = localStorage.getItem('rememberedEmail');
      if (savedEmail) {
        setFormData((prev) => ({
          ...prev,
          email: savedEmail,
          rememberMe: true
        }));
      }
    }
  }, [isSignup]);

  // Redirect if already authenticated
  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    const { name, rollNumber, department, year, email, password } = formData;
    if (isSignup) {
      if (!name.trim()) return 'Full Name is required';
      if (!rollNumber.trim()) return 'Roll Number is required';
      if (!department) return 'Please select a department';
      if (!year) return 'Please select your academic year';
    }
    if (!email.trim()) return 'College Email is required';
    if (!email.match(/^\S+@\S+\.\S+$/)) return 'Please enter a valid email address';
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errorMsg = validateForm();
    if (errorMsg) {
      showToast(errorMsg, 'warning');
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        await register({
          name: formData.name.trim(),
          rollNumber: formData.rollNumber.trim().toUpperCase(),
          department: formData.department,
          year: formData.year,
          email: formData.email.trim().toLowerCase(),
          password: formData.password
        });
        showToast('Registration successful! Welcome to CampusConnect.', 'success');
      } else {
        await login(formData.email.trim().toLowerCase(), formData.password);
        
        // Handle Remember Me
        if (formData.rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email.trim().toLowerCase());
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        showToast('Successfully signed in.', 'success');
      }
      navigate('/dashboard');
    } catch (err) {
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const departments = [
    'Computer Science',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Business Administration',
    'Humanities & Sciences',
    'Physics & Chemistry'
  ];

  const academicYears = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year',
    'Postgraduate',
    'Staff / Faculty'
  ];

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col justify-center items-center py-12 px-4 relative overflow-hidden">
      {/* Decorative gradient balls */}
      <div className="absolute top-[-25%] left-[-15%] w-[60%] h-[60%] rounded-full bg-primary-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] rounded-full bg-secondary-500/10 blur-[130px] pointer-events-none" />

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full glass-card-premium card-glow bg-white/5 p-8 rounded-3xl relative z-10"
      >
        {/* Title logo */}
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-black tracking-wider bg-gradient-to-r from-primary-400 via-accent-400 to-secondary-400 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <span className="p-1.5 rounded-xl bg-luxury-gradient text-white shadow shadow-primary-500/10 text-xs">🎓</span>
            CampusConnect
          </Link>
          <p className="text-xs text-slate-400 mt-3 font-medium">
            {isSignup ? 'Create your college account today' : 'Sign in to access your student dashboard'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <>
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-accent-400" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="w-full bg-dark-900/40 border border-white/10 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-transparent transition-all placeholder:text-slate-500"
                />
              </div>

              {/* Roll Number */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                  <IdCard className="w-3.5 h-3.5 text-accent-400" />
                  Roll Number
                </label>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  placeholder="e.g. CS-2023-042"
                  className="w-full bg-dark-900/40 border border-white/10 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-transparent transition-all placeholder:text-slate-500"
                />
              </div>

              {/* Department & Year Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-accent-400" />
                    Department
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full bg-dark-900 border border-white/10 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-all text-slate-800 dark:text-white"
                  >
                    <option value="" className="bg-white dark:bg-dark-900 text-slate-800 dark:text-white">Select...</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept} className="bg-white dark:bg-dark-900 text-slate-800 dark:text-white">{dept}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-accent-400" />
                    Year
                  </label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full bg-dark-900 border border-white/10 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-all text-slate-800 dark:text-white"
                  >
                    <option value="" className="bg-white dark:bg-dark-900 text-slate-800 dark:text-white">Select...</option>
                    {academicYears.map((yr) => (
                      <option key={yr} value={yr} className="bg-white dark:bg-dark-900 text-slate-800 dark:text-white">{yr}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-accent-400" />
              College Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. admin.college@edu.in"
              className="w-full bg-dark-900/40 border border-white/10 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-transparent transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-accent-400" />
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full bg-dark-900/40 border border-white/10 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-transparent transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Remember me & Forgot password row */}
          {!isSignup && (
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="rounded border-white/10 bg-white/5 text-primary-500 focus:ring-0 focus:ring-offset-0"
                />
                Remember Me
              </label>
              <button 
                type="button" 
                onClick={() => showToast('Check your system administrator to reset passwords for college credentials.', 'info')} 
                className="hover:underline hover:text-slate-300 font-semibold"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl font-bold transition-all btn-luxury disabled:opacity-50 text-sm mt-6 flex justify-center items-center"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              isSignup ? 'Create Student Account' : 'Sign In'
            )}
          </button>
        </form>

        {/* Footer switch state link */}
        <div className="text-center mt-6 text-xs text-slate-400 font-medium">
          {isSignup ? (
            <p>
              Already have an account?{' '}
              <Link to="/login" className="text-primary-400 font-bold hover:underline">
                Sign In
              </Link>
            </p>
          ) : (
            <p>
              New student?{' '}
              <Link to="/signup" className="text-primary-400 font-bold hover:underline">
                Create Account
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
