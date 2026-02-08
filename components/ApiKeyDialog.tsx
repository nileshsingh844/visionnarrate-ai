
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { KeyIcon } from './icons';

interface ApiKeyDialogProps {
  onContinue: () => void;
}

const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ onContinue }) => {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#0A0A0A] border border-white/10 rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.5)] max-w-lg w-full p-12 text-center flex flex-col items-center ring-1 ring-white/10">
        <div className="bg-indigo-600/20 p-6 rounded-3xl mb-8 ring-1 ring-indigo-500/30">
          <KeyIcon className="w-12 h-12 text-indigo-400" />
        </div>
        <h2 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase">Project Key Required</h2>
        {/* Added mandatory billing documentation link */}
        <p className="text-slate-400 mb-6 font-medium leading-relaxed">
          Veo synthesis requires a paid API key. In this environment, you do not paste strings directly. 
          <br/><br/>
          To use a teammate's key, click below and <strong>select their project</strong> in the secure system dialog that appears.
          For more information, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline hover:text-indigo-300">billing documentation</a>.
        </p>
        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl mb-8 w-full">
           <p className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest">
             Platform Security Policy: Keys managed via Project Selector
           </p>
        </div>
        <button
          onClick={onContinue}
          className="w-full px-8 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/30"
        >
          Open Project Selector
        </button>
      </div>
    </div>
  );
};

export default ApiKeyDialog;
