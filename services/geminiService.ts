
import { GoogleGenAI, Type } from "@google/genai";
import { PilotProfile, AnalysisResult } from "../types";

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

export const checkProfileCompleteness = async (profile: PilotProfile) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Analyse ce profil de pilote de parapente :
    Expérience: ${profile.experience}
    Ambitions: ${profile.ambitions}
    PTV: ${profile.ptv}kg
    Voile actuelle: ${profile.currentWing}

    Si des informations cruciales manquent pour conseiller une aile (ex: nombre d'heures de vol par an, SIV fait, type de sellette), pose 3 questions max.
    Réponds EXCLUSIVEMENT en JSON : { "isComplete": boolean, "questions": string[] }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{"isComplete": true, "questions": []}');
  } catch (e) {
    return { isComplete: true, questions: [] };
  }
};

export const analyzeWings = async (profile: PilotProfile, wings: string[], includeSuggestions: boolean): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const flightTypesStr = profile.flightTypes.join(", ");
  const manufacturersList = MANUFACTURERS.map(m => `- ${m.name}: ${m.url}`).join("\n");
  const hasWings = wings.length > 0;

  const prompt = `
    Rôle : Tu es un expert senior en ingénierie de parapente et instructeur (notamment en cross XC).
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
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 8000 }
      },
    });

    return {
      dossier: response.text || "Désolé, l'analyse n'a pas pu être générée.",
      sources: (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as any[]
    };
  } catch (error) {
    console.error("Erreur analyzeWings:", error);
    throw error;
  }
};

export const askFollowUp = async (history: {role: string, text: string}[], lastReport: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `Tu es l'expert qui a rédigé ce dossier : ${lastReport}. Réponds précisément aux questions techniques du pilote en gardant une rigueur d'ingénieur.
      Met à jour ${lastReport} si l'utilisateur le demande.`
    }
  });

  const lastMessage = history[history.length - 1].text;
  try {
    const response = await chat.sendMessage({ message: lastMessage });
    return response.text;
  } catch (e) {
    return "Une erreur technique empêche la réponse.";
  }
};
