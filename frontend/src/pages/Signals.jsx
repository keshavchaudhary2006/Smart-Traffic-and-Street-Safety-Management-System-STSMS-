import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  RotateCcw, 
  Flame, 
  Play, 
  Car, 
  Clock, 
  TrendingDown, 
  ShieldCheck, 
  Layers,
  ArrowRight,
  Gauge
} from 'lucide-react';
import api from '../services/api';
import IntersectionVisualizer from '../components/signals/IntersectionVisualizer';

const defaultDemoSignal = {
  _id: 'sig-001',
  name: 'Broadway & 5th Ave Smart Intersection',
  zone: 'Zone-A (Downtown Corridor)',
  mode: 'dynamic_ai',
  activePhase: 'NORTH_SOUTH',
  cycleCount: 142,
  approaches: {
    north: { state: 'GREEN', timer: 20, allocatedGreen: 20, density: 'LOW', vehicleCount: 8, pcu: 9, lanes: 2 },
    south: { state: 'GREEN', timer: 20, allocatedGreen: 20, density: 'LOW', vehicleCount: 11, pcu: 12, lanes: 2 },
    east: { state: 'RED', timer: 26, allocatedGreen: 20, density: 'LOW', vehicleCount: 5, pcu: 5.5, lanes: 2 },
    west: { state: 'RED', timer: 26, allocatedGreen: 20, density: 'LOW', vehicleCount: 6, pcu: 6, lanes: 2 },
  },
  emergency: { active: false, corridor: null, vehicleType: null },
  stats: { totalVehiclesCleared: 1420, congestionReductionPercent: 28.5, averageWaitReductionSeconds: 18.2 },
};

export const Signals = () => {
  const [signal, setSignal] = useState(defaultDemoSignal);
  const [autoCycle, setAutoCycle] = useState(true);
  const [loading, setLoading] = useState(false);
  const [surgeDir, setSurgeDir] = useState('north');
  const [surgeCount, setSurgeCount] = useState(35);
  const timerRef = useRef(null);

  // Fetch initial signal state
  const fetchSignal = async () => {
    try {
      const res = await api.get('/signals');
      if (res.data?.data?.signals?.[0]) {
        setSignal(res.data.data.signals[0]);
      }
    } catch (err) {
      console.warn('Using local signal simulation:', err.message);
    }
  };

  useEffect(() => {
    fetchSignal();
  }, []);

  // Real-time Countdown Timer Hook
  useEffect(() => {
    if (!autoCycle) return;

    const interval = setInterval(() => {
      setSignal((prev) => {
        if (!prev || prev.emergency?.active) return prev;

        const updated = { ...prev, approaches: { ...prev.approaches } };
        let shouldTransition = false;

        ['north', 'south', 'east', 'west'].forEach((dir) => {
          if (updated.approaches[dir]) {
            const current = updated.approaches[dir].timer;
            if (current > 1) {
              updated.approaches[dir] = { ...updated.approaches[dir], timer: current - 1 };
            } else {
              shouldTransition = true;
            }
          }
        });

        if (shouldTransition) {
          // Trigger backend or local phase transition
          handlePhaseTransition();
        }

        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoCycle, signal?.activePhase]);

  const handlePhaseTransition = async () => {
    try {
      const res = await api.post(`/signals/${signal._id}/transition`);
      if (res.data?.data?.signal) {
        setSignal(res.data.data.signal);
      }
    } catch (err) {
      // Local fallback phase switch
      setSignal((prev) => {
        const nextPhase = prev.activePhase === 'NORTH_SOUTH' ? 'EAST_WEST' : 'NORTH_SOUTH';
        const ewGreen = prev.approaches.east.density === 'CRITICAL' ? 90 : prev.approaches.east.density === 'HIGH' ? 65 : 40;
        const nsGreen = prev.approaches.north.density === 'CRITICAL' ? 90 : prev.approaches.north.density === 'HIGH' ? 65 : 25;

        return {
          ...prev,
          activePhase: nextPhase,
          cycleCount: prev.cycleCount + 1,
          approaches: {
            north: { ...prev.approaches.north, state: nextPhase === 'NORTH_SOUTH' ? 'GREEN' : 'RED', timer: nextPhase === 'NORTH_SOUTH' ? nsGreen : ewGreen + 6 },
            south: { ...prev.approaches.south, state: nextPhase === 'NORTH_SOUTH' ? 'GREEN' : 'RED', timer: nextPhase === 'NORTH_SOUTH' ? nsGreen : ewGreen + 6 },
            east: { ...prev.approaches.east, state: nextPhase === 'EAST_WEST' ? 'GREEN' : 'RED', timer: nextPhase === 'EAST_WEST' ? ewGreen : nsGreen + 6 },
            west: { ...prev.approaches.west, state: nextPhase === 'EAST_WEST' ? 'GREEN' : 'RED', timer: nextPhase === 'EAST_WEST' ? ewGreen : nsGreen + 6 },
          },
        };
      });
    }
  };

  const handleSurge = async (direction, count) => {
    setLoading(true);
    try {
      const res = await api.post(`/signals/${signal._id}/simulate`, {
        direction,
        vehicleCount: count,
      });
      if (res.data?.data?.signal) {
        setSignal(res.data.data.signal);
      }
    } catch (err) {
      // Local fallback
      setSignal((prev) => {
        const density = count >= 45 ? 'CRITICAL' : count >= 25 ? 'HIGH' : count >= 10 ? 'MEDIUM' : 'LOW';
        const green = count >= 45 ? 90 : count >= 25 ? 65 : count >= 10 ? 40 : 20;

        return {
          ...prev,
          approaches: {
            ...prev.approaches,
            [direction]: {
              ...prev.approaches[direction],
              vehicleCount: count,
              density,
              allocatedGreen: green,
              timer: prev.approaches[direction].state === 'GREEN' ? Math.max(prev.approaches[direction].timer, green) : prev.approaches[direction].timer,
            },
          },
        };
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmergency = async (corridor, vehicleType = 'Ambulance') => {
    try {
      const res = await api.patch(`/signals/${signal._id}/emergency`, { corridor, vehicleType });
      if (res.data?.data?.signal) {
        setSignal(res.data.data.signal);
      }
    } catch (err) {
      setSignal((prev) => ({
        ...prev,
        mode: 'emergency_override',
        emergency: { active: true, corridor, vehicleType },
        approaches: {
          north: { ...prev.approaches.north, state: corridor === 'north' ? 'GREEN' : 'RED', timer: 60 },
          south: { ...prev.approaches.south, state: corridor === 'south' ? 'GREEN' : 'RED', timer: 60 },
          east: { ...prev.approaches.east, state: corridor === 'east' ? 'GREEN' : 'RED', timer: 60 },
          west: { ...prev.approaches.west, state: corridor === 'west' ? 'GREEN' : 'RED', timer: 60 },
        },
      }));
    }
  };

  const handleResetEmergency = async () => {
    try {
      const res = await api.delete(`/signals/${signal._id}/emergency`);
      if (res.data?.data?.signal) {
        setSignal(res.data.data.signal);
      }
    } catch (err) {
      setSignal((prev) => ({
        ...prev,
        mode: 'dynamic_ai',
        emergency: { active: false, corridor: null, vehicleType: null },
      }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">
            Smart Traffic Signal Controller & 4-Way Simulation
          </h1>
          <p className="text-sm text-slate-400">
            Real-time density-driven green wave optimization (Webster's dynamic timing)
          </p>
        </div>

        {/* Global Auto-Cycle Toggle */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoCycle(!autoCycle)}
            className={`px-4 py-2 text-xs font-bold rounded-xl border flex items-center space-x-2 transition-all ${
              autoCycle
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${autoCycle ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>{autoCycle ? 'Live AI Auto-Cycling (Active)' : 'Simulation Paused'}</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-100">-28.5%</div>
            <div className="text-xs text-slate-400">Average Intersection Queue Delay</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-100">Dynamic (15s – 90s)</div>
            <div className="text-xs text-slate-400">Adaptive Green Duration Allocation</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-100">Emergency Wave</div>
            <div className="text-xs text-slate-400">Ambulance & Emergency Priority Ready</div>
          </div>
        </div>
      </div>

      {/* Main Intersection Visualizer */}
      <IntersectionVisualizer signal={signal} />

      {/* Interactive Simulation & Test Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Dynamic Traffic Surge Simulation */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center space-x-2.5">
            <Car className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">Inject Traffic Surge & Re-compute Green Split</h2>
          </div>
          <p className="text-xs text-slate-400">
            Select an approach corridor to inject a sudden vehicle queue and observe the AI dynamically scale green-light duration.
          </p>

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">Target Approach Corridor</label>
            <div className="grid grid-cols-4 gap-2">
              {['north', 'south', 'east', 'west'].map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => setSurgeDir(dir)}
                  className={`py-2 text-xs font-bold uppercase rounded-xl border transition-all ${
                    surgeDir === dir
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">Surge Density Preset</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSurge(surgeDir, 12)}
                className="py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-colors"
              >
                MEDIUM (12 veh → 40s)
              </button>
              <button
                type="button"
                onClick={() => handleSurge(surgeDir, 32)}
                className="py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-orange-400 transition-colors"
              >
                HIGH (32 veh → 65s)
              </button>
              <button
                type="button"
                onClick={() => handleSurge(surgeDir, 52)}
                className="py-2.5 bg-slate-950 hover:bg-slate-800 border border-rose-500/30 rounded-xl text-xs font-semibold text-rose-400 transition-colors"
              >
                CRITICAL (52 veh → 90s)
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePhaseTransition}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center space-x-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Force Immediate Phase Switch</span>
            </button>
          </div>
        </div>

        {/* Right Card: Emergency Corridor Override & Math Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center space-x-2.5">
            <Flame className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-bold text-slate-100">Emergency Green-Wave Corridor Override</h2>
          </div>
          <p className="text-xs text-slate-400">
            Instantly turn all opposing lights RED and grant an immediate 60-second GREEN corridor for emergency transit.
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => handleEmergency('north', 'Ambulance')}
              className="p-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold text-left transition-colors flex items-center justify-between"
            >
              <span>🚨 North Ambulance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleEmergency('south', 'Ambulance')}
              className="p-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold text-left transition-colors flex items-center justify-between"
            >
              <span>🚨 South Ambulance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleEmergency('east', 'Fire Engine')}
              className="p-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold text-left transition-colors flex items-center justify-between"
            >
              <span>🚒 East Fire Engine</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleEmergency('west', 'Police Rapid')}
              className="p-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold text-left transition-colors flex items-center justify-between"
            >
              <span>🚓 West Police Unit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {signal.emergency?.active && (
            <button
              onClick={handleResetEmergency}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 transition-all"
            >
              Dismiss Emergency Override & Resume Dynamic AI
            </button>
          )}

          {/* Mathematical Density Matrix Table */}
          <div className="pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Mathematical Density & Split Formulation Matrix
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="text-emerald-400 font-bold block">LOW (&lt;10 PCU)</span>
                <span className="text-slate-400 font-mono">20s Green</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="text-amber-400 font-bold block">MEDIUM (10-25)</span>
                <span className="text-slate-400 font-mono">40s Green</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="text-orange-400 font-bold block">HIGH (25-45)</span>
                <span className="text-slate-400 font-mono">65s Green</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-rose-500/30">
                <span className="text-rose-400 font-bold block">CRITICAL (&ge;45)</span>
                <span className="text-slate-400 font-mono">90s Green</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signals;
