import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
/**
 * Create a short dynamic link
 */
export declare function createShortLink(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Get link statistics
 */
export declare function getLinkStats(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Execute Dynamic Links operation
 */
export declare function execute(this: IExecuteFunctions, operation: string, index: number): Promise<INodeExecutionData[]>;
//# sourceMappingURL=index.d.ts.map