
import React, { useState, useLayoutEffect } from 'react';
import { AppStep, PilotProfile, AnalysisResult } from './types';
import ProfileForm from './components/ProfileForm';
import WingInput from './components/WingInput';
import LoadingScreen from './components/LoadingScreen';
import AnalysisResultView from './components/AnalysisResultView';
import { analyzeWings, checkProfileCompleteness } from './services/geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.PROFILE);
  const [profile, setProfile] = useState<PilotProfile | null>(null);
  const [wings, setWings] = useState<string[]>([]);
  const [missingQuestions, setMissingQuestions] = useState<string[]>([]);
  const [clarifications, setClarifications] = useState<string>('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [step]);

  const handleProfileSubmit = async (p: PilotProfile) => {
    setErrorMessage(null);
    setProfile(p);
    setIsChecking(true);
    try {
      const data = await checkProfileCompleteness(p);
      if (data && !data.isComplete && data.questions && data.questions.length > 0) {
        setMissingQuestions(data.questions);
        setStep(AppStep.QUESTIONS);
      } else {
        setStep(AppStep.WINGS);
      }
    } catch (e: any) {
      if (e.message === "QUOTA_EXCEEDED") {
        setErrorMessage("Le service est très sollicité. Réessayez dans 30 secondes.");
      } else if (e.message === "API_KEY_INVALID" || e.message?.includes("API key")) {
        setErrorMessage("La clé API configurée est absente ou invalide. Vérifiez vos variables d'environnement (API_KEY) et redéployez l'application.");
      } else {
        console.error("Erreur profil:", e);
        setStep(AppStep.WINGS);
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleStartAnalysis = async (w: string[], includeSuggestions: boolean) => {
    if (!profile) return;
    setErrorMessage(null);
    const finalExperience = profile.experience + (clarifications ? "\n\nPrécisions: " + clarifications : "");
    const finalProfile = { ...profile, experience: finalExperience };
    
    setWings(w);
    setStep(AppStep.ANALYZING);
    
    try {
      const data = await analyzeWings(finalProfile, w, includeSuggestions);
      setResult(data);
      setStep(AppStep.RESULT);
    } catch (e: any) {
      console.error("Erreur analyse:", e);
      if (e.message === "QUOTA_EXCEEDED") {
        setErrorMessage("Quota API dépassé. Merci de patienter 60 secondes.");
        setStep(AppStep.WINGS);
      } else if (e.message === "API_KEY_INVALID") {
        setErrorMessage("Erreur de clé API au moment de l'analyse. Vérifiez la configuration du projet.");
        setStep(AppStep.WINGS);
      } else {
        setErrorMessage(`Une erreur est survenue : ${e.message || "Erreur technique"}`);
        setStep(AppStep.WINGS);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-slate-900 text-white py-8 shadow-2xl sticky top-0 z-50 border-b border-white/5 no-print">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-orange-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <i className="fas fa-compass text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-none uppercase">WING ANALYST</h1>
              <p className="text-orange-400 text-[10px] font-black tracking-[0.25em] uppercase mt-1 opacity-90">L'IA t'aide à choisir ta voile !</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12">
        {errorMessage && (
          <div className="max-w-2xl mx-auto mb-6 bg-red-50 border-2 border-red-200 p-6 rounded-2xl text-red-700 font-bold text-sm animate-in flex items-center gap-4 shadow-lg">
            <i className="fas fa-exclamation-circle text-2xl"></i>
            <div>{errorMessage}</div>
          </div>
        )}

        {step === AppStep.PROFILE && (
          <div className="max-w-2xl mx-auto">
            <ProfileForm onComplete={handleProfileSubmit} />
            {isChecking && (
              <div className="mt-8 text-center text-orange-600 animate-pulse font-black text-xs uppercase tracking-widest">
                Analyse IA du profil en cours...
              </div>
            )}
          </div>
        )}

        {step === AppStep.QUESTIONS && (
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-2xl mx-auto border-2 border-orange-500 animate-in">
            <h2 className="text-3xl font-black mb-6">Précisions de l'Expert</h2>
            <p className="text-slate-500 mb-8 font-medium italic">Pour une analyse fiable, l'IA a besoin de ces compléments :</p>
            <div className="space-y-4 mb-10">
              {missingQuestions.map((q, i) => (
                <div key={i} className="bg-orange-50 p-5 rounded-2xl text-orange-900 font-bold flex gap-4 border border-orange-100 items-center">
                  <i className="fas fa-bolt text-orange-500"></i> {q}
                </div>
              ))}
            </div>
            <textarea 
              className="w-full p-5 border-2 border-slate-50 rounded-2xl mb-8 focus:border-orange-500 outline-none font-bold bg-slate-50/50" 
              rows={4} 
              placeholder="Ex: Je vole environ 30h par an, principalement en thermique calme..." 
              value={clarifications} 
              onChange={e => setClarifications(e.target.value)} 
            />
            <div className="flex gap-4">
              <button onClick={() => setStep(AppStep.PROFILE)} className="flex-1 bg-slate-100 text-slate-500 font-black py-5 rounded-2xl hover:bg-slate-200 transition-all">RETOUR</button>
              <button onClick={() => setStep(AppStep.WINGS)} className="flex-[2] bg-orange-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-orange-500 transition-all">VALIDER ET CONTINUER</button>
            </div>
          </div>
        )}

        {step === AppStep.WINGS && (
          <WingInput onAnalyze={handleStartAnalysis} onBack={() => setStep(AppStep.PROFILE)} />
        )}

        {step === AppStep.ANALYZING && <LoadingScreen />}

        {step === AppStep.RESULT && result && (
          <AnalysisResultView result={result} onReset={() => setStep(AppStep.PROFILE)} />
        )}
      </main>
    </div>
  );
};

export default App;
