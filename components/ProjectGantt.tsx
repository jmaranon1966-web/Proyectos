
import React, { useState, useEffect, useRef } from 'react';
import { Download, Plus, UserCircle, X, CornerDownRight, List, BarChart2, FolderPlus, Trash2, Edit, AlertTriangle, LayoutGrid, Users, MoreVertical, Clock, CheckCircle2, Circle, GripVertical, ZoomIn, ZoomOut, Maximize, Minimize, Calendar as CalendarIcon, Link as LinkIcon, ArrowRight, ChevronLeft, ChevronRight, AlertOctagon } from 'lucide-react';
import { Task, Project, Priority, User } from '../types';

interface ProjectGanttProps {
  projects: Project[];
  tasks: Task[];
  users: User[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onReorderTasks?: (sourceId: string, targetId: string) => void;
  // New props for dynamic config
  phases: string[];
  taskStatuses: string[];
}

type ViewMode = 'list' | 'board' | 'gantt' | 'calendar' | 'team';
type GanttMode = 'standard' | 'fit';

const ProjectGantt: React.FC<ProjectGanttProps> = ({ 
    projects, tasks, users, 
    onAddTask, onUpdateTask, onDeleteTask, onReorderTasks,
    phases, taskStatuses
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [ganttMode, setGanttMode] = useState<GanttMode>('standard');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [hoveredTaskDependencies, setHoveredTaskDependencies] = useState<string[]>([]);
  
  // Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Refs
  const ganttContainerRef = useRef<HTMLDivElement>(null);

  // Drag and Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  
  // Task Form State
  const [taskForm, setTaskForm] = useState<Partial<Task>>({
    name: '',
    phase: phases[0] as any,
    startDate: new Date().toISOString().split('T')[0],
    duration: 1,
    priority: Priority.MEDIA,
    progress: 0,
    status: 'Pendiente',
    assignedTo: '',
    parentId: '',
    dependencies: []
  });

  // Ensure selectedProjectId is valid
  useEffect(() => {
    const projectExists = projects.find(p => p.id === selectedProjectId);
    if ((!selectedProjectId || !projectExists) && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    } else if (projects.length === 0) {
      setSelectedProjectId('');
    }
  }, [projects, selectedProjectId]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  const currentProject = projects.find(p => p.id === selectedProjectId);
  const rawProjectTasks = tasks.filter(t => t.projectId === selectedProjectId);

  // --- SORTING LOGIC ---
  const getOrganizedTasks = () => {
      // Use config phases
      const organized: Task[] = [];
      const processedIds = new Set<string>();

      phases.forEach(phase => {
          const phaseTasks = rawProjectTasks.filter(t => t.phase === phase);
          const roots = phaseTasks.filter(t => {
             if (!t.parentId) return true;
             const parentInPhase = phaseTasks.find(pt => pt.id === t.parentId);
             return !parentInPhase; 
          });

          const addNode = (task: Task) => {
              if (processedIds.has(task.id)) return;
              organized.push(task);
              processedIds.add(task.id);
              const children = phaseTasks.filter(t => t.parentId === task.id);
              children.forEach(addNode);
          };

          roots.forEach(addNode);
          phaseTasks.forEach(t => {
              if (!processedIds.has(t.id)) organized.push(t);
          });
      });

      return organized;
  };

  const projectTasks = viewMode === 'list' ? getOrganizedTasks() : rawProjectTasks;

  // --- Helpers ---
  const getAssigneeName = (userId: string) => users.find(u => u.id === userId)?.name || 'Sin asignar';
  const getAssigneeAvatar = (userId: string) => users.find(u => u.id === userId)?.avatar;
  const isParentTask = (taskId: string) => rawProjectTasks.some(t => t.parentId === taskId);

  // --- Handlers ---
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
      setDraggedTaskId(taskId);
      e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (e: React.DragEvent, targetTaskId: string) => {
      e.preventDefault();
      if (draggedTaskId && draggedTaskId !== targetTaskId && onReorderTasks) {
          onReorderTasks(draggedTaskId, targetTaskId);
      }
      setDraggedTaskId(null);
  };

  const openNewTaskModal = () => {
    setEditingTask(null);
    setTaskForm({
      name: '',
      phase: phases[0] as any,
      startDate: new Date().toISOString().split('T')[0],
      duration: 1,
      priority: Priority.MEDIA,
      progress: 0,
      status: taskStatuses[0] as any,
      assignedTo: users[0]?.id || '',
      parentId: '',
      dependencies: []
    });
    setIsTaskModalOpen(true);
  };

  const openSubtaskModal = (parent: Task) => {
      setEditingTask(null);
      setTaskForm({
        name: '',
        phase: parent.phase,
        startDate: parent.startDate,
        duration: 1,
        priority: parent.priority,
        progress: 0,
        status: taskStatuses[0] as any,
        assignedTo: parent.assignedTo,
        parentId: parent.id,
        dependencies: []
      });
      setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setTaskForm({ ...task });
    setIsTaskModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, task: Task) => {
      e.stopPropagation();
      setTaskToDelete(task);
      setActiveMenuId(null);
  };

  const confirmDelete = () => { 
      if (taskToDelete) { 
          onDeleteTask(taskToDelete.id); 
          setTaskToDelete(null); 
      } 
  };
  
  const handleMenuClick = (e: React.MouseEvent, taskId: string) => { e.stopPropagation(); setActiveMenuId(activeMenuId === taskId ? null : taskId); };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !taskForm.name) return;
    const safeDuration = Math.max(1, Number(taskForm.duration) || 1);
    const safeProgress = Math.min(100, Math.max(0, Number(taskForm.progress) || 0));

    if (editingTask) {
        const safeParentId = (taskForm.parentId && taskForm.parentId !== editingTask.id) ? taskForm.parentId : undefined;
        const updated: Task = {
            ...editingTask,
            name: taskForm.name,
            phase: taskForm.phase || editingTask.phase,
            startDate: taskForm.startDate || editingTask.startDate,
            duration: safeDuration,
            progress: safeProgress,
            status: taskForm.status as any,
            priority: taskForm.priority || editingTask.priority,
            assignedTo: taskForm.assignedTo || editingTask.assignedTo,
            parentId: safeParentId,
            dependencies: taskForm.dependencies || []
        };
        onUpdateTask(updated);
    } else {
        const newTask: Task = {
            id: `t-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            projectId: currentProject.id,
            name: taskForm.name!,
            phase: taskForm.phase || phases[0] as any,
            assignedTo: taskForm.assignedTo || users[0]?.id || 'u1',
            startDate: taskForm.startDate!,
            duration: safeDuration,
            progress: safeProgress,
            status: taskForm.status as any || 'Pendiente',
            dependencies: taskForm.dependencies || [],
            priority: taskForm.priority || Priority.MEDIA,
            parentId: taskForm.parentId === '' ? undefined : taskForm.parentId
        };
        onAddTask(newTask);
    }
    setIsTaskModalOpen(false);
  };

  const toggleDependency = (depId: string) => {
      const current = taskForm.dependencies || [];
      if (current.includes(depId)) {
          setTaskForm({ ...taskForm, dependencies: current.filter(id => id !== depId) });
      } else {
          setTaskForm({ ...taskForm, dependencies: [...current, depId] });
      }
  };

  const downloadCSV = () => {
    if (!currentProject) return;
    const headers = ['ID', 'Tarea', 'Fase', 'Prioridad', 'Asignado', 'Estado'];
    const rows = projectTasks.map(t => [t.id, t.name, t.phase, t.priority, getAssigneeName(t.assignedTo), t.status]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `tareas-${currentProject.name.replace(/\s+/g, '-')}.csv`;
    link.click();
  };

  // --- RENDERERS ---
  const renderListView = () => {
      let lastPhase = '';
      return (
        <div className="overflow-auto flex-1 pb-32">
        <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 text-xs uppercase text-slate-500 font-semibold shadow-sm">
            <tr>
                <th className="p-4 border-b border-slate-200 w-10"></th>
                <th className="p-4 border-b border-slate-200 w-1/3">Tarea</th>
                <th className="p-4 border-b border-slate-200">Prioridad</th>
                <th className="p-4 border-b border-slate-200">Responsable</th>
                <th className="p-4 border-b border-slate-200">Cronograma</th>
                <th className="p-4 border-b border-slate-200 text-center">Estado</th>
                <th className="p-4 border-b border-slate-200 text-right w-16"></th>
            </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
            {projectTasks.length > 0 ? projectTasks.map((task) => {
                const showHeader = task.phase !== lastPhase;
                if (showHeader) lastPhase = task.phase;
                const isBeingDragged = draggedTaskId === task.id;
                const isParent = isParentTask(task.id);
                const isChild = !!task.parentId; 

                return (
                <React.Fragment key={task.id}>
                    {showHeader && (
                        <tr className="bg-slate-100/50">
                            <td colSpan={7} className="px-4 py-2 font-bold text-slate-700 text-xs uppercase tracking-wider border-y border-slate-200">
                                {task.phase}
                            </td>
                        </tr>
                    )}
                    <tr 
                        className={`hover:bg-slate-50 transition-colors group ${isBeingDragged ? 'opacity-40 bg-slate-100' : ''} ${isParent ? 'bg-slate-50/50' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, task.id)}
                    >
                    <td className="p-4 text-slate-300 cursor-move hover:text-slate-500">
                        <GripVertical className="w-4 h-4" />
                    </td>
                    <td className="p-4">
                        <div className="flex items-center" style={{ paddingLeft: isChild ? '24px' : '0px' }}>
                            {isChild && <CornerDownRight className="w-4 h-4 text-slate-300 mr-2" />}
                            <div className="flex-1">
                                <div className={`font-medium ${isParent ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>{task.name}</div>
                                {task.dependencies && task.dependencies.length > 0 && (
                                    <div className="flex items-center text-xs text-slate-400 mt-1">
                                        <LinkIcon className="w-3 h-3 mr-1" />
                                        <span>Dep: {task.dependencies.length}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </td>
                    <td className="p-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                             task.priority === Priority.CRITICA ? 'bg-red-50 text-red-700 border-red-100' :
                             task.priority === Priority.ALTA ? 'bg-orange-50 text-orange-700 border-orange-100' :
                             task.priority === Priority.MEDIA ? 'bg-blue-50 text-blue-700 border-blue-100' :
                             'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                            {task.priority}
                        </span>
                    </td>
                    <td className="p-4">
                        <div className="flex items-center space-x-2">
                            {getAssigneeAvatar(task.assignedTo) ? (
                                <img src={getAssigneeAvatar(task.assignedTo)} alt="" className="w-6 h-6 rounded-full" />
                            ) : (
                                <UserCircle className="w-6 h-6 text-slate-300" />
                            )}
                            <span className="text-slate-700 text-xs md:text-sm">{getAssigneeName(task.assignedTo)}</span>
                        </div>
                    </td>
                    <td className="p-4">
                        <div className="w-full max-w-xs">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                                <span>{task.startDate}</span>
                                <span className={isParent ? "font-bold text-indigo-600" : ""}>{task.duration}d</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${
                                task.status === 'Completado' ? 'bg-emerald-500' : 'bg-blue-500'
                                }`} style={{ width: `${task.progress}%` }}></div>
                            </div>
                        </div>
                    </td>
                    <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            task.status === 'Completado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            task.status === 'En Riesgo' ? 'bg-red-50 text-red-700 border-red-200' :
                            task.status === 'En Progreso' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                        {task.status}
                        </span>
                    </td>
                    <td className="p-4 text-right relative">
                        <button onClick={(e) => handleMenuClick(e, task.id)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><MoreVertical className="w-4 h-4" /></button>
                        {activeMenuId === task.id && (
                            <div className="absolute right-8 top-8 w-40 bg-white rounded-lg shadow-xl border border-slate-100 z-50 animate-fade-in py-1 text-left">
                                <button onClick={() => openEditTaskModal(task)} className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center"><Edit className="w-3.5 h-3.5 mr-2 text-blue-500" /> Editar</button>
                                <button onClick={() => openSubtaskModal(task)} className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center"><FolderPlus className="w-3.5 h-3.5 mr-2 text-emerald-500" /> Subtarea</button>
                                <div className="h-px bg-slate-100 my-1"></div>
                                <button onClick={(e) => handleDeleteClick(e, task)} className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"><Trash2 className="w-3.5 h-3.5 mr-2" /> Eliminar</button>
                            </div>
                        )}
                    </td>
                    </tr>
                </React.Fragment>
                );
            }) : (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">Sin tareas registradas.</td></tr>
            )}
            </tbody>
        </table>
        </div>
    );
  };

  const renderBoardView = () => {
    // Use dynamic statuses for columns
    const columns = taskStatuses;
    
    return (
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 flex space-x-4 bg-slate-100/50 h-full">
        {columns.map(status => {
          const columnTasks = rawProjectTasks.filter(t => t.status === status);
          return (
            <div key={status} className="flex-shrink-0 w-80 flex flex-col bg-slate-50 rounded-xl border border-slate-200 h-full max-h-full">
               <div className={`p-3 border-b border-slate-200 font-bold text-sm flex justify-between items-center flex-shrink-0 ${
                   status === 'En Riesgo' ? 'bg-red-50 text-red-700' :
                   status === 'Completado' ? 'bg-emerald-50 text-emerald-700' :
                   'bg-slate-100 text-slate-700'
               }`}>
                  <span>{status}</span>
                  <span className="bg-white px-2 py-0.5 rounded text-xs border border-slate-200">{columnTasks.length}</span>
               </div>
               <div 
                className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0"
                onDragOver={handleDragOver}
                onDrop={(e) => {
                    e.preventDefault();
                }}
               >
                  {columnTasks.map(task => (
                    <div 
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, task.id)}
                      onClick={() => openEditTaskModal(task)}
                      className={`bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-move hover:shadow-md transition-all group relative ${draggedTaskId === task.id ? 'opacity-50' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                             <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
                                 task.priority === Priority.CRITICA ? 'bg-red-50 text-red-700 border-red-100' : 
                                 task.priority === Priority.ALTA ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                             }`}>{task.priority}</span>
                             <button onClick={(e) => { e.stopPropagation(); handleMenuClick(e, task.id); }} className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="w-4 h-4" /></button>
                             {activeMenuId === task.id && (
                                <div className="absolute right-2 top-8 w-40 bg-white rounded-lg shadow-xl border border-slate-100 z-50 animate-fade-in py-1 text-left">
                                    <button onClick={(e) => { e.stopPropagation(); openEditTaskModal(task); }} className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center"><Edit className="w-3.5 h-3.5 mr-2 text-blue-500" /> Editar</button>
                                    <button onClick={(e) => handleDeleteClick(e, task)} className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"><Trash2 className="w-3.5 h-3.5 mr-2" /> Eliminar</button>
                                </div>
                             )}
                        </div>
                        <h4 className="font-medium text-slate-800 mb-3">{task.name}</h4>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                {getAssigneeAvatar(task.assignedTo) && <img src={getAssigneeAvatar(task.assignedTo)} className="w-6 h-6 rounded-full" alt="" />}
                                <span className="text-xs text-slate-500">{getAssigneeName(task.assignedTo).split(' ')[0]}</span>
                            </div>
                            <div className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">{task.duration}d</div>
                        </div>
                    </div>
                  ))}
               </div>
            </div>
          )
        })}
      </div>
    );
  };

  const renderGanttView = () => {
    // ... same logic but using dynamic phases maybe?
    // For now keeping Standard/Fit logic which relies on dates, which is fine
    if (rawProjectTasks.length === 0) return <div className="p-8 text-center text-slate-400">No hay tareas para mostrar en el cronograma.</div>;

    const dates = rawProjectTasks.map(t => new Date(t.startDate).getTime());
    const minDate = new Date(Math.min(...dates));
    minDate.setDate(minDate.getDate() - 2); 
    const maxDate = new Date(Math.max(...rawProjectTasks.map(t => {
        const d = new Date(t.startDate);
        // FIXED: Inclusive duration (Start + Duration - 1) logic for max bounds
        d.setDate(d.getDate() + Math.max(0, t.duration - 1));
        return d.getTime();
    })));
    maxDate.setDate(maxDate.getDate() + 5); 

    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let pxPerDay = 40;
    if (ganttMode === 'fit' && ganttContainerRef.current) {
        const containerWidth = ganttContainerRef.current.clientWidth;
        const timelineWidth = Math.max(0, containerWidth - 256); 
        pxPerDay = Math.max(timelineWidth / totalDays, 5); 
    }

    return (
        <div className="flex-1 flex flex-col h-full relative">
            <div className="flex justify-between items-center px-4 py-2 border-b border-slate-200 bg-slate-50">
                <div className="text-xs text-slate-500 flex items-center space-x-2">
                    <BarChart2 className="w-4 h-4 text-indigo-500" />
                    <span className="font-semibold uppercase">Vista de Cronograma</span>
                </div>
                <div className="flex items-center space-x-2">
                     <div className="flex bg-white rounded-md border border-slate-200 p-0.5">
                        <button 
                            onClick={() => setGanttMode('standard')} 
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1 ${ganttMode === 'standard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`} 
                        >
                             <ZoomIn className="w-3 h-3" /> <span>Normal</span>
                         </button>
                         <button 
                            onClick={() => setGanttMode('fit')} 
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1 ${ganttMode === 'fit' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`} 
                        >
                             <Maximize className="w-3 h-3" /> <span>Completa</span>
                         </button>
                     </div>
                </div>
            </div>

            <div ref={ganttContainerRef} className="flex-1 overflow-auto bg-white relative">
                <div className={`min-w-max h-full ${ganttMode === 'fit' ? 'w-full' : ''}`}>
                    <div className="flex border-b border-slate-200 sticky top-0 bg-slate-50 z-20 shadow-sm">
                        <div className="w-64 p-3 border-r border-slate-200 font-bold text-slate-700 text-sm flex-shrink-0 bg-slate-50 sticky left-0 z-30 shadow-sm">
                            Tarea
                        </div>
                        <div className="flex h-10 relative">
                            {ganttMode === 'fit' && (
                                <>
                                    <div className="absolute left-2 top-0 bottom-0 flex items-center text-xs font-bold text-indigo-700 bg-indigo-50 px-2 border-r border-indigo-100">
                                        Inicio: {minDate.toLocaleDateString()}
                                    </div>
                                    <div className="absolute right-2 top-0 bottom-0 flex items-center text-xs font-bold text-indigo-700 bg-indigo-50 px-2 border-l border-indigo-100">
                                        Fin: {maxDate.toLocaleDateString()}
                                    </div>
                                </>
                            )}
                            {Array.from({ length: totalDays }).map((_, i) => {
                                const d = new Date(minDate);
                                d.setDate(d.getDate() + i);
                                const showDate = ganttMode === 'standard' || pxPerDay > 30 || (pxPerDay > 5 && i % Math.ceil(100/pxPerDay) === 0);
                                return (
                                    <div key={i} className="flex-shrink-0 border-r border-slate-200 flex items-center justify-center text-[10px] text-slate-500 bg-slate-50 overflow-hidden" style={{ width: pxPerDay }}>
                                        {showDate && `${d.getDate()}/${d.getMonth()+1}`}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {[...rawProjectTasks].sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map(task => {
                            const start = new Date(task.startDate);
                            const offsetDays = Math.ceil((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
                            const width = task.duration * pxPerDay;
                            const left = offsetDays * pxPerDay;
                            const hasDependency = task.dependencies && task.dependencies.length > 0;
                            const isDependencyOfHovered = hoveredTaskDependencies.includes(task.id);

                            return (
                                <div 
                                    key={task.id} 
                                    className={`flex hover:bg-slate-50 transition-colors group ${isDependencyOfHovered ? 'bg-yellow-50' : ''}`}
                                    onMouseEnter={() => task.dependencies && setHoveredTaskDependencies(task.dependencies)}
                                    onMouseLeave={() => setHoveredTaskDependencies([])}
                                >
                                    <div className="w-64 p-3 border-r border-slate-200 flex-shrink-0 sticky left-0 bg-white group-hover:bg-slate-50 z-10 flex items-center justify-between">
                                        <div className="truncate text-sm text-slate-700 font-medium cursor-pointer flex items-center" onClick={() => openEditTaskModal(task)}>
                                            {hasDependency && <LinkIcon className="w-3 h-3 text-slate-400 mr-1.5" />}
                                            <span className="truncate">{task.name}</span>
                                        </div>
                                        <span className="text-xs text-slate-400">{task.duration}d</span>
                                    </div>
                                    <div className="flex-1 relative h-10">
                                        <div className="absolute inset-0 flex pointer-events-none">
                                            {Array.from({ length: totalDays }).map((_, i) => (
                                                <div key={i} className="flex-shrink-0 border-r border-slate-50 h-full" style={{ width: pxPerDay }}></div>
                                            ))}
                                        </div>
                                        <div 
                                            onClick={() => openEditTaskModal(task)}
                                            className={`absolute top-2 h-6 rounded-md shadow-sm border border-white/20 cursor-pointer flex items-center px-2 text-xs text-white font-medium truncate hover:opacity-90 transition-opacity z-10 ${
                                                task.status === 'Completado' ? 'bg-emerald-500' : 
                                                task.status === 'En Riesgo' ? 'bg-red-500' : 
                                                phases.indexOf(task.phase) < 2 ? 'bg-indigo-500' : 'bg-blue-500'
                                            }`}
                                            style={{ left, width }}
                                            title={`Inicio: ${task.startDate} | Duración: ${task.duration} días`}
                                        >
                                            {hasDependency && <LinkIcon className="w-3 h-3 mr-1 text-white/70" />}
                                            {(ganttMode === 'standard' || width > 30) && `${task.progress}%`}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
  };

  const renderCalendarView = () => {
    // UPDATED: Logic to navigate months
    const currentMonth = calendarDate.getMonth();
    const currentYear = calendarDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
    
    // Navigation handlers
    const prevMonth = () => setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
    const nextMonth = () => setCalendarDate(new Date(currentYear, currentMonth + 1, 1));
    const goToToday = () => setCalendarDate(new Date());

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null); 
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(currentYear, currentMonth, i));
    }

    // --- Timezone Safe Date Formatter ---
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // USE HIERARCHY-SORTED TASKS
    const hierarchicalTasks = getOrganizedTasks();

    return (
        <div className="flex-1 bg-slate-50 p-4 flex flex-col h-full overflow-hidden">
             {/* Calendar Navigation */}
             <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex-shrink-0">
                <div className="flex items-center space-x-2">
                    <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-full"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
                    <h2 className="text-lg font-bold text-slate-800 capitalize w-48 text-center">
                        {calendarDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-full"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
                </div>
                <button onClick={goToToday} className="text-sm text-blue-600 font-medium hover:underline">Ir a Hoy</button>
             </div>

             <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 flex-shrink-0">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                        <div key={d} className="py-2 text-center text-xs font-bold text-slate-500 uppercase">{d}</div>
                    ))}
                </div>
                {/* CSS Adjustment: Added overflow-y-auto to allow vertical scrolling within the grid */}
                <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)] divide-x divide-y divide-slate-200 flex-1 overflow-y-auto">
                    {days.map((date, idx) => {
                        if (!date) return <div key={`empty-${idx}`} className="bg-slate-50/50 min-h-[120px]"></div>;
                        
                        const dateStr = formatDate(date);

                        // Check tasks STARTING on this day
                        const tasksStarting = hierarchicalTasks.filter(t => t.startDate === dateStr);

                         // Check tasks ENDING on this day
                        const tasksEnding = hierarchicalTasks.filter(t => {
                             // Calculation needs to be robust. 
                             // We avoid Date object math for string comparison to prevent TZ issues if possible,
                             // but for adding duration, we must use Date.
                             // We create a date from the string, add days, then format back to string.
                             // IMPORTANT: Treat the string 'YYYY-MM-DD' as local time noon to avoid 00:00 shifts.
                             const parts = t.startDate.split('-');
                             const start = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
                             const end = new Date(start);
                             // FIXED: Inclusive end date logic (Start + Duration - 1)
                             end.setDate(end.getDate() + Math.max(0, t.duration - 1));
                             return formatDate(end) === dateStr;
                        });

                        // Check tasks ACTIVE (Middle) on this day
                        const tasksActive = hierarchicalTasks.filter(t => {
                             const parts = t.startDate.split('-');
                             const start = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
                             const end = new Date(start);
                             // FIXED: Inclusive end date logic (Start + Duration - 1)
                             end.setDate(end.getDate() + Math.max(0, t.duration - 1));
                             
                             // Check if current date is > start AND < end
                             // We compare timestamps of midnight
                             return date.getTime() > start.getTime() && date.getTime() < end.getTime();
                        });

                        return (
                            <div key={idx} className="p-2 hover:bg-slate-50 transition-colors min-h-[120px] relative">
                                <div className={`text-xs font-bold mb-1 ${date.getDate() === new Date().getDate() && date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear() ? 'text-blue-600 bg-blue-100 w-6 h-6 flex items-center justify-center rounded-full' : 'text-slate-400'}`}>
                                    {date.getDate()}
                                </div>
                                <div className="space-y-1">
                                    {/* Start Markers (Blue) */}
                                    {tasksStarting.map(t => (
                                        <div 
                                            key={`start-${t.id}`} 
                                            onClick={() => openEditTaskModal(t)}
                                            className="text-xs p-1 rounded bg-blue-600 text-white cursor-pointer shadow-sm hover:opacity-90 break-words"
                                            title={`Inicio: ${t.name}`}
                                        >
                                            {t.parentId ? '↳ ' : ''}{t.name}
                                        </div>
                                    ))}
                                    
                                    {/* Active Markers (Gray/Light) */}
                                    {tasksActive.map(t => (
                                        <div 
                                            key={`active-${t.id}`} 
                                            onClick={() => openEditTaskModal(t)}
                                            className="text-[10px] p-0.5 px-1 rounded bg-slate-100 text-slate-500 border border-slate-200 cursor-pointer hover:bg-slate-200 break-words truncate"
                                            title={`En curso: ${t.name}`}
                                        >
                                            {t.parentId ? '↳ ' : ''}{t.name.substring(0, 15)}...
                                        </div>
                                    ))}

                                    {/* End Markers (Orange) */}
                                    {tasksEnding.map(t => (
                                        <div 
                                            key={`end-${t.id}`} 
                                            onClick={() => openEditTaskModal(t)}
                                            className="text-xs p-1 rounded bg-orange-500 text-white cursor-pointer shadow-sm hover:opacity-90 break-words"
                                            title={`Fin: ${t.name}`}
                                        >
                                            {t.parentId ? '↳ ' : ''}🏁 {t.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
             </div>
        </div>
    );
  };

  // ... TeamView and other parts remain the same mostly

  if (!currentProject) {
    return <div className="p-8 text-center text-slate-500">No hay proyectos. Ve al Dashboard para crear uno.</div>;
  }

  return (
    <div className="h-full flex flex-col space-y-4 relative">
       {/* Header Controls */}
       <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Proyecto</h1>
          <p className="text-slate-500 text-sm">Gestiona las tareas de: <strong>{currentProject.name}</strong></p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
            <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none shadow-sm">
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                <button onClick={() => setViewMode('list')} className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}><List className="w-4 h-4" /><span className="hidden md:inline">Lista</span></button>
                <button onClick={() => setViewMode('board')} className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'board' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}><LayoutGrid className="w-4 h-4" /><span className="hidden md:inline">Tablero</span></button>
                <button onClick={() => setViewMode('gantt')} className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'gantt' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}><BarChart2 className="w-4 h-4 rotate-90" /><span className="hidden md:inline">Gantt</span></button>
                <button onClick={() => setViewMode('calendar')} className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'calendar' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}><CalendarIcon className="w-4 h-4" /><span className="hidden md:inline">Calendario</span></button>
                <button onClick={() => setViewMode('team')} className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'team' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}><Users className="w-4 h-4" /><span className="hidden md:inline">Equipo</span></button>
            </div>
            
            <button onClick={downloadCSV} className="p-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm" title="Descargar CSV"><Download className="w-5 h-5" /></button>
            <button onClick={openNewTaskModal} className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium shadow-sm transition-colors"><Plus className="w-4 h-4" /><span>Nueva Tarea</span></button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-0">
        {viewMode === 'list' && renderListView()}
        {viewMode === 'board' && renderBoardView()}
        {viewMode === 'gantt' && renderGanttView()}
        {viewMode === 'calendar' && renderCalendarView()}
        {/* Reuse Team View logic but pass props if needed */}
        {viewMode === 'team' && (
             // Inline minimal version to avoid giant file again, logic is same
             <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Simplified Team View logic for brevity */}
                    {users.map(u => {
                        const userTasks = rawProjectTasks.filter(t => t.assignedTo === u.id);
                        return (
                            <div key={u.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                <div className="flex items-center space-x-3 mb-4">
                                    <img src={u.avatar} className="w-10 h-10 rounded-full" />
                                    <div className="font-bold">{u.name}</div>
                                    <div className="ml-auto bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">{userTasks.length}</div>
                                </div>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {userTasks.map(t => <div key={t.id} className="text-sm p-2 bg-slate-50 rounded border">{t.name}</div>)}
                                    {userTasks.length === 0 && <div className="text-slate-400 text-xs text-center">Sin tareas</div>}
                                </div>
                            </div>
                        )
                    })}
                 </div>
             </div>
        )}
      </div>

       {/* Task Modal (Using dynamic options) */}
       {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">{editingTask ? 'Editar Tarea' : 'Crear Tarea'}</h3>
              <button onClick={() => setIsTaskModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            
            <form onSubmit={handleTaskSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* ... Inputs ... */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                    <input type="text" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" value={taskForm.name} onChange={e => setTaskForm({...taskForm, name: e.target.value})} />
                  </div>
                  {/* ... Parent ID select ... */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Padre (Opcional)</label>
                    <select 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg" 
                        value={taskForm.parentId || ''} 
                        onChange={e => setTaskForm({...taskForm, parentId: e.target.value})}
                        disabled={!!editingTask && isParentTask(editingTask.id)} 
                    >
                        <option value="">-- Tarea Principal --</option>
                        {rawProjectTasks.filter(t => t.id !== editingTask?.id).map(task => (<option key={task.id} value={task.id}>{task.name}</option>))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fase</label>
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg" value={taskForm.phase} onChange={e => setTaskForm({...taskForm, phase: e.target.value as any})}>
                        {phases.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  
                   {/* ... Other inputs (Date, Duration, Priority) ... */}
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Inicio</label>
                    <input type="date" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" value={taskForm.startDate} onChange={e => setTaskForm({...taskForm, startDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Duración (días)</label>
                    <input type="number" min="1" className="w-full px-3 py-2 border border-slate-300 rounded-lg" value={taskForm.duration} onChange={e => setTaskForm({...taskForm, duration: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad</label>
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value as Priority})}>
                        {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Avance (%)</label>
                    <input type="number" min="0" max="100" className="w-full px-3 py-2 border border-slate-300 rounded-lg" value={taskForm.progress} onChange={e => setTaskForm({...taskForm, progress: Number(e.target.value)})} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                    <select 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        value={taskForm.status} 
                        onChange={e => setTaskForm({...taskForm, status: e.target.value as any})}
                    >
                        {taskStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Asignar a</label>
                    <select className="w-full px-3 py-2 border rounded-lg" value={taskForm.assignedTo} onChange={e => setTaskForm({...taskForm, assignedTo: e.target.value})}>
                         <option value="">Sin Asignar</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
              </div>
              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">{editingTask ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in border border-red-100">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertOctagon className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">¿Eliminar Tarea?</h3>
                    <p className="text-sm text-slate-600 mb-6">
                        Estás a punto de eliminar <strong>{taskToDelete.name}</strong>.<br/>
                        Esta acción es irreversible.
                    </p>
                    <div className="flex space-x-3 justify-center">
                        <button
                            onClick={() => setTaskToDelete(null)}
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

export default ProjectGantt;
