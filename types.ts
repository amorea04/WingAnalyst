
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

export interface AnalysisResult {
  dossier: string;
  sources: GroundingSource[];
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
