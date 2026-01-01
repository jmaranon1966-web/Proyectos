
import { Task, User, Project } from '../types';

/**
 * INTELLIGENT SCHEDULER ENGINE
 * 
 * Implements a heuristic-based Forward Scheduling algorithm.
 * 1. Topological Sorting: Respects dependencies.
 * 2. Critical Path Constraint: Dependencies dictate earliest start dates.
 * 3. Resource Constraint: Users cannot be in two places at once.
 */

// Helper: Add days to date string
const addDays = (dateStr: string, days: number): string => {
    const result = new Date(dateStr);
    result.setDate(result.getDate() + days);
    return result.toISOString().split('T')[0];
};

// Helper: Get max of two date strings
const maxDate = (d1: string, d2: string): string => {
    return new Date(d1) > new Date(d2) ? d1 : d2;
};

interface ScheduleResult {
    optimizedTasks: Task[];
    conflicts: string[];
    utilization: Record<string, number>;
}

export const scheduleProject = (
    project: Project,
    projectTasks: Task[],
    allUsers: User[],
    existingGlobalTasks: Task[] // Tasks from OTHER projects to avoid conflicts
): ScheduleResult => {
    
    // 1. Build Dependency Graph & Map for fast access
    const taskMap = new Map<string, Task>();
    const outgoingEdges = new Map<string, string[]>(); // TaskId -> [DependentTaskIds]
    const incomingDegree = new Map<string, number>(); // TaskId -> count of dependencies

    projectTasks.forEach(t => {
        taskMap.set(t.id, { ...t }); // Clone to avoid mutation of source
        incomingDegree.set(t.id, 0);
        outgoingEdges.set(t.id, []);
    });

    projectTasks.forEach(t => {
        if (t.dependencies) {
            t.dependencies.forEach(depId => {
                if (taskMap.has(depId)) {
                    outgoingEdges.get(depId)?.push(t.id);
                    incomingDegree.set(t.id, (incomingDegree.get(t.id) || 0) + 1);
                }
            });
        }
    });

    // 2. Resource Availability Map (User ID -> Date String of next availability)
    const userAvailability = new Map<string, string>();
    
    // Initialize with today or existing global tasks end dates
    allUsers.forEach(u => userAvailability.set(u.id, new Date().toISOString().split('T')[0]));

    // Pre-fill availability based on OTHER projects' tasks (Resource Leveling)
    existingGlobalTasks.forEach(t => {
        if (t.projectId !== project.id && t.assignedTo && userAvailability.has(t.assignedTo)) {
            const currentAvail = userAvailability.get(t.assignedTo)!;
            const taskEnd = addDays(t.startDate, t.duration);
            userAvailability.set(t.assignedTo, maxDate(currentAvail, taskEnd));
        }
    });

    // 3. Queue for Topological Processing (Tasks with no unmet dependencies)
    const queue: string[] = [];
    projectTasks.forEach(t => {
        if ((incomingDegree.get(t.id) || 0) === 0) {
            queue.push(t.id);
        }
    });

    // Sort queue by priority initially (Critical Path heuristic)
    // We prioritize Critical tasks to grab resources first
    const priorityWeight = { 'Crítica': 4, 'Alta': 3, 'Media': 2, 'Baja': 1 };
    queue.sort((a, b) => priorityWeight[taskMap.get(b)!.priority] - priorityWeight[taskMap.get(a)!.priority]);

    const optimizedTasks: Task[] = [];
    const conflicts: string[] = [];

    // 4. Process Loop
    while (queue.length > 0) {
        const taskId = queue.shift()!;
        const task = taskMap.get(taskId)!;

        // A. Calculate Earliest Start based on Dependencies (CPM)
        let dependencyEarliestStart = project.startDate; // Project start is the floor
        if (task.dependencies) {
            task.dependencies.forEach(depId => {
                const depTask = taskMap.get(depId);
                // Note: depTask should already be processed because of topological sort logic
                if (depTask) {
                    const depEnd = addDays(depTask.startDate, depTask.duration);
                    dependencyEarliestStart = maxDate(dependencyEarliestStart, depEnd);
                }
            });
        }

        // B. Resource Assignment
        let assignedUser = task.assignedTo;
        let actualStartDate = dependencyEarliestStart;

        // Find eligible users for this task's required specialty
        const specialtyNeeded = task.requiredSpecialty;
        let bestUser = assignedUser;
        
        if (specialtyNeeded) {
            const candidates = allUsers.filter(u => u.specialties.includes(specialtyNeeded) || u.role === specialtyNeeded);
            
            if (candidates.length > 0) {
                // Find candidate available closest to dependencyEarliestStart
                // We want: UserAvailableDate <= DependencyStart (Ideal)
                // Or: Minimize (UserAvailableDate - DependencyStart)
                
                candidates.sort((u1, u2) => {
                    const avail1 = userAvailability.get(u1.id)!;
                    const avail2 = userAvailability.get(u2.id)!;
                    return new Date(avail1).getTime() - new Date(avail2).getTime();
                });

                // Pick the best candidate. 
                // If the currently assigned user is capable and available reasonably, keep them to avoid churn.
                // Otherwise switch to the one who frees up earliest.
                const currentIsCapable = candidates.find(c => c.id === assignedUser);
                if (currentIsCapable && new Date(userAvailability.get(assignedUser)!) <= new Date(dependencyEarliestStart)) {
                    bestUser = assignedUser;
                } else {
                    bestUser = candidates[0].id;
                }
            } else {
                conflicts.push(`Falta perfil: ${specialtyNeeded} para tarea "${task.name}"`);
            }
        }

        // C. Calculate Final Start Date based on User Availability
        if (bestUser) {
            const userNextFree = userAvailability.get(bestUser) || project.startDate;
            // The task cannot start before dependencies are done AND user is free
            actualStartDate = maxDate(dependencyEarliestStart, userNextFree);
            
            // Update User Availability
            const newEnd = addDays(actualStartDate, task.duration);
            userAvailability.set(bestUser, newEnd);
            
            task.assignedTo = bestUser;
        }

        // D. Update Task
        task.startDate = actualStartDate;
        
        // E. Add to optimized list
        optimizedTasks.push(task);

        // F. Update Neighbors
        outgoingEdges.get(taskId)?.forEach(neighborId => {
            const currentDegree = incomingDegree.get(neighborId)! - 1;
            incomingDegree.set(neighborId, currentDegree);
            if (currentDegree === 0) {
                queue.push(neighborId);
                // Re-sort queue dynamically to prioritize high value tasks
                queue.sort((a, b) => priorityWeight[taskMap.get(b)!.priority] - priorityWeight[taskMap.get(a)!.priority]);
            }
        });
    }

    return {
        optimizedTasks,
        conflicts,
        utilization: {} // Todo: Calculate utilization %
    };
};
