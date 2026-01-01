
export enum ProjectStatus {
  PLANIFICACION = 'Planificación',
  EN_PROGRESO = 'En Progreso',
  DETENIDO = 'Detenido',
  COMPLETADO = 'Completado'
}

export enum ProjectPhase {
  PREPARACION = '1. Preparación y planificación',
  INGENIERIA = '2. Ingeniería y diseño',
  SUMINISTRO = '3. Suministro y logística',
  EJECUCION = '4. Ejecución y montaje',
  PRUEBAS = '5. Puesta en marcha y pruebas',
  ENTREGA = '6. Entrega y documentación final'
}

export enum Department {
  INGENIERIA = 'Ingeniería',
  LEGAL = 'Legal',
  COMPRAS = 'Compras',
  OPERACIONES = 'Operaciones',
  VENTAS = 'Ventas',
  DIRECCION = 'Dirección'
}

export enum Priority {
  BAJA = 'Baja',
  MEDIA = 'Media',
  ALTA = 'Alta',
  CRITICA = 'Crítica'
}

export interface User {
  id: string;
  name: string;
  email: string; 
  role: string; // Display role (e.g. "Jefe de Obra")
  specialties: string[]; // NEW: For scheduler (e.g. ["Electricista", "Montador"])
  department: string; 
  avatar: string;
  accessCode: string;
  isActive: boolean;
}

export type TaskStatus = 'Pendiente' | 'En Progreso' | 'En Riesgo' | 'Completado' | 'Cancelado';

export interface Task {
  id: string;
  projectId: string; 
  name: string;
  phase: ProjectPhase | string; 
  assignedTo: string; 
  startDate: string; 
  duration: number; 
  progress: number; 
  status: TaskStatus;
  dependencies: string[]; 
  priority: Priority;
  parentId?: string; 
  isEnterprise?: boolean;
  department?: string;
  level?: number;
  requiredSpecialty?: string; // NEW: For scheduler constraints
}

export interface Project {
  id: string;
  name: string;
  client: string;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  budget: number;
  location: string;
  capacityKW: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  date: string;
  read: boolean;
  generatedByAI: boolean;
}

export interface DocumentationSection {
  id: string;
  title: string;
  content: string; 
}

export interface AutomationSettings {
    enabled: boolean;
    emailProvider: 'gmail' | 'outlook'; 
    adminEmail: string;
    lastRunDate: string | null;
    emailJsServiceId?: string;
    emailJsTemplateId?: string;
    emailJsPublicKey?: string;
}

export interface EmailLogEntry {
    id: string;
    timestamp: string; 
    recipientName: string;
    recipientEmail: string;
    subject: string;
    status: 'Enviado' | 'Error';
    type: 'Automático' | 'Manual';
}

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    action: string;
    details: string;
    user: string;
    module: 'Configuración' | 'Reportes' | 'Proyectos' | 'Sistema';
}