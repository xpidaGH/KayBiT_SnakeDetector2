export interface AlertRecord {
  id: string;
  cameraId: string;
  cameraName: string;
  timestamp: string;
  species: string;
  scientificName?: string;
  riskLevel: "CRITICAL - HIGHLY VENOMOUS" | "DANGER - VENOMOUS" | "CAUTION - NON-VENOMOUS" | "FALSE POSITIVE REJECTED";
  confidence: number;
  consecutiveStreak: number;
  requiredStreak: number;
  nightMode: boolean;
  snapshotUrl?: string;
  snapshotBase64?: string;
  latencies: {
    captureMs: number;
    inferenceMs: number;
    streakFilterMs: number;
    webhookDispatchMs: number;
    cloudFcmMs: number;
    deviceWakeAlarmMs: number;
    totalEndToEndMs: number;
  };
  slaPass: boolean;
  actionsTaken: string[];
}

export interface SystemSettings {
  consecutiveFramesN: number;
  confidenceThreshold: number;
  nightVisionMode: boolean;
  alarmSirenEnabled: boolean;
  fcmPushChannel: string;
  fcmDeviceToken: string;
  edgeCameraSource: string;
  autoDispatchWebhook: boolean;
  targetSlaMs: number;
}

export interface LatencyStage {
  name: string;
  durationMs: number;
  budgetMs: number;
  percentage: number;
  status: "fast" | "optimal" | "warning";
  description: string;
}

export interface SnakeSpeciesInfo {
  name: string;
  scientificName: string;
  family: string;
  venomType: "Hemotoxic" | "Neurotoxic" | "Cytotoxic" | "Non-Venomous";
  riskColor: string;
  commonLocations: string;
  typicalLength: string;
  distinguishingFeatures: string;
  firstAid: string;
}
