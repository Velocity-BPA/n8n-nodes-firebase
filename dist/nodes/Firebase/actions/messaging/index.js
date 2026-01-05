"use strict";
/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = sendMessage;
exports.sendMulticast = sendMulticast;
exports.sendToTopic = sendToTopic;
exports.sendToCondition = sendToCondition;
exports.subscribeToTopic = subscribeToTopic;
exports.unsubscribeFromTopic = unsubscribeFromTopic;
exports.execute = execute;
const firebaseApi_1 = require("../../transport/firebaseApi");
const helpers_1 = require("../../utils/helpers");
/**
 * Build notification payload
 */
function buildNotification(title, body, image) {
    if (!title && !body && !image) {
        return undefined;
    }
    const notification = {};
    if (title)
        notification.title = title;
    if (body)
        notification.body = body;
    if (image)
        notification.image = image;
    return notification;
}
/**
 * Build message payload
 */
function buildMessage(target, notification, data, android, apns, webpush) {
    const message = {
        ...target,
    };
    if (notification) {
        message.notification = notification;
    }
    if (data && Object.keys(data).length > 0) {
        // FCM data must be string key-value pairs
        const stringData = {};
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
async function sendMessage(index) {
    const token = this.getNodeParameter('token', index, '');
    const title = this.getNodeParameter('notificationTitle', index, '');
    const body = this.getNodeParameter('notificationBody', index, '');
    const image = this.getNodeParameter('notificationImage', index, '');
    const dataInput = this.getNodeParameter('data', index, '{}');
    const androidConfigInput = this.getNodeParameter('androidConfig', index, '{}');
    const apnsConfigInput = this.getNodeParameter('apnsConfig', index, '{}');
    const webpushConfigInput = this.getNodeParameter('webpushConfig', index, '{}');
    const notification = buildNotification(title, body, image);
    const data = (0, helpers_1.parseJson)(dataInput);
    const androidConfig = (0, helpers_1.parseJson)(androidConfigInput);
    const apnsConfig = (0, helpers_1.parseJson)(apnsConfigInput);
    const webpushConfig = (0, helpers_1.parseJson)(webpushConfigInput);
    const message = buildMessage({ token }, notification, data, androidConfig, apnsConfig, webpushConfig);
    const response = await firebaseApi_1.messagingRequest.call(this, { message });
    return [{ json: response }];
}
/**
 * Send message to multiple devices
 */
async function sendMulticast(index) {
    const tokensInput = this.getNodeParameter('tokens', index, '');
    const title = this.getNodeParameter('notificationTitle', index, '');
    const body = this.getNodeParameter('notificationBody', index, '');
    const image = this.getNodeParameter('notificationImage', index, '');
    const dataInput = this.getNodeParameter('data', index, '{}');
    const tokens = tokensInput.split(',').map((t) => t.trim()).filter(Boolean);
    const notification = buildNotification(title, body, image);
    const data = (0, helpers_1.parseJson)(dataInput);
    // FCM v1 doesn't have native multicast, so we send individual messages
    const results = [];
    const errors = [];
    for (const token of tokens) {
        try {
            const message = buildMessage({ token }, notification, data);
            const response = await firebaseApi_1.messagingRequest.call(this, { message });
            results.push({ token, success: true, messageId: response.name });
        }
        catch (error) {
            errors.push({
                token,
                success: false,
                error: error.message,
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
async function sendToTopic(index) {
    const topic = this.getNodeParameter('topic', index, '');
    const title = this.getNodeParameter('notificationTitle', index, '');
    const body = this.getNodeParameter('notificationBody', index, '');
    const image = this.getNodeParameter('notificationImage', index, '');
    const dataInput = this.getNodeParameter('data', index, '{}');
    const notification = buildNotification(title, body, image);
    const data = (0, helpers_1.parseJson)(dataInput);
    const message = buildMessage({ topic }, notification, data);
    const response = await firebaseApi_1.messagingRequest.call(this, { message });
    return [{ json: { ...response, topic } }];
}
/**
 * Send message to a condition
 */
async function sendToCondition(index) {
    const condition = this.getNodeParameter('condition', index, '');
    const title = this.getNodeParameter('notificationTitle', index, '');
    const body = this.getNodeParameter('notificationBody', index, '');
    const image = this.getNodeParameter('notificationImage', index, '');
    const dataInput = this.getNodeParameter('data', index, '{}');
    const notification = buildNotification(title, body, image);
    const data = (0, helpers_1.parseJson)(dataInput);
    const message = buildMessage({ condition }, notification, data);
    const response = await firebaseApi_1.messagingRequest.call(this, { message });
    return [{ json: { ...response, condition } }];
}
/**
 * Subscribe tokens to a topic
 */
async function subscribeToTopic(index) {
    const topic = this.getNodeParameter('topic', index, '');
    const tokensInput = this.getNodeParameter('tokens', index, '');
    const tokens = tokensInput.split(',').map((t) => t.trim()).filter(Boolean);
    const response = await firebaseApi_1.topicManagementRequest.call(this, ':batchAdd', topic, tokens);
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
async function unsubscribeFromTopic(index) {
    const topic = this.getNodeParameter('topic', index, '');
    const tokensInput = this.getNodeParameter('tokens', index, '');
    const tokens = tokensInput.split(',').map((t) => t.trim()).filter(Boolean);
    const response = await firebaseApi_1.topicManagementRequest.call(this, ':batchRemove', topic, tokens);
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
async function execute(operation, index) {
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
//# sourceMappingURL=index.js.map