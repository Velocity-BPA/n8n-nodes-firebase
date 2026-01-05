import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
/**
 * Create a new user
 */
export declare function createUser(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Get user by UID
 */
export declare function getUser(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Get user by email
 */
export declare function getUserByEmail(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * List all users
 */
export declare function listUsers(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Update user
 */
export declare function updateUser(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Delete user
 */
export declare function deleteUser(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Generate password reset link
 */
export declare function generatePasswordResetLink(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Generate email verification link
 */
export declare function generateEmailVerificationLink(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Set custom claims for user
 */
export declare function setCustomClaims(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Revoke refresh tokens for user
 */
export declare function revokeRefreshTokens(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Execute Authentication operation
 */
export declare function execute(this: IExecuteFunctions, operation: string, index: number): Promise<INodeExecutionData[]>;
//# sourceMappingURL=index.d.ts.map