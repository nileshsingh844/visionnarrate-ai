
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Video } from '@google/genai';

export enum AppState {
  IDLE,
  SENTINEL,      // Active monitoring/scanning mode
  INGESTION,     // File Upload & Storage Persistence
  ANALYSIS,      // V-JEPA Representation Learning & Scene Metadata extraction
  PLANNING,      // Master Planner LLM: Chapter Architecture
  GENERATION,    // Step-wise Segment Synthesis (Child LLMs + Veo)
  HEALING,       // Autonomous patch application
  FORENSIC,      // AI Deep-dive into log failures
  ASSEMBLY,      // FFmpeg Stitching & Normalization
  SUCCESS,
  ERROR,
}

export enum VideoType {
  HACKATHON = 'Hackathon Explanation',
  DEMO = 'Product Deep-Dive',
  MARKETING = 'Investor / Marketing',
}

export enum VideoTone {
  TECHNICAL = 'Highly Technical',
  STORYTELLING = 'Narrative Storytelling',
  PROFESSIONAL = 'Corporate / Investor',
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'DEBUG' | 'WARN' | 'ERROR';
  message: string;
  source: string;
  traceId?: string;
}

export interface SceneMetadata {
  id: string;
  importanceScore: number; // Normalized 0.0 - 1.0 (V-JEPA derived)
  visualEvent: string;     // e.g., "Dashboard Anomaly", "CLI Input"
  timestamp: string;       // In-recording offset
  meaningfulChange: boolean;
  duplicateSuppressed: boolean;
  embeddingVector?: number[]; // Representing V-JEPA latent space
}

export interface ProductContext {
  name: string;
  targetUsers: string;
  coreProblem: string;
  differentiators: string;
  constraints: string;
}

export interface VideoGoal {
  type: VideoType;
  durationMinutes: number;
  tone: VideoTone;
  audience: string;
}

export interface Chapter {
  id: number;
  title: string;
  durationSeconds: number;
  visualIntent: string;    // Output from Master Planner
  narrationScript: string; // Grounded in Product Context
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  videoUrl?: string;
  retryCount: number;
  metadata: SceneMetadata; // High-fidelity V-JEPA derived data
}

export interface PipelineConfig {
  product: ProductContext;
  goal: VideoGoal;
  recordings: string[]; // List of URIs/Filenames
}

export interface GenerationResult {
  chapters: Chapter[];
  finalVideoUrl: string;
  finalAudioUrl?: string | null;
  totalDuration: number;
  vjepaInsights: SceneMetadata[];
  logs: LogEntry[];
  fixesApplied: number;
}
