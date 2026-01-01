
import React, { useState, useEffect } from 'react';
import TeamManagement from './TeamManagement';
import { User, ProjectPhase, TaskStatus, ProjectStatus, Priority, Project, Task, AutomationSettings, AuditLogEntry } from '../types';
import { Layers, ListChecks, Activity, Users as UsersIcon, Settings as SettingsIcon, Plus, Trash2, Edit2, Save, X, Image as ImageIcon, Upload, Building, Database, Download, FileText, FileSpreadsheet, Zap, Mail, Clock, Key, HelpCircle, ChevronRight, ExternalLink, Send, RefreshCw, CheckCircle2, AlertTriangle, AlertOctagon, Printer, CheckSquare, Square, Shield } from 'lucide-react';
import { runDailyAutomation } from '../services/automationService';
import { getAuditLogs, clearAuditLogs, logSystemAction } from '../services/auditService';

interface SettingsProps {
    users: User[];
    onAddUser: (user: User) => void;
    onUpdateUser: (user: User) => void;
    onDeleteUser: (userId: string) => void;
    onResetData: () => void;
    
    // Config Props
    phases: string[];
    setPhases: (phases: string[]) => void;
    
    taskStatuses: string[];
    setTaskStatuses: (statuses: string[]) => void;
    
    projectStatuses: string[];
    setProjectStatuses: (statuses: string[]) => void;
    
    projectTemplate: any[];
    setProjectTemplate: (template: any[]) => void;

    companyLogo: string;
    setCompanyLogo: (logo: string) => void;

    departments: string[];
    setDepartments: (depts: string[]) => void;

    // NEW: Roles
    roles: string[];
    setRoles: (roles: string[]) => void;

    // Data Import/Export props
    projects: Project[];
    tasks: Task[];
    setProjects: (p: Project[]) => void;
    setTasks: (t: Task[]) => void;
}

// Helper for Toast Notifications inside Settings
interface ToastMsg {
    type: 'success' | 'error' | 'info';
    text: string;
}

// --- HELPER FOR STATUS COLORS ---
const getPreviewColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('completado') || s.includes('finalizado')) return 'bg-emerald-500';
    if (s.includes('riesgo') || s.includes('atrasado') || s.includes('error')) return 'bg-red-500';
    if (s.includes('progreso') || s.includes('curso') || s.includes('ejecución')) return 'bg-blue-500';
    if (s.includes('planificación') || s.includes('diseño')) return 'bg-yellow-500'; // Updated to Yellow
    if (s.includes('cancelado') || s.includes('detenido')) return 'bg-orange-500';
    
    const colors = ['bg-purple-500', 'bg-pink-500', 'bg-teal-500', 'bg-cyan-500', 'bg-lime-500'];
    let hash = 0;
    for (let i = 0; i < status.length; i++) hash = status.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

// --- SUB-COMPONENTS ---

const AuditLogViewer = () => {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);

    useEffect(() => {
        setLogs(getAuditLogs());
    }, []);

    const refreshLogs = () => {
        setLogs(getAuditLogs());
    };

    const handleClear = () => {
        if(confirm("¿Borrar todo el historial de auditoría? Esta acción no se puede deshacer.")) {
            clearAuditLogs();
            refreshLogs();
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in flex flex-col h-full max-h-[600px]">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-indigo-600" />
                        Auditoría del Sistema
                    </h3>
                    <p className="text-sm text-slate-500">Registro de todas las operaciones realizadas.</p>
                </div>
                <div className="flex space-x-2">
                    <button onClick={refreshLogs} className="p-2 hover:bg-slate-100 rounded-full text-slate-500" title="Actualizar">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button onClick={handleClear} className="text-xs text-red-600 hover:underline px-2">Limpiar Registro</button>
                </div>
            </div>

            <div className="flex-1 overflow-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold sticky top-0">
                        <tr>
                            <th className="p-3 border-b">Fecha/Hora</th>
                            <th className="p-3 border-b">Usuario</th>
                            <th className="p-3 border-b">Módulo</th>
                            <th className="p-3 border-b">Acción</th>
                            <th className="p-3 border-b">Detalles</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400">Sin registros de auditoría.</td></tr>
                        )}
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50">
                                <td className="p-3 text-slate-500 whitespace-nowrap text-xs">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="p-3 font-medium text-slate-700">{log.user}</td>
                                <td className="p-3">
                                    <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs border border-slate-200">
                                        {log.module}
                                    </span>
                                </td>
                                <td className="p-3 font-medium text-slate-800">{log.action}</td>
                                <td className="p-3 text-slate-500 text-xs truncate max-w-xs" title={log.details}>
                                    {log.details}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ... ReportDefaultsEditor, BrandingEditor, AutomationEditor are mostly unchanged ...
const ReportDefaultsEditor = ({ users, showToast }: { users: User[], showToast: (msg: ToastMsg) => void }) => {
    const [defaults, setDefaults] = useState<string[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('helios_report_defaults');
        if (saved) setDefaults(JSON.parse(saved));
    }, []);

    const toggleUser = (userId: string) => {
        const newDefaults = defaults.includes(userId) 
            ? defaults.filter(id => id !== userId)
            : [...defaults, userId];
        
        setDefaults(newDefaults);
        localStorage.setItem('helios_report_defaults', JSON.stringify(newDefaults));
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-3xl animate-fade-in">
             <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <Printer className="w-5 h-5 mr-2 text-indigo-600" />
                    Destinatarios Predeterminados
                </h3>
                <p className="text-sm text-slate-500">
                    Selecciona qué usuarios recibirán los <strong>Reportes Globales</strong> (cuando el filtro es "Todos") de forma automática.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                {users.map(user => {
                    const isSelected = defaults.includes(user.id);
                    return (
                        <div 
                            key={user.id}
                            onClick={() => toggleUser(user.id)}
                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                                isSelected 
                                ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                                : 'bg-white border-slate-200 hover:border-indigo-200'
                            }`}
                        >
                             <div className={`w-5 h-5 rounded mr-3 flex items-center justify-center transition-colors ${
                                 isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-transparent border border-slate-300'
                             }`}>
                                 <CheckSquare className="w-3.5 h-3.5" />
                             </div>
                             <div>
                                 <p className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{user.name}</p>
                                 <p className="text-xs text-slate-500">{user.role}</p>
                             </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const BrandingEditor = ({ companyLogo, setCompanyLogo }: { companyLogo: string, setCompanyLogo: (logo: string) => void }) => {
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCompanyLogo(reader.result as string);
                logSystemAction('Cambio Logo', 'Se actualizó el logo de la empresa', 'Configuración');
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-2xl animate-fade-in">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800">Identidad Corporativa</h3>
                <p className="text-sm text-slate-500">Personaliza la apariencia de la aplicación.</p>
            </div>

            <div className="flex items-start space-x-6">
                <div className="w-32 h-32 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group">
                    {companyLogo ? (
                        <img src={companyLogo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                        <ImageIcon className="w-8 h-8 text-slate-400" />
                    )}
                </div>
                
                <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Logo de la Empresa</label>
                    <p className="text-xs text-slate-500 mb-4">Sube tu logo para que aparezca en la barra lateral y en los reportes impresos. Recomendado: PNG o JPG cuadrado.</p>
                    
                    <div className="flex items-center space-x-3">
                        <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
                            <Upload className="w-4 h-4 mr-2" />
                            <span>Subir Imagen</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                        {companyLogo && (
                            <button 
                                onClick={() => setCompanyLogo('')}
                                className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Eliminar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AutomationEditor = ({ 
    automation, 
    setAutomation, 
    tasks, 
    users,
    showToast 
}: { 
    automation: AutomationSettings, 
    setAutomation: (s: AutomationSettings) => void,
    tasks: Task[],
    users: User[],
    showToast: (msg: ToastMsg) => void
}) => {
    const [isTesting, setIsTesting] = useState(false);

    const handleTestEmail = async () => {
        if (!automation.emailJsPublicKey || !automation.emailJsServiceId || !automation.emailJsTemplateId) {
            showToast({ type: 'error', text: 'Faltan credenciales de EmailJS' });
            return;
        }
        setIsTesting(true);
        try {
            const result = await runDailyAutomation(tasks, users, automation);
            logSystemAction('Prueba Email', `Resultado: ${result.success ? 'Éxito' : 'Fallo'}`, 'Configuración');
            if (result.success && result.count > 0) {
                showToast({ type: 'success', text: `¡Éxito! Se enviaron ${result.count} correos de prueba.` });
            } else if (result.success && result.count === 0) {
                showToast({ type: 'info', text: 'Conexión exitosa, pero no hay tareas pendientes para notificar.' });
            } else {
                showToast({ type: 'error', text: 'Error en el envío. Revisa la consola.' });
            }
        } catch (error) {
            console.error(error);
            showToast({ type: 'error', text: 'Error crítico al ejecutar la prueba.' });
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="max-w-3xl space-y-6 animate-fade-in">
             <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                    <div className="p-3 bg-white rounded-full text-blue-600 shadow-sm">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Rutina Matutina Automática (7:00 AM)</h3>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                            El sistema revisará automáticamente todas las tareas pendientes cada mañana.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="font-bold text-slate-800">Configuración de Envío</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={automation.enabled}
                            onChange={(e) => setAutomation({...automation, enabled: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        <span className="ml-3 text-sm font-medium text-slate-700">{automation.enabled ? 'Activado' : 'Desactivado'}</span>
                    </label>
                </div>
                
                <div className="space-y-6">
                     <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Correo del Administrador</label>
                         <input 
                            type="email" 
                            value={automation.adminEmail}
                            onChange={(e) => setAutomation({...automation, adminEmail: e.target.value})}
                            placeholder="admin@empresa.com"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                         />
                     </div>
                     <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Service ID</label>
                                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-mono" value={automation.emailJsServiceId || ''} onChange={(e) => setAutomation({...automation, emailJsServiceId: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Template ID</label>
                                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-mono" value={automation.emailJsTemplateId || ''} onChange={(e) => setAutomation({...automation, emailJsTemplateId: e.target.value})} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Public Key (API Key)</label>
                                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-mono" value={automation.emailJsPublicKey || ''} onChange={(e) => setAutomation({...automation, emailJsPublicKey: e.target.value})} />
                            </div>
                        </div>
                        <button onClick={handleTestEmail} disabled={isTesting || !automation.emailJsPublicKey} className={`mt-4 w-full flex items-center justify-center px-4 py-3 rounded-lg font-bold transition-colors shadow-sm ${!automation.emailJsPublicKey ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : isTesting ? 'bg-blue-100 text-blue-700' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>{isTesting ? 'Enviando...' : 'Enviar Email de Prueba Ahora'}</button>
                     </div>
                </div>
            </div>
        </div>
    );
};

const ListEditor = ({ 
    title, description, items, onSave, showToast, showColorBadge = false 
}: { 
    title: string, description: string, items: string[], onSave: (items: string[]) => void, showToast: (msg: ToastMsg) => void, showColorBadge?: boolean 
}) => {
    const [localItems, setLocalItems] = useState<string[]>(items);
    const [newItem, setNewItem] = useState('');
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

    useEffect(() => {
        setLocalItems(items);
    }, [items]);

    const handleAddItem = () => {
        if (newItem.trim()) {
            const updated = [...localItems, newItem.trim()];
            setLocalItems(updated);
            onSave(updated);
            logSystemAction('Editar Lista', `Añadido: ${newItem.trim()} a ${title}`, 'Configuración');
            setNewItem('');
            showToast({ type: 'success', text: 'Elemento añadido' });
        }
    };

    const confirmDelete = () => {
        if (deleteIndex !== null) {
            const removed = localItems[deleteIndex];
            const updated = localItems.filter((_, i) => i !== deleteIndex);
            setLocalItems(updated);
            onSave(updated);
            logSystemAction('Editar Lista', `Eliminado: ${removed} de ${title}`, 'Configuración');
            showToast({ type: 'info', text: 'Elemento eliminado' });
            setDeleteIndex(null);
        }
    };

    const handleEditItem = (index: number, val: string) => {
            const updated = [...localItems];
            updated[index] = val;
            setLocalItems(updated);
    };

    const handleBlurItem = () => {
        onSave(localItems);
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in relative">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                <p className="text-sm text-slate-500">{description}</p>
            </div>

            <div className="space-y-3">
                {localItems.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                        {/* COLOR BADGE FOR STATUSES */}
                        {showColorBadge && (
                            <div className={`w-4 h-4 rounded-full flex-shrink-0 ${getPreviewColor(item)} border border-white shadow-sm ring-1 ring-slate-100`} title="Color automático"></div>
                        )}
                        <input 
                            type="text" 
                            value={item}
                            onChange={(e) => handleEditItem(idx, e.target.value)}
                            onBlur={handleBlurItem}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                        />
                        <div className="w-8 flex items-center justify-center">
                            <button 
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setDeleteIndex(idx)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
                
                <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 mt-4">
                        {showColorBadge && <div className="w-4 h-4 mr-1"></div>}
                        <input 
                        type="text" 
                        placeholder="Añadir nuevo..."
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-slate-50"
                    />
                    <button 
                        onClick={handleAddItem}
                        className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        title="Añadir"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Custom Modal for Deletion Confirmation */}
            {deleteIndex !== null && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in border border-red-100 transform scale-100">
                         <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertOctagon className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">¿Eliminar elemento?</h3>
                            <p className="text-sm text-slate-600 mb-6">
                                Se eliminará "{localItems[deleteIndex]}".<br/>
                                Esta acción no se puede deshacer.
                            </p>
                            <div className="flex space-x-3 justify-center">
                                <button 
                                    onClick={() => setDeleteIndex(null)}
                                    className="px-4 py-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={confirmDelete}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-md transition-colors"
                                >
                                    Sí, Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TemplateEditor = ({ phases, projectTemplate, setProjectTemplate }: { phases: string[], projectTemplate: any[], setProjectTemplate: (t: any[]) => void }) => {
    // ... Unchanged ...
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [tempTask, setTempTask] = useState<any>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

    const startEdit = (index: number) => {
        setEditingIndex(index);
        setTempTask({ ...projectTemplate[index] });
        setIsAdding(false);
    };

    const startAdd = () => {
        setTempTask({ name: '', phase: phases[0], duration: 1, offset: 0, priority: 'Media' });
        setIsAdding(true);
        setEditingIndex(null);
    };

    const saveTask = () => {
        if (!tempTask.name) return;
        let updated;
        if (isAdding) {
            updated = [...projectTemplate, tempTask];
        } else if (editingIndex !== null) {
            updated = [...projectTemplate];
            updated[editingIndex] = tempTask;
        }
        if (updated) {
            setProjectTemplate(updated);
            logSystemAction('Plantilla', `Tarea guardada: ${tempTask.name}`, 'Configuración');
        }
        setEditingIndex(null);
        setIsAdding(false);
        setTempTask(null);
    };

    const deleteTask = (index: number) => {
        setDeleteIndex(index);
    };

    const confirmDelete = () => {
        if (deleteIndex !== null) {
            const updated = projectTemplate.filter((_, i) => i !== deleteIndex);
            setProjectTemplate(updated);
            setDeleteIndex(null);
            logSystemAction('Plantilla', 'Tarea eliminada', 'Configuración');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            <div className="flex justify-between items-center">
                    <div>
                    <h3 className="text-lg font-bold text-slate-800">Plantilla de Tareas Predeterminadas</h3>
                    <p className="text-sm text-slate-500">Estas tareas se crean automáticamente al iniciar un proyecto nuevo.</p>
                    </div>
                    <button onClick={startAdd} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                        <Plus className="w-4 h-4" /> <span>Añadir Tarea</span>
                    </button>
            </div>
            
                {(editingIndex !== null || isAdding) && tempTask && (
                <div className="bg-slate-50 p-4 rounded-lg border border-blue-200 mb-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Tarea</label>
                            <input type="text" className="w-full p-2 border rounded" value={tempTask.name} onChange={e => setTempTask({...tempTask, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fase</label>
                            <select className="w-full p-2 border rounded" value={tempTask.phase} onChange={e => setTempTask({...tempTask, phase: e.target.value})}>
                                {phases.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                            <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prioridad</label>
                            <select className="w-full p-2 border rounded" value={tempTask.priority} onChange={e => setTempTask({...tempTask, priority: e.target.value})}>
                                <option value="Baja">Baja</option>
                                <option value="Media">Media</option>
                                <option value="Alta">Alta</option>
                                <option value="Crítica">Crítica</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duración (Días)</label>
                            <input type="number" min="1" className="w-full p-2 border rounded" value={tempTask.duration} onChange={e => setTempTask({...tempTask, duration: parseInt(e.target.value)})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Offset (Días desde inicio)</label>
                            <input type="number" min="0" className="w-full p-2 border rounded" value={tempTask.offset} onChange={e => setTempTask({...tempTask, offset: parseInt(e.target.value)})} />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                        <button onClick={() => { setIsAdding(false); setEditingIndex(null); }} className="px-3 py-1.5 text-slate-600 bg-white border border-slate-300 rounded text-sm">Cancelar</button>
                        <button onClick={saveTask} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm flex items-center"><Save className="w-4 h-4 mr-1" /> Guardar</button>
                    </div>
                </div>
            )}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                            <th className="p-4">Tarea</th>
                            <th className="p-4">Fase</th>
                            <th className="p-4">Duración</th>
                            <th className="p-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {projectTemplate.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-4 font-medium text-slate-800">{item.name}</td>
                                <td className="p-4 text-slate-500">
                                    <span className="bg-slate-100 px-2 py-1 rounded text-xs">{item.phase}</span>
                                </td>
                                <td className="p-4 text-slate-500">{item.duration}d (+{item.offset})</td>
                                <td className="p-4 text-right flex justify-end space-x-2">
                                    <button onClick={() => startEdit(idx)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => deleteTask(idx)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Template Deletion Modal */}
            {deleteIndex !== null && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in border border-red-100 transform scale-100">
                         <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertOctagon className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">¿Eliminar Tarea?</h3>
                            <p className="text-sm text-slate-600 mb-6">
                                Se eliminará "{projectTemplate[deleteIndex]?.name}".<br/>
                                Esta acción no se puede deshacer.
                            </p>
                            <div className="flex space-x-3 justify-center">
                                <button 
                                    onClick={() => setDeleteIndex(null)}
                                    className="px-4 py-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={confirmDelete}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-md transition-colors"
                                >
                                    Sí, Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
};

const DataManagement = ({ 
    projects, tasks, users, setProjects, setTasks 
}: { 
    projects: Project[], tasks: Task[], users: User[], setProjects: (p: Project[]) => void, setTasks: (t: Task[]) => void 
}) => {
    // ... Unchanged ...
    const handleExport = () => {
        const dataStr = JSON.stringify({ projects, tasks, users }, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `helios_backup_${new Date().toISOString().slice(0,10)}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        logSystemAction('Backup', 'Exportación completa de datos', 'Sistema');
    };
    
    const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const json = JSON.parse(evt.target?.result as string);
                if(json.projects) setProjects(json.projects);
                if(json.tasks) setTasks(json.tasks);
                alert("Importado");
                logSystemAction('Restauración', 'Importación de Backup JSON', 'Sistema');
            } catch(e) { alert("Error"); }
        };
        reader.readAsText(file);
    };

    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
         alert("Funcionalidad de importación CSV disponible (Simplificada en esta vista)");
    };

    return (
        <div className="space-y-6 max-w-4xl animate-fade-in">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
                    <Database className="w-5 h-5 mr-2 text-blue-500" />
                    Copia de Seguridad (Backup)
                </h3>
                <p className="text-sm text-slate-500 mb-4">Descarga una copia completa de todos los proyectos, tareas y usuarios en formato JSON.</p>
                <button onClick={handleExport} className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors text-sm font-medium">
                    <Download className="w-4 h-4" /><span>Exportar Todo</span>
                </button>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center"><Upload className="w-5 h-5 mr-2 text-emerald-500" /> Restaurar / Importar</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                            <h4 className="font-bold text-slate-700 text-sm mb-2">Restaurar Backup (JSON)</h4>
                            <input type="file" accept=".json" onChange={handleImportJSON} className="block w-full text-xs text-slate-500" />
                        </div>
                        <div className="border border-slate-200 rounded-lg p-4 hover:border-emerald-300 transition-colors">
                            <h4 className="font-bold text-slate-700 text-sm mb-2">Importar CSV</h4>
                            <input type="file" accept=".csv" onChange={handleImportCSV} className="block w-full text-xs text-slate-500" />
                        </div>
                    </div>
                </div>
        </div>
    );
};

// --- MAIN SETTINGS COMPONENT ---

export const Settings: React.FC<SettingsProps> = ({
    users, onAddUser, onUpdateUser, onDeleteUser, onResetData,
    phases, setPhases,
    taskStatuses, setTaskStatuses,
    projectStatuses, setProjectStatuses,
    projectTemplate, setProjectTemplate,
    companyLogo, setCompanyLogo,
    departments, setDepartments,
    roles, setRoles, // NEW
    projects, tasks, setProjects, setTasks
}) => {
    const [activeTab, setActiveTab] = useState<'branding' | 'departments' | 'roles' | 'team' | 'phases' | 'statuses' | 'template' | 'data' | 'automation' | 'reports' | 'audit'>('branding');
    const [toast, setToast] = useState<ToastMsg | null>(null);

    const showToast = (msg: ToastMsg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 4000);
    };

    const [automation, setAutomation] = useState<AutomationSettings>(() => {
        const saved = localStorage.getItem('helios_automation');
        const defaults = { 
            enabled: true, 
            emailProvider: 'gmail', 
            adminEmail: users[0]?.email || '', 
            lastRunDate: null,
            emailJsServiceId: 'service_h5msw16',
            emailJsTemplateId: 'template_6nwrlun',
            emailJsPublicKey: 'zT-yR3eE8gUU2Jsu7'
        };
        
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                ...parsed,
                emailJsServiceId: parsed.emailJsServiceId || defaults.emailJsServiceId,
                emailJsTemplateId: parsed.emailJsTemplateId || defaults.emailJsTemplateId,
                emailJsPublicKey: parsed.emailJsPublicKey || defaults.emailJsPublicKey,
                enabled: parsed.enabled ?? true
            };
        }
        return defaults as AutomationSettings;
    });

    useEffect(() => {
        localStorage.setItem('helios_automation', JSON.stringify(automation));
    }, [automation]);

    const menuItems = [
        { id: 'branding', label: 'Empresa', icon: SettingsIcon, desc: 'Logo e identidad' },
        { id: 'departments', label: 'Áreas/Dptos', icon: Building, desc: 'Estructura organizativa' },
        { id: 'roles', label: 'Roles', icon: Key, desc: 'Perfiles de usuario' }, // Renamed from Roles y Accesos
        { id: 'team', label: 'Equipo', icon: UsersIcon, desc: 'Usuarios y códigos' },
        { id: 'reports', label: 'Reportes', icon: Printer, desc: 'Destinatarios predeterminados' }, 
        { id: 'phases', label: 'Fases', icon: Layers, desc: 'Etapas de proyecto' },
        { id: 'statuses', label: 'Estados', icon: Activity, desc: 'Flujos de trabajo' },
        { id: 'template', label: 'Plantilla', icon: ListChecks, desc: 'Tareas por defecto' },
        { id: 'automation', label: 'Automatización', icon: Zap, desc: 'Correos y alertas' },
        { id: 'audit', label: 'Auditoría', icon: Shield, desc: 'Registro de operaciones' }, // NEW
        { id: 'data', label: 'Base de Datos', icon: Database, desc: 'Importar/Exportar' },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] relative">
            
            {/* Custom Toast Notification */}
            {toast && (
                <div className={`absolute top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl flex items-center space-x-3 animate-fade-in transition-all transform hover:scale-105 cursor-pointer ${
                    toast.type === 'success' ? 'bg-emerald-600 text-white' :
                    toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'
                }`} onClick={() => setToast(null)}>
                    {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                    {toast.type === 'error' && <AlertTriangle className="w-5 h-5" />}
                    {toast.type === 'info' && <Zap className="w-5 h-5 text-yellow-300" />}
                    <span className="font-medium text-sm">{toast.text}</span>
                    <button className="ml-2 text-white/50 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
            )}

            <h1 className="text-2xl font-bold text-slate-800 mb-6 flex-shrink-0">Configuración General</h1>
            
            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-64 flex-shrink-0 flex flex-col space-y-2 overflow-y-auto pr-2">
                    {menuItems.map(item => (
                        <button 
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`w-full flex items-center p-3 rounded-xl transition-all text-left group ${
                                activeTab === item.id 
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200'
                            }`}
                        >
                            <div className={`p-2 rounded-lg mr-3 ${activeTab === item.id ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-white'}`}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="block font-bold text-sm">{item.label}</span>
                                <span className={`text-[10px] ${activeTab === item.id ? 'text-blue-100' : 'text-slate-400'}`}>{item.desc}</span>
                            </div>
                            {activeTab === item.id && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                        </button>
                    ))}
                    
                    {activeTab === 'data' && (
                         <div className="pt-4 mt-auto">
                            <button 
                                onClick={onResetData}
                                className="w-full p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Restaurar Fábrica
                            </button>
                         </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto pr-2 pb-10">
                    {activeTab === 'branding' && (
                        <BrandingEditor companyLogo={companyLogo} setCompanyLogo={setCompanyLogo} />
                    )}

                    {activeTab === 'departments' && (
                         <div className="max-w-3xl">
                            <ListEditor 
                                title="Áreas de la Empresa" 
                                description="Define los departamentos o áreas funcionales (ej. Ingeniería, RRHH, Marketing) para la Gestión Empresarial."
                                items={departments}
                                onSave={setDepartments}
                                showToast={showToast}
                            />
                        </div>
                    )}

                    {activeTab === 'roles' && (
                         <div className="max-w-3xl">
                            <ListEditor 
                                title="Roles de Usuario" 
                                description="Define los roles disponibles para el equipo (ej. Ingeniero, Administrador, Técnico)."
                                items={roles}
                                onSave={setRoles}
                                showToast={showToast}
                            />
                        </div>
                    )}

                    {activeTab === 'team' && (
                        <TeamManagement 
                            users={users} 
                            onAddUser={onAddUser} 
                            onUpdateUser={onUpdateUser} 
                            onDeleteUser={onDeleteUser}
                            onResetData={onResetData} 
                            departments={departments}
                            roles={roles}
                        />
                    )}

                    {activeTab === 'reports' && (
                         <ReportDefaultsEditor users={users} showToast={showToast} />
                    )}

                    {activeTab === 'phases' && (
                        <div className="max-w-3xl">
                            <ListEditor 
                                title="Fases de los Proyectos" 
                                description="Define las etapas por las que pasa un proyecto. Estas se usarán para agrupar tareas en el diagrama de Gantt."
                                items={phases}
                                onSave={setPhases}
                                showToast={showToast}
                            />
                        </div>
                    )}

                    {activeTab === 'statuses' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
                            <ListEditor 
                                title="Estados de los Proyectos" 
                                description="Ciclo de vida de un proyecto completo (ej. Planificación, En Progreso)."
                                items={projectStatuses}
                                onSave={setProjectStatuses}
                                showToast={showToast}
                                showColorBadge={true} // Enabled Color Badges
                            />
                            <ListEditor 
                                title="Estados de las Tareas" 
                                description="Flujo de trabajo para tareas individuales (Kanban)."
                                items={taskStatuses}
                                onSave={setTaskStatuses}
                                showToast={showToast}
                                showColorBadge={true} // Enabled Color Badges
                            />
                        </div>
                    )}

                    {activeTab === 'template' && (
                        <div className="max-w-4xl">
                            <TemplateEditor phases={phases} projectTemplate={projectTemplate} setProjectTemplate={setProjectTemplate} />
                        </div>
                    )}
                    
                    {activeTab === 'automation' && (
                        <AutomationEditor 
                            automation={automation} 
                            setAutomation={setAutomation} 
                            tasks={tasks}
                            users={users}
                            showToast={showToast}
                        />
                    )}

                    {activeTab === 'audit' && (
                        <AuditLogViewer />
                    )}

                    {activeTab === 'data' && (
                        <DataManagement 
                            projects={projects} 
                            tasks={tasks} 
                            users={users} 
                            setProjects={setProjects} 
                            setTasks={setTasks} 
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
