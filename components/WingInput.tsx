
import React, { useState } from 'react';

interface WingInputProps {
  onAnalyze: (wings: string[], includeSuggestions: boolean) => void;
  onBack: () => void;
}

const WingInput: React.FC<WingInputProps> = ({ onAnalyze, onBack }) => {
  const [wings, setWings] = useState<string[]>([]);
  const [newWing, setNewWing] = useState('');
  const [includeSuggestions, setIncludeSuggestions] = useState(true);

  const addWing = () => {
    if (newWing.trim() && !wings.includes(newWing.trim())) {
      setWings([...wings, newWing.trim()]);
      setNewWing('');
    }
  };

  const removeWing = (name: string) => {
    setWings(wings.filter(w => w !== name));
  };

  const showSuggestionToggle = wings.length >= 0 && wings.length <= 3;

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-2xl mx-auto animate-in">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-xl text-slate-400 hover:text-orange-600 transition-colors">
          <i className="fas fa-chevron-left text-lg"></i>
        </button>
        <h2 className="text-2xl font-black flex items-center gap-3">
          <i className="fas fa-wind text-orange-600"></i>
          Dossier de Sélection
        </h2>
      </div>

      <p className="text-slate-500 mb-8 font-medium">
        Indiquez les modèles que vous ciblez pour une analyse comparative.
      </p>

      <div className="flex gap-3 mb-10">
        <input 
          type="text"
          className="flex-1 p-4 border-2 border-slate-50 rounded-2xl focus:border-orange-500 outline-none transition-all placeholder-slate-300 font-bold bg-slate-50/50"
          placeholder="Ex: Advance Iota DLS"
          value={newWing}
          onChange={e => setNewWing(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && addWing()}
        />
        <button 
          onClick={addWing}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl hover:bg-black transition-colors font-black uppercase text-xs tracking-widest"
        >
          Ajouter
        </button>
      </div>

      <div className="space-y-3 mb-10">
        {wings.map(wing => (
          <div key={wing} className="flex items-center justify-between p-5 bg-orange-50/50 rounded-2xl border border-orange-100 group animate-in">
            <span className="font-black text-slate-800">{wing}</span>
            <button 
              onClick={() => removeWing(wing)}
              className="text-orange-300 hover:text-red-500 p-2 transition-colors"
            >
              <i className="fas fa-times-circle text-xl"></i>
            </button>
          </div>
        ))}
        {wings.length === 0 && (
          <div className="text-center py-14 text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
            <i className="fas fa-parachute-box mb-4 text-4xl opacity-10"></i>
            <p className="text-sm font-medium">La sélection est vide.<br/>L'IA vous proposera les meilleurs modèles du marché.</p>
          </div>
        )}
      </div>

      {showSuggestionToggle && (
        <div className="mb-10 p-6 bg-slate-900 rounded-[2rem] border border-white/5 flex items-center justify-between text-white shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <i className="fas fa-wand-magic-sparkles"></i>
            </div>
            <div>
              <p className="text-sm font-black">Expertise Étendue</p>
              <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Suggestions intelligentes incluses</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={includeSuggestions}
              onChange={() => setIncludeSuggestions(!includeSuggestions)}
            />
            <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-600"></div>
          </label>
        </div>
      )}

      <button 
        onClick={() => onAnalyze(wings, includeSuggestions)}
        className="w-full bg-orange-600 text-white font-black py-6 rounded-3xl transition-all shadow-xl hover:bg-orange-500 hover:shadow-orange-200 flex items-center justify-center gap-4 group"
      >
        <i className="fas fa-microchip group-hover:rotate-12 transition-transform"></i>
        LANCER L'EXPERTISE TECHNIQUE
      </button>
    </div>
  );
};

export default WingInput;
