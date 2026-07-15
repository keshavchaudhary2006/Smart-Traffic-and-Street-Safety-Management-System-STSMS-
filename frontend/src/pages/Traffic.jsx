import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Car, 
  TrendingUp, 
  ShieldAlert, 
  Clock, 
  Filter, 
  Calendar,
  AlertCircle,
  Bike,
  Users,
  Compass
} from 'lucide-react';
import api from '../services/api';

const mockHourlyFlow = [
  { time: '06:00', volume: 1200, speed: 52 },
  { time: '08:00', volume: 4800, speed: 28 },
  { time: '10:00', volume: 3400, speed: 38 },
  { time: '12:00', volume: 2900, speed: 44 },
  { time: '14:00', volume: 3100, speed: 42 },
  { time: '16:00', volume: 4200, speed: 32 },
  { time: '18:00', volume: 5600, speed: 22 },
  { time: '20:00', volume: 2400, speed: 48 },
];

const mockTrafficRecords = [
  { _id: 'TR-1', camera: { name: 'Downtown Junction', location: { zone: 'Zone-A' } }, timestamp: '10 mins ago', vehicleCount: 42, pedestrianCount: 18, bicycleCount: 4, congestionLevel: 'moderate', averageSpeed: 36, violations: [{ type: 'Wrong Lane' }] },
  { _id: 'TR-2', camera: { name: 'Highway 101 North', location: { zone: 'Highway-101' } }, timestamp: '14 mins ago', vehicleCount: 88, pedestrianCount: 0, bicycleCount: 0, congestionLevel: 'low', averageSpeed: 74, violations: [{ type: 'Speeding' }] },
  { _id: 'TR-3', camera: { name: 'Metro Plaza Crossing', location: { zone: 'Pedestrian-Zone' } }, timestamp: '20 mins ago', vehicleCount: 22, pedestrianCount: 45, bicycleCount: 9, congestionLevel: 'high', averageSpeed: 18, violations: [] },
  { _id: 'TR-4', camera: { name: 'Harbor Bridge Approach', location: { zone: 'Harbor-District' } }, timestamp: '28 mins ago', vehicleCount: 65, pedestrianCount: 2, bicycleCount: 1, congestionLevel: 'moderate', averageSpeed: 40, violations: [] },
];

export const Traffic = () => {
  const [records, setRecords] = useState(mockTrafficRecords);
  const [stats, setStats] = useState({
    totalVehicles: '128,450',
    totalPedestrians: '34,120',
    totalBicycles: '6,490',
    avgSpeed: '42.8 km/h',
  });
  const [congestionFilter, setCongestionFilter] = useState('all');

  useEffect(() => {
    const fetchTraffic = async () => {
      try {
        const [recordsRes, statsRes] = await Promise.all([
          api.get('/traffic'),
          api.get('/traffic/stats?hours=24'),
        ]);
        if (recordsRes.data?.data?.records?.length > 0) {
          setRecords(recordsRes.data.data.records);
        }
        if (statsRes.data?.data?.summary) {
          const s = statsRes.data.data.summary;
          setStats({
            totalVehicles: s.totalVehicles.toLocaleString(),
            totalPedestrians: s.totalPedestrians.toLocaleString(),
            totalBicycles: s.totalBicycles.toLocaleString(),
            avgSpeed: `${Math.round(s.avgSpeed || 42)} km/h`,
          });
        }
      } catch (err) {
        console.warn('Using demo traffic dataset:', err.message);
      }
    };
    fetchTraffic();
  }, []);

  const filteredRecords = records.filter((r) => 
    congestionFilter === 'all' || r.congestionLevel === congestionFilter
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">
          Traffic Analytics & Flow Intelligence
        </h1>
        <p className="text-sm text-slate-400">
          Aggregated multimodal transport metrics and real-time corridor congestion
        </p>
      </div>

      {/* Multimodal Transport Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-blue-400">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Automobiles</span>
            <Car className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-100 mt-3">{stats.totalVehicles}</div>
          <span className="text-[11px] text-emerald-400 font-semibold">+8% from peak hours</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pedestrians Tracked</span>
            <Users className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-100 mt-3">{stats.totalPedestrians}</div>
          <span className="text-[11px] text-slate-400">Crosswalk safety normal</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bicycles & Micromobility</span>
            <Bike className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-100 mt-3">{stats.totalBicycles}</div>
          <span className="text-[11px] text-amber-400 font-semibold">+14% bike lane usage</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg City Speed</span>
            <Compass className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-100 mt-3">{stats.avgSpeed}</div>
          <span className="text-[11px] text-emerald-400 font-semibold">Green wave active</span>
        </div>
      </div>

      {/* Hourly Flow Chart Representation */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100">Hourly Traffic Volume Distribution</h2>
            <p className="text-xs text-slate-400">Recorded throughput along primary arterial roads</p>
          </div>
          <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-3 py-1 rounded-lg">Today</span>
        </div>

        {/* Visual Bar Graph */}
        <div className="pt-6 grid grid-cols-8 gap-2 items-end h-48 border-b border-slate-800 pb-3">
          {mockHourlyFlow.map((slot) => {
            const heightPercent = Math.round((slot.volume / 6000) * 100);
            return (
              <div key={slot.time} className="flex flex-col items-center space-y-2 h-full justify-end group">
                <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {slot.volume}
                </div>
                <div 
                  className={`w-full max-w-[40px] rounded-t-lg transition-all group-hover:brightness-125 ${
                    heightPercent > 75 ? 'bg-rose-500' : heightPercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[10px] font-semibold text-slate-400">{slot.time}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Normal Flow</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Moderate Density</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Peak Rush Congestion</span>
          </div>
          <span>Max Capacity: 6,000 veh/hr</span>
        </div>
      </div>

      {/* Traffic Observation Timeline Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-100">Live Traffic Observation Feed</h2>
            <p className="text-xs text-slate-400">Discrete AI inferences ingested from active roadside cameras</p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Congestion:</span>
            {['all', 'low', 'moderate', 'high'].map((c) => (
              <button
                key={c}
                onClick={() => setCongestionFilter(c)}
                className={`px-2.5 py-1 rounded-lg uppercase font-bold text-[10px] transition-colors ${
                  congestionFilter === c
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-3">Camera / Node</th>
                <th className="py-3 px-3">Zone</th>
                <th className="py-3 px-3">Vehicles</th>
                <th className="py-3 px-3">Pedestrians</th>
                <th className="py-3 px-3">Avg Speed</th>
                <th className="py-3 px-3">Congestion</th>
                <th className="py-3 px-3 text-right">Violations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredRecords.map((rec) => (
                <tr key={rec._id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3.5 px-3 font-semibold text-slate-100">
                    {rec.camera?.name || 'Street Sensor Unit'}
                    <span className="block text-[10px] text-slate-400 font-normal">{rec.timestamp}</span>
                  </td>
                  <td className="py-3.5 px-3 text-emerald-400 font-medium">
                    {rec.camera?.location?.zone || 'Zone-A'}
                  </td>
                  <td className="py-3.5 px-3 font-bold text-slate-200">
                    {rec.vehicleCount}
                  </td>
                  <td className="py-3.5 px-3 text-slate-300">
                    {rec.pedestrianCount}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-slate-300">
                    {rec.averageSpeed} km/h
                  </td>
                  <td className="py-3.5 px-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      rec.congestionLevel === 'high' ? 'bg-rose-500/20 text-rose-400' :
                      rec.congestionLevel === 'moderate' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {rec.congestionLevel}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    {rec.violations?.length > 0 ? (
                      <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30">
                        {rec.violations.map(v => v.type).join(', ')}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">— None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Traffic;
