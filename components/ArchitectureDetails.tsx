
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Layers, Database, Cpu, Share2, Activity } from 'lucide-react';

export default function ArchitectureDetails() {
  const steps = [
    {
      title: 'V-JEPA Representation',
      desc: 'Self-supervised temporal learning on ground-truth product recordings.',
      icon: <Cpu className="w-5 h-5 text-indigo-400" />,
      tag: 'ML CORE'
    },
    {
      title: 'Master Planner (Gemini)',
      desc: 'Long-form narrative decomposition into deterministic Chapter DAGs.',
      icon: <Activity className="w-5 h-5 text-blue-400" />,
      tag: 'ORCHESTRATION'
    },
    {
      title: 'Inheritance Synthesis',
      desc: 'Segment workers passing latent state for frame-to-frame continuity.',
      icon: <Share2 className="w-5 h-5 text-emerald-400" />,
      tag: 'VEO CHAIN'
    },
    {
      title: 'Media Assembly',
      desc: 'FFmpeg normalization, audio ducking, and HD master export.',
      icon: <Database className="w-5 h-5 text-slate-400" />,
      tag: 'INFRA'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
      {steps.map((step, i) => (
        <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl hover:border-indigo-500/20 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/5 rounded-lg group-hover:bg-indigo-500/10 transition-colors">
              {step.icon}
            </div>
            <span className="text-[8px] font-black tracking-[0.2em] text-slate-600 uppercase">{step.tag}</span>
          </div>
          <h5 className="text-xs font-bold text-slate-200 mb-2">{step.title}</h5>
          <p className="text-[10px] text-slate-500 leading-relaxed">{step.desc}</p>
        </div>
      ))}
    </div>
  );
}
