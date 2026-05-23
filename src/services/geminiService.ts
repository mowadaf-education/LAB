import { Type } from "@google/genai";
import { logger } from './loggingService';

// ── اسم الموديل في مكان واحد — غيّره هنا فقط إذا احتجت ─────────────────────
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_MODEL_VISION = "gemini-1.5-flash"; // للصور والمحادثة
// ────────────────────────────────────────────────────────────────────────────


function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input) return "";
  return input.slice(0, maxLength).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function callGeminiAPI(reqBody: any) {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Gemini API failed');
  }
  const data = await res.json();
  return { data: { text: data.text } };
}

const functions = null as any;
const httpsCallable = (f: any, n: string) => callGeminiAPI;

export interface ChemicalIntelligence {
  nameEn: string;
  nameAr: string;
  formula: string;
  casNumber: string;
  storageTemp: string;
  hazardClass: 'safe' | 'danger';
  ghs: string[];
  expiryYears: number;
  notes: string;
}

export async function ensureApiKey(): Promise<boolean> {
  // Now using Firebase Cloud Functions, API key is server-side.
  return true;
}

export async function getChemicalIntelligence(name: string, retries = 5, delay = 3000): Promise<ChemicalIntelligence | null> {
  try {
    const hasKey = await ensureApiKey();
    if (!hasKey) {
      logger.error("No API key available for Gemini.");
      return null;
    }

    const callGemini = httpsCallable(functions, 'generateContent');
    const response = await callGemini({
      model: GEMINI_MODEL,
      contents: `Provide detailed chemical information for: \`<input>\${sanitizeInput(name, 200)}</input>\`. 
      Return the data in JSON format with the following fields:
      - nameEn: English name
      - nameAr: Arabic name
      - formula: Chemical formula
      - casNumber: CAS registry number
      - storageTemp: Recommended storage temperature (e.g. "2-8°C", "Room Temp")
      - hazardClass: either 'safe' or 'danger'
      - ghs: array of GHS codes (e.g. ["GHS01", "GHS02"])
      - expiryYears: typical shelf life in years as a number
      - notes: brief safety and storage notes in Arabic`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nameEn: { type: Type.STRING },
            nameAr: { type: Type.STRING },
            formula: { type: Type.STRING },
            casNumber: { type: Type.STRING },
            storageTemp: { type: Type.STRING },
            hazardClass: { type: Type.STRING, enum: ['safe', 'danger'] },
            ghs: { type: Type.ARRAY, items: { type: Type.STRING } },
            expiryYears: { type: Type.NUMBER },
            notes: { type: Type.STRING },
          },
          required: ["nameEn", "nameAr", "formula", "casNumber", "storageTemp", "hazardClass", "ghs", "expiryYears", "notes"],
        },
      },
    });

    const text = (response.data as any).text;
    if (!text) return null;
    return JSON.parse(text.trim()) as ChemicalIntelligence;
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    const isQuotaExceeded = errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED");
    
    // Handle rate limit (429) errors with exponential backoff
    if (error?.status === 'RESOURCE_EXHAUSTED' || error?.code === 429 || isQuotaExceeded) {
      // If it's a hard quota limit (daily/monthly), retrying won't help immediately
      if (errorMessage.includes("check your plan and billing details") || errorMessage.includes("Hard quota limit reached")) {
        logger.error("Hard quota limit reached. Please check your Gemini API billing/plan.");
        
        // If the user hasn't selected their own key, prompt them to do so
        if (typeof window !== 'undefined' && (window as any).aistudio?.openSelectKey) {
          const hasKey = await (window as any).aistudio.hasSelectedApiKey();
          if (!hasKey) {
            logger.warn("Prompting user to select their own API key due to quota exhaustion.");
            await (window as any).aistudio.openSelectKey();
            // After selecting a key, we can try one more time
            return getChemicalIntelligence(name, 1, delay);
          }
        }
        return null;
      }

      if (retries > 0) {
        logger.warn(`Rate limit hit for "${name}". Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return getChemicalIntelligence(name, retries - 1, delay * 1.5);
      }
    }
    
    logger.error("Error fetching chemical intelligence:", error);
    return null;
  }
}

export interface StorageAnalysisResult {
  storageZones: {
    zoneName: string;
    colorCode: string;
    recommendedChemicals: string[];
    description: string;
  }[];
  hazards: {
    severity: 'high' | 'medium' | 'low';
    location: string;
    chemicalsInvolved: string[];
    reason: string;
  }[];
  overallSafetyGrade: string;
}

export async function analyzeChemicalStorage(inventory: any[], retries = 3, delay = 5000): Promise<StorageAnalysisResult | null> {
  try {
    const hasKey = await ensureApiKey();
    if (!hasKey) return null;

    const callGemini = httpsCallable(functions, 'generateContent');
    
    // Format the inventory slightly to save tokens
    const compactInventory = inventory.slice(0, 150).map(c => ({
      nameEn: c.nameEn,
      nameAr: c.nameAr,
      hazardClass: c.hazardClass,
      ghs: c.ghs,
      shelf: c.shelf || "Unassigned"
    }));

    const response = await callGemini({
      model: GEMINI_MODEL,
      contents: `You are an expert in chemical laboratory safety and storage matrices. 
      Analyze the provided laboratory chemical inventory and its current physical shelf locations.
      
      1. Group the chemicals into ideal "Storage Zones" (e.g., Acids, Flammables, Oxidizers, Bases, General).
      2. Analyze their CURRENT "shelf" locations. Identify any dangerous incompatibilities (e.g., storing an oxidizer with a flammable on the same shelf, or an acid with a base).
      3. Return a safety grade (A, B, C, D, F).
      
      Inventory Data: ${JSON.stringify(compactInventory)}
      
      Return Arabic translated descriptions for the zones and hazard reasons where applicable.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            storageZones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  zoneName: { type: Type.STRING },
                  colorCode: { type: Type.STRING },
                  recommendedChemicals: { type: Type.ARRAY, items: { type: Type.STRING } },
                  description: { type: Type.STRING }
                },
                required: ["zoneName", "colorCode", "recommendedChemicals", "description"]
              }
            },
            hazards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  severity: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
                  location: { type: Type.STRING },
                  chemicalsInvolved: { type: Type.ARRAY, items: { type: Type.STRING } },
                  reason: { type: Type.STRING }
                },
                required: ["severity", "location", "chemicalsInvolved", "reason"]
              }
            },
            overallSafetyGrade: { type: Type.STRING }
          },
          required: ["storageZones", "hazards", "overallSafetyGrade"]
        }
      }
    });

    const text = (response.data as any).text;
    if (!text) return null;
    return JSON.parse(text.trim()) as StorageAnalysisResult;
  } catch (error: any) {
    if ((error?.status === 'RESOURCE_EXHAUSTED' || error?.code === 429) && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return analyzeChemicalStorage(inventory, retries - 1, delay * 1.5);
    }
    logger.error("Error analyzing chemical storage:", error);
    return null;
  }
}

export interface EquipmentIntelligence {
  id: string;
  smartNameAr: string;
  smartDescriptionAr: string;
  imageKeyword: string;
}

export async function getEquipmentIntelligence(items: { id: string; name: string }[], retries = 3, delay = 5000): Promise<EquipmentIntelligence[] | null> {
  try {
    const hasKey = await ensureApiKey();
    if (!hasKey) return null;

    const callGemini = httpsCallable(functions, 'generateContent');
    const response = await callGemini({
      model: GEMINI_MODEL,
      contents: `Analyze these laboratory equipment items and provide: 
      1. A better Arabic name (smartNameAr).
      2. A concise Arabic description (smartDescriptionAr).
      3. An English keyword for image search (imageKeyword).
      Items: ${JSON.stringify(items)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              smartNameAr: { type: Type.STRING },
              smartDescriptionAr: { type: Type.STRING },
              imageKeyword: { type: Type.STRING }
            },
            required: ["id", "smartNameAr", "smartDescriptionAr", "imageKeyword"]
          }
        }
      }
    });

    const text = (response.data as any).text;
    return JSON.parse(text);
  } catch (err: any) {
    const errorMessage = err.message || String(err);
    if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
      if (retries > 0) {
        logger.warn(`Quota exceeded for equipment. Retrying in ${delay/1000}s...`);
        await new Promise(r => setTimeout(r, delay));
        return getEquipmentIntelligence(items, retries - 1, delay * 2);
      }
      
      if (errorMessage.includes("check your plan and billing details") || errorMessage.includes("Hard quota limit reached")) {
        if (typeof window !== 'undefined' && (window as any).aistudio?.openSelectKey) {
          const hasKey = await (window as any).aistudio.hasSelectedApiKey();
          if (!hasKey) {
            await (window as any).aistudio.openSelectKey();
            return getEquipmentIntelligence(items, 1, delay);
          }
        }
      }
    }
    logger.error("Error fetching equipment intelligence:", err);
    return null;
  }
}

export interface MaintenanceInsight {
  overview: string;
  urgentActions: {
    equipmentName: string;
    issue: string;
    recommendation: string;
    actionRequired: 'repair' | 'replace' | 'calibrate' | 'scrapping';
  }[];
  preventiveMeasures: string[];
}

export async function analyzeMaintenance(logs: any[], retries = 3, delay = 5000): Promise<MaintenanceInsight | null> {
  try {
    const hasKey = await ensureApiKey();
    if (!hasKey) return null;

    const callGemini = httpsCallable(functions, 'generateContent');
    
    const compactLogs = logs.slice(0, 100).map((l: any) => ({
      equipmentName: l.equipmentName,
      issue: l.issue,
      status: l.status,
      priority: l.priority,
      date: l.startDate
    }));

    const response = await callGemini({
      model: GEMINI_MODEL,
      contents: `You are an expert laboratory technician and maintenance manager in Algeria. 
      Analyze the provided equipment maintenance logs for a high school laboratory.
      
      Provide:
      1. A brief overview of the equipment health status.
      2. Identify urgent logs or equipment that break down frequently and give specific action recommendations (repair, calibrate, or scrap/replace).
      3. Recommend preventive measures for the laboratory equipment.
      
      Respond completely in Arabic.
      
      Logs: ${JSON.stringify(compactLogs)}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING },
            urgentActions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  equipmentName: { type: Type.STRING },
                  issue: { type: Type.STRING },
                  recommendation: { type: Type.STRING },
                  actionRequired: { type: Type.STRING }
                },
                required: ["equipmentName", "issue", "recommendation", "actionRequired"]
              }
            },
            preventiveMeasures: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["overview", "urgentActions", "preventiveMeasures"]
        }
      }
    });

    const text = (response.data as any).text;
    if (!text) return null;
    return JSON.parse(text.trim()) as MaintenanceInsight;
  } catch (error: any) {
    if ((error?.status === 'RESOURCE_EXHAUSTED' || error?.code === 429) && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return analyzeMaintenance(logs, retries - 1, delay * 1.5);
    }
    logger.error("Error analyzing maintenance logs:", error);
    return null;
  }
}

export interface FormRecommendation {
  recommendedPath: string;
  reasoning: string;
}

export async function findSmartForm(query: string, availableForms: {title: string, path: string, desc: string}[]): Promise<FormRecommendation | null> {
  try {
    const hasKey = await ensureApiKey();
    if (!hasKey) return null;
    
    const callGemini = httpsCallable(functions, 'generateContent');
    
    const response = await callGemini({
      model: GEMINI_MODEL,
      contents: `You are an intelligent assistant for a laboratory management system in Algeria.
      The user is asking for a specific document, form, or process.
      Match their request to one of the available forms.
      
      User query: "${sanitizeInput(query, 500)}"
      
      Available Forms:
      ${JSON.stringify(availableForms)}
      
      Return the path of the most appropriate form and a brief reason (in Arabic) explaining why.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedPath: { type: Type.STRING },
            reasoning: { type: Type.STRING }
          },
          required: ["recommendedPath", "reasoning"]
        }
      }
    });

    const text = (response.data as any).text;
    if (!text) return null;
    return JSON.parse(text.trim()) as FormRecommendation;
  } catch (error: any) {
    logger.error("Error finding smart form:", error);
    return null;
  }
}

export interface PedagogicalInsight {
  overview: string;
  criticalDelays: {
    subject: string;
    teacher: string;
    reason: string;
    recommendation: string;
  }[];
  generalRecommendations: string[];
}

export async function analyzePedagogicalTracking(entries: any[], retries = 3, delay = 5000): Promise<PedagogicalInsight | null> {
  try {
    const hasKey = await ensureApiKey();
    if (!hasKey) return null;

    const callGemini = httpsCallable(functions, 'generateContent');
    
    // Format lightly to save tokens
    const compactEntries = entries.slice(0, 100).map((e: any) => ({
      subject: e.subject,
      level: e.level,
      branch: e.branch,
      teacher: e.teacher,
      progress: e.progress,
      status: e.status,
      delayWeeks: e.delayWeeks,
      delayReason: e.delayReason
    }));

    const response = await callGemini({
      model: GEMINI_MODEL,
      contents: `You are an expert pedagogical inspector and school director in Algeria. 
      Analyze the provided pedagogical progression tracking data for a high school.
      
      Provide:
      1. A brief overview of the progression (overview).
      2. Identify critical delays, their reasons, and provide a concrete pedagogical recommendation for the teacher/administration to catch up (criticalDelays).
      3. Provide a list of general recommendations to improve the curriculum tracking process (generalRecommendations).
      
      Respond completely in Arabic.
      
      Data: ${JSON.stringify(compactEntries)}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING },
            criticalDelays: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  subject: { type: Type.STRING },
                  teacher: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  recommendation: { type: Type.STRING }
                },
                required: ["subject", "teacher", "reason", "recommendation"]
              }
            },
            generalRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["overview", "criticalDelays", "generalRecommendations"]
        }
      }
    });

    const text = (response.data as any).text;
    if (!text) return null;
    return JSON.parse(text.trim()) as PedagogicalInsight;
  } catch (error: any) {
    if ((error?.status === 'RESOURCE_EXHAUSTED' || error?.code === 429) && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return analyzePedagogicalTracking(entries, retries - 1, delay * 1.5);
    }
    logger.error("Error analyzing pedagogical tracking:", error);
    return null;
  }
}

export interface IncidentAnalysis {
  rootCause: string;
  suggestedActions: string[];
  safetyTipsAr: string;
  longTermMitigation: string;
}

export async function analyzeIncident(incident: any, retries = 3, delay = 5000): Promise<IncidentAnalysis | null> {
  try {
    const hasKey = await ensureApiKey();
    if (!hasKey) return null;

    const callGemini = httpsCallable(functions, 'generateContent');
    
    const response = await callGemini({
      model: GEMINI_MODEL,
      contents: `You are a laboratory safety expert in Algeria. 
      Analyze this laboratory incident and provide a professional investigation report.
      
      Incident: ${JSON.stringify(incident)}
      
      Provide:
      1. Potential root cause analysis (rootCause).
      2. Immediate suggested corrective actions (suggestedActions - as an array).
      3. Specific safety tips in Arabic (safetyTipsAr).
      4. Long-term mitigation strategies (longTermMitigation).
      
      Respond completely in Arabic for all text fields.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rootCause: { type: Type.STRING },
            suggestedActions: { type: Type.ARRAY, items: { type: Type.STRING } },
            safetyTipsAr: { type: Type.STRING },
            longTermMitigation: { type: Type.STRING }
          },
          required: ["rootCause", "suggestedActions", "safetyTipsAr", "longTermMitigation"]
        }
      }
    });

    const text = (response.data as any).text;
    if (!text) return null;
    return JSON.parse(text.trim()) as IncidentAnalysis;
  } catch (error: any) {
    if ((error?.status === 'RESOURCE_EXHAUSTED' || error?.code === 429) && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return analyzeIncident(incident, retries - 1, delay * 1.5);
    }
    logger.error("Error analyzing incident:", error);
    return null;
  }
}

export async function chatWithLabAssistant(messages: { role: 'user' | 'model', parts: string }[]) {
  try {
    const hasKey = await ensureApiKey();
    if (!hasKey) return "لم يتم تمكين مفتاح API. يرجى مراجعة الإعدادات.";

    const callGemini = httpsCallable(functions, 'generateContent');
    
    // System instruction for the chat
    const systemPrompt = `You are "Mekhbari AI" (مخبري الذكي), an expert laboratory assistant specialized in the Algerian education system (Middle and High School). 
    Your expertise includes:
    1. Chemical safety and compatibility (MSDS knowledge).
    2. Physics and Chemistry experiment procedures according to the Algerian curriculum.
    3. Lab management best practices (inventory, storage, waste disposal).
    4. Laboratory calculations (normality, molarity, dilutions).
    
    Guidelines:
    - Respond strictly in Arabic (Algerian professional terminology).
    - Be precise and safety-oriented. If a request is dangerous, warn clearly.
    - Reference Algerian school legislation when relevant.
    - Keep responses concise but helpful.
    `;

    const contents = messages.slice(-10).map(m => `${m.role === 'user' ? 'User' : 'Model'}: ${sanitizeInput(m.parts, 2000)}`).join('\n');
    const fullPrompt = `${systemPrompt}\n\nConversation history:\n${contents}\n\nModel response:`;

    const result = await callGemini({
      model: GEMINI_MODEL_VISION,
      contents: fullPrompt
    });

    const text = (result.data as any).text;
    return text || "عذراً، لم أتمكن من توليد إجابة.";
  } catch (error) {
    logger.error("Lab Assistant Chat Error:", error);
    return "عذراً، حدث خطأ أثناء الاتصال بالمساعد الذكي. يرجى المحاولة لاحقاً.";
  }
}

export async function analyzeLabImage(base64Image: string) {
  try {
    const hasKey = await ensureApiKey();
    if (!hasKey) return null;

    const callGemini = httpsCallable(functions, 'generateContent');
    
    const result = await callGemini({
      model: GEMINI_MODEL_VISION,
      contents: [
        {
          role: "user",
          parts: [
            { text: "Identify the laboratory equipment or chemical in this image. Provide its name in Arabic, its primary use in school labs, and common safety warnings. Respond in JSON format with fields: nameAr, primaryUse, safetyWarnings." },
            { 
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = (result.data as any).text;
    return JSON.parse(text || '{}');
  } catch (error) {
    logger.error("AI Image Analysis Error:", error);
    return null;
  }
}

export interface ExperimentAnalysis {
  smartTitle: string;
  smartOutcome: string;
  suggestedSafetyNotes: string;
  materialsNeeded: { name: string; estimatedQty: string }[];
}

export async function analyzeExperiment(expData: any, retries = 3, delay = 5000): Promise<ExperimentAnalysis | null> {
  try {
    const hasKey = await ensureApiKey();
    if (!hasKey) return null;

    const callGemini = httpsCallable(functions, 'generateContent');
    
    const response = await callGemini({
      model: GEMINI_MODEL,
      contents: `You are an expert laboratory technician in Algeria. 
      Review this laboratory experiment and provide a professional summary and safety guidance.
      
      Experiment Data: ${JSON.stringify(expData)}
      
      Provide:
      1. A professional Arabic title (smartTitle).
      2. A concise pedagogical outcome in Arabic (smartOutcome).
      3. Critical safety notes in Arabic (suggestedSafetyNotes).
      4. List of materials likely needed based on the title if they are missing (materialsNeeded).
      
      Respond completely in Arabic.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            smartTitle: { type: Type.STRING },
            smartOutcome: { type: Type.STRING },
            suggestedSafetyNotes: { type: Type.STRING },
            materialsNeeded: { 
              type: Type.ARRAY, 
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  estimatedQty: { type: Type.STRING }
                },
                required: ["name", "estimatedQty"]
              }
            }
          },
          required: ["smartTitle", "smartOutcome", "suggestedSafetyNotes", "materialsNeeded"]
        }
      }
    });

    const text = (response.data as any).text;
    if (!text) return null;
    return JSON.parse(text.trim()) as ExperimentAnalysis;
  } catch (error: any) {
    if ((error?.status === 'RESOURCE_EXHAUSTED' || error?.code === 429) && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return analyzeExperiment(expData, retries - 1, delay * 1.5);
    }
    logger.error("Error analyzing experiment:", error);
    return null;
  }
}
