"""
Simple client script to test the STSMS YOLO Computer Vision service.
Run with: python test_client.py <optional_path_to_video>
"""

import sys
import requests
import json

SERVER_URL = "http://localhost:8000"

def test_health():
    print("🔍 Testing /health endpoint...")
    try:
        res = requests.get(f"{SERVER_URL}/health", timeout=5)
        print("Status code:", res.status_code)
        print("Response:", json.dumps(res.json(), indent=2))
    except Exception as e:
        print("❌ Health check failed:", e)

def test_detect(video_path):
    print(f"\n🎬 Sending video to /detect: {video_path}")
    payload = {
        "video_path": video_path,
        "sample_rate": 2,
    }
    try:
        res = requests.post(f"{SERVER_URL}/detect", json=payload, timeout=60)
        print("Status code:", res.status_code)
        print("Response Summary:")
        print(json.dumps(res.json(), indent=2))
    except Exception as e:
        print("❌ Detection request failed:", e)

if __name__ == "__main__":
    test_health()
    if len(sys.argv) > 1:
        test_detect(sys.argv[1])
    else:
        print("\n💡 Tip: pass a video file path to test detection: python test_client.py path/to/video.mp4")
