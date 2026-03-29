import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
OUTPUT_DIR = BASE_DIR / "outputs"

MODELS_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# YOLO Configuration
DEFAULT_MODEL = os.getenv("YOLO_MODEL", "yolov8n.pt")  # Ultralytics lightweight model
CONF_THRESHOLD = float(os.getenv("CONF_THRESHOLD", "0.30"))
IOU_THRESHOLD = float(os.getenv("IOU_THRESHOLD", "0.45"))

# Server Configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# COCO Class IDs for traffic monitoring
TARGET_CLASSES = {
    0: "person",
    1: "bicycle",
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck",
}

# Color palette for classes (BGR format for OpenCV)
CLASS_COLORS = {
    "car": (0, 255, 128),         # Emerald
    "motorcycle": (255, 128, 0),  # Blue/Cyan
    "bus": (0, 165, 255),         # Orange
    "truck": (0, 69, 255),        # Red-Orange
    "person": (255, 255, 0),      # Cyan
    "bicycle": (180, 105, 255),   # Pink/Purple
}
