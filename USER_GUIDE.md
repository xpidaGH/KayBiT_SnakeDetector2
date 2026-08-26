# KayBiT_SnakeDetector — Comprehensive User Guide & Engineering Manual

Welcome to **KayBiT_SnakeDetector**, an end-to-end edge-AI snake detection, classification, and real-time alert system designed for rural compounds, agricultural farms, residential perimeters, and industrial outdoor zones.

---

## 📋 Table of Contents
1. [System Architecture Overview](#1-system-architecture-overview)
2. [Dataset Collection & Training Pipeline](#2-dataset-collection--training-pipeline)
3. [Edge Detection Daemon (`edge_detector.py`)](#3-edge-detection-daemon-edgedetectorpy)
4. [Engineering Challenge 1: False Positive Mitigation (Hoses & Roots)](#4-engineering-challenge-1-false-positive-mitigation-hoses--roots)
5. [Engineering Challenge 2: Night-Vision & Infrared (IR) Augmentation](#5-engineering-challenge-2-night-vision--infrared-ir-augmentation)
6. [Engineering Challenge 3: Sub-3-Second End-to-End Latency Instrumentation](#6-engineering-challenge-3-sub-3-second-end-to-end-latency-instrumentation)
7. [Android Mobile App & Firebase Cloud Messaging (FCM)](#7-android-mobile-app--firebase-cloud-messaging-fcm)
8. [Hardware & Edge Compute Deployment Guide](#8-hardware--edge-compute-deployment-guide)
9. [Operational Troubleshooting & Field FAQ](#9-operational-troubleshooting--field-faq)

---

## 1. System Architecture Overview

The KayBiT system operates across three synchronized tiers:

```
+-----------------------------------------------------------------------------------+
|                           EDGE TIER (Camera + Local NPU)                           |
|  [CCTV / RTSP Camera]                                                             |
|         │ (30 FPS Stream)                                                         |
|         ▼                                                                         |
|  [Frame Capture & Preprocess] ──► (Night Mode IR Auto-Filter)                     |
|         │                                                                         |
|         ▼                                                                         |
|  [YOLOv8-Nano / NCNN Engine] ──► Snake Bounding Boxes + Confidence Scores        |
|         │                                                                         |
|         ▼                                                                         |
|  [N-Consecutive Frame Spatial IOU Tracker] ──► (Discards Hoses/Roots Glances)     |
|         │ (Triggered when streak >= N frames)                                     |
|         ▼                                                                         |
|  [Webhook / API Dispatcher] ───────────────────────────────────────────┐         |
+------------------------------------------------------------------------│----------+
                                                                         │ (~120ms)
+------------------------------------------------------------------------│----------+
|                         CLOUD / GATEWAY TIER                           ▼          |
|  [Express Webhook Listener (`/api/alerts/webhook`)] ──► [Latency Logger & Telemetry]|
|         │                                                                         |
|         ▼                                                                         |
|  [Firebase Cloud Messaging (FCM) Server] ──► High-Priority Data Payload Message    |
+------------------------------------------------------------------------│----------+
                                                                         │ (~180ms)
+------------------------------------------------------------------------│----------+
|                         MOBILE CLIENT TIER (Android)                   ▼          |
|  [Android FCM Background Wake Service] ──► Acquire Partial WakeLock               |
|         │                                                                         |
|         ▼                                                                         |
|  [High-Urgency Warning UI] + [Multi-Tone Emergency Siren Sound Generator]          |
|  (Displays Species ID, Danger Level, Snapshot Thumbnail, & E2E Latency Badge)     |
+-----------------------------------------------------------------------------------+
```

---

## 2. Dataset Collection & Training Pipeline

### Data Sourcing
* **Roboflow Universe**: Download venomous & non-venomous snake annotation sets (e.g., *Crotalinae*, *Elapidae*, *Viperidae*, *Colubridae*).
* **Kaggle SnakeCLEF Dataset**: Comprehensive continental snake datasets for morphological diversity.
* **Negative Classes & Distractors**: Include labeled images of garden water hoses (green, black, coiled, stretched), exposed tree roots, electrical extension cords, and curved irrigation drip lines.

### Training Command (YOLOv8n)
```bash
python train_yolo_snake.py \
  --data dataset.yaml \
  --epochs 100 \
  --imgsz 640 \
  --batch 32 \
  --augment-ir \
  --weights yolov8n.pt \
  --device 0
```

---

## 3. Edge Detection Daemon (`edge_detector.py`)

The edge daemon is a lightweight Python process deployed directly on your edge device (Raspberry Pi 5 with Hailo-8 NPU, Jetson Orin Nano, or Coral TPU).

### Key Features:
* **Asynchronous RTSP stream reader** running on a dedicated low-latency POSIX thread.
* **ONNX / TensorRT / OpenVINO runtime** execution for 15–45ms inference per frame.
* **Ring-Buffer streak memory** to enforce consecutive-frame confirmation.
* **HTTP Webhook poster** with JSON payload including telemetry timestamps.

---

## 4. Engineering Challenge 1: False Positive Mitigation (Hoses & Roots)

### The Problem
Outdoor cameras frequently observe curved garden hoses, exposed tree roots, black polyethylene pipes, and fallen tree branches. In single-frame inference, a curved green hose in shadowed grass can briefly trigger a 0.52 confidence detection.

### The KayBiT Solution: $N$-Consecutive Frame Spatial Verification
1. When a candidate detection occurs above threshold $\tau_{conf}$ (e.g., 0.55), its bounding box is assigned a spatial tracking ID.
2. The tracker computes the Intersection-Over-Union ($\text{IoU}$) across succeeding frames:
   $$\text{IoU}(B_{t-1}, B_{t}) = \frac{\text{Area}(B_{t-1} \cap B_t)}{\text{Area}(B_{t-1} \cup B_t)}$$
3. If an object maintains $\text{IoU} \ge 0.40$ or displays smooth biological slither motion vectors across $N$ uninterrupted frames (default $N = 4$), the detection is confirmed as a true positive.
4. Static or momentary camera noise spikes (leaves blowing over a hose) that fail consecutive frame thresholds are automatically pruned without dispatching an alarm.

---

## 5. Engineering Challenge 2: Night-Vision & Infrared (IR) Augmentation

### The Problem
Snakes (especially vipers, kraits, and rattlesnakes) are primarily nocturnal predators active after dusk. Standard RGB vision models fail dramatically in black-and-white (850nm / 940nm) infrared night mode due to loss of chromatic cues and sudden specular reflectance.

### The KayBiT Solution: IR Synthetic Augmentation Pipeline
During dataset preparation, every training batch undergoes:
1. **Dynamic Desaturation**: Converting RGB to 1-channel luminance matching camera IR bandpass cutoffs.
2. **CLAHE (Contrast Limited Adaptive Histogram Equalization)**: Simulates the harsh contrast between active IR illuminator hotspots and dark backgrounds.
3. **IR Thermal / Reflectance Bloom**: Scales specular highlight channels on smooth reptilian scales.
4. **Gaussian Noise & Grain Injection**: Replicates sensor thermal sensor noise in high-gain night captures.

---

## 6. Engineering Challenge 3: Sub-3-Second End-to-End Latency Instrumentation

Safety-critical alerts must reach the user before an individual steps within striking distance. KayBiT instruments every microsecond along the telemetry chain:

| Pipeline Stage | Typical Duration | Target Budget |
|---|---|---|
| **1. Frame Ingestion & Resizing** | 12 – 18 ms | < 30 ms |
| **2. Edge Neural Network Inference** | 35 – 55 ms | < 80 ms |
| **3. $N$-Frame Temporal Confirmation ($N=4$ @ 30FPS)** | 100 – 133 ms | < 200 ms |
| **4. Snapshot Compression & Webhook POST** | 45 – 90 ms | < 150 ms |
| **5. FCM Cloud Dispatch & Cellular Transport** | 180 – 450 ms | < 800 ms |
| **6. Android WakeLock, Notification & Siren Sound** | 120 – 250 ms | < 500 ms |
| **TOTAL END-TO-END LATENCY** | **~550 – 996 ms** | **< 3,000 ms (SLA PASS)** |

---

## 7. Android Mobile App & Firebase Cloud Messaging (FCM)

### Background Wake Protocol
1. **High Priority FCM Payload**: Uses `priority: "high"` with `content_available: true` to trigger Android Doze mode exemption.
2. **Android WakeLock**: The background receiver obtains a `PARTIAL_WAKE_LOCK` for 5,000ms.
3. **Custom Emergency Siren Audio**: Automatically triggers `RingtoneManager` or Web Audio API siren with dual-frequency sweeping alert pulses (880Hz / 1760Hz).
4. **Full-Screen Warning Activity**: Surfaces over the lock screen with vibration pattern `[0, 500, 200, 500, 200, 800]`.

---

## 8. Hardware & Edge Compute Deployment Guide

| Component | Recommended Hardware | Budget Alternative |
|---|---|---|
| **Processor / NPU** | NVIDIA Jetson Orin Nano (40 TOPS) | Raspberry Pi 5 + Hailo-8 M.2 |
| **Camera** | 4MP Sony IMX335 Starvis Day/Night RTSP | USB Night-Vision IR Camera module |
| **IR Illumination** | 850nm High-Power Array (50m range) | Integrated 12-LED Camera IR Ring |
| **Power Supply** | 12V 2A PoE (Power-over-Ethernet) | 5V 4A DC Power Brick |

---

## 9. Operational Troubleshooting & Field FAQ

* **Q: Why did an alert not trigger when a snake passed by?**
  * *Check:* Verify that the $N$-frame confirmation count was met before the snake exited the camera frame. If the frame rate dropped below 10 FPS, reduce input resolution to 480p or set $N=3$.
* **Q: How to stop a garden hose from causing repeated false alarms?**
  * *Action:* Use the *Hard Negative Training tool* in KayBiT Console to take 10 snapshots of the hose and retrain the model weights. Ensure $N \ge 4$.
* **Q: Does the alarm work if the phone is set to Silent/Do Not Disturb?**
  * *Yes:* On Android, the app registers a `NotificationChannel` with `IMPORTANCE_HIGH` and requests DND bypass permission for emergency safety.

---
*KayBiT SnakeDetector — Protecting Lives with Intelligent Edge AI.*
