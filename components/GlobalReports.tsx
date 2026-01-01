
import React, { useState, useEffect } from 'react';
import { Project, Task, User, AutomationSettings, EmailLogEntry } from '../types';
import { Printer, Filter, Calendar, User as UserIcon, Briefcase, Mail, CheckSquare, Square, Save, X, Send, FileText, CheckCircle2, AlertCircle, Clock, Search, FileDown, RefreshCw } from 'lucide-react';
import { logEmailEvent } from '../services/automationService';
import { logSystemAction } from '../services/auditService';

interface GlobalReportsProps {
  projects: Project[];
  tasks: Task[];
  users: User[];
}

const GlobalReports: React.FC<GlobalReportsProps> = ({ projects, tasks, users }) => {
  // --- STATE ---
  // Filters
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [taskSource, setTaskSource] = useState<'all' | 'project' | 'enterprise'>('all');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const [hideCompleted, setHideCompleted] = useState<boolean>(true); 

  // Modal & Recipients
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [sendingStatus, setSendingStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  // History Modal
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([]);

  // Force Load logs from Storage
  const loadLogs = () => {
      try {
          const savedLogs = localStorage.getItem('helios_email_logs');
          if (savedLogs) {
              setEmailLogs(JSON.parse(savedLogs));
          } else {
              setEmailLogs([]);
          }
      } catch (e) {
          console.error("Error loading logs", e);
      }
  };

  // Load logs whenever history modal opens
  useEffect(() => {
      if (isHistoryOpen) {
          loadLogs();
      }
  }, [isHistoryOpen]);

  // --- FILTER LOGIC ---
  const filteredTasks = tasks.filter(task => {
    // 1. Filter by User
    const matchesUser = selectedUser === 'all' || task.assignedTo === selectedUser;
    
    // 2. Filter by Date
    let matchesDate = true;
    if (dateStart && dateEnd) {
        matchesDate = task.startDate >= dateStart && task.startDate <= dateEnd;
    } else if (dateStart) {
        matchesDate = task.startDate >= dateStart;
    }

    // 3. Filter by Source
    let matchesSource = true;
    if (taskSource === 'project') {
        matchesSource = !task.isEnterprise;
    } else if (taskSource === 'enterprise') {
        matchesSource = !!task.isEnterprise;
    }

    // 4. Filter Completed
    let matchesStatus = true;
    if (hideCompleted) {
        matchesStatus = task.status !== 'Completado' && task.status !== 'Cancelado';
    }

    return matchesUser && matchesDate && matchesSource && matchesStatus;
  });

  // Sorting: Date -> Hierarchy
  const sortedTasks = [...filteredTasks].sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      if (dateA !== dateB) return dateA - dateB;
      if (a.id === b.parentId) return -1;
      if (b.id === a.parentId) return 1;
      return 0; 
  });

  // --- HELPERS ---
  const getContextName = (task: Task) => {
      if (task.isEnterprise) return task.department || 'Gestión Empresarial';
      return projects.find(p => p.id === task.projectId)?.name || 'Proyecto Desconocido';
  };
  
  const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'Sin Asignar';

  // --- ACTIONS ---
  const handlePrint = () => {
    logSystemAction('Imprimir Reporte', `Reporte filtrado (${sortedTasks.length} tareas)`, 'Reportes');
    // Using a timeout allows DOM updates
    setTimeout(() => window.print(), 100);
  };

  const handleSavePDF = () => {
    // DIRECT PRINT TRIGGER - NO ALERT
    // Browser print dialog handles PDF generation
    logSystemAction('Guardar PDF', `Solicitud de PDF (${sortedTasks.length} tareas)`, 'Reportes');
    setTimeout(() => window.print(), 100);
  };

  // --- RECIPIENT MANAGEMENT ---
  const handleOpenEmailModal = () => {
      let initialSelection: string[] = [];

      if (selectedUser !== 'all') {
          initialSelection = [selectedUser];
      } else {
          try {
              const savedDefaultsStr = localStorage.getItem('helios_report_defaults');
              if (savedDefaultsStr) {
                  const parsed = JSON.parse(savedDefaultsStr);
                  if (Array.isArray(parsed)) {
                      initialSelection = parsed.filter(id => users.some(u => u.id === id));
                  }
              }
          } catch (e) {
              console.error("Error reading default recipients", e);
              initialSelection = [];
          }
      }
      setSelectedRecipients(initialSelection);
      setIsEmailModalOpen(true);
  };

  const toggleRecipient = (userId: string) => {
      setSelectedRecipients(prev => 
          prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
      );
  };

  const saveAsDefault = () => {
      localStorage.setItem('helios_report_defaults', JSON.stringify(selectedRecipients));
      alert(`Grupo de ${selectedRecipients.length} personas guardado como predeterminado.`);
  };

  // --- SENDING LOGIC ---
  const handleSendReport = async () => {
      if (selectedRecipients.length === 0) {
          alert("Selecciona al menos un destinatario.");
          return;
      }

      setSendingStatus('sending');

      const recipients = users.filter(u => selectedRecipients.includes(u.id));
      const reportTitle = `Reporte de Estado RyV - ${new Date().toLocaleDateString()}`;
      
      let bodyText = `REPORTE DE ACTIVIDADES\nFecha: ${new Date().toLocaleDateString()}\n`;
      bodyText += `Tareas Listadas: ${sortedTasks.length}\n`;
      bodyText += `Filtro: ${hideCompleted ? 'Solo Pendientes' : 'Todas'}\n\n`;
      
      const maxTasks = 40;
      const tasksToShow = sortedTasks.slice(0, maxTasks);
      
      bodyText += tasksToShow.map(t => {
          const context = t.isEnterprise ? (t.department || 'Dpto') : 'Proy';
          return `- [${t.startDate}] [${t.status}] ${t.name} (${context} - ${getUserName(t.assignedTo)})`;
      }).join('\n');

      if (sortedTasks.length > maxTasks) bodyText += `\n... y ${sortedTasks.length - maxTasks} más.`;

      const warning = `\n\n[AVISO SISTEMA]: Si lees esto y no eres el destinatario, es por el uso del Plan Gratuito de EmailJS.`;
      bodyText += warning;

      const automationSettingsStr = localStorage.getItem('helios_automation');
      let usedEmailJS = false;

      // Try EmailJS
      if (automationSettingsStr) {
          const settings: AutomationSettings = JSON.parse(automationSettingsStr);
          if (settings.emailJsPublicKey && settings.emailJsServiceId && settings.emailJsTemplateId && window.emailjs) {
              try {
                  window.emailjs.init(settings.emailJsPublicKey);
                  
                  // SEQUENTIAL SENDING
                  for (const user of recipients) {
                      if (user.email.includes('@helioscuba.cu')) continue;

                      try {
                        await window.emailjs.send(
                            settings.emailJsServiceId!,
                            settings.emailJsTemplateId!,
                            {
                                to_email: user.email,
                                to_name: user.name,
                                subject: reportTitle,
                                message: bodyText,
                                task_count: sortedTasks.length
                            }
                        );
                        logEmailEvent(user.name, user.email, reportTitle, 'Enviado', 'Manual');
                        await new Promise(resolve => setTimeout(resolve, 100)); 

                      } catch(e) {
                          logEmailEvent(user.name, user.email, reportTitle, 'Error', 'Manual');
                          console.error("EmailJS Error", e);
                      }
                  }

                  usedEmailJS = true;
                  setSendingStatus('success');
                  logSystemAction('Enviar Reporte', `Reporte enviado a ${recipients.length} destinatarios`, 'Reportes');
                  setTimeout(() => {
                      setIsEmailModalOpen(false);
                      setSendingStatus('idle');
                  }, 2000);
                  return; 

              } catch (error) {
                  console.error("EmailJS Failed, falling back to mailto", error);
              }
          }
      }

      // MAILTO FALLBACK
      if (!usedEmailJS) {
          const recipientEmails = recipients.map(u => u.email).filter(e => e && !e.includes('helioscuba.cu'));
          const mailtoLink = `mailto:?bcc=${recipientEmails.join(',')}&subject=${encodeURIComponent(reportTitle)}&body=${encodeURIComponent(bodyText)}`;
          
          // 1. LOG TO LOCAL STORAGE FIRST
          recipients.forEach(u => logEmailEvent(u.name, u.email, reportTitle, 'Enviado', 'Manual'));
          logSystemAction('Enviar Reporte (Mailto)', `Reporte abierto en cliente de correo`, 'Reportes');
          
          // Force reload logs immediately in case user checks history right away
          loadLogs();

          // 2. TRIGGER MAILTO via window.location (More reliable for desktop clients)
          setTimeout(() => {
              window.location.href = mailtoLink;
              setSendingStatus('idle');
              setIsEmailModalOpen(false);
          }, 300);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center no-print gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reportes Globales</h1>
          <p className="text-slate-500 text-sm">Generación de listados para seguimiento y control</p>
        </div>
        <div className="flex flex-wrap space-x-3 gap-y-2">
            <button 
                onClick={() => setIsHistoryOpen(true)}
                className="flex items-center space-x-2 bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
                <Clock className="w-4 h-4" />
                <span>Historial</span>
            </button>
            <button 
                onClick={handleOpenEmailModal}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
                <Mail className="w-4 h-4" />
                <span>Enviar Email</span>
            </button>
            
            {/* PDF BUTTON - DIRECT ACTION */}
            <button 
                onClick={handleSavePDF}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            >
                <FileDown className="w-4 h-4" />
                <span>Guardar PDF</span>
            </button>

            {/* PRINT BUTTON */}
            <button 
                onClick={handlePrint}
                className="flex items-center space-x-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors shadow-sm"
                title="Imprimir directamente"
            >
                <Printer className="w-4 h-4" />
                <span>Imprimir</span>
            </button>
        </div>
      </div>

      {/* Filters (Hidden during print via .no-print in CSS) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 no-print">
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filtros de Búsqueda
            </h3>
            
            <label className="flex items-center cursor-pointer space-x-2">
                <div className="relative">
                    <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={hideCompleted} 
                        onChange={() => setHideCompleted(!hideCompleted)}
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${hideCompleted ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${hideCompleted ? 'transform translate-x-4' : ''}`}></div>
                </div>
                <span className="text-sm font-medium text-slate-600">Ocultar Tareas Terminadas</span>
            </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Responsable</label>
                <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                    <select 
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                    >
                        <option value="all">Todos los empleados</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tipo de Origen</label>
                <div className="relative">
                    <Briefcase className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                    <select 
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={taskSource}
                        onChange={(e) => setTaskSource(e.target.value as any)}
                    >
                        <option value="all">Todo (Proyectos + Empresa)</option>
                        <option value="project">Solo Proyectos</option>
                        <option value="enterprise">Solo Gestión Empresarial</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Fecha Inicio (Desde)</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                    <input 
                        type="date" 
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={dateStart}
                        onChange={(e) => setDateStart(e.target.value)}
                    />
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Fecha Fin (Hasta)</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                    <input 
                        type="date" 
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={dateEnd}
                        onChange={(e) => setDateEnd(e.target.value)}
                    />
                </div>
            </div>
        </div>
      </div>

      {/* Report Content - WRAPPED WITH ID FOR PRINTING */}
      <div id="printable-area" className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print-full-width">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Listado de Actividades</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        {hideCompleted ? 'Solo tareas pendientes o en curso.' : 'Todas las tareas (incluye completadas).'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">Fecha de Corte: {new Date().toLocaleDateString()}</p>
                    <p className="text-xs text-slate-500">Total: {sortedTasks.length} registros</p>
                </div>
              </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-white text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                        <th className="p-4 w-1/4">Origen</th>
                        <th className="p-4 w-1/3">Tarea y Jerarquía</th>
                        <th className="p-4">Responsable</th>
                        <th className="p-4">Fecha Inicio</th>
                        <th className="p-4 text-center">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                    {sortedTasks.length > 0 ? sortedTasks.map(task => (
                        <tr key={task.id} className="break-inside-avoid">
                            <td className="p-4 align-top">
                                <span className={`font-medium block ${task.isEnterprise ? 'text-indigo-600' : 'text-slate-700'}`}>
                                    {getContextName(task)}
                                </span>
                                {task.isEnterprise && <span className="text-[10px] bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-700 border border-indigo-100">AREA</span>}
                            </td>
                            <td className="p-4 align-top">
                                {/* Hierarchy Indicator */}
                                {task.parentId ? (
                                    <div className="flex flex-col">
                                        <div className="text-slate-900 font-medium pl-4 border-l-2 border-slate-300">
                                            {task.name}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-slate-900 font-bold">{task.name}</div>
                                )}
                                <div className="text-xs text-slate-500 mt-1">{task.phase}</div>
                            </td>
                            <td className="p-4 align-top text-slate-600 font-medium">{getUserName(task.assignedTo)}</td>
                            <td className="p-4 align-top text-slate-600 whitespace-nowrap">{task.startDate}</td>
                            <td className="p-4 align-top text-center">
                                <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap inline-block border ${
                                    task.status === 'Completado' ? 'text-green-700 bg-green-50 border-green-200' :
                                    task.status === 'En Riesgo' ? 'text-red-700 bg-red-50 border-red-200' :
                                    task.status === 'En Progreso' ? 'text-blue-700 bg-blue-50 border-blue-200' : 
                                    task.status === 'Cancelado' ? 'text-orange-700 bg-orange-50 border-orange-200' :
                                    'text-slate-600 bg-slate-100 border-slate-200'
                                }`}>
                                    {task.status}
                                </span>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400">
                                No se encontraron tareas con los filtros seleccionados.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
          </div>
          
          <div className="p-6 border-t border-slate-200 bg-slate-50 text-center text-xs text-slate-400">
              Reporte generado por RyV Manager • {new Date().toLocaleString()}
          </div>
      </div>

      {/* MODAL DE ENVÍO */}
      {isEmailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 no-print">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                            <Send className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Enviar Reporte (Gmail)</h3>
                      </div>
                      <button onClick={() => setIsEmailModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
                  </div>

                  <div className="p-6 overflow-y-auto flex-1">
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6 text-sm text-blue-800 flex items-start">
                          <FileText className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                          <div>
                              <p className="font-bold mb-1">Se enviará el reporte actual</p>
                              <p className="text-blue-600">Filtro: {hideCompleted ? 'Solo Pendientes' : 'Todas'} | Total: {sortedTasks.length} tareas</p>
                              <p className="text-xs mt-2 text-blue-500">* Se usa EmailJS (Plan Gratuito). Los correos pueden redirigirse al administrador si no tienes plan de pago.</p>
                          </div>
                      </div>

                      <div className="mb-4 flex justify-between items-center">
                          <label className="text-sm font-bold text-slate-700">Seleccionar Destinatarios</label>
                          <button 
                            onClick={saveAsDefault}
                            className="text-xs flex items-center text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                              <Save className="w-3 h-3 mr-1" /> Guardar como Predeterminados
                          </button>
                      </div>

                      <div className="border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
                          {users.map(user => {
                              const isSelected = selectedRecipients.includes(user.id);
                              return (
                                  <div 
                                    key={user.id} 
                                    className={`flex items-center justify-between p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50' : ''}`}
                                    onClick={() => toggleRecipient(user.id)}
                                  >
                                      <div className="flex items-center space-x-3">
                                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                              {isSelected && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                                          </div>
                                          <div>
                                              <p className={`text-sm font-medium ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{user.name}</p>
                                              <p className="text-xs text-slate-500">{user.role}</p>
                                          </div>
                                      </div>
                                  </div>
                              )
                          })}
                      </div>
                      <p className="text-xs text-slate-400 mt-2 text-right">{selectedRecipients.length} seleccionados</p>
                  </div>

                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
                      <button onClick={() => setIsEmailModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium">Cancelar</button>
                      <button 
                        onClick={handleSendReport}
                        disabled={sendingStatus === 'sending' || selectedRecipients.length === 0}
                        className={`px-6 py-2 rounded-lg text-white font-medium shadow-md transition-all flex items-center ${
                            sendingStatus === 'success' ? 'bg-green-600' : sendingStatus === 'sending' ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                      >
                          {sendingStatus === 'sending' ? 'Enviando...' : sendingStatus === 'success' ? '¡Enviado!' : 'Enviar Reporte'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* HISTORY MODAL */}
      {isHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 no-print">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center">
                          <Clock className="w-5 h-5 mr-2 text-slate-500" />
                          Historial de Envíos
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button onClick={loadLogs} className="p-2 hover:bg-slate-100 rounded-full text-slate-500" title="Actualizar">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button onClick={() => setIsHistoryOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
                      </div>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1">
                      <div className="bg-orange-50 border border-orange-100 p-3 rounded mb-4 text-xs text-orange-800">
                          <strong>Nota:</strong> Este registro muestra cuándo el sistema envió el correo. 
                          Debido a restricciones de privacidad globales, no es posible saber si el usuario abrió el correo o lo leyó (requeriría servidores de rastreo).
                      </div>
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                              <tr>
                                  <th className="p-3">Fecha/Hora</th>
                                  <th className="p-3">Destinatario</th>
                                  <th className="p-3">Asunto</th>
                                  <th className="p-3">Tipo</th>
                                  <th className="p-3">Estado</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {emailLogs.length > 0 ? emailLogs.map(log => (
                                  <tr key={log.id} className="hover:bg-slate-50">
                                      <td className="p-3 text-slate-600 whitespace-nowrap">
                                          {new Date(log.timestamp).toLocaleString()}
                                      </td>
                                      <td className="p-3">
                                          <div className="font-medium text-slate-800">{log.recipientName}</div>
                                          <div className="text-xs text-slate-400">{log.recipientEmail}</div>
                                      </td>
                                      <td className="p-3 text-slate-600 truncate max-w-xs" title={log.subject}>
                                          {log.subject}
                                      </td>
                                      <td className="p-3">
                                          <span className={`px-2 py-0.5 rounded text-xs border ${
                                              log.type === 'Automático' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                                          }`}>
                                              {log.type}
                                          </span>
                                      </td>
                                      <td className="p-3">
                                          <span className={`flex items-center font-bold text-xs ${log.status === 'Enviado' ? 'text-green-600' : 'text-red-600'}`}>
                                              {log.status === 'Enviado' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                                              {log.status}
                                          </span>
                                      </td>
                                  </tr>
                              )) : (
                                  <tr>
                                      <td colSpan={5} className="p-8 text-center text-slate-400">
                                          No hay registros de envíos recientes.
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default GlobalReports;
