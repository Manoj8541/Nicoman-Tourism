// client/src/lib/aiModels.js
// ─── Pure Lazy-Loaded AI Model Manager ────────────────────────────────────────
// Zero top-level imports of @xenova/transformers.
// This prevents initial page load crashes, blank screens, and bundle bloat.
// Both pipelines are dynamically loaded on-demand and cached for the session.

let transformersModulePromise = null;
let sentimentPipelinePromise = null;
let intentPipelinePromise = null;

// ─── Lazy load the transformers module ────────────────────────────────────────
async function getTransformers() {
  if (!transformersModulePromise) {
    transformersModulePromise = (async () => {
      const mod = await import('@xenova/transformers');
      const env = mod.env;
      if (env) {
        env.allowLocalModels = false;
        env.useBrowserCache = true;
        if (env.backends?.onnx?.wasm) {
          env.backends.onnx.wasm.numThreads = 1;
        }
      }
      return mod;
    })().catch(err => {
      transformersModulePromise = null;
      console.warn('[aiModels] Failed to load @xenova/transformers:', err?.message || err);
      throw err;
    });
  }
  return transformersModulePromise;
}

// ─── Load the sentiment pipeline (once per session) ───────────────────────────
export async function loadSentimentPipeline() {
  if (!sentimentPipelinePromise) {
    sentimentPipelinePromise = (async () => {
      const { pipeline } = await getTransformers();
      return pipeline(
        'sentiment-analysis',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        { quantized: true }
      );
    })().catch(err => {
      sentimentPipelinePromise = null;
      console.warn('[aiModels] Sentiment model load failed:', err?.message || err);
      throw err;
    });
  }
  return sentimentPipelinePromise;
}

// ─── Load the intent classification pipeline (once per session) ──────────────
export async function loadIntentPipeline() {
  if (!intentPipelinePromise) {
    intentPipelinePromise = (async () => {
      const { pipeline } = await getTransformers();
      return pipeline(
        'zero-shot-classification',
        'Xenova/distilbert-base-uncased-mnli',
        { quantized: true }
      );
    })().catch(err => {
      intentPipelinePromise = null;
      console.warn('[aiModels] Intent model load failed:', err?.message || err);
      throw err;
    });
  }
  return intentPipelinePromise;
}

// Helper with timeout to ensure UI never hangs
function withTimeout(promise, ms = 8000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ]);
}

// ─── Classify a piece of feedback text as positive/negative/neutral ───────────
// Returns: 'positive' | 'negative' | 'neutral' | null (on failure)
export async function classifySentiment(text) {
  if (!text?.trim()) return null;
  try {
    const classifier = await withTimeout(loadSentimentPipeline(), 8000);
    const result = await classifier(text.slice(0, 512));
    if (!result || !result[0]) return null;
    const { label, score } = result[0];
    if (score < 0.6) return 'neutral';
    if (label === 'POSITIVE') return 'positive';
    if (label === 'NEGATIVE') return 'negative';
    return 'neutral';
  } catch (err) {
    console.warn('[aiModels] Sentiment classification skipped/failed:', err?.message || err);
    return null;
  }
}

// ─── Classify a chat message into a known intent ──────────────────────────────
// Returns: 'hotels' | 'ferries' | 'tourist places' | 'booking help' | 'general question' | null (on failure)
const INTENT_LABELS = ['hotels', 'ferries', 'tourist places', 'booking help', 'general question'];

export async function classifyIntent(text) {
  if (!text?.trim()) return null;
  try {
    const classifier = await withTimeout(loadIntentPipeline(), 8000);
    const result = await classifier(text.slice(0, 512), INTENT_LABELS);
    if (result && Array.isArray(result.labels) && result.labels.length > 0) {
      return result.labels[0];
    }
    return null;
  } catch (err) {
    console.warn('[aiModels] Intent classification skipped/failed:', err?.message || err);
    return null;
  }
}
