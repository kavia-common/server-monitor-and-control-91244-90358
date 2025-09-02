//
// Core domain models and DTOs for the Service Status Frontend.
// These interfaces and enums are used across the application to provide
// consistent typing for services, users, processes, and termination actions.
//

// PUBLIC_INTERFACE
/** Roles that can be assigned to application users for authorization checks. */
export enum RoleType {
  Admin = 'admin',
  Operator = 'operator',
  Viewer = 'viewer',
}

// PUBLIC_INTERFACE
/** Permissions available in the application, used for fine-grained access control. */
export enum PermissionType {
  ReadServices = 'read:services',
  ManageProcesses = 'manage:processes',
  ManageUsers = 'manage:users',
  TerminateProcess = 'terminate:process',
  TerminateUser = 'terminate:user',
}

// PUBLIC_INTERFACE
/** Status of a monitored service or entity. */
export enum StatusType {
  Healthy = 'healthy',
  Degraded = 'degraded',
  Down = 'down',
  Unknown = 'unknown',
}

// PUBLIC_INTERFACE
/** Process information as returned from the backend. */
export interface ProcessInfo {
  /** Unique process identifier (PID or system-unique ID). */
  pid: string | number;
  /** Human-readable process name or command. */
  name: string;
  /** Username of the owner of the process. */
  user: string;
  /** CPU usage percentage (0-100). */
  cpuPercent?: number;
  /** Memory usage percentage (0-100). */
  memoryPercent?: number;
  /** The service this process belongs to, if applicable. */
  serviceId?: string;
  /** Current status of the process if provided. */
  status?: StatusType;
  /** ISO 8601 timestamp when the process started, if known. */
  startedAt?: string;
  /** Additional metadata provided by backend. */
  meta?: Record<string, unknown>;
}

// PUBLIC_INTERFACE
/** User information describing an active or known user in the system. */
export interface UserInfo {
  /** Unique user identifier. */
  id: string;
  /** Username/login of the user. */
  username: string;
  /** Optional display name for UI. */
  displayName?: string;
  /** Roles assigned to the user for authorization. */
  roles: RoleType[];
  /** Optional permissions for fine-grained access. */
  permissions?: PermissionType[];
  /** Whether the user is currently active (e.g., logged-in or detected on a server). */
  active?: boolean;
  /** List of running processes for this user if requested. */
  processes?: ProcessInfo[];
  /** Additional metadata provided by backend. */
  meta?: Record<string, unknown>;
}

// PUBLIC_INTERFACE
/** Summary of a monitored service shown on the dashboard. */
export interface ServiceSummary {
  /** Unique identifier for the service. */
  id: string;
  /** Human-readable service name. */
  name: string;
  /** Current status of the service. */
  status: StatusType;
  /** Number of active users associated with this service. */
  activeUsers: number;
  /** Number of active processes associated with this service. */
  activeProcesses: number;
  /** ISO 8601 timestamp for the last heartbeat or update. */
  lastUpdatedAt?: string;
  /** Optional description of the service. */
  description?: string;
  /** Optional list of recent issues, warnings, or events. */
  issues?: string[];
  /** Additional metadata provided by backend. */
  meta?: Record<string, unknown>;
}

// PUBLIC_INTERFACE
/** Union of supported termination targets. */
export type TerminationTargetType = 'process' | 'user';

// PUBLIC_INTERFACE
/** Request payload to terminate a process or a user. */
export interface TerminateRequest {
  /** Target type to terminate: a process or a user. */
  targetType: TerminationTargetType;
  /** Identifier of the entity to terminate: pid for process, user id for user. */
  targetId: string | number;
  /** Optional reason to be recorded by backend auditing. */
  reason?: string;
  /** Service context if termination is scoped to a service. */
  serviceId?: string;
  /** Force termination if supported by backend. */
  force?: boolean;
  /** Requester context for auditing and authorization. */
  requestedBy?: {
    userId?: string;
    username?: string;
  };
}

// PUBLIC_INTERFACE
/** Response payload after attempting a termination action. */
export interface TerminateResponse {
  /** Whether the termination was accepted/successful. */
  success: boolean;
  /** Optional human-readable message or error description. */
  message?: string;
  /** Echo of target type. */
  targetType: TerminationTargetType;
  /** Echo of target id. */
  targetId: string | number;
  /** Optional backend-provided code for success or error categorization. */
  code?: string;
  /** Additional metadata or post-action state. */
  meta?: Record<string, unknown>;
}
