import os
import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from detector import process_video_stream, get_yolo_model
from config import HOST, PORT, DEFAULT_MODEL, CONF_THRESHOLD

app = FastAPI(
    title="STSMS Computer Vision Engine",
    description="Real-Time AI-Powered Traffic & Street Safety Detection Service using YOLO",
    version="1.0.0",
)

# Enable CORS for backend and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request schema for POST /detect
class DetectRequest(BaseModel):
    video_path: Optional[str] = Field(None, description="Absolute or relative path to the target video file")
    videoPath: Optional[str] = Field(None, description="CamelCase alternative for video_path")
    filePath: Optional[str] = Field(None, description="Alternative alias for video_path")
    output_dir: Optional[str] = Field(None, description="Optional directory to store annotated output video")
    conf_threshold: Optional[float] = Field(CONF_THRESHOLD, ge=0.05, le=1.0, description="YOLO detection confidence threshold")
    sample_rate: Optional[int] = Field(2, ge=1, le=10, description="Process every Nth frame")


@app.on_event("startup")
async def startup_event():
    """Warm up the YOLO model at startup."""
    print("🚀 Initializing STSMS Computer Vision Engine...")
    get_yolo_model()
    print("🎯 Model ready for inference requests.")


@app.get("/")
@app.get("/health")
def health_check() -> Dict[str, Any]:
    """Health check endpoint confirming AI service readiness."""
    return {
        "status": "healthy",
        "service": "STSMS Computer Vision Engine",
        "model": DEFAULT_MODEL,
        "classes": ["car", "motorcycle", "bus", "truck", "person", "bicycle"],
    }


@app.post("/detect")
def detect_traffic(request: DetectRequest) -> Dict[str, Any]:
    """
    Process video with YOLO and compute vehicle counts & traffic metrics.
    
    Accepts video_path, analyzes frames, detects vehicles (cars, motorcycles, buses, trucks),
    annotates bounding boxes, and returns a JSON summary.
    """
    # Resolve video path from multiple possible key names
    target_path = request.video_path or request.videoPath or request.filePath
    if not target_path:
        raise HTTPException(
            status_code=400,
            detail="Missing required field: 'video_path' (or 'videoPath' / 'filePath') must be provided."
        )

    if not os.path.exists(target_path):
        raise HTTPException(
            status_code=404,
            detail=f"Video file not found at path: {target_path}"
        )

    try:
        print(f"🎬 Running detection pipeline on: {target_path}")
        results = process_video_stream(
            video_path=target_path,
            output_dir=request.output_dir,
            conf_threshold=request.conf_threshold or CONF_THRESHOLD,
            sample_rate=request.sample_rate or 2,
        )
        print(f"✅ Video processing complete. Total vehicles detected: {results['summary']['total_vehicles']}")
        return results
    except Exception as e:
        print(f"❌ Error processing video: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Inference error processing video: {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
