import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('stsms_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('stsms_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.data?.user) {
            setUser(res.data.data.user);
            localStorage.setItem('stsms_user', JSON.stringify(res.data.data.user));
          }
        } catch (err) {
          console.error('Session expired or invalid token:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = res.data.data;
    
    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('stsms_token', receivedToken);
    localStorage.setItem('stsms_user', JSON.stringify(receivedUser));
    return receivedUser;
  };

  const register = async (name, email, password, role = 'user') => {
    const res = await api.post('/auth/register', { name, email, password, role });
    const { token: receivedToken, user: receivedUser } = res.data.data;
    
    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('stsms_token', receivedToken);
    localStorage.setItem('stsms_user', JSON.stringify(receivedUser));
    return receivedUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('stsms_token');
    localStorage.removeItem('stsms_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
