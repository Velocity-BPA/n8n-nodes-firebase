import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
/**
 * Get the current Remote Config template
 */
export declare function getTemplate(this: IExecuteFunctions, _index: number): Promise<INodeExecutionData[]>;
/**
 * Publish a new Remote Config template
 */
export declare function publishTemplate(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Rollback to a specific version
 */
export declare function rollback(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * List template versions
 */
export declare function listVersions(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Get conditions from template
 */
export declare function getConditions(this: IExecuteFunctions, _index: number): Promise<INodeExecutionData[]>;
/**
 * Get parameters from template
 */
export declare function getParameters(this: IExecuteFunctions, _index: number): Promise<INodeExecutionData[]>;
/**
 * Execute Remote Config operation
 */
export declare function execute(this: IExecuteFunctions, operation: string, index: number): Promise<INodeExecutionData[]>;
//# sourceMappingURL=index.d.ts.map