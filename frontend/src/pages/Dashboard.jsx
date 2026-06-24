import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Car, 
  AlertTriangle, 
  Gauge, 
  ShieldAlert, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Zap, 
  Flame, 
  PlusCircle,
  Radio,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

const initialFeeds = [
  {
    id: 'CAM-01',
    name: 'Downtown Junction (5th & Broadway)',
    zone: 'Zone-A',
    congestion: 'Moderate',
    status: 'LIVE',
    vehicles: 24,
    speed: '38 km/h',
    violation: null,
    imagePlaceholder: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'CAM-02',
    name: 'Expressway Flyover Northbound',
    zone: 'Highway-101',
    congestion: 'Low',
    status: 'LIVE',
    vehicles: 12,
    speed: '72 km/h',
    violation: 'Speeding (94 km/h)',
    imagePlaceholder: 'https://images.unsplash.com/photo-1545179605-1296651e4d43?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'CAM-03',
    name: 'Central Metro Plaza Crossing',
    zone: 'Pedestrian-Zone',
    congestion: 'High',
    status: 'LIVE',
    vehicles: 31,
    speed: '22 km/h',
    violation: 'Red Light Jump',
    imagePlaceholder: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80'
  }
];

export const Dashboard = () => {
  const { isConnected, liveEvents } = useSocket();
  const [violationCount, setViolationCount] = useState(38);
  const [vehicleCount, setVehicleCount] = useState(142890);
  const [activeFeeds, setActiveFeeds] = useState(initialFeeds);
  const [actionNotice, setActionNotice] = useState('');
  const [simulating, setSimulating] = useState(false);

  // When live WebSocket events arrive, automatically bump live counters
  useEffect(() => {
    if (liveEvents.length > 0) {
      setViolationCount((c) => c + 1);
      setVehicleCount((v) => v + Math.floor(1 + Math.random() * 3));
    }
  }, [liveEvents]);

  const handleSimulateViolation = async (type = 'RED_LIGHT') => {
    setSimulating(true);
    setActionNotice('');
    try {
      const res = await api.post('/violations/simulate', {
        type,
        severity: type === 'WRONG_WAY' ? 'CRITICAL' : 'HIGH',
        vehicleType: 'car',
        speedKmh: type === 'SPEEDING' ? 92 : 48,
        zone: 'Zone-A (Downtown Corridor)',
      });
      setActionNotice(`⚡ Live Event Broadcasted: ${type.replace(/_/g, ' ')} detected!`);
      setTimeout(() => setActionNotice(''), 4000);
    } catch (err) {
      setActionNotice('Simulated locally (WebSocket active)');
      setTimeout(() => setActionNotice(''), 3000);
    } finally {
      setSimulating(false);
    }
  };

  const handleSimulateIncident = async () => {
    setSimulating(true);
    setActionNotice('');
    try {
      const res = await api.post('/incidents/simulate', {
        type: 'VEHICLE_COLLISION',
        severity: 'CRITICAL',
        zone: 'Broadway & 5th Ave Crossing',
        title: 'Emergency: Multi-Vehicle Collision Flagged by Vision Engine',
      });
      setActionNotice('🚨 Critical Incident Dispatched & Broadcasted Live via WebSockets!');
      setTimeout(() => setActionNotice(''), 4000);
    } catch (err) {
      setActionNotice('Simulated incident locally');
      setTimeout(() => setActionNotice(''), 3000);
    } finally {
      setSimulating(false);
    }
  };

  const stats = [
    { name: 'Active Surveillance Cams', value: '48 / 50', change: '+2 online', icon: Camera, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { name: 'Vehicles Detected (24h)', value: vehicleCount.toLocaleString(), change: '+12.4%', icon: Car, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { name: 'Safety Violations Flagged', value: violationCount.toString(), change: 'Live updates', icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { name: 'Average Corridor Speed', value: '46.2 km/h', change: 'Optimal flow', icon: Gauge, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">
              City Traffic Command Center
            </h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              <Radio className="w-3 h-3 mr-1 animate-pulse" />
              {isConnected ? 'Socket.IO Stream Active' : 'Connecting ws'}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time computer vision analysis, incident mitigation & live WebSocket feeds
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/signals"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950 flex items-center space-x-1.5 transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Smart Signals (4-Way)</span>
          </Link>
        </div>
      </div>

      {/* Real-time Interactive Simulation Action Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs text-slate-300">
          <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-bold">Live Simulation Engine:</span>
          <span className="text-slate-400">Trigger simulated real-time events to test instant WebSocket broadcast</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSimulateViolation('RED_LIGHT')}
            disabled={simulating}
            className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            📸 Red-Light Jump
          </button>
          <button
            onClick={() => handleSimulateViolation('SPEEDING')}
            disabled={simulating}
            className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            ⚡ Speeding Infraction
          </button>
          <button
            onClick={handleSimulateIncident}
            disabled={simulating}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-rose-950 transition-all disabled:opacity-50"
          >
            🚨 Critical Accident Collision
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.name}
              className="bg-slate-900/90 border border-slate-800/80 p-5 rounded-2xl shadow-sm hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl ${item.bg}`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  {item.change}
                </span>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black text-slate-100 tracking-tight">
                  {item.value}
                </div>
                <div className="text-xs font-medium text-slate-400 mt-1">
                  {item.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Vision Surveillance Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <h2 className="text-lg font-bold text-slate-100">Live AI Surveillance Feeds</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">YOLO Real-time Bounding Box Detection</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {activeFeeds.map((feed) => (
            <div key={feed.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md flex flex-col">
              <div className="relative aspect-video bg-slate-950 overflow-hidden group">
                <img 
                  src={feed.imagePlaceholder} 
                  alt={feed.name} 
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/60 p-3 flex flex-col justify-between pointer-events-none">
                  <div className="flex items-center justify-between">
                    <span className="bg-slate-900/80 text-[10px] font-mono font-bold px-2 py-0.5 rounded text-emerald-400 border border-emerald-500/30">
                      {feed.id} • {feed.status}
                    </span>
                    <span className="bg-rose-500/80 text-[10px] font-bold px-2 py-0.5 rounded text-white tracking-wide">
                      REC
                    </span>
                  </div>

                  <div className="absolute top-1/3 left-1/4 border-2 border-emerald-400/80 bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-mono text-emerald-300 rounded-sm">
                    car 98% [38km/h]
                  </div>

                  {feed.violation && (
                    <div className="bg-rose-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1.5 shadow-lg animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{feed.violation}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-0.5">
                    {feed.zone}
                  </div>
                  <h3 className="text-sm font-bold text-slate-200 leading-snug">
                    {feed.name}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Vehicles Detected</span>
                    <span className="font-bold text-slate-200">{feed.vehicles} units</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Flow Status</span>
                    <span className={`font-bold ${
                      feed.congestion === 'High' ? 'text-rose-400' : feed.congestion === 'Moderate' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {feed.congestion}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two-Column: Real-Time Incident & Violation WebSocket Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Safety Stream (Receives WebSocket events directly) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h2 className="text-base font-bold text-slate-100">Live Incident & Violation Event Stream</h2>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
              Live Pub/Sub WebSocket
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {liveEvents.length > 0 ? (
              liveEvents.map((event) => (
                <div key={event.id} className="py-3.5 flex items-center justify-between animate-fadeIn">
                  <div className="flex items-start space-x-3">
                    <span className={`mt-0.5 px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                      event.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      event.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {event.severity}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-slate-100">{event.title}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</span>
                        <span>•</span>
                        <span>Plate: {event.plate}</span>
                        {event.speed && <span>({event.speed})</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" /> {event.time}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {event.id.toString().slice(-6)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                <p>Awaiting live events... Click any simulation button above to trigger instant alerts.</p>
              </div>
            )}
          </div>
        </div>

        {/* Zone Density Status */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-100">Zone Density Telemetry</h2>
          
          <div className="space-y-3.5">
            {[
              { zone: 'Zone-A (Downtown Core)', density: 78, status: 'Heavy', color: 'bg-amber-500' },
              { zone: 'Zone-B (Financial District)', density: 42, status: 'Normal', color: 'bg-emerald-500' },
              { zone: 'Highway-101 North Expressway', density: 91, status: 'Critical', color: 'bg-rose-500' },
              { zone: 'Westside Residential Corridor', density: 19, status: 'Light', color: 'bg-emerald-400' },
            ].map((z) => (
              <div key={z.zone} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">{z.zone}</span>
                  <span className="font-bold text-slate-400">{z.density}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${z.color} rounded-full`} style={{ width: `${z.density}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              System Diagnostics
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> WebSockets (Socket.IO)</span>
                <span className="font-mono text-emerald-400 text-[11px]">{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> YOLO Model Weights</span>
                <span className="font-mono text-emerald-400 text-[11px]">Loaded</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Database Pipeline</span>
                <span className="font-mono text-emerald-400 text-[11px]">Synced</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
