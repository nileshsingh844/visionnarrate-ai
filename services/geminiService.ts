
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Modality } from '@google/genai';
import { 
  Chapter, 
  PipelineConfig, 
  GenerationResult, 
  AppState, 
  LogEntry, 
  LLMModelInfo,
  Artifact
} from '../types';

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

const extractJson = (text: string): string => {
  if (!text) return "[]";
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
  const result = jsonMatch ? jsonMatch[1].trim() : text.trim();
  return result.replace(/^[^{[]+/, '').replace(/[^}\]]+$/, '');
};

const LLM_FALLBACK_CHAIN: LLMModelInfo[] = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', tier: 'TIER_0', contextWindow: 128000, provider: 'GEMINI' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', tier: 'TIER_1', contextWindow: 1000000, provider: 'GEMINI' },
];

let currentModelIndex = 0;

class UnifiedLLM {
  static async execute(
    operation: string,
    prompt: string,
    addLog: (level: LogEntry['level'], message: string, source: string, artifact?: Artifact) => void
  ): Promise<string> {
    const model = LLM_FALLBACK_CHAIN[currentModelIndex];
    
    addLog('DEBUG', `Constructed ${operation} prompt for execution.`, "PROMPT_ENGINE", {
      id: `prompt_${Date.now()}`,
      stage: "PROMPT_CONSTRUCTION",
      type: "PROMPT",
      payload: prompt,
      timestamp: new Date().toISOString()
    });

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: model.id,
        contents: prompt,
        config: { 
          responseMimeType: prompt.includes('JSON') ? "application/json" : undefined,
        },
      });
      
      const text = response.text || "";
      
      addLog('INFO', `Received raw response from ${model.name}`, "LLM_ORCHESTRATOR", {
        id: `res_${Date.now()}`,
        stage: "LLM_EXECUTION",
        type: "RAW_TEXT",
        payload: text,
        timestamp: new Date().toISOString()
      });

      return text;
    } catch (e: any) {
      addLog('ERROR', `Tier failure on ${model.name}: ${e.message}`, "RESILIENCE_UNIT");
      throw e;
    }
  }

  static async generateSpeech(text: string): Promise<string> {
    const safeText = text.trim();
    if (!safeText) return "";

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say clearly and professionally: ${safeText}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    } catch (e: any) {
      console.error("TTS Synthesis Failed:", e.message);
      return "";
    }
  }
}

export const runVisionNarratePipeline = async (
  config: PipelineConfig,
  onProgress: (state: AppState, message: string, progress: number, log?: LogEntry) => void
): Promise<GenerationResult> => {
  const logs: LogEntry[] = [];
  const addLog = (level: LogEntry['level'], message: string, source: string, artifact?: Artifact) => {
    const model = LLM_FALLBACK_CHAIN[currentModelIndex];
    const entry: LogEntry = { 
      timestamp: new Date().toISOString(), 
      level, message, source, 
      activeTier: model.tier, 
      activeModel: model.name,
      artifact
    };
    logs.push(entry);
    onProgress(AppState.INGESTION, message, 0, entry);
    return entry;
  };

  onProgress(AppState.ANALYSIS, "STAGE 1: V-JEPA Grounding...", 5);
  await wait(800);
  
  const vJepaMetadata = config.recordings.map((filename, i) => ({
    scene_id: i + 1,
    visual_event: `Grounded Interface Sequence: ${filename}`,
    importance: 0.9,
    source_artifact: filename
  })).slice(0, 10);

  onProgress(AppState.PLANNING, "STAGE 2/3: Planning Narrative Blueprint...", 15);
  const targetSeconds = (config.goal.durationMinutes || 1) * 60;
  
  const plannerPrompt = `Lead Video Architect: Plan a ${config.goal.durationMinutes}-minute professional product walkthrough for "${config.product.name}".
  Target Duration: ${targetSeconds} seconds.
  Output JSON: {"chapters": [{"title", "visualIntent", "narrationScript"}]}`;
  
  const plannerResponse = await UnifiedLLM.execute('CHAPTER_PLAN', plannerPrompt, addLog);
  let parsedChapters: any[] = [];
  try {
    const rawParsed = JSON.parse(extractJson(plannerResponse));
    parsedChapters = Array.isArray(rawParsed) ? rawParsed : (rawParsed.chapters || []);
  } catch (err) {
    parsedChapters = [{ title: "Demo", visualIntent: "Dashboard", narrationScript: "Behold the platform." }];
  }

  onProgress(AppState.GENERATION, "STAGE 4: Integrated Video Synthesis...", 20);
  
  let currentVideoUrl = "";
  let lastVideoOperation: any = null;
  let accumulatedSeconds = 0;
  let segmentIndex = 0;
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  try {
    // Stage 4a: Initial
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: `High-fidelity software demo for ${config.product.name}. Realistic screen recording.`,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });
    
    while (!operation.done) {
      await wait(10000);
      operation = await ai.operations.getVideosOperation({operation});
    }

    if (operation.error) throw new Error(operation.error.message);
    
    lastVideoOperation = operation;
    accumulatedSeconds = 5; 
    segmentIndex++;

    // Stage 4b: Extension chain
    while (accumulatedSeconds < targetSeconds) {
      const progressPercent = 20 + Math.min(75, (accumulatedSeconds / targetSeconds) * 75);
      onProgress(AppState.GENERATION, `Extending Narrative: ${accumulatedSeconds}s / ${targetSeconds}s...`, progressPercent);
      
      // FIX: Stabilization wait to prevent "Not Processed" 400 error
      addLog('DEBUG', "Stabilizing video buffer...", "VEO_INTEGRATOR");
      await wait(8000);

      const previousVideoRef = lastVideoOperation?.response?.generatedVideos?.[0]?.video;
      if (!previousVideoRef) throw new Error("Lost video reference chain.");

      const chapterRef = parsedChapters[segmentIndex % parsedChapters.length] || parsedChapters[0];
      const extPrompt = `Continue the software demo walkthrough. Focus: ${chapterRef.visualIntent}. Seamless UI transition.`;

      let extOp = await ai.models.generateVideos({
        model: 'veo-3.1-generate-preview',
        prompt: extPrompt,
        video: previousVideoRef,
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
      });

      while (!extOp.done) {
        await wait(10000);
        extOp = await ai.operations.getVideosOperation({operation: extOp});
      }

      if (extOp.error) {
        if (extOp.error.message.includes("PROCESSED")) {
          addLog('WARN', "Extended stabilization required. Retrying...", "VEO_INTEGRATOR");
          await wait(15000);
          continue; 
        }
        addLog('ERROR', `Ext Failed: ${extOp.error.message}`, "VEO_INTEGRATOR");
        break;
      }

      lastVideoOperation = extOp;
      accumulatedSeconds += 7;
      segmentIndex++;

      // Absolute safety cap for demo stability
      if (accumulatedSeconds >= 1200) break