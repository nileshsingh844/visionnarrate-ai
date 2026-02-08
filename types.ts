
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export enum AppState {
  IDLE,
  INGESTION,
  ANALYSIS, // V-JEPA Stage
  PLANNING, // LLM Planning Stage
  GENERATION, // Video Gen Stage
  ASSEMBLY, // FFmpeg / Final Stitch Stage
  SUCCESS,
  ERROR,
  FORENSIC, // Dashboard view for artifact inspection
}

export enum VideoType {
  DEMO = 'Product Demo',
  EXPLAINER = 'Technical Explainer',
  TRAINING = 'Internal Training',
  PROMO = 'Product Showcase'
}

export enum VideoTone {
  TECHNICAL = 'Technical & Deep',
  EXECUTIVE = 'Executive Summary',
  FRIENDLY = 'Developer Friendly',
  CINEMATIC = 'Cinematic Story'
}

export type LLMTier = 'TIER_0' | 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4';

// Fix: Missing LLMModelInfo interface definition exported for service layer orchestration
export interface LLMModelInfo {
  id: string;
  name: string;
  tier: LLMTier;
  contextWindow: number;
  provider: string;
}

export interface Artifact {
  id: string;
  stage: string;
  type: 'JSON' | 'PROMPT' | 'METADATA' | 'RAW_TEXT';
  payload: any;
  timestamp: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'DEBUG' | 'WARN' | 'ERROR';
  message: string;
  source: string;
  activeTier?: LLMTier;
  activeModel?: string;
  artifact?: Artifact; // Every major log can carry a persistent artifact
}

export interface Chapter {
  id: number;
  title: string;
  durationSeconds: number;
  visualIntent: string;
  narrationScript: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  videoUrl?: string;
  retryCount: number;
  metadata: any;
}

export interface PipelineConfig {
  product: {
    name: string;
    targetUsers: string;
    coreProblem: string;
    differentiators: string;
    constraints: string;
  };
  goal: {
    type: string;
    durationMinutes: number;
    tone: string;
    audience: string;
  };
  recordings: string[];
}

export interface GenerationResult {
  chapters: Chapter[];
  finalVideoUrl: string;
  finalAudioUrl?: string | null;
  totalDuration: number;
  logs: LogEntry[];
  fixesApplied: number;
  finalTier: LLMTier;
}
