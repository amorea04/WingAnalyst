
export interface PilotProfile {
  experience: string;
  currentWing: string;
  ptv: number;
  flightTypes: string[];
  ambitions: string;
}

export interface GroundingSource {
  web?: {
    uri: string;
    title: string;
  };
}

export interface RadarData {
  label: string;
  metrics: {
    safety: number;      // Sécurité passive
    performance: number; // Plané / Finesse
    handling: number;    // Maniabilité / Virage
    accessibility: number; // Exigence technique (10 = très accessible)
    speed: number;       // Vitesse / Pénétration
  };
}

export interface AnalysisResult {
  dossier: string;
  sources: GroundingSource[];
  chartData?: RadarData[];
}

export enum AppStep {
  PROFILE,
  QUESTIONS,
  WINGS,
  ANALYZING,
  RESULT
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
