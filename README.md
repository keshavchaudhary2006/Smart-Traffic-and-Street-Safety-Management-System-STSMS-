# 🚦 Smart Traffic & Street Safety Management System (STSMS)

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Stack: MERN + Python YOLO](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20MongoDB%20%7C%20YOLOv8-blue.svg)](https://github.com/keshavchaudhary2006/Real-Time-AI-Powered-Threat-Detection-Engine)
[![Docker: Ready](https://img.shields.io/badge/Docker-Compose%20Ready-2496ED.svg)](https://www.docker.com/)
[![WebSockets: Socket.IO](https://img.shields.io/badge/WebSockets-Socket.IO%20Live-010101.svg)](https://socket.io/)

**STSMS** is an enterprise-grade, real-time computer vision and urban traffic orchestration platform. It integrates **Ultralytics YOLOv8** deep-learning inference with a **Node.js/Express** backend, **MongoDB** telemetry storage, **Socket.IO** real-time event broadcasting, and a modern **React (Vite) + Tailwind CSS** GIS command center.

---

## 🏗️ System Architecture

```
                                  ┌────────────────────────────────────────┐
                                  │      Client Browser (React SPA)        │
                                  │  - Command Dashboard & Live Tickers    │
                                  │  - 4-Way Smart Signal Visualizer       │
                                  │  - Interactive Leaflet OpenStreetMap   │
                                  │  - Recharts Deep Analytics Hub         │
                                  └───────────────────▲────────────────────┘
                                                      │
                                   HTTP / REST (5173) │ WebSockets (ws://)
                                                      ▼
┌───────────────────────┐         ┌────────────────────────────────────────┐
│     MongoDB (27017)   │◄────────┤        Node.js / Express Backend       │
│  - Users & JWT Auth   │ Mongoose│  - JWT Auth & Role-Based Access        │
│  - Cameras & Streams  │         │  - Camera & Traffic Record CRUD        │
│  - Incidents & Vio.   │         │  - Video Upload Engine (/uploads)      │
│  - 4-Way Signals      │         │  - Webster Density Math Formulation    │
│  - Video Jobs Queue   │         │  - Socket.IO Pub/Sub Event Hub         │
└───────────────────────┘         └───────────────────▲────────────────────┘
                                                      │
                                       Async HTTP POST│ (JSON Payload & Status)
                                                      ▼
                                  ┌────────────────────────────────────────┐
                                  │     Python AI Service (FastAPI 8000)   │
                                  │  - Ultralytics YOLOv8 Neural Engine    │
                                  │  - OpenCV Video Decoder & Annotator    │
                                  │  - Multimodal Vehicle Counter          │
                                  │  - Level of Service (LOS) Density Math │
                                  └────────────────────────────────────────┘
```

---

## ✨ Key Platform Features

| Module | Features & Capabilities |
| :--- | :--- |
| **Authentication & RBAC** | Stateless JWT authentication, 12-round Bcrypt password hashing, Operator (`user`) and Commander (`admin`) roles. |
| **Computer Vision Engine** | Ultralytics YOLOv8 detecting **Cars, Motorcycles, Buses, Trucks, Pedestrians, Bicycles**; automatic HUD rendering & annotated MP4 generation. |
| **Background AI Pipeline** | Non-blocking video ingestion; backend offloads video files to the Python worker and updates database records asynchronously. |
| **Traffic Density Math** | Transportation engineering formulation with Passenger Car Unit (PCU) weights and Highway Capacity Manual (HCM) Level of Service (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`). |
| **Dynamic 4-Way Signals** | Webster's dynamic green-split allocator adjusting phase durations ($15\text{s} \to 90\text{s}$) with Ambulance/Emergency priority overrides. |
| **Safety Incidents & Violations** | Tracking red-light jumps, speeding, wrong-way entries, collisions; includes simulation triggers for testing. |
| **Real-Time WebSockets** | Socket.IO engine pushing instant telemetry, violation popups, and incident alerts without browser refreshes. |
| **Interactive GIS Map** | OpenStreetMap (CartoDB Dark Matter) plotting cameras, live hazard radii, smart signal heads, and congested road polylines. |
| **Analytics Dashboard** | Recharts visualizations: multimodal split donut, 24-hour throughput/speed curves, incident stacked bars, and delay reduction benchmarks. |

---

## 📋 System Requirements

- **Node.js**: `v18.0.0` or higher
- **Python**: `3.10` – `3.13` (with `pip`)
- **MongoDB**: `v6.0` or higher (or MongoDB Atlas Cloud URI)
- **Docker & Docker Compose**: (Optional, for containerized deployment)

---

## 🚀 Quickstart & Setup Guide

### Method 1: Running with Docker Compose (Recommended)

Start all 4 services (MongoDB, Python AI Engine, Express Backend, React Frontend) with a single command:

```bash
docker-compose up --build
```

Access the application:
- **Frontend Command Center**: [http://localhost:5173](http://localhost:5173)
- **Backend API Server**: [http://localhost:5000](http://localhost:5000)
- **Python AI Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Method 2: Local Development Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/keshavchaudhary2006/Real-Time-AI-Powered-Threat-Detection-Engine.git
cd Real-Time-AI-Powered-Threat-Detection-Engine
```

#### 2. Configure Environment Variables
Copy `.env.example` to `backend/.env`:
```bash
cp .env.example backend/.env
```

#### 3. Install All Dependencies
```bash
# Install Node backend, React frontend, and Python AI dependencies
npm run install:all
```
*(Or install individually: `cd backend && npm install`, `cd frontend && npm install`, `cd ai-service && pip install -r requirements.txt`)*

#### 4. Start Development Servers (3 Terminals)

```bash
# Terminal 1: Python AI Service (Port 8000)
npm run dev:ai

# Terminal 2: Node.js Express API (Port 5000)
npm run dev:backend

# Terminal 3: React Vite Frontend (Port 5173)
npm run dev:frontend
```

---

## 📡 REST API Reference

All protected endpoints require the header: `Authorization: Bearer <JWT_TOKEN>`

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Create a new user or admin account | Public |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT token | Public |
| `GET` | `/api/auth/me` | Fetch authenticated profile | Private |

### 📹 Cameras (`/api/cameras`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cameras` | List cameras (filters: `status`, `zone`, `type`) | Private |
| `GET` | `/api/cameras/:id` | Get single camera telemetry | Private |
| `POST` | `/api/cameras` | Register new camera node | Admin |
| `PUT` | `/api/cameras/:id` | Update camera hardware / stream details | Admin |
| `DELETE` | `/api/cameras/:id` | Remove camera node | Admin |

### 🚦 Smart 4-Way Signals (`/api/signals`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/signals` | List all smart intersections | Private |
| `GET` | `/api/signals/:id` | Get live 4-way countdowns & split analysis | Private |
| `POST` | `/api/signals/:id/simulate` | Inject vehicle surge and recalculate dynamic green times | Private |
| `POST` | `/api/signals/:id/transition` | Advance phase with dynamic duration ($15\text{s} \to 90\text{s}$) | Private |
| `PATCH` | `/api/signals/:id/emergency` | Trigger emergency corridor override (Ambulance/Fire) | Private |
| `DELETE` | `/api/signals/:id/emergency` | Dismiss override & resume dynamic AI balancing | Private |

### 🚨 Incidents & Violations (`/api`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/incidents` | Query roadway collisions & hazard telemetry | Private |
| `POST` | `/api/incidents/simulate` | Trigger simulated collision with real-time broadcast | Private |
| `PATCH` | `/api/incidents/:id/status` | Update dispatch status (`REPORTED`, `DISPATCHED`, `RESOLVED`) | Private |
| `GET` | `/api/violations` | Query traffic violations with license plates & fines | Private |
| `POST` | `/api/violations/simulate` | Trigger simulated red-light / speeding violation | Private |

### 🎥 Video AI Ingestion (`/api/videos`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/videos/upload` | Upload MP4/AVI footage (`multipart/form-data`) | Private |
| `GET` | `/api/videos` | List processing jobs and status | Private |
| `GET` | `/api/videos/:id` | Inspect AI detection counts and summary | Private |

### 🧠 Python Computer Vision Service (`:8000`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Verify YOLO model readiness & classes | Public |
| `POST` | `/detect` | Run YOLO inference on local video path | Public / Internal |

---

## 🔌 Real-Time WebSocket Events (Socket.IO)

Clients connect to `ws://localhost:5000` to receive live events:

| Event Name | Direction | Payload Description |
| :--- | :--- | :--- |
| `violation:new` | Server $\to$ Client | Emitted when a red-light jump or speeding infraction is detected. |
| `incident:new` | Server $\to$ Client | Emitted when a roadway accident or collision is flagged. |
| `incident:updated`| Server $\to$ Client | Emitted when emergency responder dispatch status changes. |
| `traffic:update` | Server $\to$ Client | Real-time vehicle counts and density level updates. |

---

## ⚙️ Environment Variables Reference

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` | Node runtime mode (`development` / `production` / `test`) |
| `PORT` | `5000` | Backend API server port |
| `MONGO_URI` | `mongodb://localhost:27017/stsms` | MongoDB connection string |
| `JWT_SECRET` | *(Required in prod)* | Secret key used for signing JWT auth tokens |
| `JWT_EXPIRES_IN`| `7d` | Expiration window for JWT sessions |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin for frontend |
| `AI_SERVICE_URL`| `http://localhost:8000` | URL of the Python FastAPI YOLO service |

---

## 🔒 Security Best Practices

- **Zero Hardcoded Credentials**: Environment configuration loaded strictly via dotenv / Docker environment.
- **Input Sanitization**: File uploads restricted to valid video formats with a 500MB size limit.
- **CORS Protection**: Access restricted to configured `CLIENT_URL` origins.
- **Security Headers**: Powered by `helmet` middleware.

---

## 📄 License

This project is licensed under the **MIT License**.
