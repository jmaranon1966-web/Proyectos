import { AuditLogEntry } from '../types';

const AUDIT_KEY = 'helios_audit_log';

export const logSystemAction = (
    action: string, 
    details: string, 
    module: AuditLogEntry['module'], 
    userName: string = 'Administrador' // Default to Admin for now, until real login
) => {
    try {
        const currentLogStr = localStorage.getItem(AUDIT_KEY);
        const logs: AuditLogEntry[] = currentLogStr ? JSON.parse(currentLogStr) : [];

        const newEntry: AuditLogEntry = {
            id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            timestamp: new Date().toISOString(),
            action,
            details,
            module,
            user: userName
        };

        // Add to beginning
        logs.unshift(newEntry);

        // Keep last 1000 entries
        if (logs.length > 1000) logs.pop();

        localStorage.setItem(AUDIT_KEY, JSON.stringify(logs));
    } catch (e) {
        console.error("Audit log error", e);
    }
};

export const getAuditLogs = (): AuditLogEntry[] => {
    try {
        const str = localStorage.getItem(AUDIT_KEY);
        return str ? JSON.parse(str) : [];
    } catch (e) {
        return [];
    }
};

export const clearAuditLogs = () => {
    localStorage.removeItem(AUDIT_KEY);
};