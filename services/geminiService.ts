
import { GoogleGenAI, Type } from "@google/genai";
import { PilotProfile, AnalysisResult, RadarData } from "../types";

const MANUFACTURERS = [
  { name: "Advance", url: "https://www.advance.swiss/" },
  { name: "Ozone", url: "https://flyozone.com/paragliders/fr" },
  { name: "Gin Gliders", url: "https://www.gingliders.com/fr/paragliders/" },
  { name: "Skywalk", url: "https://www.skywalk.info/" },
  { name: "Niviuk", url: "https://niviuk.com/" },
  { name: "Nova", url: "https://www.nova.eu/fr/parapentes/" },
  { name: "BGD", url: "https://www.flybgd.com/fr/parapentes/" },
  { name: "AirDesign", url: "https://www.ad-gliders.com/" },
  { name: "Supair", url: "https://www.supair.com/" },
  { name: "Sky Paragliders", url: "https://www.sky-cz.com/" },
  { name: "Dudek", url: "https://www.dudek.fr" },
  { name: "ITV Wings", url: "https://www.itv-wings.com/" },
  { name: "Level Wings", url: "https://levelwings.com/fr/" },
  { name: "Little Cloud", url: "https://www.littlecloud.fr" },
  { name: "Nervures", url: "https://www.nervures.com/" },
  { name: "Sol Paragliders", url: "https://www.solfrance.fr" },
  { name: "Swing Paragliders", url: "https://www.swing.de/?lang=fr" },
  { name: "UP Paragliders", url: "https://up-paragliders.com/" },
  { name: "Phi-Air", url: "https://phi-air.com" },
  { name: "Icaro", url: "https://www.icaro-paragliders.com/" },
  { name: "APCO Aviation", url: "https://www.apcoaviation.com/" },
  { name: "Mac Para", url: "https://www.macpara.com/" },
  { name: "Independence", url: "https://www.independence.aero/fr/parapentes/" },
  { name: "Sky Country", url: "https://sky-country.com/" },
  { name: "Neo Paragliders", url: "https://www.neo-paragliders.fr" }
];

/**
 * Récupération de la clé compatible avec les builds statiques (GitHub Pages)
 * et les environnements de fonctions (Vercel/Netlify).
 */
const getApiKey = () => {
  // @ts-ignore
  return process.env.API_KEY || process.env.VITE_API_KEY || (import.meta.env ? import.meta.env.VITE_API_KEY : "");
};

const handleApiError = (error: any) => {
  console.error("Gemini API Error:", error);
  const msg = error?.message || "";
  if (msg.includes("429") || error?.status === 429) {
    throw new Error("QUOTA_EXCEEDED");
  }
  if (msg.includes("API key") || error?.status === 401) {
    throw new Error("API_KEY_INVALID");
  }
  throw error;
};

export const checkProfileCompleteness = async (profile: PilotProfile) => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Analyse ce profil de pilote de parapente et pose 1-3 questions si besoin: Expérience: ${profile.experience}, Ambitions: ${profile.ambitions}, PTV: ${profile.ptv}kg, Voile: ${profile.currentWing}`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isComplete: { type: Type.BOOLEAN },
            questions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["isComplete", "questions"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) { return handleApiError(error); }
};

export const analyzeWings = async (profile: PilotProfile, wings: string[], includeSuggestions: boolean): Promise<AnalysisResult> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const flightTypesStr = (profile.flightTypes || []).join(", ");
  const manufacturersList = MANUFACTURERS.map(m => `- ${m.name}: ${m.url}`).join("\n");
  const hasWings = wings.length > 0;
  
  const prompt = `
    Rôle : Tu es un expert IA senior en ingénierie de parapente et instructeur (notamment en cross XC).
    Ta mission est de produire un dossier technique et pédagogique d'une précision chirurgicale.

    BASE DE DONNÉES CONSTRUCTEURS (Utilise PRIORITAIREMENT ces sites pour chercher les données techniques réelles via Google Search) :
    ${manufacturersList}

    PROFIL DU PILOTE :
    - Expérience actuelle : ${profile.experience}
    - Voile de référence : ${profile.currentWing}
    - PTV (Poids Total Volant) : ${profile.ptv} kg
    - Pratique : ${flightTypesStr}
    - Ambitions : ${profile.ambitions}

    MISSION :
    ${hasWings 
      ? `Analyser spécifiquement ces voiles : ${wings.join(", ")}.` 
      : `Le pilote n'a pas d'idée précise. PROPOSE 3 à 4 voiles de progression pertinentes (ex: A, B, High-B type "EN-B+"... si le niveau le permet).`
    }
    ${hasWings && includeSuggestions 
      ? `EN PLUS des voiles saisies, PROPOSE 1 ou 2 modèles supplémentaires qui seraient extrêmement cohérents selon toi pour ce pilote.` 
      : ""
    }

    ---

    STRUCTURE DU RAPPORT (RIGOUREUSE) :
    
    ## 0. Profil pilote (rappel)
    (Synthèse des points clés et analyse critique du setup actuel)

    ## 1. Voiles étudiées
    (Liste exhaustive incluant la voile de référence ${profile.currentWing}, les choix du pilote et les suggestions de l'IA)

    ## 2. Données techniques consolidées (tailles pertinentes PTV ${profile.ptv} kg)
    (Tableau comparatif incluant TOUTES les voiles citées en section 1. Colonnes : Modèle, Taille, Allongement, Poids, PTV certifié, Matériaux)
         
    ## 3. Analyse approfondie et consolidée par voile
    IMPORTANT : Tu DOIS créer une sous-section (3.1, 3.2, etc.) pour CHAQUE voile listée en section 1 (Référence + Choix + Suggestions).
    
    ### 3.X [Nom du modèle]
    #### **Positionnement constructeur :**
    (Cible et promesse)
    #### **Conception technique :**
    (Specs marquantes. DYNAMIQUE DE VOL : Communication via élévateurs/suspentes, fermeté commande, tendance tangage)
    #### **Retours terrain et essais :**
    (Synthèse approfondie : Ziad Bassil / XC Mag / Flybubble / Forums)
    #### **Limites objectivement observées :**
    (Points faibles documentés)
    #### **Conclusion technique :**
    (Avis tranché de l'expert)
            
    ## 4. Analyse croisée spécifique au profil
    IMPORTANT : Analyse l'adéquation de CHAQUE voile listée en section 1 par rapport au pilote.
    ### 4.X [Nom du modèle]
    (Pourquoi ce modèle est (ou n'est pas) adapté à l'expérience et aux ambitions du pilote)
    ### Résumé de l'analyse croisée :
    (Comparaison globale des options)
      
    ## 5. Positionnement dans une trajectoire de progression
    (Attribution d'un niveau 1, 2 ou 3 selon l'accessibilité réelle pour ce pilote)
      
    ## 6. Recommandations Finales
    (Choix n°1 prioritaire et alternatives argumentées)
    [CHART]
      
    ## 7. Comparaison immersive : ${profile.currentWing} → [Le choix recommandé]
    Comparaison immersive : Quelles sensations attendre en passant de la ${profile.currentWing} à la [Meilleure Voile] ?
    ### 7.1. Philosophie générale
    (Ressenti du pilote)
    ### 7.2. Gonflage & décollage
    ### 7.3. Tangage, roulis, information
    ### 7.4. Thermique
    ### 7.5. Transition & XC
    ### 7.6. Sécurité Passive
    ### 7.7. Conclusion de la comparaison  

    ---
     
    DIRECTIVES D'ANALYSE :
    1. Sois extrêmement précis sur les matériaux et la structure interne.
    2. Étudie spécifiquement le comportement au TREUIL uniquement si mentionné.
    3. Cite tes sources (Forums, Ziad Bassil, XC Mag, etc.).
    4. Sécurité : Sois intransigeant si une voile est trop exigeante pour le pilote.
    5. N'invente aucune donnée. Si une spec est inconnue, indique-le.

    Génère un dossier complet et rédigé pour le pilote.
    Utilise Google Search pour les données techniques les plus récentes.

    CONSIGNES TECHNIQUES POUR LE GRAPHIQUE :
    Tu DOIS inclure le tag [CHART] sur une ligne seule dans la section 6.
    À la TOUTE FIN de ta réponse, après tout le texte, ajoute ce bloc exactement (complète les données) :
    [DATA]{"data": [{"label": "Modèle", "metrics": {"safety": 8, "performance": 7, "handling": 9, "accessibility": 8, "speed": 6}}]}[/DATA]
    Note : metrics sont sur 10. accessibility: 10 = très facile, 1 = voile de compétition.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });

    const fullText = response.text || "";
    let chartData: RadarData[] | undefined;
    let cleanDossier = fullText;
    
    const dataMatch = fullText.match(/\[DATA\]\s*([\s\S]*?)\s*\[\/DATA\]/);
    if (dataMatch) {
      try {
        const jsonContent = dataMatch[1].replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(jsonContent);
        chartData = parsed.data;
        cleanDossier = fullText.replace(dataMatch[0], "").trim();
      } catch (e) {
        console.error("Erreur parsing JSON Chart:", e);
      }
    }

    return { 
      dossier: cleanDossier, 
      sources: (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as any[], 
      chartData 
    };
  } catch (error: any) {
    return handleApiError(error);
  }
};

export const askFollowUp = async (history: {role: string, text: string}[], lastReport: string) => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: { systemInstruction: `Tu es l'expert senior en parapente ayant rédigé ce rapport : ${lastReport}. Réponds de manière technique et rassurante.` }
    });
    const response = await chat.sendMessage({ message: history[history.length - 1].text });
    return response.text;
  } catch (error) { return handleApiError(error); }
};
