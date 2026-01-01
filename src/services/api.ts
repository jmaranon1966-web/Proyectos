import { Project, Task, User, AuditLogEntry, ProjectPhase, ProjectStatus, Department } from '../types';
import { MOCK_PROJECTS, MOCK_TASKS, MOCK_USERS, PROJECT_TEMPLATE } from '../mockData';

// --- MOCK DATABASE UTILS ---
// En un escenario real, esto sería tu base de datos (PostgreSQL/MongoDB)
const DB_KEYS = {
    PROJECTS: 'helios_projects',
    TASKS: 'helios_tasks',
    USERS: 'helios_users',
    AUDIT: 'helios_audit_log',
    CONFIG_PHASES: 'config_phases',
    CONFIG_TASK_STATUSES: 'config_task_statuses',
    CONFIG_PROJECT_STATUSES: 'config_project_statuses',
    CONFIG_TEMPLATE: 'config_template',
    CONFIG_LOGO: 'config_logo',
    CONFIG_DEPARTMENTS: 'config_departments',
    CONFIG_ROLES: 'config_roles',
    SESSION: 'helios_session_user'
};

// Simula latencia de red (200-500ms)
const simulateLatency = async () => {
    await new Promise(resolve => setTimeout(resolve, 600));
};

const getFromStorage = <T>(key: string, fallback: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch {
        return fallback;
    }
};

const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// --- API CLIENT ---
export const api = {
    // --- AUTHENTICATION ---
    auth: {
        login: async (email: string, accessCode: string): Promise<User> => {
            await simulateLatency();
            const users = getFromStorage<User[]>(DB_KEYS.USERS, MOCK_USERS);
            
            // Case insensitive check
            const user = users.find(u => 
                u.email.toLowerCase() === email.toLowerCase() && 
                u.accessCode === accessCode
            );

            if (!user) {
                throw new Error("Credenciales inválidas. Verifique correo y código de acceso.");
            }

            if (!user.isActive) {
                throw new Error("Usuario desactivado. Contacte al administrador.");
            }

            // Create Session
            localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(user));
            
            // Log entry
            const logs = getFromStorage<AuditLogEntry[]>(DB_KEYS.AUDIT, []);
            const newEntry: AuditLogEntry = {
                id: `audit-${Date.now()}`,
                timestamp: new Date().toISOString(),
                action: 'Inicio de Sesión',
                details: 'Acceso autorizado al sistema',
                module: 'Sistema',
                user: user.name
            };
            saveToStorage(DB_KEYS.AUDIT, [newEntry, ...logs].slice(0, 1000));

            return user;
        },
        logout: async () => {
            await simulateLatency();
            localStorage.removeItem(DB_KEYS.SESSION);
        },
        getSession: async (): Promise<User | null> => {
            // No latency needed for session check on load to prevent flash
            return getFromStorage<User | null>(DB_KEYS.SESSION, null);
        }
    },

    // --- PROJECTS ---
    projects: {
        list: async (): Promise<Project[]> => {
            await simulateLatency();
            return getFromStorage(DB_KEYS.PROJECTS, MOCK_PROJECTS);
        },
        create: async (project: Project): Promise<Project> => {
            await simulateLatency();
            const projects = getFromStorage<Project[]>(DB_KEYS.PROJECTS, MOCK_PROJECTS);
            const updated = [...projects, project];
            saveToStorage(DB_KEYS.PROJECTS, updated);
            return project;
        },
        delete: async (id: string): Promise<void> => {
            await simulateLatency();
            const projects = getFromStorage<Project[]>(DB_KEYS.PROJECTS, MOCK_PROJECTS);
            saveToStorage(DB_KEYS.PROJECTS, projects.filter(p => p.id !== id));
        },
        // Reset DB simulates wiping the server DB
        reset: async () => {
            await simulateLatency();
            localStorage.clear();
            window.location.reload();
        }
    },

    // --- TASKS ---
    tasks: {
        list: async (): Promise<Task[]> => {
            await simulateLatency();
            return getFromStorage(DB_KEYS.TASKS, MOCK_TASKS);
        },
        create: async (task: Task): Promise<Task> => {
            await simulateLatency();
            const tasks = getFromStorage<Task[]>(DB_KEYS.TASKS, MOCK_TASKS);
            const updated = [...tasks, task];
            saveToStorage(DB_KEYS.TASKS, updated);
            return task;
        },
        update: async (task: Task): Promise<Task> => {
            await simulateLatency();
            const tasks = getFromStorage<Task[]>(DB_KEYS.TASKS, MOCK_TASKS);
            const updated = tasks.map(t => t.id === task.id ? task : t);
            saveToStorage(DB_KEYS.TASKS, updated);
            return task;
        },
        delete: async (id: string): Promise<void> => {
            await simulateLatency();
            const tasks = getFromStorage<Task[]>(DB_KEYS.TASKS, MOCK_TASKS);
            saveToStorage(DB_KEYS.TASKS, tasks.filter(t => t.id !== id));
        },
        // Bulk update simulates a transaction
        sync: async (tasks: Task[]): Promise<void> => {
            saveToStorage(DB_KEYS.TASKS, tasks);
        }
    },

    // --- USERS ---
    users: {
        list: async (): Promise<User[]> => {
            await simulateLatency();
            return getFromStorage(DB_KEYS.USERS, MOCK_USERS);
        },
        create: async (user: User): Promise<User> => {
            await simulateLatency();
            const users = getFromStorage<User[]>(DB_KEYS.USERS, MOCK_USERS);
            saveToStorage(DB_KEYS.USERS, [...users, user]);
            return user;
        },
        update: async (user: User): Promise<User> => {
            await simulateLatency();
            const users = getFromStorage<User[]>(DB_KEYS.USERS, MOCK_USERS);
            saveToStorage(DB_KEYS.USERS, users.map(u => u.id === user.id ? user : u));
            return user;
        },
        delete: async (id: string): Promise<void> => {
            await simulateLatency();
            const users = getFromStorage<User[]>(DB_KEYS.USERS, MOCK_USERS);
            saveToStorage(DB_KEYS.USERS, users.filter(u => u.id !== id));
        }
    },

    // --- CONFIGURATION / METADATA ---
    config: {
        getPhases: async () => getFromStorage(DB_KEYS.CONFIG_PHASES, Object.values(ProjectPhase)),
        savePhases: async (data: string[]) => saveToStorage(DB_KEYS.CONFIG_PHASES, data),

        getTaskStatuses: async () => getFromStorage(DB_KEYS.CONFIG_TASK_STATUSES, ['Pendiente', 'En Progreso', 'En Riesgo', 'Completado', 'Cancelado']),
        saveTaskStatuses: async (data: string[]) => saveToStorage(DB_KEYS.CONFIG_TASK_STATUSES, data),

        getProjectStatuses: async () => getFromStorage(DB_KEYS.CONFIG_PROJECT_STATUSES, Object.values(ProjectStatus)),
        saveProjectStatuses: async (data: string[]) => saveToStorage(DB_KEYS.CONFIG_PROJECT_STATUSES, data),

        getTemplate: async () => getFromStorage(DB_KEYS.CONFIG_TEMPLATE, PROJECT_TEMPLATE),
        saveTemplate: async (data: any[]) => saveToStorage(DB_KEYS.CONFIG_TEMPLATE, data),

        getLogo: async () => getFromStorage(DB_KEYS.CONFIG_LOGO, ''),
        saveLogo: async (data: string) => saveToStorage(DB_KEYS.CONFIG_LOGO, data),

        getDepartments: async () => getFromStorage(DB_KEYS.CONFIG_DEPARTMENTS, Object.values(Department)),
        saveDepartments: async (data: string[]) => saveToStorage(DB_KEYS.CONFIG_DEPARTMENTS, data),

        getRoles: async () => getFromStorage(DB_KEYS.CONFIG_ROLES, ['Ingeniero de proyecto','Gestor de permisos','Ingeniero eléctrico','Director técnico','Responsable de compras','Logística','Supervisor de obra','Equipo de montaje','Electricista especializado','Técnico especialista','Responsable de servicio técnico','Coordinador de proyecto','Administrador']),
        saveRoles: async (data: string[]) => saveToStorage(DB_KEYS.CONFIG_ROLES, data),
    },

    // --- AUDIT ---
    audit: {
        log: async (action: string, details: string, module: string, user: string) => {
            // Logs are fire-and-forget, usually
            const logs = getFromStorage<AuditLogEntry[]>(DB_KEYS.AUDIT, []);
            const newEntry: AuditLogEntry = {
                id: `audit-${Date.now()}`,
                timestamp: new Date().toISOString(),
                action, details, module: module as any, user
            };
            saveToStorage(DB_KEYS.AUDIT, [newEntry, ...logs].slice(0, 1000));
        }
    }
};