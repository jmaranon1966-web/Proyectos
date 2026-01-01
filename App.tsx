
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ProjectGantt from './components/ProjectGantt';
import Notifications from './components/Notifications';
import Documentation from './components/Documentation';
import GlobalReports from './components/GlobalReports';
import EnterpriseManagement from './components/EnterpriseManagement';
import { Settings } from './components/Settings';
import { MOCK_PROJECTS, MOCK_TASKS, MOCK_USERS, PROJECT_TEMPLATE } from './mockData';
import { Project, Task, User, TaskStatus, ProjectPhase, ProjectStatus, Department, AutomationSettings } from './types';
import { shouldRunDailyReport, runDailyAutomation } from './services/automationService';
import { logSystemAction } from './services/auditService';

// Helper para cargar datos con persistencia
const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    console.error(`Error loading ${key} from storage`, e);
    return fallback;
  }
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [projects, setProjects] = useState<Project[]>(() => loadFromStorage('helios_projects', MOCK_PROJECTS));
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage('helios_tasks', MOCK_TASKS));
  const [users, setUsers] = useState<User[]>(() => loadFromStorage('helios_users', MOCK_USERS));

  // --- CONFIG STATE (Lifted from Constants to Editable State) ---
  const [phases, setPhases] = useState<string[]>(() => 
      loadFromStorage('config_phases', Object.values(ProjectPhase))
  );
  const [taskStatuses, setTaskStatuses] = useState<string[]>(() => 
      loadFromStorage('config_task_statuses', ['Pendiente', 'En Progreso', 'En Riesgo', 'Completado', 'Cancelado'])
  );
  const [projectStatuses, setProjectStatuses] = useState<string[]>(() => 
      loadFromStorage('config_project_statuses', Object.values(ProjectStatus))
  );
  const [projectTemplate, setProjectTemplate] = useState<any[]>(() => 
      loadFromStorage('config_template', PROJECT_TEMPLATE)
  );
  const [companyLogo, setCompanyLogo] = useState<string>(() => 
      loadFromStorage('config_logo', '')
  );
  
  const [departments, setDepartments] = useState<string[]>(() => 
    loadFromStorage('config_departments', Object.values(Department))
  );

  // NEW: Roles State
  const [roles, setRoles] = useState<string[]>(() => 
    loadFromStorage('config_roles', [
      'Ingeniero de proyecto',
      'Gestor de permisos',
      'Ingeniero eléctrico',
      'Director técnico',
      'Responsable de compras',
      'Logística',
      'Supervisor de obra',
      'Equipo de montaje',
      'Electricista especializado',
      'Técnico especialista',
      'Responsable de servicio técnico',
      'Coordinador de proyecto',
      'Administrador'
    ])
  );

  // AUTOMATION NOTIFICATION STATE
  const [automationToast, setAutomationToast] = useState<{show: boolean, msg: string} | null>(null);

  useEffect(() => { localStorage.setItem('helios_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('helios_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('helios_users', JSON.stringify(users)); }, [users]);
  
  // Save Configs
  useEffect(() => { localStorage.setItem('config_phases', JSON.stringify(phases)); }, [phases]);
  useEffect(() => { localStorage.setItem('config_task_statuses', JSON.stringify(taskStatuses)); }, [taskStatuses]);
  useEffect(() => { localStorage.setItem('config_project_statuses', JSON.stringify(projectStatuses)); }, [projectStatuses]);
  useEffect(() => { localStorage.setItem('config_template', JSON.stringify(projectTemplate)); }, [projectTemplate]);
  useEffect(() => { localStorage.setItem('config_logo', JSON.stringify(companyLogo)); }, [companyLogo]);
  useEffect(() => { localStorage.setItem('config_departments', JSON.stringify(departments)); }, [departments]);
  useEffect(() => { localStorage.setItem('config_roles', JSON.stringify(roles)); }, [roles]);

  // --- AUTOMATION CHECK ON MOUNT ---
  useEffect(() => {
    const checkAutomation = async () => {
        const settings: AutomationSettings = loadFromStorage('helios_automation', { 
            enabled: true, // Auto-enabled for test
            emailProvider: 'gmail', 
            adminEmail: '', 
            lastRunDate: null,
            emailJsServiceId: 'service_h5msw16',
            emailJsTemplateId: 'template_6nwrlun',
            emailJsPublicKey: 'zT-yR3eE8gUU2Jsu7'
        });

        if (shouldRunDailyReport(settings)) {
            // Run Automation
            const result = await runDailyAutomation(tasks, users, settings);
            
            if (result.success) {
                // Update Last Run Date
                const updatedSettings = { ...settings, lastRunDate: new Date().toISOString().split('T')[0] };
                localStorage.setItem('helios_automation', JSON.stringify(updatedSettings));
                
                // Log Audit
                logSystemAction('Automatización', 'Reporte diario 7:00 AM ejecutado', 'Sistema');

                // Show Toast
                setAutomationToast({
                    show: true,
                    msg: `Rutina 7:00 AM completada: Se enviaron recordatorios a ${result.count} usuarios (${result.adminNotified ? 'Incl. Admin' : 'Sin Admin'}).`
                });
                
                // Hide toast after 5s
                setTimeout(() => setAutomationToast(null), 5000);
            }
        }
    };
    
    checkAutomation();
  }, [tasks, users]); // Dependencies ensure fresh data is used if it loads fast

  // --- HELPERS DE FECHAS ROBUSTOS ---
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
  
  // --- LÓGICA DE ACTUALIZACIÓN JERÁRQUICA (Bubble Up) ---
  const recalculateHierarchy = (allTasks: Task[], changedTaskId: string): Task[] => {
      const changedTask = allTasks.find(t => t.id === changedTaskId);
      if (!changedTask || !changedTask.parentId) return allTasks;

      const parent = allTasks.find(t => t.id === changedTask.parentId);
      if (!parent) return allTasks;

      const siblings = allTasks.filter(t => t.parentId === parent.id);
      if (siblings.length === 0) return allTasks;

      // Dynamic status logic simplified for custom statuses
      let newStatus: any = taskStatuses[0]; // Default pending
      
      const hasRisk = siblings.some(s => s.status.includes('Riesgo'));
      const hasProgress = siblings.some(s => s.status.includes('Progreso'));
      const allCompleted = siblings.every(s => s.status.includes('Completado'));
      
      if (hasRisk) newStatus = taskStatuses.find(s => s.includes('Riesgo')) || newStatus;
      else if (hasProgress) newStatus = taskStatuses.find(s => s.includes('Progreso')) || newStatus;
      else if (allCompleted) newStatus = taskStatuses.find(s => s.includes('Completado')) || newStatus;

      // Progress Calculation
      const totalDurationWeight = siblings.reduce((sum, t) => sum + (Number(t.duration) || 1), 0);
      const totalWeightedProgress = siblings.reduce((sum, t) => {
          const duration = Number(t.duration) || 1;
          const effectiveProgress = t.status.includes('Completado') ? 100 : (Number(t.progress) || 0);
          return sum + (duration * effectiveProgress);
      }, 0);
      
      const newProgress = totalDurationWeight > 0 
          ? Math.round(totalWeightedProgress / totalDurationWeight) 
          : 0;

      // Date Calculation
      const validStartDates = siblings.map(t => new Date(t.startDate).getTime()).filter(t => !isNaN(t));
      // End dates calculated inclusively
      const validEndDates = siblings.map(t => new Date(getEndDate(t.startDate, t.duration)).getTime()).filter(t => !isNaN(t));

      let newStartDateStr = parent.startDate;
      let newDuration = parent.duration;

      if (validStartDates.length > 0 && validEndDates.length > 0) {
          const minStart = new Date(Math.min(...validStartDates));
          const maxEnd = new Date(Math.max(...validEndDates));
          
          if (isValidDate(minStart) && isValidDate(maxEnd)) {
             newStartDateStr = minStart.toISOString().split('T')[0];
             const diffTime = Math.abs(maxEnd.getTime() - minStart.getTime());
             // Inclusive duration: (End - Start) + 1 day
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

  // --- CRUD TAREAS ---
  const handleAddTask = (newTask: Task) => {
    if (newTask.status === 'Completado') newTask.progress = 100;

    setTasks(prev => {
        const listWithNewTask = [...prev, newTask];
        try {
            if (newTask.parentId) {
                return recalculateHierarchy(listWithNewTask, newTask.id);
            }
        } catch (error) {
            console.error("Error recalculating hierarchy on add:", error);
        }
        return listWithNewTask;
    });
    logSystemAction('Crear Tarea', `Nueva tarea: ${newTask.name}`, 'Proyectos');
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const taskToSave = { ...updatedTask };
    if (taskToSave.status === 'Completado') {
        taskToSave.progress = 100;
    }

    setTasks(prev => {
        const listWithUpdate = prev.map(t => t.id === taskToSave.id ? taskToSave : t);
        try {
            if (taskToSave.parentId) {
                return recalculateHierarchy(listWithUpdate, taskToSave.id);
            }
        } catch (error) {
             console.error("Error recalculating hierarchy on update:", error);
        }
        return listWithUpdate;
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(currentTasks => {
        const taskToDelete = currentTasks.find(t => t.id === taskId);
        if (taskToDelete) logSystemAction('Eliminar Tarea', `Tarea eliminada: ${taskToDelete.name}`, 'Proyectos');

        const parentId = taskToDelete?.parentId;
        const idsToDelete = new Set<string>([taskId]);
        let tasksToCheck = [taskId];
        while(tasksToCheck.length > 0) {
            const curr = tasksToCheck.pop();
            const children = currentTasks.filter(t => t.parentId === curr);
            children.forEach(child => {
                if(!idsToDelete.has(child.id)) {
                    idsToDelete.add(child.id);
                    tasksToCheck.push(child.id);
                }
            });
        }
        
        const cleanedTasks = currentTasks.filter(t => !idsToDelete.has(t.id));

        if (parentId) {
            const sibling = cleanedTasks.find(t => t.parentId === parentId);
            if (sibling) {
                try {
                    return recalculateHierarchy(cleanedTasks, sibling.id);
                } catch(e) { console.error(e); }
            }
        }
        return cleanedTasks;
    });
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
          if (targetTask && removed.phase !== targetTask.phase) {
              removed.phase = targetTask.phase;
          }
          return newTasks;
      });
  };

  // --- CRUD PROYECTOS / USUARIOS ---
  const handleAddProject = (newProject: Project, newTasks: Task[] = []) => {
    setProjects(prev => [...prev, newProject]);
    if (newTasks.length > 0) setTasks(prev => [...prev, ...newTasks]);
    logSystemAction('Crear Proyecto', `Proyecto: ${newProject.name}`, 'Proyectos');
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setTasks(prev => prev.filter(t => t.projectId !== projectId));
    logSystemAction('Eliminar Proyecto', `Proyecto ID: ${projectId}`, 'Proyectos');
  };

  const handleAddUser = (newUser: User) => {
      setUsers(prev => [...prev, newUser]);
      logSystemAction('Crear Usuario', `Usuario: ${newUser.name} (Rol: ${newUser.role})`, 'Configuración');
  };
  
  const handleUpdateUser = (updatedUser: User) => {
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      logSystemAction('Actualizar Usuario', `Usuario: ${updatedUser.name}`, 'Configuración');
  };
  
  const handleDeleteUser = (userId: string) => {
      const uName = users.find(u => u.id === userId)?.name;
      setUsers(prev => prev.filter(u => u.id !== userId));
      logSystemAction('Eliminar Usuario', `Usuario: ${uName}`, 'Configuración');
  };

  const handleResetData = () => {
    if (confirm("¿Restaurar datos de fábrica?")) {
        setProjects(MOCK_PROJECTS);
        setTasks(MOCK_TASKS);
        setUsers(MOCK_USERS);
        setPhases(Object.values(ProjectPhase));
        setTaskStatuses(['Pendiente', 'En Progreso', 'En Riesgo', 'Completado', 'Cancelado']);
        setProjectStatuses(Object.values(ProjectStatus));
        setProjectTemplate(PROJECT_TEMPLATE);
        setCompanyLogo('');
        setDepartments(Object.values(Department));
        setRoles(['Ingeniero de proyecto','Administrador']); // Reset simplified roles
        localStorage.clear();
        logSystemAction('Reset', 'Restauración de fábrica completa', 'Sistema');
        window.location.reload();
    }
  };

  // Renderizado
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
            phases={phases} setPhases={setPhases}
            taskStatuses={taskStatuses} setTaskStatuses={setTaskStatuses}
            projectStatuses={projectStatuses} setProjectStatuses={setProjectStatuses}
            projectTemplate={projectTemplate} setProjectTemplate={setProjectTemplate}
            companyLogo={companyLogo} setCompanyLogo={setCompanyLogo}
            departments={departments} setDepartments={setDepartments}
            roles={roles} setRoles={setRoles}
            // Passing data for Import/Export
            projects={projects} tasks={tasks}
            setProjects={setProjects} setTasks={setTasks}
        />;
      default: return <Dashboard projects={projects} tasks={tasks} users={users} onAddProject={handleAddProject} onDeleteProject={handleDeleteProject} projectStatuses={projectStatuses} projectTemplate={projectTemplate} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} companyLogo={companyLogo}>
        {/* AUTOMATION TOAST */}
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
