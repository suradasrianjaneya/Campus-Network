import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect to Socket.io server
    const socketInstance = io(SOCKET_URL, {
      auth: { token }
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    // Socket event listeners
    socketInstance.on('connect', () => {
      console.log('Connected to socket.io server');
    });

    socketInstance.on('online_users', (users) => {
      setOnlineUsers(users);
    });

    // Clean up connections on unmount or authentication state changes
    return () => {
      socketInstance.disconnect();
      setSocket(null);
    };
  }, [user, token]);

  const isUserOnline = (userId) => {
    if (!userId) return false;
    return onlineUsers.includes(userId.toString());
  };

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, isUserOnline, notifications, setNotifications, unreadCount, setUnreadCount }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
