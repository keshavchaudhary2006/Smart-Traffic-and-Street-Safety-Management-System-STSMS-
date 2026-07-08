import React from 'react';
import { MapPin, ShieldAlert, Camera, Compass, Radio } from 'lucide-react';
import TrafficMap from '../components/map/TrafficMap';

export const MapPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">
              Interactive Geospatial Traffic Map
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Radio className="w-3 h-3 mr-1 animate-pulse" />
              GIS Telemetry Live
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time OpenStreetMap overlay of roadside cameras, active road hazards, smart signals, and congested corridors
          </p>
        </div>
      </div>

      {/* Main Map Visualizer */}
      <TrafficMap />

      {/* Bottom Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-100">48 / 50 Nodes</div>
            <div className="text-xs text-slate-400">Surveillance GIS Coverage (96%)</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-100">2 Active Hazards</div>
            <div className="text-xs text-slate-400">1 Critical Collision, 1 Breakdown</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-100">Broadway Corridor</div>
            <div className="text-xs text-slate-400">Peak Density Bottleneck (88%)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
