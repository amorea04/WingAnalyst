
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AnalysisResult, ChatMessage } from '../types';
import { askFollowUp } from '../services/geminiService';
import RadarChart from './RadarChart';

declare var html2pdf: any;

interface AnalysisResultViewProps {
  result: AnalysisResult;
  onReset: () => void;
}

const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({ result, onReset }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editableDossier, setEditableDossier] = useState(result.dossier);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const scrollUp = () => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    };
    requestAnimationFrame(scrollUp);
    setTimeout(scrollUp, 100);
  }, []);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    const newUserMsg: ChatMessage = { role: 'user', text: userInput };
    setChatHistory(prev => [...prev, newUserMsg]);
    setUserInput('');
    setIsTyping(true);
    try {
      const response = await askFollowUp([...chatHistory, newUserMsg], editableDossier);
      setChatHistory(prev => [...prev, { role: 'model', text: response || 'Erreur de réponse.' }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'model', text: 'Erreur technique.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const generatePDF = async () => {
    if (isEditing) setIsEditing(false);
    setIsExporting(true);
    
    setTimeout(async () => {
      const element = reportRef.current;
      if (!element) {
        setIsExporting(false);
        return;
      }
      
      const opt = {
        margin: 10,
        filename: 'Expertise_WingAnalyst.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      try {
        await html2pdf().set(opt).from(element).save();
      } catch (err) {
        console.error("PDF Error:", err);
      } finally {
        setIsExporting(false);
      }
    }, 800);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-24 px-4 animate-in">
      {/* Barre d'outils */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-slate-900 text-white p-6 md:p-8 rounded-[2rem] shadow-2xl border border-white/10 no-print">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <i className="fas fa-file-contract text-xl text-white"></i>
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">Expertise Technique</h1>
            <p className="text-orange-300 text-[10px] font-bold uppercase tracking-widest">Généré par Wing Analyst</p>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={() => setIsEditing(!isEditing)} className={`${isEditing ? 'bg-orange-500' : 'bg-white/10'} hover:opacity-90 px-5 py-2.5 rounded-xl transition-all font-bold text-xs flex items-center gap-2`}>
            <i className={`fas ${isEditing ? 'fa-check' : 'fa-pen'}`}></i> {isEditing ? 'Valider' : 'Éditer'}
          </button>
          <button 
            onClick={generatePDF} 
            disabled={isExporting} 
            className="bg-orange-600 hover:bg-orange-500 px-5 py-2.5 rounded-xl transition-all font-bold text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            <i className={isExporting ? "fas fa-spinner fa-spin" : "fas fa-file-pdf"}></i> 
            {isExporting ? 'Export...' : 'PDF'}
          </button>
          <button onClick={onReset} className="bg-slate-700 hover:bg-slate-600 px-5 py-2.5 rounded-xl transition-all font-bold text-xs">
            Nouveau Profil
          </button>
        </div>
      </div>

      <article 
        ref={reportRef}
        className={`bg-white rounded-[2.5rem] shadow-xl border border-slate-100 transition-all ${isEditing ? 'p-4' : 'p-8 md:p-16'}`}
      >
        {isEditing ? (
          <textarea
            className="w-full min-h-[600px] p-8 border-2 border-slate-100 rounded-3xl font-mono text-sm text-slate-700 bg-slate-50 outline-none"
            value={editableDossier}
            onChange={(e) => setEditableDossier(e.target.value)}
          />
        ) : (
          <div className="markdown-content">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]} 
              components={{
                p: ({children}) => {
                  // Détection du tag [CHART] même s'il est entouré d'autres textes ou mal formaté
                  const textContent = React.Children.toArray(children).join("").trim();
                  if (textContent.includes('[CHART]')) {
                    return result.chartData && result.chartData.length > 0 ? (
                      <div className="my-12 flex flex-col items-center w-full overflow-visible">
                        <RadarChart data={result.chartData} />
                      </div>
                    ) : (
                      <div className="my-12 p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-center text-slate-400 font-bold italic">
                        Chargement des données du graphique comparatif...
                      </div>
                    );
                  }
                  return <p className="mb-6">{children}</p>;
                },
                h2: (p) => <h2 className="text-2xl font-black text-slate-900 mt-16 mb-8 border-b-4 border-orange-600 pb-2 inline-block" {...p} />,
                h3: (p) => <h3 className="text-xl font-bold text-orange-700 mt-10 mb-4 bg-orange-50/50 p-4 rounded-xl border-l-4 border-orange-600" {...p} />,
                table: (p) => <div className="my-8 overflow-x-auto"><table className="min-w-full border-collapse" {...p} /></div>,
              }}
            >
              {editableDossier}
            </ReactMarkdown>

            {result.sources && result.sources.length > 0 && (
              <div className="mt-16 pt-8 border-t border-slate-100 no-print">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Sources consultées</h3>
                <div className="flex flex-wrap gap-3">
                  {result.sources.map((source, idx) => source.web && (
                    <a key={idx} href={source.web.uri} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-slate-50 hover:bg-orange-50 text-slate-600 px-4 py-2 rounded-xl border border-slate-100 transition-all text-xs font-bold">
                      <i className="fas fa-external-link-alt"></i> {source.web.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </article>

      {/* Dialogue Expert */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl border border-white/5 no-print">
        <h3 className="text-xl font-bold mb-8 flex items-center gap-4 text-orange-400">
          <i className="fas fa-comments"></i> Dialogue Expert
        </h3>
        <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm ${msg.role === 'user' ? 'bg-orange-600' : 'bg-slate-800 border border-white/5'}`}>
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          ))}
          {isTyping && <div className="animate-pulse flex gap-2"><div className="w-2 h-2 bg-orange-500 rounded-full"></div><div className="w-2 h-2 bg-orange-500 rounded-full animation-delay-200"></div></div>}
          <div ref={chatEndRef} />
        </div>
        <div className="flex gap-3 bg-slate-800 p-2 rounded-2xl">
          <input type="text" placeholder="Une question ?" className="flex-1 bg-transparent border-none focus:ring-0 px-4 text-white" value={userInput} onChange={e => setUserInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} />
          <button onClick={handleSendMessage} disabled={isTyping} className="bg-orange-600 hover:bg-orange-500 px-6 py-3 rounded-xl transition-all font-bold">Poser</button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResultView;
