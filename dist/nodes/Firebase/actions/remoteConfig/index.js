"use strict";
/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplate = getTemplate;
exports.publishTemplate = publishTemplate;
exports.rollback = rollback;
exports.listVersions = listVersions;
exports.getConditions = getConditions;
exports.getParameters = getParameters;
exports.execute = execute;
const firebaseApi_1 = require("../../transport/firebaseApi");
const helpers_1 = require("../../utils/helpers");
/**
 * Get the current Remote Config template
 */
async function getTemplate(_index) {
    const response = await firebaseApi_1.remoteConfigRequest.call(this, 'GET');
    return [{ json: response }];
}
/**
 * Publish a new Remote Config template
 */
async function publishTemplate(index) {
    const parametersInput = this.getNodeParameter('parameters', index, '{}');
    const conditionsInput = this.getNodeParameter('conditions', index, '[]');
    const validateOnly = this.getNodeParameter('validateOnly', index, false);
    const parameters = (0, helpers_1.parseJson)(parametersInput);
    const conditions = JSON.parse(conditionsInput);
    // First, get the current template to get the etag
    const currentTemplate = await firebaseApi_1.remoteConfigRequest.call(this, 'GET');
    const etag = currentTemplate.etag;
    const body = {
        parameters,
        conditions,
    };
    const headers = {
        'If-Match': etag,
    };
    const query = {};
    if (validateOnly) {
        query.validateOnly = 'true';
    }
    const response = await firebaseApi_1.remoteConfigRequest.call(this, 'PUT', '', body, query, headers);
    return [
        {
            json: {
                ...response,
                validated: validateOnly,
            },
        },
    ];
}
/**
 * Rollback to a specific version
 */
async function rollback(index) {
    const versionNumber = this.getNodeParameter('versionNumber', index, '');
    const body = {
        versionNumber,
    };
    const response = await firebaseApi_1.remoteConfigRequest.call(this, 'POST', ':rollback', body);
    return [
        {
            json: {
                ...response,
                rolledBackTo: versionNumber,
            },
        },
    ];
}
/**
 * List template versions
 */
async function listVersions(index) {
    const pageSize = this.getNodeParameter('pageSize', index, 10);
    const pageToken = this.getNodeParameter('pageToken', index, '');
    const query = {
        pageSize,
    };
    if (pageToken) {
        query.pageToken = pageToken;
    }
    const response = await firebaseApi_1.remoteConfigRequest.call(this, 'GET', ':listVersions', undefined, query);
    return [
        {
            json: {
                versions: response.versions || [],
                nextPageToken: response.nextPageToken || null,
            },
        },
    ];
}
/**
 * Get conditions from template
 */
async function getConditions(_index) {
    const response = await firebaseApi_1.remoteConfigRequest.call(this, 'GET');
    return [
        {
            json: {
                conditions: response.conditions || [],
            },
        },
    ];
}
/**
 * Get parameters from template
 */
async function getParameters(_index) {
    const response = await firebaseApi_1.remoteConfigRequest.call(this, 'GET');
    return [
        {
            json: {
                parameters: response.parameters || {},
                parameterGroups: response.parameterGroups || {},
            },
        },
    ];
}
/**
 * Execute Remote Config operation
 */
async function execute(operation, index) {
    switch (operation) {
        case 'getTemplate':
            return getTemplate.call(this, index);
        case 'publishTemplate':
            return publishTemplate.call(this, index);
        case 'rollback':
            return rollback.call(this, index);
        case 'listVersions':
            return listVersions.call(this, index);
        case 'getConditions':
            return getConditions.call(this, index);
        case 'getParameters':
            return getParameters.call(this, index);
        default:
            throw new Error(`Unknown operation: ${operation}`);
    }
}
//# sourceMappingURL=index.js.map