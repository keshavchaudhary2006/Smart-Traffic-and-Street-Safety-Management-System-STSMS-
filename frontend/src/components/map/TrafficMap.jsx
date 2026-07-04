import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Camera, AlertTriangle, Zap, Flame, Filter, Eye, ShieldAlert } from 'lucide-react';

// Fix default marker icon asset paths for Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom HTML DivIcons for rich UI markers
const createCustomIcon = (bgClass, borderClass, iconSvg) => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div class="w-8 h-8 rounded-full ${bgClass} border-2 ${borderClass} flex items-center justify-center text-white shadow-lg shadow-black/60 transition-transform hover:scale-110">${iconSvg}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const cameraIcon = createCustomIcon(
  'bg-emerald-600',
  'border-emerald-300',
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`
);

const incidentCriticalIcon = createCustomIcon(
  'bg-rose-600 animate-pulse',
  'border-rose-300 ring-4 ring-rose-500/40',
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
);

const incidentMediumIcon = createCustomIcon(
  'bg-amber-600',
  'border-amber-300',
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
);

const signalIcon = createCustomIcon(
  'bg-blue-600',
  'border-blue-300',
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
);

// Sample Geo-located Map Data (New York Metro Grid coordinates for demo)
const mockCameras = [
  { id: 'cam-1', name: 'Downtown Junction (5th & Broadway)', lat: 40.7128, lng: -74.0060, zone: 'Zone-A', status: 'active', resolution: '4K', vehicles: 24 },
  { id: 'cam-2', name: 'Expressway Flyover Northbound', lat: 40.7282, lng: -73.9942, zone: 'Highway-101', status: 'active', resolution: '1080p', vehicles: 14 },
  { id: 'cam-3', name: 'Central Metro Plaza Crossing', lat: 40.7061, lng: -74.0092, zone: 'Pedestrian-Zone', status: 'active', resolution: '1080p', vehicles: 31 },
  { id: 'cam-4', name: 'Harbor Bridge South Approach', lat: 40.7028, lng: -73.9870, zone: 'Harbor-District', status: 'maintenance', resolution: '1080p', vehicles: 0 },
];

const mockIncidents = [
  {
    id: 'inc-1',
    title: 'Multi-Vehicle Collision at Broadway Crossing',
    type: 'VEHICLE_COLLISION',
    severity: 'CRITICAL',
    lat: 40.7145,
    lng: -74.0040,
    address: 'Broadway & 5th Ave Crossing',
    vehicles: '2 Sedans (NY-8492, NJ-3011)',
    responder: 'Ambulance & Patrol Dispatched',
    time: '5 mins ago',
  },
  {
    id: 'inc-2',
    title: 'Freight Truck Breakdown on Slipway',
    type: 'ROAD_HAZARD',
    severity: 'MEDIUM',
    lat: 40.7250,
    lng: -73.9980,
    address: 'Highway-101 Exit 4 Slipway',
    vehicles: 'Commercial Truck (PA-9023)',
    responder: 'Heavy Tow Unit Dispatched',
    time: '14 mins ago',
  },
];

const mockSignals = [
  { id: 'sig-1', name: 'Broadway & 5th Ave Smart Intersection', lat: 40.7138, lng: -74.0055, activePhase: 'NORTH_SOUTH', timer: 18, mode: 'dynamic_ai' },
  { id: 'sig-2', name: 'Metro Plaza & Main Crossing', lat: 40.7080, lng: -74.0080, activePhase: 'EAST_WEST', timer: 32, mode: 'dynamic_ai' },
];

// Arterial Corridors with congestion color overlays
const mockCorridors = [
  {
    name: 'Broadway Arterial Corridor (Downtown)',
    density: 'HIGH (Heavy Congestion)',
    color: '#f43f5e', // Red
    weight: 5,
    positions: [
      [40.7050, -74.0110],
      [40.7128, -74.0060],
      [40.7200, -74.0000],
    ],
  },
  {
    name: 'Highway-101 Northbound Expressway',
    density: 'LOW (Free-Flow Traffic)',
    color: '#10b981', // Emerald
    weight: 6,
    positions: [
      [40.7200, -73.9900],
      [40.7282, -73.9942],
      [40.7380, -73.9990],
    ],
  },
  {
    name: 'East-West Metro Connector',
    density: 'MEDIUM (Stable Flow)',
    color: '#f59e0b', // Amber
    weight: 4,
    positions: [
      [40.7150, -74.0150],
      [40.7138, -74.0055],
      [40.7110, -73.9920],
    ],
  },
];

export const TrafficMap = () => {
  const [showCameras, setShowCameras] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showSignals, setShowSignals] = useState(true);
  const [showCorridors, setShowCorridors] = useState(true);

  return (
    <div className="space-y-4">
      {/* Map Filter Control Bar */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center space-x-2 text-slate-300 font-bold">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span>Active Map Layers:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCameras(!showCameras)}
            className={`px-3 py-1.5 rounded-xl font-semibold border transition-all flex items-center space-x-1.5 ${
              showCameras
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Cameras ({mockCameras.length})</span>
          </button>

          <button
            onClick={() => setShowIncidents(!showIncidents)}
            className={`px-3 py-1.5 rounded-xl font-semibold border transition-all flex items-center space-x-1.5 ${
              showIncidents
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Incidents ({mockIncidents.length})</span>
          </button>

          <button
            onClick={() => setShowSignals(!showSignals)}
            className={`px-3 py-1.5 rounded-xl font-semibold border transition-all flex items-center space-x-1.5 ${
              showSignals
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Smart Signals ({mockSignals.length})</span>
          </button>

          <button
            onClick={() => setShowCorridors(!showCorridors)}
            className={`px-3 py-1.5 rounded-xl font-semibold border transition-all flex items-center space-x-1.5 ${
              showCorridors
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Congested Corridors</span>
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas Container */}
      <div className="h-[620px] w-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative z-0">
        <MapContainer
          center={[40.7145, -74.0040]}
          zoom={14}
          scrollWheelZoom={true}
          className="h-full w-full bg-slate-950"
        >
          {/* CartoDB Dark Matter Basemap Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* 1. Roadway Corridor Congestion Polylines */}
          {showCorridors &&
            mockCorridors.map((corridor, idx) => (
              <Polyline
                key={idx}
                positions={corridor.positions}
                pathOptions={{
                  color: corridor.color,
                  weight: corridor.weight,
                  opacity: 0.85,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              >
                <Tooltip sticky className="leaflet-tooltip-dark">
                  <div className="text-xs font-semibold text-slate-100">
                    <div>{corridor.name}</div>
                    <div className="text-[10px] text-emerald-400 font-mono">{corridor.density}</div>
                  </div>
                </Tooltip>
              </Polyline>
            ))}

          {/* 2. Surveillance Camera Markers */}
          {showCameras &&
            mockCameras.map((cam) => (
              <Marker key={cam.id} position={[cam.lat, cam.lng]} icon={cameraIcon}>
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 space-y-1.5 text-slate-900 min-w-[200px]">
                    <div className="font-bold text-sm text-slate-900 leading-tight">{cam.name}</div>
                    <div className="text-xs text-slate-600 font-medium">Zone: <span className="text-emerald-700 font-bold">{cam.zone}</span></div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] bg-slate-100 p-2 rounded-lg">
                      <div>Status: <span className="font-bold uppercase text-emerald-600">{cam.status}</span></div>
                      <div>Resolution: <span className="font-mono font-bold">{cam.resolution}</span></div>
                      <div className="col-span-2">Detected: <span className="font-bold text-slate-900">{cam.vehicles} units/frame</span></div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* 3. Incident Markers with Visual Severity Pulse */}
          {showIncidents &&
            mockIncidents.map((inc) => (
              <React.Fragment key={inc.id}>
                {/* Visual Hazard Radius */}
                <CircleMarker
                  center={[inc.lat, inc.lng]}
                  radius={inc.severity === 'CRITICAL' ? 36 : 24}
                  pathOptions={{
                    color: inc.severity === 'CRITICAL' ? '#f43f5e' : '#f59e0b',
                    fillColor: inc.severity === 'CRITICAL' ? '#f43f5e' : '#f59e0b',
                    fillOpacity: 0.25,
                    weight: 2,
                  }}
                />
                <Marker
                  position={[inc.lat, inc.lng]}
                  icon={inc.severity === 'CRITICAL' ? incidentCriticalIcon : incidentMediumIcon}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 space-y-1.5 text-slate-900 min-w-[220px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-rose-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase">
                          {inc.severity} HAZARD
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">{inc.time}</span>
                      </div>
                      <div className="font-extrabold text-sm text-slate-900 leading-tight">{inc.title}</div>
                      <div className="text-xs text-slate-600">{inc.address}</div>
                      <div className="text-[11px] bg-rose-50 border border-rose-200 text-rose-950 p-2 rounded-lg space-y-1">
                        <div>Vehicles: <span className="font-semibold">{inc.vehicles}</span></div>
                        <div>Dispatch: <span className="font-bold text-emerald-800">{inc.responder}</span></div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            ))}

          {/* 4. Smart Traffic Signal Markers */}
          {showSignals &&
            mockSignals.map((sig) => (
              <Marker key={sig.id} position={[sig.lat, sig.lng]} icon={signalIcon}>
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 space-y-1.5 text-slate-900 min-w-[200px]">
                    <div className="font-bold text-sm text-slate-900 leading-tight">{sig.name}</div>
                    <div className="text-xs text-blue-700 font-semibold uppercase">Smart 4-Way Controller</div>
                    <div className="bg-slate-100 p-2 rounded-lg text-xs space-y-1">
                      <div>Active Corridor: <span className="font-bold text-slate-900">{sig.activePhase}</span></div>
                      <div>Countdown: <span className="font-mono font-bold text-emerald-600">{sig.timer}s remaining</span></div>
                      <div>Mode: <span className="font-bold uppercase text-blue-600">{sig.mode}</span></div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default TrafficMap;
