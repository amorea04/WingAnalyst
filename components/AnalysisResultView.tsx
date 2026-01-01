
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AnalysisResult, ChatMessage } from '../types';
import { askFollowUp } from '../services/geminiService';

declare var html2pdf: any;

interface AnalysisResultViewProps {
  result: AnalysisResult;
  onReset: () => void;
}

const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({ result, onReset }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editableDossier, setEditableDossier] = useState(result.dossier);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const printContentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    const newUserMsg: ChatMessage = { role: 'user', text: userInput };
    setChatHistory(prev => [...prev, newUserMsg]);
    setUserInput('');
    setIsTyping(true);
    try {
      const response = await askFollowUp([...chatHistory, newUserMsg], editableDossier);
      setChatHistory(prev => [...prev, { role: 'model', text: response || 'L\'expert n\'a pas pu répondre.' }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'model', text: 'Une erreur technique empêche la réponse.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const generatePDF = async () => {
    if (isEditing) setIsEditing(false);
    setIsExporting(true);

    // Petit délai pour s'assurer que le DOM est prêt
    setTimeout(async () => {
      const element = printContentRef.current;
      if (!element) return;

      const opt = {
        margin: [15, 15, 20, 15], // Marges [Haut, Gauche, Bas, Droite]
        filename: `WingAnalyst_Rapport_${new Date().getTime().toString().slice(-4)}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { 
          scale: 2, // 2 est suffisant pour la lisibilité et évite les crashs mémoire
          useCORS: true, 
          letterRendering: true,
          logging: false
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      try {
        await html2pdf().set(opt).from(element).save();
      } catch (err) {
        console.error("Erreur lors de la génération du PDF:", err);
        alert("Une erreur est survenue lors de l'export PDF.");
      } finally {
        setIsExporting(false);
      }
    }, 500);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(editableDossier).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
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
            <h1 className="text-xl font-black">Rapport d'Expertise</h1>
            <p className="text-orange-300 text-[10px] font-bold uppercase tracking-widest">IA Wing Analyst Engineering</p>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
          <button onClick={() => setIsEditing(!isEditing)} className={`${isEditing ? 'bg-orange-500' : 'bg-white/10'} hover:opacity-90 px-4 py-2.5 rounded-xl transition-all font-bold text-xs flex items-center gap-2`}>
            <i className={`fas ${isEditing ? 'fa-check' : 'fa-pen'}`}></i> {isEditing ? 'Valider' : 'Éditer'}
          </button>
          
          <button onClick={generatePDF} disabled={isExporting} className="bg-orange-600 hover:bg-orange-500 px-4 py-2.5 rounded-xl transition-all font-bold text-xs flex items-center gap-2 shadow-lg disabled:opacity-50">
            <i className={`fas ${isExporting ? 'fa-spinner animate-spin' : 'fa-file-pdf'}`}></i> {isExporting ? 'Calcul du rendu...' : 'Télécharger PDF'}
          </button>
          
          <button onClick={handleCopyToClipboard} className="bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl transition-all font-bold text-xs flex items-center gap-2">
            <i className={`fas ${copyFeedback ? 'fa-check text-green-400' : 'fa-copy'}`}></i> {copyFeedback ? 'Copié' : 'Copier'}
          </button>
          
          <button onClick={onReset} className="bg-slate-700 hover:bg-slate-600 px-5 py-2.5 rounded-xl transition-all font-bold text-xs">
            Nouveau profil
          </button>
        </div>
      </div>

      <article className={`bg-white rounded-[2.5rem] shadow-xl border border-slate-100 transition-all ${isEditing ? 'p-4' : 'p-8 md:p-16'}`}>
        {isEditing ? (
          <textarea
            className="w-full min-h-[600px] p-8 border-2 border-slate-100 rounded-3xl font-mono text-sm text-slate-700 bg-slate-50 focus:border-orange-500 focus:ring-0 outline-none transition-colors"
            value={editableDossier}
            onChange={(e) => setEditableDossier(e.target.value)}
          />
        ) : (
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
              h2: (p) => <h2 className="text-2xl font-black text-slate-900 mt-16 mb-8 border-b-4 border-orange-600 pb-2 inline-block" {...p} />,
              h3: (p) => <h3 className="text-xl font-bold text-orange-700 mt-10 mb-4 bg-orange-50/50 p-4 rounded-xl border-l-4 border-orange-600" {...p} />,
              table: (p) => <div className="my-8 overflow-x-auto"><table className="min-w-full" {...p} /></div>,
              blockquote: (p) => <blockquote className="my-10 bg-slate-50 border-l-8 border-orange-600 p-8 rounded-r-2xl italic text-slate-800 text-lg shadow-inner font-serif" {...p} />
            }}>
              {editableDossier}
            </ReactMarkdown>
          </div>
        )}
      </article>

      {/* Dialogue Expert */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl border border-white/5 no-print">
        <h3 className="text-xl font-bold mb-8 flex items-center gap-4 text-orange-400">
          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white"><i className="fas fa-comments text-white"></i></div>
          Dialogue Expert
        </h3>

        <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-5 rounded-[1.5rem] text-sm leading-relaxed ${
                msg.role === 'user' ? 'bg-orange-600 text-white rounded-tr-none shadow-orange-900/20 shadow-xl' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'
              }`}>
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          ))}
          {isTyping && <div className="animate-pulse flex gap-2"><div className="w-2 h-2 bg-orange-500 rounded-full"></div><div className="w-2 h-2 bg-orange-500 rounded-full animation-delay-200"></div></div>}
          <div ref={chatEndRef} />
        </div>

        <div className="flex gap-3 bg-slate-800 p-2 rounded-2xl border border-white/10 focus-within:border-orange-500 transition-all">
          <input type="text" placeholder="Une question sur la structure ou les matériaux ?" className="flex-1 bg-transparent border-none focus:ring-0 px-4 text-white placeholder-slate-500" value={userInput} onChange={e => setUserInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} />
          <button onClick={handleSendMessage} disabled={isTyping} className="bg-orange-600 hover:bg-orange-500 px-6 py-3 rounded-xl transition-all font-bold">Poser la question</button>
        </div>
      </div>

      {/* SECTION PDF - OPTIMISÉE POUR HTML2PDF */}
      <div className="pdf-export-only">
        <div ref={printContentRef} style={{ width: '190mm', padding: '10mm', background: 'white', color: '#0f172a' }}>
          <style>{`
            /* Reset & Core Styles */
            .pdf-body { 
              font-family: 'Helvetica', 'Arial', sans-serif; 
              font-size: 11pt; 
              line-height: 1.5; 
              color: #0f172a;
              width: 100%;
            }

            /* Header Section */
            .pdf-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2pt solid #ea580c;
              padding-bottom: 10pt;
              margin-bottom: 25pt;
            }
            .pdf-brand { color: #ea580c; font-weight: bold; font-size: 20pt; letter-spacing: -1px; }
            .pdf-subtitle { font-size: 8pt; color: #64748b; text-transform: uppercase; font-weight: bold; }
            .pdf-ref { font-size: 8pt; text-align: right; color: #94a3b8; }

            /* Content Typography */
            .pdf-body h2 { 
              font-size: 16pt; 
              font-weight: bold; 
              color: #0f172a; 
              margin-top: 25pt; 
              margin-bottom: 10pt; 
              border-bottom: 1pt solid #f1f5f9;
              page-break-after: avoid;
            }
            .pdf-body h3 { 
              font-size: 13pt; 
              font-weight: bold; 
              color: #ea580c; 
              margin-top: 15pt; 
              margin-bottom: 8pt; 
              page-break-after: avoid;
            }
            .pdf-body h4 {
              font-size: 11pt;
              font-weight: bold;
              margin-top: 12pt;
              margin-bottom: 4pt;
              color: #1e293b;
            }
            .pdf-body p { margin-bottom: 10pt; text-align: justify; page-break-inside: avoid; }
            
            /* Table Styling - High Priority for PDF Layout */
            .pdf-body table {
              width: 100%;
              border-collapse: collapse;
              margin: 15pt 0;
              page-break-inside: avoid; /* Crucial pour ne pas couper les tableaux */
            }
            .pdf-body th {
              background: #0f172a;
              color: white;
              font-size: 9pt;
              padding: 6pt;
              text-align: left;
              border: 0.5pt solid #0f172a;
            }
            .pdf-body td {
              border: 0.5pt solid #e2e8f0;
              padding: 6pt;
              font-size: 9pt;
              vertical-align: top;
            }
            .pdf-body tr:nth-child(even) { background: #f8fafc; }

            /* Lists & Other Elements */
            .pdf-body ul, .pdf-body ol { margin-bottom: 10pt; padding-left: 15pt; }
            .pdf-body li { margin-bottom: 4pt; page-break-inside: avoid; }
            .pdf-body blockquote {
              border-left: 3pt solid #ea580c;
              background: #fff7ed;
              padding: 10pt 15pt;
              margin: 15pt 0;
              font-style: italic;
              page-break-inside: avoid;
            }

            /* Footer */
            .pdf-footer {
              margin-top: 40pt;
              border-top: 0.5pt solid #e2e8f0;
              padding-top: 10pt;
              font-size: 7pt;
              color: #94a3b8;
              text-align: center;
              line-height: 1.4;
            }
            
            /* Helpers */
            .page-break { page-break-before: always; }
          `}</style>

          <div className="pdf-body">
            {/* Page Header */}
            <div className="pdf-header">
              <div>
                <div className="pdf-brand">WING ANALYST</div>
                <div className="pdf-subtitle">Rapport Technique d'Aide à la Décision</div>
              </div>
              <div className="pdf-ref">
                Réf: WA-{new Date().getTime().toString().slice(-6)}<br/>
                Date: {new Date().toLocaleDateString('fr-FR')}
              </div>
            </div>

            {/* Main Content */}
            <div className="pdf-main-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{editableDossier}</ReactMarkdown>
            </div>

            {/* Appendix if Chat exists */}
            {chatHistory.length > 0 && (
              <div className="page-break">
                <h2 style={{ borderBottom: '2pt solid #ea580c', paddingBottom: '5pt' }}>ANNEXES : PRÉCISIONS DE L'EXPERT</h2>
                <div style={{ marginTop: '20pt' }}>
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} style={{ 
                      marginBottom: '15pt', 
                      padding: '10pt', 
                      background: msg.role === 'model' ? '#fff7ed' : '#f8fafc',
                      border: '0.5pt solid #e2e8f0',
                      borderRadius: '4pt',
                      pageBreakInside: 'avoid'
                    }}>
                      <div style={{ fontWeight: 'bold', fontSize: '8pt', color: '#64748b', marginBottom: '5pt', textTransform: 'uppercase' }}>
                        {msg.role === 'user' ? 'Question du Pilote' : 'Expert Technique'}
                      </div>
                      <div style={{ fontSize: '10pt', color: '#334155' }}>
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Footer */}
            <div className="pdf-footer">
              <strong>AVERTISSEMENT LÉGAL :</strong> Ce dossier est généré par un système d'intelligence artificielle.<br/>
              Les données techniques sont extraites de sources publiques constructeurs et de revues spécialisées au moment de la demande.<br/>
              Ce rapport ne remplace pas l'avis d'un moniteur de parapente diplômé d'État.<br/>
              Le choix final et la responsabilité de la pratique incombent exclusivement au pilote.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResultView;
