import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Car,
  TrendingUp,
  ShieldAlert,
  Clock,
  Gauge,
  Calendar,
  Layers,
  Award,
  DollarSign,
  Compass,
} from 'lucide-react';

// Color definitions for charts
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f43f5e', '#8b5cf6'];

// 1. Multimodal Transport Category Distribution
const vehicleDistributionData = [
  { name: 'Passenger Cars', value: 62, count: '88,590' },
  { name: 'Motorcycles', value: 18, count: '25,720' },
  { name: 'Buses / Public Transit', value: 8, count: '11,430' },
  { name: 'Commercial Trucks', value: 7, count: '10,000' },
  { name: 'Bicycles & Micromobility', value: 5, count: '7,150' },
];

// 2. 24-Hour Hourly Throughput & Corridor Speed
const hourlyTrendData = [
  { hour: '00:00', volume: 850, speed: 68 },
  { hour: '02:00', volume: 420, speed: 72 },
  { hour: '04:00', volume: 610, speed: 70 },
  { hour: '06:00', volume: 2400, speed: 58 },
  { hour: '08:00', volume: 6800, speed: 26 }, // Peak morning rush
  { hour: '10:00', volume: 4900, speed: 42 },
  { hour: '12:00', volume: 4200, speed: 48 },
  { hour: '14:00', volume: 4600, speed: 45 },
  { hour: '16:00', volume: 6200, speed: 32 },
  { hour: '18:00', volume: 7400, speed: 22 }, // Peak evening rush
  { hour: '20:00', volume: 3800, speed: 52 },
  { hour: '22:00', volume: 1900, speed: 64 },
];

// 3. Incident Breakdown by Category & Severity
const incidentSeverityData = [
  { type: 'Red Light Jump', LOW: 4, MEDIUM: 12, HIGH: 18, CRITICAL: 4 },
  { type: 'Speeding Infraction', LOW: 8, MEDIUM: 22, HIGH: 14, CRITICAL: 6 },
  { type: 'Wrong-Way Entry', LOW: 1, MEDIUM: 3, HIGH: 8, CRITICAL: 12 },
  { type: 'Vehicle Collision', LOW: 0, MEDIUM: 2, HIGH: 6, CRITICAL: 5 },
  { type: 'Bus Lane Intrusion', LOW: 14, MEDIUM: 18, HIGH: 4, CRITICAL: 0 },
];

// 4. Corridor Wait Times & Queue Delay
const corridorDelayData = [
  { corridor: 'Broadway Arterial', dynamicDelay: 18, fixedDelay: 42 },
  { corridor: 'Highway-101 North', dynamicDelay: 8, fixedDelay: 24 },
  { corridor: 'Metro Plaza Crossing', dynamicDelay: 22, fixedDelay: 55 },
  { corridor: 'Harbor Bridge Approach', dynamicDelay: 14, fixedDelay: 36 },
  { corridor: 'Westside Connector', dynamicDelay: 10, fixedDelay: 28 },
];

export const Analytics = () => {
  const [timeRange, setTimeRange] = useState('24h');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">
            Traffic Intelligence & City Safety Analytics
          </h1>
          <p className="text-sm text-slate-400">
            Multimodal volume telemetry, corridor congestion heatmaps, and incident severity metrics
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          {['24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-colors ${
                timeRange === range
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {range === '24h' ? 'Last 24 Hours' : range === '7d' ? 'Last 7 Days' : 'Monthly'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Vehicles Analyzed</span>
            <Car className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-100 mt-3">142,890</div>
          <span className="text-[11px] text-emerald-400 font-semibold">+12.4% vs last cycle</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-blue-400">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Corridor Speed</span>
            <Gauge className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-100 mt-3">46.2 km/h</div>
          <span className="text-[11px] text-slate-400">Green wave active</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Incident Clear Time</span>
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-100 mt-3">14.2 mins</div>
          <span className="text-[11px] text-emerald-400 font-semibold">-4.6 mins faster</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Citation Fines Issued</span>
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-100 mt-3">$14,850</div>
          <span className="text-[11px] text-slate-400">92 violations confirmed</span>
        </div>
      </div>

      {/* Row 1: Volume & Speed Area Chart + Vehicle Distribution Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 24h Hourly Trend Area & Line Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100">Hourly Throughput vs. Corridor Speed</h2>
              <p className="text-xs text-slate-400">Correlation between traffic surge volume and average corridor velocity</p>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Volume (veh/hr)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-400" /> Speed (km/h)</span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyTrendData}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                <YAxis yAxisId="left" stroke="#10b981" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={11} domain={[0, 90]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Area yAxisId="left" type="monotone" dataKey="volume" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVolume)" name="Vehicle Volume" />
                <Line yAxisId="right" type="monotone" dataKey="speed" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} name="Corridor Speed (km/h)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Vehicle Classification Donut */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100">Vehicle Type Breakdown</h2>
            <p className="text-xs text-slate-400">Multimodal split classified by YOLO model</p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehicleDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {vehicleDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            {vehicleDistributionData.map((v, i) => (
              <div key={v.name} className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {v.name}
                </span>
                <span className="font-bold font-mono">{v.value}% ({v.count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Incident Severity Stacked Bar + Dynamic vs Fixed Wait Delay Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Incident Severity Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100">Incident Classification & Severities</h2>
              <p className="text-xs text-slate-400">Total detected infractions grouped by hazard severity</p>
            </div>
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="text-emerald-400">● Low</span>
              <span className="text-amber-400">● Med</span>
              <span className="text-orange-400">● High</span>
              <span className="text-rose-400">● Crit</span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incidentSeverityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="type" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey="LOW" stackId="a" fill="#10b981" />
                <Bar dataKey="MEDIUM" stackId="a" fill="#f59e0b" />
                <Bar dataKey="HIGH" stackId="a" fill="#f97316" />
                <Bar dataKey="CRITICAL" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Dynamic AI vs Traditional Fixed Signal Delay */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100">Dynamic AI vs. Fixed Timer Delay (Seconds)</h2>
              <p className="text-xs text-slate-400">Average intersection vehicle waiting queue reduction</p>
            </div>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
              -48% Avg Delay
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={corridorDelayData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={11} unit="s" />
                <YAxis dataKey="corridor" type="category" stroke="#64748b" fontSize={10} width={130} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="dynamicDelay" name="Dynamic AI Signal Delay" fill="#10b981" radius={[0, 4, 4, 0]} />
                <Bar dataKey="fixedDelay" name="Fixed 30s Traditional Delay" fill="#475569" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
