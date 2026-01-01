import React, { useState, useEffect } from 'react';
import { Task, User, Priority } from '../types';
import { Briefcase, Plus, List, LayoutGrid, Calendar as CalendarIcon, UserCircle, X, Edit, Trash2, MoreVertical, ChevronLeft, ChevronRight, FolderPlus, CornerDownRight, AlertOctagon } from 'lucide-react';

interface EnterpriseManagementProps {
  tasks: Task[];
  users: User[];
  departments: string[];
  taskStatuses: string[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

// Helper type for display
type TaskWithLevel = Task & { level: number };

const EnterpriseManagement: React.FC<EnterpriseManagementProps> = ({ 
    tasks, users, departments, taskStatuses, 
    onAddTask, onUpdateTask, onDeleteTask 
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'calendar'>('list');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Menu & Delete State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
      if ((!selectedDept || !departments.includes(selectedDept)) && departments.length > 0) {
          setSelectedDept(departments[0]);
      }
  }, [departments, selectedDept]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  // Filter tasks
  const rawFilteredTasks = tasks.filter(t => 
      t.isEnterprise === true && 
      (t.department === selectedDept || (!t.department && selectedDept === 'General'))
  );

  // --- MULTI-LEVEL HIERARCHY SORTING ---
  const getOrganizedTasks = (): TaskWithLevel[] => {
      const organized: TaskWithLevel[] = [];
      const processedIds = new Set<string>();

      // Find root tasks (no parent, or parent is not in this filtered list)
      const roots = rawFilteredTasks.filter(t => {
         if (!t.parentId) return true;
         // If parent exists but is NOT in the current department view, treat as root for display
         const parentInView = rawFilteredTasks.find(pt => pt.id === t.parentId);
         return !parentInView; 
      });

      const addNode = (task: Task, level: number) => {
          if (processedIds.has(task.id)) return;
          organized.push({ ...task, level });
          processedIds.add(task.id);
          
          // Find children in the current list
          const children = rawFilteredTasks.filter(t => t.parentId === task.id);
          children.forEach(c => addNode(c, level + 1));
      };

      roots.forEach(t => addNode(t, 0));
      
      // Orphans (safety net)
      rawFilteredTasks.forEach(t => {
          if (!processedIds.has(t.id)) organized.push({ ...t, level: 0 });
      });

      return organized;
  };

  const displayTasks = viewMode === 'list' ? getOrganizedTasks() : rawFilteredTasks as TaskWithLevel[];

  // --- FORM STATE ---
  const [taskForm, setTaskForm] = useState<Partial<Task>>({
      name: '',
      department: '',
      assignedTo: '',
      startDate: new Date().toISOString().split('T')[0],
      duration: 1,
      priority: Priority.MEDIA,
      status: taskStatuses[0] as any,
      parentId: undefined
  });

  const openNewTaskModal = () => {
      setEditingTask(null);
      setTaskForm({
          name: '',
          department: selectedDept,
          assignedTo: users[0]?.id || '',
          startDate: new Date().toISOString().split('T')[0],
          duration: 1,
          priority: Priority.MEDIA,
          status: taskStatuses[0] as any,
          parentId: undefined
      });
      setIsTaskModalOpen(true);
  };

  const openSubtaskModal = (parent: Task) => {
      setEditingTask(null);
      setTaskForm({
          name: '',
          department: selectedDept,
          assignedTo: parent.assignedTo || '',
          startDate: parent.startDate,
          duration: 1,
          priority: parent.priority,
          status: taskStatuses[0] as any,
          parentId: parent.id // Correctly sets parent ID for nesting
      });
      setIsTaskModalOpen(true);
      setActiveMenuId(null);
  };

  const openEditTaskModal = (task: Task) => {
      setEditingTask(task);
      setTaskForm({ ...task });
      setIsTaskModalOpen(true);
      setActiveMenuId(null);
  };

  const handleMenuClick = (e: React.MouseEvent, taskId: string) => {
      e.stopPropagation();
      setActiveMenuId(activeMenuId === taskId ? null : taskId);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!taskForm.name) return;
      
      const safeDuration = Math.max(1, Number(taskForm.duration) || 1);

      if (editingTask) {
          onUpdateTask({
              ...editingTask,
              ...taskForm as Task,
              duration: safeDuration,
              isEnterprise: true 
          });
      } else {
          onAddTask({
              id: `ent-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Robust ID generation
              projectId: '', 
              name: taskForm.name!,
              phase: 'General',
              assignedTo: taskForm.assignedTo || '',
              startDate: taskForm.startDate!,
              duration: safeDuration,
              progress: 0,
              status: taskForm.status as any,
              dependencies: [],
              priority: taskForm.priority || Priority.MEDIA,
              isEnterprise: true,
              department: selectedDept,
              parentId: taskForm.parentId
          });
      }
      setIsTaskModalOpen(false);
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

  // --- HELPERS FOR COLORS ---
  const getStatusColorClass = (status: string) => {
      const s = status.toLowerCase();
      if (s.includes('completado') || s.includes('finalizado')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      if (s.includes('riesgo') || s.includes('atrasado') || s.includes('error')) return 'bg-red-100 text-red-700 border-red-200';
      if (s.includes('progreso') || s.includes('curso') || s.includes('ejecución')) return 'bg-blue-100 text-blue-700 border-blue-200';
      if (s.includes('cancelado')) return 'bg-orange-100 text-orange-800 border-orange-200';
      return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const getStatusBarColor = (status: string) => {
      const s = status.toLowerCase();
      if (s.includes('completado')) return 'bg-emerald-500';
      if (s.includes('riesgo')) return 'bg-red-500';
      if (s.includes('progreso')) return 'bg-blue-500';
      if (s.includes('cancelado')) return 'bg-orange-400';
      return 'bg-slate-400';
  };

  const getParentName = (parentId: string | undefined) => {
      if (!parentId) return null;
      const parent = tasks.find(t => t.id === parentId);
      return parent ? parent.name : 'Tarea Padre Eliminada';
  };

  // --- VIEWS ---

  const renderListView = () => (
      <div className="overflow-auto flex-1 pb-20">
          <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10 text-xs uppercase text-slate-500 font-semibold shadow-sm">
                  <tr>
                      <th className="p-4 border-b border-slate-200 w-1/3">Tarea</th>
                      <th className="p-4 border-b border-slate-200">Prioridad</th>
                      <th className="p-4 border-b border-slate-200">Responsable</th>
                      <th className="p-4 border-b border-slate-200 w-48">Cronograma</th>
                      <th className="p-4 border-b border-slate-200 text-center">Estado</th>
                      <th className="p-4 border-b border-slate-200 w-16"></th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                  {displayTasks.length > 0 ? displayTasks.map(task => {
                      const level = task.level || 0;
                      // Dynamic indentation based on tree level
                      const indentSize = level * 24; 
                      
                      // Check if it acts as a parent (has children in the raw list)
                      const isParent = tasks.some(t => t.parentId === task.id);

                      return (
                        <tr key={task.id} className={`hover:bg-slate-50 group ${isParent ? 'bg-slate-50/30' : ''}`}>
                            <td className="p-4 cursor-pointer" onClick={() => openEditTaskModal(task)}>
                                <div className="flex items-center" style={{ paddingLeft: `${indentSize}px` }}>
                                    {level > 0 && <CornerDownRight className="w-4 h-4 text-slate-300 mr-2 flex-shrink-0" />}
                                    <div className="flex-1">
                                        <div className={`font-medium ${isParent ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                                            {task.name}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                                    task.priority === Priority.CRITICA ? 'bg-red-50 text-red-700 border-red-100' :
                                    task.priority === Priority.ALTA ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                    task.priority === Priority.MEDIA ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                    'bg-slate-50 text-slate-600 border-slate-200'
                                }`}>{task.priority}</span>
                            </td>
                            <td className="p-4 text-slate-600">
                                <div className="flex items-center gap-2">
                                    <UserCircle className="w-4 h-4 text-slate-300" />
                                    <span className="truncate max-w-[120px]">{users.find(u => u.id === task.assignedTo)?.name || 'Sin Asignar'}</span>
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="w-full max-w-xs">
                                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                                        <span>{task.startDate}</span>
                                        <span className={isParent ? "font-bold text-indigo-600" : ""}>{task.duration}d</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${getStatusBarColor(task.status)}`} 
                                            style={{ width: task.status === 'Completado' ? '100%' : `${Math.max(5, task.progress || 0)}%` }} 
                                        />
                                    </div>
                                </div>
                            </td>
                            <td className="p-4 text-center">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${getStatusColorClass(task.status)}`}>
                                    {task.status}
                                </span>
                            </td>
                            <td className="p-4 text-right relative">
                                <button 
                                    onClick={(e) => handleMenuClick(e, task.id)} 
                                    className={`p-1.5 rounded-full transition-colors ${activeMenuId === task.id ? 'bg-slate-200 text-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                                
                                {activeMenuId === task.id && (
                                    <div className="absolute right-8 top-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-50 animate-fade-in py-1 text-left">
                                        <button onClick={() => openEditTaskModal(task)} className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center">
                                            <Edit className="w-4 h-4 mr-2 text-blue-500" /> Editar
                                        </button>
                                        <button onClick={() => openSubtaskModal(task)} className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center">
                                            <FolderPlus className="w-4 h-4 mr-2 text-emerald-500" /> Agregar Subtarea
                                        </button>
                                        <div className="h-px bg-slate-100 my-1"></div>
                                        <button onClick={(e) => handleDeleteClick(e, task)} className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                                            <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                      );
                  }) : (
                      <tr><td colSpan={6} className="p-8 text-center text-slate-400">No hay tareas en este departamento.</td></tr>
                  )}
              </tbody>
          </table>
      </div>
  );

  const renderBoardView = () => (
      <div className="flex-1 overflow-x-auto p-4 flex space-x-4 bg-slate-100/50">
          {taskStatuses.map(status => {
              const colTasks = rawFilteredTasks.filter(t => t.status === status);
              return (
                  <div key={status} className="flex-shrink-0 w-80 flex flex-col bg-slate-50 rounded-xl border border-slate-200 h-full max-h-full">
                      <div className={`p-3 border-b border-slate-200 font-bold text-sm flex justify-between items-center rounded-t-xl ${getStatusColorClass(status)} bg-opacity-30`}>
                          <span>{status}</span>
                          <span className="bg-white px-2 py-0.5 rounded text-xs border border-slate-200 shadow-sm">{colTasks.length}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 space-y-3">
                          {colTasks.map(task => (
                              <div key={task.id} onClick={() => openEditTaskModal(task)} className="bg-white p-3 rounded shadow-sm border border-slate-200 cursor-pointer hover:shadow-md">
                                  <div className="flex justify-between mb-2">
                                      <span className={`text-[10px] px-1 rounded ${
                                          task.priority === Priority.CRITICA ? 'bg-red-100 text-red-700' : 'bg-slate-100'
                                      }`}>{task.priority}</span>
                                  </div>
                                  <div className="font-medium text-sm mb-2">{task.name}</div>
                                  <div className="flex items-center justify-between mt-2">
                                      <div className="text-xs text-slate-500 flex items-center">
                                          <CalendarIcon className="w-3 h-3 mr-1" />
                                          {task.startDate}
                                      </div>
                                      <div className={`h-1.5 w-12 rounded-full ${getStatusBarColor(task.status)}`} />
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              );
          })}
      </div>
  );

  const renderCalendarView = () => {
      const currentMonth = calendarDate.getMonth();
      const currentYear = calendarDate.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const firstDay = new Date(currentYear, currentMonth, 1).getDay();

      const prevMonth = () => setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
      const nextMonth = () => setCalendarDate(new Date(currentYear, currentMonth + 1, 1));
      const today = () => setCalendarDate(new Date());

      const days = Array(firstDay).fill(null).concat(Array.from({length: daysInMonth}, (_, i) => new Date(currentYear, currentMonth, i + 1)));

      const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // USE HIERARCHY-SORTED TASKS FOR CALENDAR RENDER
      const hierarchicalTasks = getOrganizedTasks();

      return (
          <div className="flex-1 flex flex-col bg-slate-50 p-4 overflow-hidden">
               <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-center space-x-2">
                      <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-full"><ChevronLeft className="w-5 h-5" /></button>
                      <h2 className="text-lg font-bold capitalize w-48 text-center">{calendarDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h2>
                      <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-full"><ChevronRight className="w-5 h-5" /></button>
                  </div>
                  <button onClick={today} className="text-sm text-blue-600 font-medium">Hoy</button>
               </div>
               <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
                   <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                       {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => <div key={d} className="py-2 text-center text-xs font-bold text-slate-500">{d}</div>)}
                   </div>
                   <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)] divide-x divide-y divide-slate-200 overflow-y-auto flex-1">
                       {days.map((date, idx) => {
                           if (!date) return <div key={idx} className="bg-slate-50/50"></div>;
                           
                           const dateStr = formatDate(date);

                           // Check tasks STARTING on this day (using hierarchical list)
                           const tasksStarting = hierarchicalTasks.filter(t => t.startDate === dateStr);

                            // Check tasks ENDING on this day
                           const tasksEnding = hierarchicalTasks.filter(t => {
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
                                
                                // Check if date is strictly between start and end
                                return date.getTime() > start.getTime() && date.getTime() < end.getTime();
                           });
                           
                           return (
                               <div key={idx} className="p-2 min-h-[120px] relative hover:bg-slate-50">
                                   <div className={`text-xs font-bold mb-1 ${date.getDate() === new Date().getDate() && date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear() ? 'text-blue-600 bg-blue-100 w-6 h-6 flex items-center justify-center rounded-full' : 'text-slate-400'}`}>{date.getDate()}</div>
                                   <div className="space-y-1">
                                       {/* Start Markers (Blue) */}
                                       {tasksStarting.map(t => (
                                           <div 
                                               key={`start-${t.id}`} 
                                               onClick={() => openEditTaskModal(t)}
                                               className="text-[10px] p-1 rounded bg-blue-600 text-white cursor-pointer shadow-sm hover:opacity-90 break-words flex items-center"
                                               title={`Inicio: ${t.name}`}
                                           >
                                               {t.level > 0 && <span className="mr-1 opacity-70">↳</span>}
                                               {t.name}
                                           </div>
                                       ))}
                                       
                                       {/* Active Markers (Gray/Light) */}
                                       {tasksActive.map(t => (
                                           <div 
                                               key={`active-${t.id}`} 
                                               onClick={() => openEditTaskModal(t)}
                                               className="text-[10px] p-0.5 px-1 rounded bg-slate-100 text-slate-500 border border-slate-200 cursor-pointer hover:bg-slate-200 break-words truncate flex items-center"
                                               title={`En curso: ${t.name}`}
                                           >
                                               {t.level > 0 && <span className="mr-1 opacity-70">↳</span>}
                                               {t.name}
                                           </div>
                                       ))}

                                       {/* End Markers (Orange) */}
                                       {tasksEnding.map(t => (
                                           <div 
                                               key={`end-${t.id}`} 
                                               onClick={() => openEditTaskModal(t)}
                                               className="text-[10px] p-1 rounded bg-orange-500 text-white cursor-pointer shadow-sm hover:opacity-90 break-words flex items-center"
                                               title={`Fin: ${t.name}`}
                                           >
                                               {t.level > 0 && <span className="mr-1 opacity-70">↳</span>}
                                               🏁 {t.name}
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

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 flex-shrink-0">
          <div>
              <h1 className="text-2xl font-bold text-slate-800">Gestión Empresarial</h1>
              <p className="text-slate-500 text-sm">Administración de tareas por departamentos</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
              <select 
                  value={selectedDept} 
                  onChange={(e) => setSelectedDept(e.target.value)} 
                  className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none shadow-sm min-w-[200px]"
              >
                  {departments.length === 0 && <option value="">Sin Departamentos</option>}
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                  <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500'}`}><List className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode('board')} className={`p-1.5 rounded ${viewMode === 'board' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500'}`}><LayoutGrid className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode('calendar')} className={`p-1.5 rounded ${viewMode === 'calendar' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500'}`}><CalendarIcon className="w-4 h-4" /></button>
              </div>

              <button onClick={openNewTaskModal} className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium shadow-sm">
                  <Plus className="w-4 h-4" /><span>Nueva Tarea</span>
              </button>
          </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-0">
          {departments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Briefcase className="w-12 h-12 mb-2 opacity-20" />
                  <p>No hay departamentos configurados.</p>
                  <p className="text-sm">Ve a Configuración &rarr; Áreas/Dptos para crear uno.</p>
              </div>
          ) : (
              <>
                  {viewMode === 'list' && renderListView()}
                  {viewMode === 'board' && renderBoardView()}
                  {viewMode === 'calendar' && renderCalendarView()}
              </>
          )}
      </div>

      {/* Modal Edit/Create */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
                    <h3 className="text-lg font-bold text-slate-800">{editingTask ? 'Editar Tarea' : 'Nueva Tarea de Área'}</h3>
                    <button onClick={() => setIsTaskModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                        <input type="text" required className="w-full px-3 py-2 border rounded-lg" value={taskForm.name} onChange={e => setTaskForm({...taskForm, name: e.target.value})} />
                    </div>
                    
                    {/* MODIFIED: Hierarchy/Phase Field replacement */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Fase / Antecedente</label>
                        <div className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 flex items-center justify-between">
                            <div className="flex items-center">
                                {taskForm.parentId && <CornerDownRight className="w-4 h-4 mr-2 text-slate-400" />}
                                <span className="font-semibold">
                                    {taskForm.parentId ? getParentName(taskForm.parentId) : 'General'}
                                </span>
                            </div>
                            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">
                                {selectedDept}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                            <input type="date" required className="w-full px-3 py-2 border rounded-lg" value={taskForm.startDate} onChange={e => setTaskForm({...taskForm, startDate: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Duración (días)</label>
                            <input type="number" min="1" className="w-full px-3 py-2 border rounded-lg" value={taskForm.duration} onChange={e => setTaskForm({...taskForm, duration: Number(e.target.value)})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad</label>
                        <select className="w-full px-3 py-2 border rounded-lg" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value as Priority})}>
                            {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                        <select className="w-full px-3 py-2 border rounded-lg" value={taskForm.status} onChange={e => setTaskForm({...taskForm, status: e.target.value as any})}>
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
                    <div className="pt-4 flex justify-end space-x-3 border-t mt-4 flex-shrink-0">
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
                        Esta acción es irreversible y eliminará todas sus subtareas.
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

export default EnterpriseManagement;