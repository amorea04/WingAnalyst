
import React, { useState, useEffect } from 'react';

const messages = [
  "Accès aux bases de données constructeurs...",
  "Extraction des rapports d'homologation...",
  "Analyse de la structure interne : SharkNose et cellules...",
  "Croisement des tests experts (Ziad Bassil, Flybubble)...",
  "Évaluation de l'allongement et de la sécurité passive...",
  "Calcul du saut de performance par rapport à votre profil...",
  "Synthèse de l'expertise technique...",
  "Mise en page du dossier final..."
];

const LoadingScreen: React.FC = () => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="relative mb-16">
        <div className="w-32 h-32 border-[12px] border-orange-50 border-t-orange-600 rounded-full animate-spin shadow-inner"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-600">
          <i className="fas fa-parachute-box text-3xl animate-bounce"></i>
        </div>
      </div>
      
      <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">
        Analyse des voiles, adéquation avec le profile du pilote...
      </h2>
      
      <div className="h-10">
        <p className="text-xl text-orange-600 font-black italic animate-in">
          {messages[msgIndex]}
        </p>
      </div>
      
      <div className="mt-20 max-w-lg bg-slate-900 p-8 rounded-[2.5rem] text-slate-300 border border-white/5 shadow-2xl">
        <div className="flex items-start gap-5 text-left">
          <i className="fas fa-info-circle text-orange-500 text-2xl mt-1"></i>
          <p className="text-sm font-medium leading-relaxed">
            <strong>Note de l'Expert :</strong> L'IA consulte des sources web réelles en temps réel pour garantir des données constructeurs vérifiées. Cette expertise approfondie prend environ 45 à 60 secondes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
