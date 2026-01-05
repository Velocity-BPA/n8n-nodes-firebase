import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
/**
 * Send message to a single device
 */
export declare function sendMessage(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Send message to multiple devices
 */
export declare function sendMulticast(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Send message to a topic
 */
export declare function sendToTopic(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Send message to a condition
 */
export declare function sendToCondition(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Subscribe tokens to a topic
 */
export declare function subscribeToTopic(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Unsubscribe tokens from a topic
 */
export declare function unsubscribeFromTopic(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Execute Messaging operation
 */
export declare function execute(this: IExecuteFunctions, operation: string, index: number): Promise<INodeExecutionData[]>;
//# sourceMappingURL=index.d.ts.map