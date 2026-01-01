import { GoogleGenAI } from "@google/genai";
import { Task, Project } from '../types';

// Helper seguro para obtener la API KEY sin que la app se rompa en el navegador
const getApiKey = () => {
  try {
    // En entornos Vite (navegador), usamos import.meta.env
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        return import.meta.env.VITE_API_KEY || import.meta.env.API_KEY || '';
    }
    return '';
  } catch (e) {
    return ''; 
  }
};

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: getApiKey() || 'demo-key' });

export const generateDailyReport = async (tasks: Task[], projects: Project[]) => {
  const key = getApiKey();
  
  // If no API key is present in a real env, we'd handle it. For this demo, we simulate if missing.
  if (!key || key === 'demo-key') {
    console.warn("API_KEY not found. Returning mock AI response.");
    // Simulación de retraso para parecer real
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      subject: "Resumen Diario de Actividades - HeliosPV",
      body: "⚠️ *Modo Demo (Sin API Key)*\n\nSe han detectado tareas críticas retrasadas en el proyecto. \n\nPara activar la IA real de Google Gemini, necesitas configurar una API Key en el archivo .env, pero para esta demostración hemos generado este texto simulado."
    };
  }

  const prompt = `
    Actúa como un Project Manager Senior de energía solar.
    Analiza los siguientes datos de proyectos y tareas:
    Proyectos: ${JSON.stringify(projects.map(p => ({ name: p.name, status: p.status })))}
    Tareas Críticas o En Riesgo: ${JSON.stringify(tasks.filter(t => t.status === 'En Riesgo' || t.priority === 'Crítica'))}
    
    Genera un resumen ejecutivo diario en formato JSON con dos campos: "subject" (Asunto del email) y "body" (Cuerpo del mensaje, formateado, sugiriendo acciones concretas para desbloquear tareas).
    Responde SOLAMENTE con el JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);

  } catch (error) {
    console.error("Error generating report:", error);
    return {
      subject: "Error al generar reporte",
      body: "No se pudo conectar con el servicio de IA para analizar los riesgos del día."
    };
  }
};

export const suggestMitigation = async (blockedTask: Task) => {
    const key = getApiKey();
    if (!key || key === 'demo-key') return "Sugerencia Demo: Contactar al proveedor inmediatamente.";

    const prompt = `
      La tarea "${blockedTask.name}" de la fase "${blockedTask.phase}" está en estado: ${blockedTask.status}.
      Prioridad: ${blockedTask.priority}.
      Dame 3 acciones específicas y cortas para desbloquearla.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "No hay sugerencias disponibles.";
    } catch (e) {
        return "Error consultando IA.";
    }
}