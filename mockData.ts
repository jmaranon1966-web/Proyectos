
import { Project, Task, User, ProjectStatus, ProjectPhase, Department, Priority } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alejandro Pérez', email: 'jmaranon1966@gmail.com', role: 'Ingeniero de proyecto', department: Department.INGENIERIA, avatar: 'https://i.pravatar.cc/150?u=u1', accessCode: 'ALEJ01', isActive: true },
  { id: 'u2', name: 'Beatriz Rodríguez', email: 'beatriz.r@helioscuba.cu', role: 'Gestor de permisos', department: Department.LEGAL, avatar: 'https://i.pravatar.cc/150?u=u2', accessCode: 'BEAT02', isActive: true },
  { id: 'u3', name: 'Carlos Acosta', email: 'carlos.a@helioscuba.cu', role: 'Supervisor de obra', department: Department.OPERACIONES, avatar: 'https://i.pravatar.cc/150?u=u3', accessCode: 'CARL03', isActive: true },
  { id: 'u4', name: 'Diana Valdés', email: 'diana.v@helioscuba.cu', role: 'Responsable de compras', department: Department.COMPRAS, avatar: 'https://i.pravatar.cc/150?u=u4', accessCode: 'DIAN04', isActive: true },
  { id: 'u5', name: 'Ernesto Guevara', email: 'ernesto.g@helioscuba.cu', role: 'Ingeniero eléctrico', department: Department.INGENIERIA, avatar: 'https://i.pravatar.cc/150?u=u5', accessCode: 'ERNE05', isActive: true },
  { id: 'u6', name: 'Félix Saborit', email: 'felix.s@helioscuba.cu', role: 'Logística', department: Department.COMPRAS, avatar: 'https://i.pravatar.cc/150?u=u6', accessCode: 'FELI06', isActive: true },
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Hotel Sol Varadero - Autoconsumo',
    client: 'Grupo Gaviota S.A.',
    location: 'Varadero, Matanzas',
    budget: 850000,
    capacityKW: 800,
    startDate: '2025-10-01',
    status: ProjectStatus.EN_PROGRESO,
    progress: 65
  },
  {
    id: 'p2',
    name: 'Bioeléctrica Ciro Redondo (Auxiliar)',
    client: 'AZCUBA',
    location: 'Ciego de Ávila',
    budget: 120000,
    capacityKW: 100,
    startDate: '2025-11-15',
    status: ProjectStatus.PLANIFICACION,
    progress: 15
  },
  {
    id: 'p3',
    name: 'Zona Especial Mariel - Naves Logísticas',
    client: 'Almacenes Universales',
    location: 'Artemisa',
    budget: 2500000,
    capacityKW: 2500,
    startDate: '2025-09-01',
    status: ProjectStatus.EN_PROGRESO,
    progress: 40
  },
  {
    id: 'p4',
    name: 'Bombeo Solar Cooperativa Niceto',
    client: 'ANAP',
    location: 'Artemisa',
    budget: 45000,
    capacityKW: 40,
    startDate: '2025-08-01',
    status: ProjectStatus.COMPLETADO,
    progress: 100
  }
];

// Helper to generate IDs
const tId = (p: number, t: number) => `p${p}-t${t}`;

export const MOCK_TASKS: Task[] = [
  // --- PROJECT 1: Hotel Varadero (Oct 2025) ---
  { id: tId(1, 1), projectId: 'p1', name: 'Levantamiento Técnico en Cubierta', phase: ProjectPhase.INGENIERIA, assignedTo: 'u1', startDate: '2025-10-05', duration: 7, progress: 100, status: 'Completado', priority: Priority.ALTA, dependencies: [] },
  { id: tId(1, 2), projectId: 'p1', name: 'Factibilidad UNE', phase: ProjectPhase.PREPARACION, assignedTo: 'u2', startDate: '2025-10-01', duration: 25, progress: 100, status: 'Completado', priority: Priority.CRITICA, dependencies: [] },
  { id: tId(1, 3), projectId: 'p1', name: 'Importación Paneles (Puerto Mariel)', phase: ProjectPhase.SUMINISTRO, assignedTo: 'u6', startDate: '2025-10-25', duration: 20, progress: 100, status: 'Completado', priority: Priority.ALTA, dependencies: [tId(1, 2)] },
  { id: tId(1, 4), projectId: 'p1', name: 'Izaje de Estructuras', phase: ProjectPhase.EJECUCION, assignedTo: 'u3', startDate: '2025-11-15', duration: 10, progress: 80, status: 'En Progreso', priority: Priority.MEDIA, dependencies: [tId(1, 3)] },
  { id: tId(1, 5), projectId: 'p1', name: 'Conexión DC/AC', phase: ProjectPhase.EJECUCION, assignedTo: 'u5', startDate: '2025-11-25', duration: 5, progress: 20, status: 'En Progreso', priority: Priority.ALTA, dependencies: [tId(1, 4)] },

  // --- PROJECT 2: Bioeléctrica (Planificación) ---
  { id: tId(2, 1), projectId: 'p2', name: 'Estudio de Suelos', phase: ProjectPhase.PREPARACION, assignedTo: 'u1', startDate: '2025-11-16', duration: 5, progress: 100, status: 'Completado', priority: Priority.MEDIA, dependencies: [] },
  { id: tId(2, 2), projectId: 'p2', name: 'Oferta Comercial en MLC', phase: ProjectPhase.PREPARACION, assignedTo: 'u1', startDate: '2025-11-22', duration: 3, progress: 50, status: 'En Progreso', priority: Priority.ALTA, dependencies: [tId(2, 1)] },
  
  // --- PROJECT 3: Mariel (Riesgos) ---
  { id: tId(3, 1), projectId: 'p3', name: 'Trámites Aduanales', phase: ProjectPhase.SUMINISTRO, assignedTo: 'u6', startDate: '2025-09-05', duration: 15, progress: 100, status: 'Completado', priority: Priority.CRITICA, dependencies: [] },
  { id: tId(3, 2), projectId: 'p3', name: 'Suministro de Inversores Centrales', phase: ProjectPhase.SUMINISTRO, assignedTo: 'u4', startDate: '2025-10-01', duration: 45, progress: 40, status: 'En Riesgo', priority: Priority.ALTA, dependencies: [tId(3, 1)] },
  
  // --- PROJECT 4: Cooperativa (Completado) ---
  { id: tId(4, 1), projectId: 'p4', name: 'Cimentación Bombas', phase: ProjectPhase.EJECUCION, assignedTo: 'u3', startDate: '2025-08-05', duration: 5, progress: 100, status: 'Completado', priority: Priority.MEDIA, dependencies: [] },
  { id: tId(4, 2), projectId: 'p4', name: 'Pruebas de Caudal', phase: ProjectPhase.PRUEBAS, assignedTo: 'u1', startDate: '2025-08-12', duration: 2, progress: 100, status: 'Completado', priority: Priority.CRITICA, dependencies: [tId(4, 1)] },
];

export const PROJECT_TEMPLATE = [
  // 1. Preparación y planificación
  { name: 'Visita técnica y levantamiento', phase: ProjectPhase.PREPARACION, duration: 3, offset: 0, priority: Priority.ALTA },
  { name: 'Factibilidad y Permiso UNE', phase: ProjectPhase.PREPARACION, duration: 20, offset: 3, priority: Priority.CRITICA },
  
  // 2. Ingeniería y diseño
  { name: 'Ingeniería de detalle (Planos)', phase: ProjectPhase.INGENIERIA, duration: 10, offset: 15, priority: Priority.ALTA },
  
  // 3. Suministro y logística
  { name: 'Gestión de Importación', phase: ProjectPhase.SUMINISTRO, duration: 30, offset: 25, priority: Priority.CRITICA },
  { name: 'Desaduanaje y Transporte al Sitio', phase: ProjectPhase.SUMINISTRO, duration: 7, offset: 55, priority: Priority.ALTA },
  
  // 4. Ejecución y montaje
  { name: 'Replanteo y Obra Civil', phase: ProjectPhase.EJECUCION, duration: 7, offset: 62, priority: Priority.MEDIA },
  { name: 'Montaje de Estructuras y Módulos', phase: ProjectPhase.EJECUCION, duration: 15, offset: 69, priority: Priority.ALTA },
  { name: 'Instalación Eléctrica y Canalizaciones', phase: ProjectPhase.EJECUCION, duration: 10, offset: 75, priority: Priority.ALTA },
  
  // 5. Puesta en marcha
  { name: 'Pruebas de Aislamiento y Puesta en Marcha', phase: ProjectPhase.PRUEBAS, duration: 3, offset: 85, priority: Priority.CRITICA },
  
  // 6. Entrega
  { name: 'Dossier de Calidad y Entrega', phase: ProjectPhase.ENTREGA, duration: 5, offset: 88, priority: Priority.MEDIA },
];

export const TECH_DOCS = [
  {
    id: 'intro',
    title: 'Manual de Inicio - HeliosPV Cuba',
    content: `Bienvenido a HeliosPV Manager, adaptado para el mercado cubano.
    
**Flujo de Trabajo Recomendado:**
1. **Fase Preparación:** Inicie siempre gestionando el permiso de la UNE (Unión Eléctrica) antes de importar equipos.
2. **Suministro:** Utilice las fases de suministro para trazar la carga desde origen hasta puerto (Mariel/Santiago) y desaduanaje.
3. **Ejecución:** Controle las brigadas de montaje por especialidad (Civil, Estructura, Eléctrica).

Para soporte técnico local, contacte al departamento de Ingeniería.`
  }
];
