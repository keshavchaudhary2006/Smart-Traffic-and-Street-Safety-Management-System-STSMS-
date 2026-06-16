import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveEvents, setLiveEvents] = useState([]);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  useEffect(() => {
    // Connect to WebSocket backend
    const socketInstance = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketInstance.on('connect', () => {
      console.log(`⚡ Connected to STSMS Real-Time WebSocket Engine (ID: ${socketInstance.id})`);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('⚠️ WebSocket disconnected from STSMS server');
      setIsConnected(false);
    });

    // Global listener for new safety violations
    socketInstance.on('violation:new', (violation) => {
      console.log('📸 Real-time Violation received:', violation);
      setLiveEvents((prev) => [
        {
          id: violation._id || Date.now(),
          category: 'VIOLATION',
          title: `Violation: ${violation.type?.replace(/_/g, ' ')}`,
          severity: violation.severity || 'HIGH',
          location: violation.location?.address || 'Downtown Crosswalk',
          plate: violation.vehicle?.licensePlate || 'UNRECORDED',
          speed: violation.vehicle?.speedKmh ? `${violation.vehicle.speedKmh} km/h` : null,
          time: 'Just now',
          raw: violation,
        },
        ...prev.slice(0, 19),
      ]);
      setUnreadAlertsCount((c) => c + 1);
    });

    // Global listener for new roadway incidents / accidents
    socketInstance.on('incident:new', (incident) => {
      console.log('🚨 Real-time Incident received:', incident);
      setLiveEvents((prev) => [
        {
          id: incident._id || Date.now(),
          category: 'INCIDENT',
          title: incident.title || `Incident: ${incident.type?.replace(/_/g, ' ')}`,
          severity: incident.severity || 'CRITICAL',
          location: incident.location?.address || 'Expressway Corridor',
          plate: incident.involvedVehicles?.[0]?.licensePlate || 'Multiple Vehicles',
          description: incident.description,
          time: 'Just now',
          raw: incident,
        },
        ...prev.slice(0, 19),
      ]);
      setUnreadAlertsCount((c) => c + 1);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const clearUnread = () => setUnreadAlertsCount(0);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        liveEvents,
        unreadAlertsCount,
        clearUnread,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
