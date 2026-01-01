import { GoogleGenAI } from "@google/genai";
import { Task, Project } from '../types';

// Initialize the API client using process.env.API_KEY as configured in vite.config.ts
// We use a fallback 'demo-key' to prevent instant crashes if the env var is missing during dev.
const apiKey = process.env.API_KEY || 'demo-key';
const ai = new GoogleGenAI({ apiKey });

export const generateDailyReport = async (tasks: Task[], projects: Project[]) => {
  // Check if we are in demo mode (no valid key)
  if (!process.env.API_KEY || process.env.API_KEY === '' || process.env.API_KEY === 'demo-key') {
    console.warn("API_KEY not configured. Returning mock response.");
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      subject: "Resumen Diario de Actividades - RyV Instalaciones Eléctricas",
      body: "⚠️ *Modo Demo (Sin API Key)*\n\nSe han detectado tareas críticas retrasadas en el proyecto. \n\nPara activar la IA real de Google Gemini, necesitas configurar una API Key en el archivo .env o en las variables de entorno de Vercel/Netlify."
    };
  }

  const prompt = `
    Actúa como un Project Manager Senior de energía solar.
    Analiza los siguientes datos de proyectos y tareas:
    Proyectos: ${JSON.stringify(projects.map(p => ({ name: p.name, status: p.status })))}
    Tareas Críticas o En Riesgo: ${JSON.stringify(tasks.filter(t => t.status === 'En Riesgo' || t.priority === 'Crítica'))}
    
    Genera un resumen ejecutivo diario en formato JSON con dos campos: "subject" (Asunto del email, usando nombre RyV Instalaciones Eléctricas) y "body" (Cuerpo del mensaje, formateado, sugiriendo acciones concretas para desbloquear tareas).
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
      body: "No se pudo conectar con el servicio de IA. Verifique su API Key o conexión."
    };
  }
};

export const suggestMitigation = async (blockedTask: Task) => {
    if (!process.env.API_KEY || process.env.API_KEY === '' || process.env.API_KEY === 'demo-key') {
        return "Sugerencia Demo: Contactar al proveedor inmediatamente.";
    }

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