/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { messagingRequest, topicManagementRequest } from '../../transport/firebaseApi';
import { parseJson } from '../../utils/helpers';

/**
 * Build notification payload
 */
function buildNotification(
  title?: string,
  body?: string,
  image?: string,
): IDataObject | undefined {
  if (!title && !body && !image) {
    return undefined;
  }

  const notification: IDataObject = {};
  if (title) notification.title = title;
  if (body) notification.body = body;
  if (image) notification.image = image;

  return notification;
}

/**
 * Build message payload
 */
function buildMessage(
  target: IDataObject,
  notification?: IDataObject,
  data?: IDataObject,
  android?: IDataObject,
  apns?: IDataObject,
  webpush?: IDataObject,
): IDataObject {
  const message: IDataObject = {
    ...target,
  };

  if (notification) {
    message.notification = notification;
  }

  if (data && Object.keys(data).length > 0) {
    // FCM data must be string key-value pairs
    const stringData: IDataObject = {};
    for (const [key, value] of Object.entries(data)) {
      stringData[key] = String(value);
    }
    message.data = stringData;
  }

  if (android && Object.keys(android).length > 0) {
    message.android = android;
  }

  if (apns && Object.keys(apns).length > 0) {
    message.apns = apns;
  }

  if (webpush && Object.keys(webpush).length > 0) {
    message.webpush = webpush;
  }

  return message;
}

/**
 * Send message to a single device
 */
export async function sendMessage(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const token = this.getNodeParameter('token', index, '') as string;
  const title = this.getNodeParameter('notificationTitle', index, '') as string;
  const body = this.getNodeParameter('notificationBody', index, '') as string;
  const image = this.getNodeParameter('notificationImage', index, '') as string;
  const dataInput = this.getNodeParameter('data', index, '{}') as string;
  const androidConfigInput = this.getNodeParameter('androidConfig', index, '{}') as string;
  const apnsConfigInput = this.getNodeParameter('apnsConfig', index, '{}') as string;
  const webpushConfigInput = this.getNodeParameter('webpushConfig', index, '{}') as string;

  const notification = buildNotification(title, body, image);
  const data = parseJson(dataInput);
  const androidConfig = parseJson(androidConfigInput);
  const apnsConfig = parseJson(apnsConfigInput);
  const webpushConfig = parseJson(webpushConfigInput);

  const message = buildMessage(
    { token },
    notification,
    data,
    androidConfig,
    apnsConfig,
    webpushConfig,
  );

  const response = await messagingRequest.call(this, { message });

  return [{ json: response }];
}

/**
 * Send message to multiple devices
 */
export async function sendMulticast(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const tokensInput = this.getNodeParameter('tokens', index, '') as string;
  const title = this.getNodeParameter('notificationTitle', index, '') as string;
  const body = this.getNodeParameter('notificationBody', index, '') as string;
  const image = this.getNodeParameter('notificationImage', index, '') as string;
  const dataInput = this.getNodeParameter('data', index, '{}') as string;

  const tokens = tokensInput.split(',').map((t) => t.trim()).filter(Boolean);
  const notification = buildNotification(title, body, image);
  const data = parseJson(dataInput);

  // FCM v1 doesn't have native multicast, so we send individual messages
  const results: IDataObject[] = [];
  const errors: IDataObject[] = [];

  for (const token of tokens) {
    try {
      const message = buildMessage({ token }, notification, data);
      const response = await messagingRequest.call(this, { message });
      results.push({ token, success: true, messageId: response.name });
    } catch (error) {
      errors.push({
        token,
        success: false,
        error: (error as Error).message,
      });
    }
  }

  return [
    {
      json: {
        successCount: results.length,
        failureCount: errors.length,
        responses: [...results, ...errors],
      },
    },
  ];
}

/**
 * Send message to a topic
 */
export async function sendToTopic(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const topic = this.getNodeParameter('topic', index, '') as string;
  const title = this.getNodeParameter('notificationTitle', index, '') as string;
  const body = this.getNodeParameter('notificationBody', index, '') as string;
  const image = this.getNodeParameter('notificationImage', index, '') as string;
  const dataInput = this.getNodeParameter('data', index, '{}') as string;

  const notification = buildNotification(title, body, image);
  const data = parseJson(dataInput);

  const message = buildMessage({ topic }, notification, data);

  const response = await messagingRequest.call(this, { message });

  return [{ json: { ...response, topic } }];
}

/**
 * Send message to a condition
 */
export async function sendToCondition(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const condition = this.getNodeParameter('condition', index, '') as string;
  const title = this.getNodeParameter('notificationTitle', index, '') as string;
  const body = this.getNodeParameter('notificationBody', index, '') as string;
  const image = this.getNodeParameter('notificationImage', index, '') as string;
  const dataInput = this.getNodeParameter('data', index, '{}') as string;

  const notification = buildNotification(title, body, image);
  const data = parseJson(dataInput);

  const message = buildMessage({ condition }, notification, data);

  const response = await messagingRequest.call(this, { message });

  return [{ json: { ...response, condition } }];
}

/**
 * Subscribe tokens to a topic
 */
export async function subscribeToTopic(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const topic = this.getNodeParameter('topic', index, '') as string;
  const tokensInput = this.getNodeParameter('tokens', index, '') as string;

  const tokens = tokensInput.split(',').map((t) => t.trim()).filter(Boolean);

  const response = await topicManagementRequest.call(
    this,
    ':batchAdd',
    topic,
    tokens,
  );

  return [
    {
      json: {
        topic,
        subscribedTokens: tokens.length,
        results: response.results || [],
      },
    },
  ];
}

/**
 * Unsubscribe tokens from a topic
 */
export async function unsubscribeFromTopic(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const topic = this.getNodeParameter('topic', index, '') as string;
  const tokensInput = this.getNodeParameter('tokens', index, '') as string;

  const tokens = tokensInput.split(',').map((t) => t.trim()).filter(Boolean);

  const response = await topicManagementRequest.call(
    this,
    ':batchRemove',
    topic,
    tokens,
  );

  return [
    {
      json: {
        topic,
        unsubscribedTokens: tokens.length,
        results: response.results || [],
      },
    },
  ];
}

/**
 * Execute Messaging operation
 */
export async function execute(
  this: IExecuteFunctions,
  operation: string,
  index: number,
): Promise<INodeExecutionData[]> {
  switch (operation) {
    case 'sendMessage':
      return sendMessage.call(this, index);
    case 'sendMulticast':
      return sendMulticast.call(this, index);
    case 'sendToTopic':
      return sendToTopic.call(this, index);
    case 'sendToCondition':
      return sendToCondition.call(this, index);
    case 'subscribeToTopic':
      return subscribeToTopic.call(this, index);
    case 'unsubscribeFromTopic':
      return unsubscribeFromTopic.call(this, index);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}
