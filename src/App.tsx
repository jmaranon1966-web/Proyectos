import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ProjectGantt from './components/ProjectGantt';
import Notifications from './components/Notifications';
import Documentation from './components/Documentation';
import GlobalReports from './components/GlobalReports';
import EnterpriseManagement from './components/EnterpriseManagement';
import { Settings } from './components/Settings';
import Login from './components/Login';
import { Project, Task, User, ProjectPhase, ProjectStatus, Department, AutomationSettings } from './types';
import { shouldRunDailyReport, runDailyAutomation } from './services/automationService';
import { api } from './services/api';
import { Zap, ShieldCheck, Database, Server, Lock, UserCheck, LogOut } from 'lucide-react';

// --- SYSTEM BOOT SCREEN COMPONENT ---
interface BootProps {
    onComplete: () => void;
    sessionUser: User | null;
    onLogout: () => void;
}

const SystemBoot: React.FC<BootProps> = ({ onComplete, sessionUser, onLogout }) => {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('Inicializando kernel del sistema...');
    const [icon, setIcon] = useState<React.ReactNode>(<Zap className="w-8 h-8 text-blue-500" />);

    useEffect(() => {
        const steps = [
            { p: 10, t: 'Cargando configuración base...', i: <Zap className="w-8 h-8 text-blue-500" /> },
            { p: 30, t: 'Verificando integridad de datos locales...', i: <Database className="w-8 h-8 text-emerald-500" /> },
            { p: 50, t: 'Estableciendo conexión segura TLS...', i: <Lock className="w-8 h-8 text-yellow-500" /> },
            { p: 70, t: 'Sincronizando módulos de gestión...', i: <Server className="w-8 h-8 text-purple-500" /> },
            { p: 90, t: 'Validando credenciales de sesión...', i: <ShieldCheck className="w-8 h-8 text-green-500" /> },
            { p: 100, t: 'Sistema RyV listo.', i: <Zap className="w-8 h-8 text-white" /> }
        ];

        let currentStep = 0;

        const interval = setInterval(() => {
            if (currentStep >= steps.length) {
                clearInterval(interval);
                setTimeout(onComplete, 800); // Slight delay to read final status
                return;
            }

            const step = steps[currentStep];
            setProgress(step.p);
            
            // Override status if user is detected late in the boot process
            if (currentStep >= 4 && sessionUser) {
                 setStatus(`Sesión recuperada: ${sessionUser.name}`);
                 setIcon(<UserCheck className="w-8 h-8 text-blue-400" />);
            } else {
                 setStatus(step.t);
                 setIcon(step.i);
            }
            
            currentStep++;
        }, 350); // Speed up slightly

        return () => clearInterval(interval);
    }, [onComplete, sessionUser]);

    return (
        <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden font-mono">
            {/* Background Tech Effects */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.9)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] opacity-20 pointer-events-none"></div>
            
            <div className="z-10 w-full max-w-md p-8">
                <div className="flex justify-center mb-8 relative">
                    <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 rounded-full"></div>
                    <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-2xl relative transition-all duration-300">
                        {icon}
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-white text-center mb-1 tracking-tight">RyV Manager <span className="text-blue-500">v2.0</span></h1>
                <p className="text-slate-500 text-center text-xs uppercase tracking-widest mb-8">Sistema de Gestión Integral</p>

                <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
                    <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                <div className="flex justify-between items-center text-xs min-h-[20px]">
                    <span className={`transition-colors ${sessionUser ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>{status}</span>
                    <span className="text-slate-500 font-bold">{progress}%</span>
                </div>
                
                {/* Session Override Control */}
                {sessionUser && (
                    <div className="mt-8 flex justify-center animate-fade-in">
                        <button 
                            onClick={onLogout}
                            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-red-900/30 hover:text-red-400 border border-slate-700 hover:border-red-900/50 rounded-lg text-xs text-slate-400 transition-all"
                        >
                            <LogOut className="w-3 h-3" />
                            <span>No soy {sessionUser.name.split(' ')[0]} (Cerrar Sesión)</span>
                        </button>
                    </div>
                )}
                
                {/* Fallback Reset if stuck */}
                {!sessionUser && progress > 50 && (
                    <div className="mt-12 text-center opacity-50 hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => { localStorage.clear(); window.location.reload(); }}
                            className="text-[10px] text-slate-600 hover:text-red-500 transition-colors"
                        >
                            Restablecer Datos Locales
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MAIN APP ROOT ---
const App: React.FC = () => {
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [bootComplete, setBootComplete] = useState(false);

  // --- CHECK SESSION ON MOUNT ---
  useEffect(() => {
      const checkSession = async () => {
          try {
              const user = await api.auth.getSession();
              if (user) {
                  // Small delay to ensure boot screen can pick it up nicely
                  setTimeout(() => setSessionUser(user), 500);
              }
          } catch (e) {
              console.error("Session check failed", e);
          }
      };
      checkSession();
  }, []);

  // --- HANDLERS ---
  const handleLoginSuccess = (user: User) => {
      setSessionUser(user);
  };

  const handleLogout = async () => {
      await api.auth.logout();
      setSessionUser(null);
      // If we are on boot screen, we don't need to reload, just clear state
      // If we are in app, reload is safer to clear all states
      if (bootComplete) {
          window.location.reload();
      }
  };

  // 1. Show Boot Screen First
  if (!bootComplete) {
      return (
          <SystemBoot 
            onComplete={() => setBootComplete(true)} 
            sessionUser={sessionUser} 
            onLogout={handleLogout} 
          />
      );
  }

  // 2. If no session after boot, Show Login
  if (!sessionUser) {
      return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // 3. Authenticated App
  return <AuthenticatedApp sessionUser={sessionUser} onLogout={handleLogout} />;
};

// --- SUB-COMPONENT: Authenticated Application Logic ---
const AuthenticatedApp: React.FC<{ sessionUser: User, onLogout: () => void }> = ({ sessionUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Config State
  const [phases, setPhases] = useState<string[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<string[]>([]);
  const [projectStatuses, setProjectStatuses] = useState<string[]>([]);
  const [projectTemplate, setProjectTemplate] = useState<any[]>([]);
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);

  const [automationToast, setAutomationToast] = useState<{show: boolean, msg: string} | null>(null);

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    const initData = async () => {
        try {
            const [
                p, t, u, 
                confPhases, confTStat, confPStat, confTemp, confLogo, confDept, confRoles
            ] = await Promise.all([
                api.projects.list(),
                api.tasks.list(),
                api.users.list(),
                api.config.getPhases(),
                api.config.getTaskStatuses(),
                api.config.getProjectStatuses(),
                api.config.getTemplate(),
                api.config.getLogo(),
                api.config.getDepartments(),
                api.config.getRoles()
            ]);

            setProjects(p);
            setTasks(t);
            setUsers(u);
            setPhases(confPhases);
            setTaskStatuses(confTStat);
            setProjectStatuses(confPStat);
            setProjectTemplate(confTemp);
            setCompanyLogo(confLogo);
            setDepartments(confDept);
            setRoles(confRoles);
        } catch (error) {
            console.error("Failed to load application data", error);
        } finally {
            setLoading(false);
        }
    };

    initData();
  }, []);

  // --- AUTOMATION CHECK ---
  useEffect(() => {
    if (loading) return;

    const checkAutomation = async () => {
        const settingsStr = localStorage.getItem('helios_automation');
        const settings: AutomationSettings = settingsStr ? JSON.parse(settingsStr) : { 
            enabled: true, 
            emailProvider: 'gmail', 
            adminEmail: '', 
            lastRunDate: null 
        };

        if (shouldRunDailyReport(settings)) {
            const result = await runDailyAutomation(tasks, users, settings);
            
            if (result.success) {
                const updatedSettings = { ...settings, lastRunDate: new Date().toISOString().split('T')[0] };
                localStorage.setItem('helios_automation', JSON.stringify(updatedSettings));
                api.audit.log('Automatización', 'Reporte diario 7:00 AM ejecutado', 'Sistema', 'Sistema');
                setAutomationToast({
                    show: true,
                    msg: `Rutina 7:00 AM completada: Se enviaron recordatorios a ${result.count} usuarios.`
                });
                setTimeout(() => setAutomationToast(null), 5000);
            }
        }
    };
    checkAutomation();
  }, [loading, tasks, users]);

  // --- CONFIG SYNC HANDLERS ---
  const updatePhases = (newPhases: string[]) => { setPhases(newPhases); api.config.savePhases(newPhases); };
  const updateTaskStatuses = (newStat: string[]) => { setTaskStatuses(newStat); api.config.saveTaskStatuses(newStat); };
  const updateProjectStatuses = (newStat: string[]) => { setProjectStatuses(newStat); api.config.saveProjectStatuses(newStat); };
  const updateTemplate = (newTemp: any[]) => { setProjectTemplate(newTemp); api.config.saveTemplate(newTemp); };
  const updateLogo = (newLogo: string) => { setCompanyLogo(newLogo); api.config.saveLogo(newLogo); };
  const updateDepartments = (newDepts: string[]) => { setDepartments(newDepts); api.config.saveDepartments(newDepts); };
  const updateRoles = (newRoles: string[]) => { setRoles(newRoles); api.config.saveRoles(newRoles); };

  // --- HELPERS & LOGIC ---
  const isValidDate = (d: Date) => d instanceof Date && !isNaN(d.getTime());

  const addDays = (dateStr: string, days: number): string => {
    try {
        const result = new Date(dateStr);
        if (!isValidDate(result)) return new Date().toISOString().split('T')[0];
        result.setDate(result.getDate() + (days || 0));
        return result.toISOString().split('T')[0];
    } catch (e) {
        return new Date().toISOString().split('T')[0];
    }
  };

  const getEndDate = (start: string, duration: number): string => addDays(start, Math.max(0, duration - 1));
  
  const recalculateHierarchy = (allTasks: Task[], changedTaskId: string): Task[] => {
      const changedTask = allTasks.find(t => t.id === changedTaskId);
      if (!changedTask || !changedTask.parentId) return allTasks;

      const parent = allTasks.find(t => t.id === changedTask.parentId);
      if (!parent) return allTasks;

      const siblings = allTasks.filter(t => t.parentId === parent.id);
      if (siblings.length === 0) return allTasks;

      let newStatus: any = taskStatuses && taskStatuses.length > 0 ? taskStatuses[0] : 'Pendiente'; 
      const hasRisk = siblings.some(s => s.status.includes('Riesgo'));
      const hasProgress = siblings.some(s => s.status.includes('Progreso'));
      const allCompleted = siblings.every(s => s.status.includes('Completado'));
      
      if (taskStatuses) {
        if (hasRisk) newStatus = taskStatuses.find(s => s.includes('Riesgo')) || newStatus;
        else if (hasProgress) newStatus = taskStatuses.find(s => s.includes('Progreso')) || newStatus;
        else if (allCompleted) newStatus = taskStatuses.find(s => s.includes('Completado')) || newStatus;
      }

      const totalDurationWeight = siblings.reduce((sum, t) => sum + (Number(t.duration) || 1), 0);
      const totalWeightedProgress = siblings.reduce((sum, t) => {
          const duration = Number(t.duration) || 1;
          const effectiveProgress = t.status.includes('Completado') ? 100 : (Number(t.progress) || 0);
          return sum + (duration * effectiveProgress);
      }, 0);
      
      const newProgress = totalDurationWeight > 0 
          ? Math.round(totalWeightedProgress / totalDurationWeight) 
          : 0;

      const validStartDates = siblings.map(t => new Date(t.startDate).getTime()).filter(t => !isNaN(t));
      const validEndDates = siblings.map(t => new Date(getEndDate(t.startDate, t.duration)).getTime()).filter(t => !isNaN(t));

      let newStartDateStr = parent.startDate;
      let newDuration = parent.duration;

      if (validStartDates.length > 0 && validEndDates.length > 0) {
          const minStart = new Date(Math.min(...validStartDates));
          const maxEnd = new Date(Math.max(...validEndDates));
          
          if (isValidDate(minStart) && isValidDate(maxEnd)) {
             newStartDateStr = minStart.toISOString().split('T')[0];
             const diffTime = Math.abs(maxEnd.getTime() - minStart.getTime());
             newDuration = Math.max(1, Math.floor(diffTime / (1000 * 3600 * 24)) + 1); 
          }
      }

      const updatedParent: Task = {
          ...parent,
          status: newStatus,
          progress: newProgress,
          startDate: newStartDateStr,
          duration: newDuration
      };

      const updatedList = allTasks.map(t => t.id === parent.id ? updatedParent : t);
      return recalculateHierarchy(updatedList, parent.id);
  };

  // --- CRUD HANDLERS ---
  const handleAddTask = async (newTask: Task) => {
    if (newTask.status === 'Completado') newTask.progress = 100;
    setTasks(prev => {
        const listWithNewTask = [...prev, newTask];
        try { if (newTask.parentId) return recalculateHierarchy(listWithNewTask, newTask.id); } catch (e) { console.error(e); }
        return listWithNewTask;
    });
    await api.tasks.create(newTask);
    api.audit.log('Crear Tarea', `Nueva tarea: ${newTask.name}`, 'Proyectos', sessionUser.name);
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    const taskToSave = { ...updatedTask };
    if (taskToSave.status === 'Completado') taskToSave.progress = 100;
    setTasks(prev => {
        const listWithUpdate = prev.map(t => t.id === taskToSave.id ? taskToSave : t);
        try { if (taskToSave.parentId) return recalculateHierarchy(listWithUpdate, taskToSave.id); } catch (e) { console.error(e); }
        return listWithUpdate;
    });
    await api.tasks.update(taskToSave);
  };

  const handleDeleteTask = async (taskId: string) => {
    let newTaskList: Task[] = [];
    setTasks(currentTasks => {
        const taskToDelete = currentTasks.find(t => t.id === taskId);
        if (taskToDelete) api.audit.log('Eliminar Tarea', `Tarea eliminada: ${taskToDelete.name}`, 'Proyectos', sessionUser.name);
        const parentId = taskToDelete?.parentId;
        const idsToDelete = new Set<string>([taskId]);
        let tasksToCheck = [taskId];
        while(tasksToCheck.length > 0) {
            const curr = tasksToCheck.pop();
            const children = currentTasks.filter(t => t.parentId === curr);
            children.forEach(child => { if(!idsToDelete.has(child.id)) { idsToDelete.add(child.id); tasksToCheck.push(child.id); } });
        }
        const cleanedTasks = currentTasks.filter(t => !idsToDelete.has(t.id));
        if (parentId) {
            const sibling = cleanedTasks.find(t => t.parentId === parentId);
            if (sibling) { try { newTaskList = recalculateHierarchy(cleanedTasks, sibling.id); return newTaskList; } catch(e) { console.error(e); } }
        }
        newTaskList = cleanedTasks;
        return cleanedTasks;
    });
    await api.tasks.delete(taskId);
    if(newTaskList.length > 0) await api.tasks.sync(newTaskList);
  };

  const handleReorderTasks = (sourceId: string, targetId: string) => {
      setTasks(prev => {
          const sourceIndex = prev.findIndex(t => t.id === sourceId);
          const targetIndex = prev.findIndex(t => t.id === targetId);
          if (sourceIndex === -1 || targetIndex === -1) return prev;
          const newTasks = [...prev];
          const [removed] = newTasks.splice(sourceIndex, 1);
          newTasks.splice(targetIndex, 0, removed);
          const targetTask = prev[targetIndex];
          if (targetTask && removed.phase !== targetTask.phase) removed.phase = targetTask.phase;
          api.tasks.sync(newTasks);
          return newTasks;
      });
  };

  const handleAddProject = async (newProject: Project, newTasks: Task[] = []) => {
    setProjects(prev => [...prev, newProject]);
    if (newTasks.length > 0) setTasks(prev => [...prev, ...newTasks]);
    await api.projects.create(newProject);
    for (const t of newTasks) await api.tasks.create(t);
    api.audit.log('Crear Proyecto', `Proyecto: ${newProject.name}`, 'Proyectos', sessionUser.name);
  };

  const handleDeleteProject = async (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setTasks(prev => prev.filter(t => t.projectId !== projectId));
    await api.projects.delete(projectId);
    api.audit.log('Eliminar Proyecto', `Proyecto ID: ${projectId}`, 'Proyectos', sessionUser.name);
  };

  const handleAddUser = async (newUser: User) => {
      setUsers(prev => [...prev, newUser]);
      await api.users.create(newUser);
      api.audit.log('Crear Usuario', `Usuario: ${newUser.name}`, 'Configuración', sessionUser.name);
  };
  
  const handleUpdateUser = async (updatedUser: User) => {
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      await api.users.update(updatedUser);
      api.audit.log('Actualizar Usuario', `Usuario: ${updatedUser.name}`, 'Configuración', sessionUser.name);
  };
  
  const handleDeleteUser = async (userId: string) => {
      setUsers(prev => prev.filter(u => u.id !== userId));
      await api.users.delete(userId);
      api.audit.log('Eliminar Usuario', `ID: ${userId}`, 'Configuración', sessionUser.name);
  };

  const handleResetData = async () => {
    if (confirm("¿Restaurar datos de fábrica? Se recargará la página.")) {
        await api.projects.reset();
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': 
        return <Dashboard 
            projects={projects} tasks={tasks} users={users} 
            onAddProject={handleAddProject} onDeleteProject={handleDeleteProject}
            projectStatuses={projectStatuses} projectTemplate={projectTemplate}
        />;
      case 'projects': 
        return <ProjectGantt 
            projects={projects} tasks={tasks} users={users} 
            onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onReorderTasks={handleReorderTasks} 
            phases={phases} taskStatuses={taskStatuses}
        />;
      case 'enterprise': 
        return <EnterpriseManagement 
          tasks={tasks} users={users} departments={departments} taskStatuses={taskStatuses}
          onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask}
        />;
      case 'reports': return <GlobalReports projects={projects} tasks={tasks} users={users} />;
      case 'notifications': return <Notifications projects={projects} tasks={tasks} />;
      case 'docs': return <Documentation />;
      case 'settings': 
        return <Settings 
            users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} onResetData={handleResetData}
            phases={phases} setPhases={updatePhases}
            taskStatuses={taskStatuses} setTaskStatuses={updateTaskStatuses}
            projectStatuses={projectStatuses} setProjectStatuses={updateProjectStatuses}
            projectTemplate={projectTemplate} setProjectTemplate={updateTemplate}
            companyLogo={companyLogo} setCompanyLogo={updateLogo}
            departments={departments} setDepartments={updateDepartments}
            roles={roles} setRoles={updateRoles}
            projects={projects} tasks={tasks}
            setProjects={setProjects} setTasks={setTasks}
        />;
      default: return <Dashboard projects={projects} tasks={tasks} users={users} onAddProject={handleAddProject} onDeleteProject={handleDeleteProject} projectStatuses={projectStatuses} projectTemplate={projectTemplate} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      companyLogo={companyLogo} 
      currentUser={sessionUser}
      onLogout={onLogout}
    >
        {automationToast && (
            <div className="fixed top-20 right-8 bg-slate-800 text-white px-4 py-3 rounded-lg shadow-2xl z-[100] animate-fade-in flex items-center space-x-3">
                <div className="p-1 bg-green-500 rounded-full">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-sm font-medium">{automationToast.msg}</span>
                <button onClick={() => setAutomationToast(null)} className="ml-4 text-slate-400 hover:text-white"><span className="sr-only">Cerrar</span>×</button>
            </div>
        )}
        {renderContent()}
    </Layout>
  );
};

export default App;