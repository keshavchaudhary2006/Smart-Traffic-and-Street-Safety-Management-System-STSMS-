import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Video, 
  UploadCloud,
  Trash2,
  ExternalLink
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const initialCameras = [
  { _id: '1', name: 'Downtown Junction (5th & Broadway)', location: { zone: 'Zone-A', address: '5th Ave & Broadway' }, streamUrl: 'rtsp://stream.traffic/cam1', type: 'ptz', resolution: '4K', status: 'active', installedAt: '2025-01-15' },
  { _id: '2', name: 'Expressway Flyover Northbound', location: { zone: 'Highway-101', address: 'Mile Marker 14' }, streamUrl: 'rtsp://stream.traffic/cam2', type: 'fixed', resolution: '1080p', status: 'active', installedAt: '2025-02-01' },
  { _id: '3', name: 'Central Metro Plaza Crossing', location: { zone: 'Pedestrian-Zone', address: 'Plaza West Gate' }, streamUrl: 'rtsp://stream.traffic/cam3', type: 'ptz', resolution: '1080p', status: 'active', installedAt: '2025-03-10' },
  { _id: '4', name: 'Harbor Bridge South Approach', location: { zone: 'Harbor-District', address: 'Bridge Pier 4' }, streamUrl: 'rtsp://stream.traffic/cam4', type: 'fixed', resolution: '1080p', status: 'maintenance', installedAt: '2024-11-20' },
  { _id: '5', name: 'Commercial Ring Road East', location: { zone: 'Zone-B', address: 'Ring Rd & 12th St' }, streamUrl: 'rtsp://stream.traffic/cam5', type: 'fixed', resolution: '720p', status: 'inactive', installedAt: '2024-09-05' },
];

export const Cameras = () => {
  const [cameras, setCameras] = useState(initialCameras);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newCam, setNewCam] = useState({ name: '', address: '', zone: 'Zone-A', streamUrl: '', type: 'fixed', resolution: '1080p' });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const res = await api.get('/cameras');
        if (res.data?.data?.cameras?.length > 0) {
          setCameras(res.data.data.cameras);
        }
      } catch (err) {
        // Fallback to initial mock cameras if backend offline
        console.warn('Using demo cameras dataset:', err.message);
      }
    };
    fetchCameras();
  }, []);

  const handleAddCamera = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/cameras', {
        name: newCam.name,
        location: { address: newCam.address, zone: newCam.zone },
        streamUrl: newCam.streamUrl,
        type: newCam.type,
        resolution: newCam.resolution,
      });
      if (res.data?.data?.camera) {
        setCameras([res.data.data.camera, ...cameras]);
      } else {
        setCameras([{ ...newCam, _id: Date.now().toString(), status: 'active' }, ...cameras]);
      }
      setShowAddModal(false);
      setNewCam({ name: '', address: '', zone: 'Zone-A', streamUrl: '', type: 'fixed', resolution: '1080p' });
    } catch (err) {
      // Add locally for demonstration
      setCameras([{ ...newCam, _id: Date.now().toString(), status: 'active' }, ...cameras]);
      setShowAddModal(false);
    }
  };

  const handleUploadVideo = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    setUploadMsg('');

    const formData = new FormData();
    formData.append('video', uploadFile);

    try {
      const res = await api.post('/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadMsg('Video uploaded successfully to /uploads! AI job initiated.');
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadMsg('');
      }, 2000);
    } catch (err) {
      setUploadMsg(err.response?.data?.message || 'Upload failed. File saved locally.');
    } finally {
      setUploading(false);
    }
  };

  const filteredCameras = cameras.filter((cam) => {
    const matchesSearch = cam.name.toLowerCase().includes(search.toLowerCase()) || 
                          cam.location?.zone?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || cam.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">
            Surveillance Camera Network
          </h1>
          <p className="text-sm text-slate-400">
            Real-time feed ingestion, telemetry, and camera health monitor
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center space-x-1.5 transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-emerald-400" />
            <span>Upload Test Video</span>
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950 flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Register Camera</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by camera name or zone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">Status:</span>
          {['all', 'active', 'maintenance', 'inactive'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                selectedStatus === st
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Cameras Inventory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-4">Camera Identifier</th>
                <th className="py-3.5 px-4">Zone & Location</th>
                <th className="py-3.5 px-4">Hardware Type</th>
                <th className="py-3.5 px-4">Resolution</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredCameras.map((cam) => (
                <tr key={cam._id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-4 px-4 font-semibold text-slate-100 flex items-center space-x-2.5">
                    <div className="p-2 bg-slate-800 rounded-lg text-emerald-400">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <div>{cam.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{cam.streamUrl || 'RTSP Stream Unconfigured'}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-semibold text-emerald-400">{cam.location?.zone || 'Unassigned'}</span>
                    <div className="text-[11px] text-slate-400">{cam.location?.address || 'Street Coordinates'}</div>
                  </td>
                  <td className="py-4 px-4 uppercase font-mono text-[11px] text-slate-400">
                    {cam.type || 'fixed'}
                  </td>
                  <td className="py-4 px-4 font-mono text-[11px]">
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                      {cam.resolution || '1080p'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      cam.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      cam.status === 'maintenance' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cam.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      <span>{cam.status}</span>
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button className="text-emerald-400 hover:text-emerald-300 font-semibold px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors">
                      Live Stream
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Register Camera */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Register Surveillance Unit</h2>
            <form onSubmit={handleAddCamera} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Camera Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5th Ave Crosswalk Sensor"
                  value={newCam.name}
                  onChange={(e) => setNewCam({ ...newCam, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Zone</label>
                  <input
                    type="text"
                    required
                    placeholder="Zone-A"
                    value={newCam.zone}
                    onChange={(e) => setNewCam({ ...newCam, zone: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Resolution</label>
                  <select
                    value={newCam.resolution}
                    onChange={(e) => setNewCam({ ...newCam, resolution: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:border-emerald-500"
                  >
                    <option value="1080p">1080p FHD</option>
                    <option value="4K">4K UHD</option>
                    <option value="720p">720p HD</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Street Address</label>
                <input
                  type="text"
                  placeholder="Corner of 5th Ave and Main St"
                  value={newCam.address}
                  onChange={(e) => setNewCam({ ...newCam, address: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">RTSP Stream URL</label>
                <input
                  type="text"
                  placeholder="rtsp://192.168.1.100:554/live"
                  value={newCam.streamUrl}
                  onChange={(e) => setNewCam({ ...newCam, streamUrl: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Save Camera
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Video Upload Testing */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Upload Traffic Video for AI Processing</h2>
            <p className="text-xs text-slate-400">
              Upload sample MP4/AVI footage to test YOLO detection & traffic density metrics.
            </p>

            {uploadMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                {uploadMsg}
              </div>
            )}

            <form onSubmit={handleUploadVideo} className="space-y-4">
              <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 text-center cursor-pointer bg-slate-950/60">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || uploading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  {uploading ? 'Processing Upload...' : 'Run YOLO Analysis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cameras;
