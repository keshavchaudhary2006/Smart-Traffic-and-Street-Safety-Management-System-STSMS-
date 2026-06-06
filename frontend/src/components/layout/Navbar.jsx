import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Bell, Shield, LogOut, Wifi, WifiOff } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { isConnected, unreadAlertsCount, clearUnread } = useSocket();

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: System Live Status & WebSocket Connection indicator */}
      <div className="flex items-center space-x-3">
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${
          isConnected
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
        }`}>
          <span className="relative flex h-2 w-2">
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider">
            {isConnected ? 'Socket.IO Live' : 'Connecting ws...'}
          </span>
        </div>
        <span className="text-slate-400 text-xs hidden md:inline-block">
          AI Vision & Traffic Hub: Connected
        </span>
      </div>

      {/* Right: Notifications & User Profile */}
      <div className="flex items-center space-x-4">
        {/* Notifications with Live Real-Time Counter */}
        <button 
          onClick={clearUnread}
          title="Live Incident & Violation Alerts"
          className="relative p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-lg shadow-rose-950 animate-bounce">
              {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-800" />

        {/* User Card */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-950/50 text-sm">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-semibold text-slate-200 leading-tight">
              {user?.name || 'Operator'}
            </div>
            <div className="text-xs text-emerald-400 font-medium capitalize flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {user?.role || 'user'}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Sign out"
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
