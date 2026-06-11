import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { 
  Send, Search, Inbox, AlertCircle, ShoppingBag, MapPin, 
  ChevronRight, Circle, CheckCheck, User, MessageSquare
} from 'lucide-react';

const Chat = () => {
  const { user } = useAuth();
  const { socket, isUserOnline } = useSocket();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Parse query params (context for new chats)
  const queryParams = new URLSearchParams(location.search);
  const queryUserId = queryParams.get('userId');
  const queryItemType = queryParams.get('itemType') || 'None';
  const queryItemId = queryParams.get('itemId');

  // Chat states
  const [conversations, setConversations] = useState([]);
  const [activeRecipient, setActiveRecipient] = useState(null); // holds otherUser object
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [contactsSearch, setContactsSearch] = useState('');

  // Active contextual item state
  const [contextItem, setContextItem] = useState(null);

  const messagesEndRef = useRef(null);

  // Fetch inbox conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Handle URL deep-linking
  useEffect(() => {
    if (queryUserId) {
      handleUrlDeepLink();
    }
  }, [queryUserId, queryItemId, queryItemType, conversations]);

  // Handle Socket.io events
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    socket.on('message', (message) => {
      // If the message is from our active chat room, append it!
      if (activeRecipient && message.sender.id === activeRecipient.id) {
        setMessages(prev => [...prev, {
          _id: message._id,
          sender: message.sender.id,
          receiver: message.receiver,
          content: message.content,
          read: true,
          itemContext: message.itemContext,
          createdAt: message.createdAt
        }]);

        // Acknowledge read status back via API/Socket
        markMessageAsRead(message._id);
      }
      
      // Refresh inbox conversations to show the latest message
      fetchConversations();
    });

    // Listen for messages read updates
    socket.on('messages_read', (data) => {
      if (activeRecipient && data.readBy === activeRecipient.id) {
        setMessages(prev => prev.map(m => m.sender === user.id ? { ...m, read: true } : m));
      }
    });

    return () => {
      socket.off('message');
      socket.off('messages_read');
    };
  }, [socket, activeRecipient, user]);

  // Scroll to bottom of message thread
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await api.get('/chat/conversations');
      setConversations(response.data);
      setLoadingConv(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      showToast('Could not load inbox.', 'error');
      setLoadingConv(false);
    }
  };

  const handleUrlDeepLink = async () => {
    // If we have query parameters, check if conversation already exists
    const existing = conversations.find(c => c.otherUser.id === queryUserId);

    if (existing) {
      selectConversation(existing.otherUser);
      cleanUrlParams();
    } else {
      // Create new mock conversation contact item on top of list
      try {
        const response = await api.get(`/auth/profile?userId=${queryUserId}`).catch(() => null);
        
        let targetUserObj = null;
        if (response) {
          targetUserObj = response.data;
        } else {
          // If profile fetch fails, fetch by sending a mock API get user info (standard search)
          // For simplicity, let's look for user in seeded DB or fetch direct info
          // We'll create a fallback mock user object from query info
          const allConvRes = await api.get('/admin/users').catch(() => null);
          const found = allConvRes?.data?.find(u => u._id === queryUserId);
          if (found) {
            targetUserObj = {
              id: found._id,
              name: found.name,
              profilePicture: found.profilePicture,
              department: found.department,
              year: found.year
            };
          }
        }

        if (targetUserObj) {
          // Add temporary placeholder conversation
          const mockConv = {
            otherUser: targetUserObj,
            lastMessage: null,
            unreadCount: 0
          };
          
          setConversations(prev => {
            if (prev.find(c => c.otherUser.id === queryUserId)) return prev;
            return [mockConv, ...prev];
          });

          selectConversation(targetUserObj);
        }
      } catch (err) {
        console.error('Error loading deep linked user:', err);
      }
      cleanUrlParams();
    }
  };

  const cleanUrlParams = () => {
    // Clear queries without reloading
    navigate('/chat', { replace: true });
  };

  const selectConversation = async (otherUser) => {
    setActiveRecipient(otherUser);
    setLoadingMessages(true);
    setMessages([]);
    setContextItem(null);

    try {
      const response = await api.get(`/chat/messages/${otherUser.id}`);
      setMessages(response.data);

      // Check if thread contains contextual items
      const msgWithItem = response.data.find(m => m.itemContext && m.itemContext.itemId);
      if (msgWithItem) {
        setContextItem(msgWithItem.itemContext);
      } else if (queryItemId && queryItemType !== 'None') {
        // If loaded via url context query
        setContextItem({
          itemType: queryItemType,
          itemId: queryItemId
        });
      }

      // Decrement unread counts in local list
      setConversations(prev => prev.map(c => 
        c.otherUser.id === otherUser.id ? { ...c, unreadCount: 0 } : c
      ));
    } catch (error) {
      console.error('Error loading messages:', error);
      showToast('Could not load chat history.', 'error');
    } finally {
      setLoadingMessages(false);
    }
  };

  const markMessageAsRead = async (messageId) => {
    try {
      // Endpoint to mark read can be socket emit or API ping
      // Messages are automatically marked read when calling GET /messages/:recipientId
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRecipient) return;

    const payload = {
      receiverId: activeRecipient.id,
      content: newMessage.trim()
    };

    // Include context if present
    if (contextItem && contextItem.itemId) {
      payload.itemType = contextItem.itemType;
      payload.itemId = contextItem.itemId._id || contextItem.itemId;
    }

    try {
      const response = await api.post('/chat/messages', payload);
      
      // Append to local messages
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');

      // Refresh inbox
      fetchConversations();
    } catch (error) {
      console.error('Send message error:', error);
      showToast('Message delivery failed.', 'error');
    }
  };

  // Filter contacts by search input
  const filteredConversations = conversations.filter(c => 
    c.otherUser.name.toLowerCase().includes(contactsSearch.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 border border-slate-200/35 dark:border-white/10 bg-white/70 dark:bg-dark-900/30 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-sm h-[calc(100vh-160px)]">
      
      {/* Inbox List Side Panel (Columns 1-4) */}
      <div className="md:col-span-4 border-r border-slate-200/35 dark:border-white/10 flex flex-col h-full bg-slate-50/20 dark:bg-dark-950/10">
        <div className="p-4 border-b border-slate-200/35 dark:border-white/10">
          <h2 className="text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-3">Chats Messenger</h2>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-450 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={contactsSearch}
              onChange={(e) => setContactsSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs border border-slate-200/40 dark:border-white/10 bg-white dark:bg-dark-900/60 focus:outline-none focus:ring-2 focus:ring-accent-500/50 placeholder:text-slate-450 text-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* List items */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100/50 dark:divide-white/5 pr-1">
          {loadingConv ? (
            <div className="p-8 text-center text-xs text-slate-450 font-semibold">Loading inbox...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-450 space-y-2 font-medium">
              <Inbox className="w-8 h-8 mx-auto text-slate-300 dark:text-dark-700" />
              <p>No active chats found.</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = activeRecipient && activeRecipient.id === conv.otherUser.id;
              const isOnline = isUserOnline(conv.otherUser.id);
              
              return (
                <div
                  key={conv.otherUser.id}
                  onClick={() => selectConversation(conv.otherUser)}
                  className={`flex items-center gap-3.5 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-dark-900/30 cursor-pointer transition-all ${
                    isSelected ? 'bg-primary-500/5 dark:bg-accent-500/10 border-l-4 border-accent-500' : ''
                  }`}
                >
                  {/* Avatar wrapper with Online Indicator */}
                  <div className="relative flex-shrink-0">
                    <img 
                      src={conv.otherUser.profilePicture || 'https://via.placeholder.com/150'} 
                      alt={conv.otherUser.name} 
                      className="w-9 h-9 rounded-full object-cover border border-slate-100 dark:border-white/10"
                    />
                    <span className={`w-3 h-3 absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white dark:border-dark-950 ${
                      isOnline ? 'bg-green-500' : 'bg-slate-350 dark:bg-dark-700'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">{conv.otherUser.name}</h4>
                      {conv.lastMessage && (
                        <span className="text-[9px] text-slate-400 font-bold">
                          {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate leading-relaxed font-semibold">
                      {conv.lastMessage ? conv.lastMessage.content : 'Started a conversation'}
                    </p>
                  </div>

                  {/* Unread count badge */}
                  {conv.unreadCount > 0 && (
                    <span className="bg-luxury-gradient text-white text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary-500/15">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Message Chat Room Panel (Columns 5-12) */}
      <div className="md:col-span-8 flex flex-col h-full bg-white/40 dark:bg-dark-900/10">
        {activeRecipient ? (
          <>
            {/* Header */}
            <div className="px-6 py-3.5 border-b border-slate-200/35 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={activeRecipient.profilePicture || 'https://via.placeholder.com/150'} 
                  alt={activeRecipient.name} 
                  className="w-9 h-9 rounded-full object-cover border border-slate-100 dark:border-white/10" 
                />
                <div>
                  <h3 className="text-xs font-bold leading-snug">{activeRecipient.name}</h3>
                  <span className="text-[9px] text-slate-400 font-bold block">
                    {activeRecipient.department} • {activeRecipient.year}
                  </span>
                </div>
              </div>

              {/* Status Tag */}
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                <span className={`w-2.5 h-2.5 rounded-full ${isUserOnline(activeRecipient.id) ? 'bg-green-500 animate-pulse' : 'bg-slate-350 dark:bg-dark-700'}`} />
                {isUserOnline(activeRecipient.id) ? 'Online' : 'Offline'}
              </div>
            </div>

            {/* Context Item Banner (Selling / Claiming link) */}
            {contextItem && contextItem.itemId && (
              <div className="px-6 py-2.5 bg-slate-50/50 dark:bg-dark-900/40 backdrop-blur-md border-b border-slate-200/20 dark:border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-500 font-semibold">
                  {contextItem.itemType === 'Product' ? (
                    <>
                      <ShoppingBag className="w-4 h-4 text-primary-500" />
                      <span>Inquiring about product: <strong className="text-slate-800 dark:text-white">{(contextItem.itemId.name) || 'Marketplace Item'}</strong></span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 text-secondary-500" />
                      <span>Chatting about lost item: <strong className="text-slate-800 dark:text-white">{(contextItem.itemId.name) || 'Lost/Found Item'}</strong></span>
                    </>
                  )}
                </div>
                
                {contextItem.itemType === 'Product' ? (
                  <button 
                    onClick={() => navigate(`/marketplace?id=${contextItem.itemId._id || contextItem.itemId}`)}
                    className="text-[9px] rounded-xl font-bold px-3 py-1.5 flex items-center gap-0.5 btn-luxury"
                  >
                    View Listing <ChevronRight className="w-3 h-3" />
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate(`/lostfound?id=${contextItem.itemId._id || contextItem.itemId}`)}
                    className="text-[9px] rounded-xl font-bold px-3 py-1.5 flex items-center gap-0.5 btn-luxury"
                  >
                    View Listing <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Message Streams view */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 pr-3.5">
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-semibold">Loading chat history...</div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-2 font-medium">
                  <MessageSquare className="w-8 h-8 text-slate-350" />
                  <p>Send a message to start conversation with {activeRecipient.name}.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwnMessage = msg.sender.toString() === user.id.toString();
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="space-y-1 max-w-[70%]">
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-sm font-semibold border ${
                          isOwnMessage 
                            ? 'bg-luxury-gradient text-white rounded-tr-none border-white/10 shadow-primary-500/10' 
                            : 'bg-slate-100 dark:bg-dark-900 text-slate-800 dark:text-slate-150 rounded-tl-none border-slate-200/30 dark:border-white/5'
                        }`}>
                          {msg.content}
                        </div>
                        <div className={`text-[9px] text-slate-400 font-bold flex items-center gap-1.5 ${
                          isOwnMessage ? 'justify-end' : 'justify-start'
                        }`}>
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isOwnMessage && (
                            <CheckCheck className={`w-3.5 h-3.5 ${msg.read ? 'text-blue-500' : 'text-slate-350'}`} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200/35 dark:border-white/10 flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-slate-50 dark:bg-dark-900 border border-slate-200/40 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent-500/50 text-slate-800 dark:text-white"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-5 py-2.5 rounded-2xl btn-luxury disabled:opacity-50 flex items-center justify-center transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col justify-center items-center text-center p-8 text-slate-400 space-y-3">
            <MessageSquare className="w-12 h-12 text-slate-300 dark:text-dark-700" />
            <h3 className="font-bold text-sm">Messenger Inbox</h3>
            <p className="text-xs max-w-sm">Select a contact from the left list or open a listing detail card to initiate chat inquiries.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
