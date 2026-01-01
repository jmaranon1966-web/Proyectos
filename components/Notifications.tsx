
import React, { useState } from 'react';
import { generateDailyReport } from '../services/geminiService';
import { Sparkles, Mail, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { Project, Task } from '../types';

interface NotificationsProps {
    projects: Project[];
    tasks: Task[];
}

interface ReportData {
  subject: string;
  body: string;
}

const Notifications: React.FC<NotificationsProps> = ({ projects, tasks }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const result = await generateDailyReport(tasks, projects);
      setReport(result);
    } catch (error) {
      console.error("Failed to generate report", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Centro de Notificaciones</h1>
            <p className="text-slate-500">Alertas automatizadas y reportes diarios</p>
        </div>
        
        <button
          onClick={handleGenerateReport}
          disabled={loading}
          className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-70"
        >
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5 text-yellow-300" />
          )}
          <span>{loading ? 'Analizando con Gemini...' : 'Generar Reporte IA'}</span>
        </button>
      </div>

      {report && (
        <div className="bg-white rounded-xl shadow-lg border border-indigo-100 overflow-hidden animate-fade-in">
            <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-indigo-900 font-semibold">
                    <Mail className="w-5 h-5" />
                    <span>Borrador de Correo Generado</span>
                </div>
                <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded">IA Gemini 2.5</span>
            </div>
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Asunto</label>
                    <div className="p-3 bg-slate-50 rounded-lg text-slate-900 border border-slate-200 font-medium">
                        {report.subject}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cuerpo del Mensaje</label>
                    <div className="p-4 bg-slate-50 rounded-lg text-slate-700 border border-slate-200 whitespace-pre-line leading-relaxed">
                        {report.body}
                    </div>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                    <button 
                        onClick={() => setReport(null)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                    >
                        Descartar
                    </button>
                    <button 
                        onClick={() => alert('Reporte enviado a los interesados')}
                        className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
                    >
                        <Check className="w-4 h-4" />
                        <span>Aprobar y Enviar</span>
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Static Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Alertas Recientes</h3>
        </div>
        <div className="divide-y divide-slate-100">
            {tasks.filter(t => t.status === 'En Riesgo').map((task) => (
                <div key={`notif-${task.id}`} className="p-4 flex items-start space-x-3 hover:bg-slate-50 transition-colors">
                    <div className="mt-1">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-900">
                            Bloqueo / Riesgo Detectado: {task.name}
                        </p>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Proyecto: <span className="font-medium">{projects.find(p => p.id === task.projectId)?.name}</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-2">Hace 2 horas • Detectado por Sistema</p>
                    </div>
                </div>
            ))}
            <div className="p-4 flex items-start space-x-3 hover:bg-slate-50 transition-colors">
                 <div className="mt-1">
                    <Check className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-900">
                        Diseño Unifilar completado
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Ana García ha finalizado la tarea en tiempo récord.
                    </p>
                    <p className="text-xs text-slate-400 mt-2">Ayer a las 16:30</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
