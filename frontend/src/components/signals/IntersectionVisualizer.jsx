import React from 'react';
import { Shield, AlertTriangle, Zap, Compass, Car, Flame } from 'lucide-react';

const DENSITY_BADGES = {
  LOW: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  MEDIUM: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  HIGH: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  CRITICAL: 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse',
};

/**
 * Single 3-aspect Traffic Signal Head Component
 */
const TrafficLightHead = ({ direction, title, approach, isEmergency }) => {
  const state = approach?.state || 'RED';
  const timer = approach?.timer ?? 20;
  const density = approach?.density || 'LOW';
  const vehicleCount = approach?.vehicleCount ?? 0;
  const allocatedGreen = approach?.allocatedGreen ?? 20;

  return (
    <div className={`bg-slate-900/95 border ${isEmergency ? 'border-amber-500/70 shadow-lg shadow-amber-500/20' : 'border-slate-800'} rounded-2xl p-4 flex flex-col items-center space-y-3 w-48 shadow-xl relative backdrop-blur-md`}>
      {/* Direction & Density Badge */}
      <div className="w-full flex items-center justify-between text-xs">
        <span className="font-bold text-slate-200 uppercase tracking-wider">{title}</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${DENSITY_BADGES[density]}`}>
          {density}
        </span>
      </div>

      {/* Traffic Light Shell */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-2.5 flex space-x-2.5 items-center justify-center shadow-inner">
        {/* RED LIGHT */}
        <div
          className={`w-6 h-6 rounded-full transition-all duration-300 ${
            state === 'RED'
              ? 'bg-rose-500 shadow-[0_0_16px_rgba(244,63,94,0.9)] ring-2 ring-rose-400/50'
              : 'bg-rose-950/40 border border-rose-900/30'
          }`}
        />
        {/* YELLOW LIGHT */}
        <div
          className={`w-6 h-6 rounded-full transition-all duration-300 ${
            state === 'YELLOW'
              ? 'bg-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.9)] ring-2 ring-amber-300/50'
              : 'bg-amber-950/40 border border-amber-900/30'
          }`}
        />
        {/* GREEN LIGHT */}
        <div
          className={`w-6 h-6 rounded-full transition-all duration-300 ${
            state === 'GREEN'
              ? 'bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)] ring-2 ring-emerald-300/50'
              : 'bg-emerald-950/40 border border-emerald-900/30'
          }`}
        />
      </div>

      {/* Countdown Timer Display */}
      <div className="flex flex-col items-center">
        <div className={`font-mono text-2xl font-black ${
          state === 'GREEN' ? 'text-emerald-400' : state === 'YELLOW' ? 'text-amber-400' : 'text-rose-400'
        }`}>
          {timer}<span className="text-xs font-normal ml-0.5">s</span>
        </div>
        <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
          {state} Phase
        </span>
      </div>

      {/* Approach Telemetry */}
      <div className="w-full pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-1 text-[11px] text-center">
        <div>
          <span className="text-slate-400 block text-[9px] uppercase">Queue</span>
          <span className="font-bold text-slate-200">{vehicleCount} veh</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[9px] uppercase">AI Split</span>
          <span className="font-bold text-emerald-400">{allocatedGreen}s</span>
        </div>
      </div>
    </div>
  );
};

export const IntersectionVisualizer = ({ signal }) => {
  if (!signal) return null;

  const { approaches, activePhase, emergency, name, zone } = signal;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      {/* Background Intersection Roadway Grid Mock */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-32 h-full bg-slate-800 border-x-2 border-dashed border-slate-700/60" />
          <div className="h-32 w-full bg-slate-800 border-y-2 border-dashed border-slate-700/60 absolute" />
        </div>
      </div>

      {/* Emergency Priority Alert Banner */}
      {emergency?.active && (
        <div className="mb-6 bg-rose-500/20 border border-rose-500/40 rounded-2xl p-3.5 flex items-center justify-between text-rose-300 animate-pulse relative z-10">
          <div className="flex items-center space-x-2.5">
            <Flame className="w-5 h-5 text-rose-400" />
            <span className="font-bold text-sm">
              EMERGENCY GREEN-WAVE PRIORITY ACTIVE: {emergency.corridor?.toUpperCase()} CORRIDOR CLEARED
            </span>
          </div>
          <span className="text-xs bg-rose-500/40 px-2.5 py-1 rounded-lg font-mono font-bold text-white">
            {emergency.vehicleType || 'Emergency Vehicle'} Priority
          </span>
        </div>
      )}

      {/* 4-Way Crossroad Visual Layout */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-4 my-2">
        {/* NORTH APPROACH */}
        <div className="flex justify-center">
          <TrafficLightHead
            direction="north"
            title="⬆ North Approach"
            approach={approaches?.north}
            isEmergency={emergency?.active && emergency.corridor === 'north'}
          />
        </div>

        {/* MIDDLE ROW: WEST + CENTER HUB + EAST */}
        <div className="flex items-center justify-between w-full max-w-4xl gap-4">
          {/* WEST APPROACH */}
          <TrafficLightHead
            direction="west"
            title="⬅ West Approach"
            approach={approaches?.west}
            isEmergency={emergency?.active && emergency.corridor === 'west'}
          />

          {/* CENTER INTERSECTION HUB */}
          <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-5 shadow-2xl flex flex-col items-center text-center space-y-3 max-w-xs flex-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-950/60">
              <Zap className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="text-xs font-mono font-semibold text-emerald-400">
                ACTIVE PHASE
              </div>
              <div className="text-sm font-extrabold text-slate-100 tracking-tight">
                {activePhase === 'NORTH_SOUTH' ? 'NORTH ⇄ SOUTH' : 'EAST ⇄ WEST'} CORRIDOR
              </div>
            </div>

            <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-[11px] space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Controller Mode:</span>
                <span className="font-bold text-emerald-400 uppercase">{signal.mode || 'dynamic_ai'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Cycle Number:</span>
                <span className="font-mono text-slate-200">#{signal.cycleCount || 0}</span>
              </div>
            </div>
          </div>

          {/* EAST APPROACH */}
          <TrafficLightHead
            direction="east"
            title="➡ East Approach"
            approach={approaches?.east}
            isEmergency={emergency?.active && emergency.corridor === 'east'}
          />
        </div>

        {/* SOUTH APPROACH */}
        <div className="flex justify-center">
          <TrafficLightHead
            direction="south"
            title="⬇ South Approach"
            approach={approaches?.south}
            isEmergency={emergency?.active && emergency.corridor === 'south'}
          />
        </div>
      </div>
    </div>
  );
};

export default IntersectionVisualizer;
