import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { 
  MessageSquare, Heart, Share2, Send, Trash2, Edit3, X,
  ImageIcon, Calendar, HelpCircle, Briefcase, Info, MoreHorizontal
} from 'lucide-react';
import { ListSkeleton } from '../components/SkeletonLoader';

const Feed = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // URL parameters
  const queryParams = new URLSearchParams(location.search);
  const actionParam = queryParams.get('action');
  const postIdParam = queryParams.get('postId');

  // Posts states
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');

  // Post form state
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('update');
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Comments state maps: postId -> comments list
  const [commentsMap, setCommentsMap] = useState({});
  const [newCommentText, setNewCommentText] = useState({});
  const [activeCommentDrawer, setActiveCommentDrawer] = useState(null); // holds postId

  // Focus ref for auto-opening
  const postInputRef = useRef(null);

  useEffect(() => {
    fetchPosts();
  }, [filterCategory]);

  useEffect(() => {
    if (actionParam === 'post' && postInputRef.current) {
      postInputRef.current.focus();
    }
  }, [actionParam]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let url = `/feed?search=${search}`;
      if (filterCategory) url += `&category=${filterCategory}`;
      const response = await api.get(url);
      setPosts(response.data);

      // Pre-populate comment lists
      const comments = {};
      response.data.forEach(p => {
        comments[p._id] = p.comments;
      });
      setCommentsMap(comments);
    } catch (error) {
      console.error('Error fetching posts:', error);
      showToast('Could not load community feed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      showToast('Post content cannot be empty', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const uploadData = new FormData();
      uploadData.append('content', content);
      uploadData.append('category', category);
      
      for (const img of images) {
        uploadData.append('images', img);
      }

      const response = await api.post('/feed', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast('Post shared with campus!', 'success');
      setPosts(prev => [response.data, ...prev]);
      setCommentsMap(prev => ({ ...prev, [response.data._id]: [] }));
      setContent('');
      setImages([]);
      setCategory('update');
    } catch (error) {
      console.error('Error creating post:', error);
      showToast(error.response?.data?.message || 'Could not upload post.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const response = await api.post(`/feed/${postId}/like`);
      // Update post likes count in state
      setPosts(prev => prev.map(p => 
        p._id === postId 
          ? { ...p, likes: response.data.likes } 
          : p
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleCommentSubmit = async (postId, e) => {
    e.preventDefault();
    const commentText = newCommentText[postId];
    if (!commentText || !commentText.trim()) return;

    try {
      const response = await api.post(`/feed/${postId}/comment`, {
        content: commentText.trim()
      });
      
      // Update comments map
      setCommentsMap(prev => ({
        ...prev,
        [postId]: response.data
      }));

      // Update post comments array for counters
      setPosts(prev => prev.map(p => 
        p._id === postId 
          ? { ...p, comments: response.data } 
          : p
      ));

      setNewCommentText(prev => ({ ...prev, [postId]: '' }));
      showToast('Comment posted.', 'success');
    } catch (error) {
      console.error('Error posting comment:', error);
      showToast('Failed to add comment.', 'error');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Delete comment?')) return;
    try {
      const response = await api.delete(`/feed/${postId}/comment/${commentId}`);
      setCommentsMap(prev => ({
        ...prev,
        [postId]: response.data
      }));
      setPosts(prev => prev.map(p => 
        p._id === postId 
          ? { ...p, comments: response.data } 
          : p
      ));
      showToast('Comment deleted', 'info');
    } catch (error) {
      console.error('Delete comment error:', error);
      showToast('Could not delete comment.', 'error');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post permanently?')) return;

    try {
      await api.delete(`/feed/${postId}`);
      setPosts(prev => prev.filter(p => p._id !== postId));
      showToast('Post deleted successfully.', 'success');
    } catch (error) {
      console.error('Delete post error:', error);
      showToast('Could not delete post.', 'error');
    }
  };

  const handleSharePost = (postId) => {
    const postLink = `${window.location.origin}/feed?postId=${postId}`;
    navigator.clipboard.writeText(postLink);
    showToast('Post link copied to clipboard!', 'success');
  };

  const getCategoryIcon = (cat) => {
    const icons = {
      'update': <Info className="w-4 h-4 text-blue-500" />,
      'question': <HelpCircle className="w-4 h-4 text-amber-500" />,
      'event': <Calendar className="w-4 h-4 text-green-500" />,
      'opportunity': <Briefcase className="w-4 h-4 text-indigo-500" />
    };
    return icons[cat] || <Info className="w-4 h-4" />;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Create Post Card */}
      {user && (
        <div className="glass-card-premium p-5 rounded-3xl border border-slate-200/30 dark:border-white/10 space-y-4">
          <div className="flex gap-3">
            <img src={user.profilePicture || 'https://via.placeholder.com/150'} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-slate-100 dark:border-white/10" />
            <form onSubmit={handlePostSubmit} className="flex-1 space-y-3">
              <textarea
                ref={postInputRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share updates, ask questions, or announce campus events..."
                rows="3"
                className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200/40 dark:border-white/10 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-transparent transition-all placeholder:text-slate-500 resize-none text-slate-850 dark:text-white font-medium"
              />
              
              <div className="flex items-center justify-between flex-wrap gap-2 pt-3 border-t border-slate-200/20 dark:border-white/5">
                <div className="flex items-center gap-3">
                  {/* Category dropdown */}
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-slate-100 dark:bg-dark-900 border border-slate-200/40 dark:border-white/10 text-[10px] font-bold px-3 py-2 rounded-xl focus:outline-none text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-accent-500/50"
                  >
                    <option value="update">Update / Announcement</option>
                    <option value="question">Academic Question</option>
                    <option value="event">Campus Event</option>
                    <option value="opportunity">Career Opportunity</option>
                  </select>

                  {/* Image attachment button */}
                  <label className="p-2 rounded-xl border border-slate-200/40 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-dark-700 cursor-pointer text-slate-400 transition-colors">
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      onChange={(e) => setImages(Array.from(e.target.files))}
                      className="hidden" 
                    />
                    <ImageIcon className="w-4 h-4" />
                  </label>
                  {images.length > 0 && (
                    <span className="text-[10px] font-black text-primary-500">{images.length} attached</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold transition-all btn-luxury flex items-center gap-1.5"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Share <Send className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feed Filters Tabs */}
      <div className="flex bg-white/60 dark:bg-dark-900/40 backdrop-blur-md border border-slate-200/30 dark:border-white/10 p-1.5 rounded-2xl shadow-sm justify-between gap-1 overflow-x-auto">
        {[
          { name: 'All Activity', value: '' },
          { name: 'Updates', value: 'update' },
          { name: 'Questions', value: 'question' },
          { name: 'Events', value: 'event' },
          { name: 'Opportunities', value: 'opportunity' }
        ].map(tab => (
          <button
            key={tab.name}
            onClick={() => setFilterCategory(tab.value)}
            className={`flex-1 py-2 text-center rounded-xl text-xs font-bold transition-all whitespace-nowrap px-3 ${
              filterCategory === tab.value
                ? 'bg-luxury-gradient text-white shadow-sm shadow-primary-500/10 border border-white/5'
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-dark-800/40 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Postings Stream */}
      {loading ? (
        <ListSkeleton />
      ) : posts.length === 0 ? (
        <div className="p-16 border border-dashed border-slate-200/60 dark:border-white/10 rounded-3xl text-center bg-white dark:bg-dark-900/30">
          <MessageSquare className="w-12 h-12 text-slate-300 dark:text-dark-600 mx-auto mb-3" />
          <h3 className="font-extrabold text-sm">No feed updates found</h3>
          <p className="text-xs text-slate-400 mt-1 font-medium">Be the first to share an update on the college wall!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isLiked = user && post.likes.includes(user.id);
            const showComments = activeCommentDrawer === post._id;
            const commentsList = commentsMap[post._id] || [];

            // Highlight deep-linked post
            const isHighlighted = postIdParam === post._id;

            return (
              <div
                key={post._id}
                id={`post-${post._id}`}
                className={`glass-card-premium card-glow border transition-all duration-300 p-5 rounded-3xl shadow-sm space-y-4 ${
                  isHighlighted 
                    ? 'border-primary-500 ring-2 ring-primary-500/10 bg-primary-500/5' 
                    : 'border-slate-200/30 dark:border-white/10'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={post.author?.profilePicture || 'https://via.placeholder.com/150'} 
                      alt={post.author?.name} 
                      className="w-9 h-9 rounded-full object-cover border border-slate-100 dark:border-white/10" 
                    />
                    <div>
                      <h3 className="text-xs font-bold">{post.author?.name}</h3>
                      <span className="text-[9px] text-slate-400 font-bold block">
                        {post.author?.department} • {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Category Label */}
                    <span className="inline-flex items-center gap-1 text-[9px] px-2.5 py-0.5 rounded-full font-bold bg-slate-50 dark:bg-dark-900/50 border border-slate-200/40 dark:border-white/10 text-slate-500 dark:text-slate-350 capitalize">
                      {getCategoryIcon(post.category)}
                      {post.category}
                    </span>

                    {/* Delete trigger */}
                    {user && (post.author?._id === user.id || user.role === 'admin') && (
                      <button 
                        onClick={() => handleDeletePost(post._id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-750 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content text */}
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap font-medium">
                  {post.content}
                </p>

                {/* Attached images layout */}
                {post.images && post.images.length > 0 && (
                  <div className={`grid gap-2 rounded-2xl overflow-hidden ${
                    post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                  }`}>
                    {post.images.map((img, idx) => (
                      <img 
                        key={idx} 
                        src={img} 
                        alt="Attached post upload" 
                        className="w-full max-h-72 object-cover" 
                      />
                    ))}
                  </div>
                )}

                {/* Action buttons row (like, comments click, share) */}
                <div className="flex gap-6 items-center pt-3.5 border-t border-slate-200/20 dark:border-white/5 text-xs text-slate-400 font-bold">
                  <button 
                    onClick={() => handleLikePost(post._id)}
                    className={`flex items-center gap-1.5 transition-all ${
                      isLiked ? 'text-red-500 scale-105' : 'hover:text-red-500 hover:scale-105'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500' : ''}`} />
                    <span>{post.likes.length} Likes</span>
                  </button>

                  <button 
                    onClick={() => setActiveCommentDrawer(showComments ? null : post._id)}
                    className={`flex items-center gap-1.5 hover:text-primary-500 transition-colors ${
                      showComments ? 'text-primary-500' : ''
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{commentsList.length} Comments</span>
                  </button>

                  <button 
                    onClick={() => handleSharePost(post._id)}
                    className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors ml-auto hover:scale-105"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>

                {/* Comments Drawer (Visible when toggled) */}
                {showComments && (
                  <div className="pt-4 border-t border-slate-200/20 dark:border-white/5 space-y-4.5 transition-all">
                    
                    {/* List comments */}
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {commentsList.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic text-center py-2.5 font-medium">No comments yet. Write one below!</p>
                      ) : (
                        commentsList.map((comm) => (
                          <div key={comm._id} className="flex gap-2.5 items-start p-3 rounded-2xl bg-slate-50/50 dark:bg-dark-900/30 border border-slate-200/40 dark:border-white/5">
                            <img src={comm.author?.profilePicture || 'https://via.placeholder.com/150'} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-100 dark:border-white/10" />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{comm.author?.name}</h4>
                                <span className="text-[9px] text-slate-450 font-bold">{new Date(comm.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-350 mt-0.5 leading-relaxed font-semibold">{comm.content}</p>
                            </div>
                            
                            {/* Delete Comment button */}
                            {user && (comm.author?._id === user.id || post.author?._id === user.id || user.role === 'admin') && (
                              <button 
                                onClick={() => handleDeleteComment(post._id, comm._id)}
                                className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Write comment Form */}
                    <form onSubmit={(e) => handleCommentSubmit(post._id, e)} className="flex gap-2.5">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={newCommentText[post._id] || ''}
                        onChange={(e) => setNewCommentText(prev => ({ ...prev, [post._id]: e.target.value }))}
                        className="flex-1 bg-slate-50 dark:bg-dark-900 border border-slate-200/40 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent-500/50 text-slate-800 dark:text-white"
                      />
                      <button 
                        type="submit" 
                        className="p-2.5 rounded-2xl btn-luxury flex items-center justify-center transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Feed;
