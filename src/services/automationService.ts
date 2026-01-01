import { Task, User, AutomationSettings, EmailLogEntry } from '../types';

// We access EmailJS globally via window to prevent import crashes
declare global {
    interface Window {
        emailjs: any;
    }
}

// --- LOGGING HELPER ---
export const logEmailEvent = (
    recipientName: string, 
    recipientEmail: string, 
    subject: string, 
    status: 'Enviado' | 'Error',
    type: 'Automático' | 'Manual'
) => {
    try {
        const currentLogsStr = localStorage.getItem('helios_email_logs');
        const logs: EmailLogEntry[] = currentLogsStr ? JSON.parse(currentLogsStr) : [];
        
        const newEntry: EmailLogEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            recipientName,
            recipientEmail,
            subject,
            status,
            type
        };

        // Add to beginning
        logs.unshift(newEntry);
        
        // Keep only last 500 logs to prevent localStorage overflow
        if (logs.length > 500) logs.pop();
        
        localStorage.setItem('helios_email_logs', JSON.stringify(logs));
    } catch (e) {
        console.error("Error saving email log", e);
    }
};

/**
 * Checks if the daily report should run (after 7:00 AM and not run yet today)
 */
export const shouldRunDailyReport = (settings: AutomationSettings): boolean => {
    if (!settings.enabled) return false;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Check if already run today
    if (settings.lastRunDate === todayStr) return false;

    // Check if it is past 7:00 AM
    // Using local hours (0-23)
    if (now.getHours() >= 7) {
        return true;
    }

    return false;
};

/**
 * Generates the content for the email
 */
const generateEmailContent = (user: User, tasks: Task[], isForAdmin: boolean = false) => {
    const pendingTasks = tasks.filter(t => t.status !== 'Completado' && t.status !== 'Cancelado');
    
    const greeting = `Hola ${user.name},`;
    const intro = isForAdmin 
        ? `Resumen diario AUTOMÁTICO de tus tareas administrativas y supervisión (7:00 AM).`
        : `Este es un recordatorio automático de tus tareas pendientes en el sistema RyV.`;

    const taskList = pendingTasks.length > 0 
        ? pendingTasks.map(t => `- [${t.status.toUpperCase()}] ${t.name} (Vence: ${t.startDate})`).join('\n')
        : "¡Excelente! No tienes tareas pendientes.";

    const footer = `\nPor favor, actualiza el estado en la aplicación hoy.\n\nAtentamente,\nBot de Gestión RyV`;

    // Free Plan Warning
    const warning = `\n\n--------------------------------\n[AVISO SISTEMA]: Si lees esto y no eres ${user.name}, es porque estás usando el Plan Gratuito de EmailJS, que redirige todos los correos al Administrador.`;

    return {
        subject: `[RyV] ${isForAdmin ? 'Reporte Admin' : 'Recordatorio Tareas'}: ${pendingTasks.length} pendientes`,
        body: `${greeting}\n\n${intro}\n\nResumen:\n${taskList}\n${footer}${warning}`,
        // Raw params for EmailJS template
        to_name: user.name,
        to_email: user.email,
        message: taskList,
        task_count: pendingTasks.length
    };
};

/**
 * Executes the automation. 
 * If EmailJS keys are present, sends real emails. 
 * If not, simulates and logs to console.
 */
export const runDailyAutomation = async (
    tasks: Task[], 
    users: User[], 
    settings: AutomationSettings
): Promise<{ success: boolean, count: number, adminNotified: boolean }> => {
    
    console.log("🚀 Iniciando automatización de las 7:00 AM...");
    
    // Initialize EmailJS if keys exist
    const useRealEmail = settings.emailJsServiceId && settings.emailJsTemplateId && settings.emailJsPublicKey && window.emailjs;
    
    if (useRealEmail) {
        try {
            window.emailjs.init(settings.emailJsPublicKey!);
        } catch (e) {
            console.error("Error initializing EmailJS:", e);
        }
    }
    
    let emailsSent = 0;
    let adminNotified = false;

    // 1. Group tasks by User
    const tasksByUser: Record<string, Task[]> = {};
    users.forEach(u => tasksByUser[u.id] = []);
    tasks.forEach(t => {
        if (t.assignedTo && tasksByUser[t.assignedTo]) {
            tasksByUser[t.assignedTo].push(t);
        }
    });

    // 2. Process each user
    for (const user of users) {
        const userTasks = tasksByUser[user.id] || [];
        const pending = userTasks.filter(t => t.status !== 'Completado' && t.status !== 'Cancelado');
        
        // Notify Admin or User if they have pending tasks
        const isAdmin = user.email === settings.adminEmail || user.role === 'Administrador' || user.id === 'u1'; 
        
        if (pending.length > 0 || isAdmin) {
            const content = generateEmailContent(user, pending, isAdmin);
            
            if (useRealEmail) {
                // IMPORTANT SKIP LOGIC: 
                // Skip specific mock domain. 
                // NOTE: If you changed the user email to a real one (e.g. gmail), this skip won't happen.
                // In that case, the email IS sent, but EmailJS Free Plan redirects it to YOU.
                if (user.email.includes('@helioscuba.cu')) {
                    console.warn(`⚠️ OMITIDO: ${user.email} (Dominio de prueba)`);
                    continue; 
                }

                // SEND REAL EMAIL VIA EMAILJS
                try {
                    console.log(`📨 Enviando correo real a ${user.email}...`);
                    await window.emailjs.send(
                        settings.emailJsServiceId!,
                        settings.emailJsTemplateId!,
                        {
                            to_name: content.to_name,
                            to_email: content.to_email,
                            message: content.body, // or use specific template params
                            subject: content.subject
                        }
                    );
                    emailsSent++;
                    if (isAdmin) adminNotified = true;
                    
                    // LOG SUCCESS
                    logEmailEvent(user.name, user.email, content.subject, 'Enviado', 'Automático');

                    // Prevent rate limiting (don't spam the API instantly)
                    await new Promise(r => setTimeout(r, 500)); 
                } catch (error) {
                    console.error(`❌ Error enviando a ${user.email}:`, error);
                    // LOG ERROR
                    logEmailEvent(user.name, user.email, content.subject, 'Error', 'Automático');
                }
            } else {
                // SIMULATION (Log only)
                console.log(`[SIMULACIÓN] 📨 Enviando a ${user.email}`);
                emailsSent++;
                if (isAdmin) adminNotified = true;
                // Log simulation if needed, or skip to avoid cluttering real logs
            }
        }
    }

    return { success: true, count: emailsSent, adminNotified };
};

export const constructMailtoLink = (email: string, subject: string, body: string) => {
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};