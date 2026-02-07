# VisionNarrate AI

VisionNarrate AI is a production-grade, product-aware video generation platform that creates accurate long-form explanation and demonstration videos from real application recordings.

Unlike generic AI video generators, VisionNarrate AI first learns how a product actually behaves visually and temporally via V-JEPA, then uses that understanding to generate structured, grounded, and reliable videos.

---

## 🏗️ Inheritance Architecture

The system uses a **Multi-LLM Inheritance DAG** to support 30-minute+ videos safely:

1.  **Ingestion Layer**: Video source persistence in GCP Cloud Storage.
2.  **Representation Layer (V-JEPA)**: Self-supervised temporal understanding and importance calibration.
3.  **Master Planner (Gemini 3 Pro)**: Narrative architecture and chapter decomposition.
4.  **Synthesis Workers (Veo 3.1)**: Sequential segment generation with latent frame inheritance.
5.  **Media Assembly**: FFmpeg stitching, audio normalization, and 4K export.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Orchestration**: Gemini 3 Pro (Planning), Veo 3.1 (Synthesis)
- **Computer Vision**: V-JEPA (Temporal Representation Learning)
- **Infra (Proposed)**: Google Cloud Run, Vertex AI, Cloud Storage

---

## 🚀 Key Features

- **Ground Truth Ingestion**: Input-driven synthesis, not prompt-driven.
- **Scene Importance Calibration**: Automatic removal of noise/idle frames.
- **Judge-Defensible Traceability**: Full observability into scene scores and embeddings.
- **Deterministic Long-Form**: multi-stage pipeline avoids LLM context drift.

---

## ⚖️ License

SPDX-License-Identifier: Apache-2.0