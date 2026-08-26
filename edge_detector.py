#!/usr/bin/env python3
"""
KayBiT_SnakeDetector — Edge AI Inference Daemon
================================================
Performs low-latency frame-by-frame inference on edge devices (Raspberry Pi,
Jetson Nano, Coral TPU) with N-consecutive frame temporal verification
to prevent false positives from garden hoses, tree roots, and ropes.

Dispatches high-priority webhooks with detailed telemetry to the FCM Gateway.
"""

import argparse
import base64
import json
import logging
import sys
import time
from collections import deque
import cv2
import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

class ConsecutiveFrameTracker:
    """
    Maintains streak of positive snake detections with spatial IoU continuity.
    Filters out momentary false positives from garden hoses or roots.
    """
    def __init__(self, required_streak=4, iou_threshold=0.35, reset_timeout_sec=1.5):
        self.required_streak = required_streak
        self.iou_threshold = iou_threshold
        self.reset_timeout_sec = reset_timeout_sec
        self.current_streak = 0
        self.last_bbox = None
        self.last_detection_time = 0
        self.history = deque(maxlen=30)

    @staticmethod
    def calculate_iou(boxA, boxB):
        # box format: [x1, y1, x2, y2]
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])

        interArea = max(0, xB - xA) * max(0, yB - yA)
        boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
        boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
        unionArea = float(boxAArea + boxBArea - interArea)

        return interArea / unionArea if unionArea > 0 else 0.0

    def update(self, detected_box, confidence, class_name):
        now = time.time()
        
        if detected_box is None:
            # No detection in this frame; reset if timeout exceeded
            if now - self.last_detection_time > self.reset_timeout_sec:
                if self.current_streak > 0:
                    logging.info(f"Streak reset (streak was {self.current_streak}) due to absence of target.")
                self.current_streak = 0
                self.last_bbox = None
            return False, self.current_streak

        # If we have a previous box, check IoU continuity
        if self.last_bbox is not None:
            iou = self.calculate_iou(self.last_bbox, detected_box)
            if iou >= self.iou_threshold or (now - self.last_detection_time < 0.25):
                self.current_streak += 1
            else:
                # Sudden jump or different object; reset streak to 1
                logging.info(f"Spatial IoU jump ({iou:.2f} < {self.iou_threshold}). Resetting streak.")
                self.current_streak = 1
        else:
            self.current_streak = 1

        self.last_bbox = detected_box
        self.last_detection_time = now
        self.history.append({"time": now, "box": detected_box, "conf": confidence, "class": class_name})

        is_confirmed = self.current_streak >= self.required_streak
        return is_confirmed, self.current_streak


class EdgeSnakeDetector:
    def __init__(self, camera_source=0, webhook_url="http://localhost:3000/api/alerts/webhook",
                 conf_thresh=0.55, consecutive_frames=4, is_night_mode=False):
        self.camera_source = camera_source
        self.webhook_url = webhook_url
        self.conf_thresh = conf_thresh
        self.consecutive_frames = consecutive_frames
        self.is_night_mode = is_night_mode
        self.tracker = ConsecutiveFrameTracker(required_streak=consecutive_frames)
        self.last_alert_time = 0
        self.alert_cooldown_sec = 8.0  # Cooldown between repeated webhook dispatches

        logging.info("Initializing Edge Snake Detection Engine...")
        logging.info(f"Camera: {camera_source} | Webhook: {webhook_url} | Conf Thresh: {conf_thresh}")
        logging.info(f"Consecutive Frame Confirmation: N={consecutive_frames}")

    def preprocess_frame(self, frame):
        """
        Applies Night Vision infrared processing if night mode is enabled.
        """
        t_start = time.time()
        if self.is_night_mode:
            # Convert to IR grayscale and apply CLAHE enhancement
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(gray)
            processed = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)
        else:
            processed = frame
        
        preprocess_ms = (time.time() - t_start) * 1000
        return processed, preprocess_ms

    def run_inference_mock_or_yolo(self, frame):
        """
        Runs local model inference. (Uses Ultralytics YOLO or optimized ONNX session)
        """
        t_infer_start = time.time()
        
        # In production:
        # results = self.model(frame, conf=self.conf_thresh, verbose=False)
        # Here we simulate high-speed edge inference (18-40ms):
        time.sleep(0.025)
        
        infer_ms = (time.time() - t_infer_start) * 1000
        return infer_ms

    def send_alert_webhook(self, frame, box, conf, class_name, streak, timing_meta):
        """
        Encodes thumbnail snapshot and dispatches telemetry payload to webhook API.
        """
        t_dispatch_start = time.time()
        
        # Crop or resize frame for low-bandwidth payload
        h, w, _ = frame.shape
        small_frame = cv2.resize(frame, (480, int(480 * h / w)))
        _, buffer = cv2.imencode(".jpg", small_frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
        jpg_as_text = base64.b64encode(buffer).decode("utf-8")

        payload = {
            "camera_id": "EDGE-CAM-01-PATIO",
            "camera_name": "Backyard Perimeter (IR Starvis)",
            "timestamp_edge_captured": timing_meta["t_capture"],
            "timestamp_edge_inferred": timing_meta["t_infer"],
            "timestamp_edge_confirmed": timing_meta["t_confirm"],
            "timestamp_edge_dispatched": t_dispatch_start,
            "species": class_name,
            "risk_level": "CRITICAL - HIGHLY VENOMOUS" if "Viper" in class_name or "Cobra" in class_name or "Rattlesnake" in class_name else "WARNING",
            "confidence": round(float(conf), 3),
            "consecutive_streak": streak,
            "bounding_box": {
                "x1": int(box[0]),
                "y1": int(box[1]),
                "x2": int(box[2]),
                "y2": int(box[3])
            },
            "night_mode": self.is_night_mode,
            "snapshot_base64": f"data:image/jpeg;base64,{jpg_as_text}",
            "edge_timings": {
                "preprocess_ms": round(timing_meta["preprocess_ms"], 2),
                "inference_ms": round(timing_meta["infer_ms"], 2),
                "streak_eval_ms": round(timing_meta["streak_ms"], 2)
            }
        }

        try:
            logging.info(f"🚨 FIRING WEBHOOK ALERT to {self.webhook_url} (Confidence: {conf:.1%}, Streak: {streak}/{self.consecutive_frames})")
            response = requests.post(self.webhook_url, json=payload, timeout=2.5)
            logging.info(f"Webhook Response HTTP {response.status_code}: {response.text}")
        except Exception as e:
            logging.error(f"Failed to deliver alert webhook: {e}")

    def run(self):
        cap = cv2.VideoCapture(self.camera_source)
        if not cap.isOpened():
            logging.warning(f"Could not open camera {self.camera_source}. Running in synthetic frame mode.")
        
        logging.info("KayBiT Edge AI Loop Started. Listening for serpent movement patterns...")
        frame_idx = 0

        try:
            while True:
                t_capture = time.time()
                ret, frame = cap.read()
                if not ret:
                    # Synthetic dummy frame for edge demonstration
                    frame = 255 * cv2.ones((480, 640, 3), dtype="uint8")
                    time.sleep(0.033)

                frame_idx += 1
                processed_frame, prep_ms = self.preprocess_frame(frame)
                
                # Inference
                infer_ms = self.run_inference_mock_or_yolo(processed_frame)
                t_infer = time.time()

                # Temporal tracker evaluation
                t_streak_start = time.time()
                
                # Mock detection pattern for testing:
                # Every 50 frames, simulate candidate detection
                mock_box = [180, 220, 420, 360] if (frame_idx % 120 > 40 and frame_idx % 120 < 70) else None
                mock_conf = 0.88 if mock_box else 0.0
                mock_class = "Eastern Diamondback Rattlesnake" if mock_box else "None"

                confirmed, streak = self.tracker.update(mock_box, mock_conf, mock_class)
                streak_ms = (time.time() - t_streak_start) * 1000
                t_confirm = time.time()

                timing_meta = {
                    "t_capture": t_capture,
                    "t_infer": t_infer,
                    "t_confirm": t_confirm,
                    "preprocess_ms": prep_ms,
                    "infer_ms": infer_ms,
                    "streak_ms": streak_ms
                }

                if confirmed:
                    now = time.time()
                    if now - self.last_alert_time > self.alert_cooldown_sec:
                        self.last_alert_time = now
                        self.send_alert_webhook(processed_frame, mock_box, mock_conf, mock_class, streak, timing_meta)

                time.sleep(0.01)

        except KeyboardInterrupt:
            logging.info("Terminating edge daemon gracefully.")
        finally:
            cap.release()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="KayBiT SnakeDetector Edge Daemon")
    parser.add_argument("--camera", type=int, default=0, help="Camera index / RTSP URL")
    parser.add_argument("--webhook", type=str, default="http://localhost:3000/api/alerts/webhook", help="Webhook destination")
    parser.add_argument("--conf", type=float, default=0.55, help="Confidence threshold")
    parser.add_argument("--consecutive-frames", type=int, default=4, help="N consecutive frames required for confirmation")
    parser.add_argument("--night-mode", action="store_true", help="Enable 850nm IR night mode processing")
    args = parser.parse_args()

    detector = EdgeSnakeDetector(
        camera_source=args.camera,
        webhook_url=args.webhook,
        conf_thresh=args.conf,
        consecutive_frames=args.consecutive_frames,
        is_night_mode=args.night_mode
    )
    detector.run()
