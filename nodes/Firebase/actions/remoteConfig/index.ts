/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { remoteConfigRequest } from '../../transport/firebaseApi';
import { parseJson } from '../../utils/helpers';

/**
 * Get the current Remote Config template
 */
export async function getTemplate(
  this: IExecuteFunctions,
  _index: number,
): Promise<INodeExecutionData[]> {
  const response = await remoteConfigRequest.call(this, 'GET');

  return [{ json: response }];
}

/**
 * Publish a new Remote Config template
 */
export async function publishTemplate(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const parametersInput = this.getNodeParameter('parameters', index, '{}') as string;
  const conditionsInput = this.getNodeParameter('conditions', index, '[]') as string;
  const validateOnly = this.getNodeParameter('validateOnly', index, false) as boolean;

  const parameters = parseJson(parametersInput);
  const conditions = JSON.parse(conditionsInput);

  // First, get the current template to get the etag
  const currentTemplate = await remoteConfigRequest.call(this, 'GET');
  const etag = currentTemplate.etag as string;

  const body: IDataObject = {
    parameters,
    conditions,
  };

  const headers: IDataObject = {
    'If-Match': etag,
  };

  const query: IDataObject = {};
  if (validateOnly) {
    query.validateOnly = 'true';
  }

  const response = await remoteConfigRequest.call(this, 'PUT', '', body, query, headers);

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
export async function rollback(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const versionNumber = this.getNodeParameter('versionNumber', index, '') as string;

  const body: IDataObject = {
    versionNumber,
  };

  const response = await remoteConfigRequest.call(this, 'POST', ':rollback', body);

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
export async function listVersions(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const pageSize = this.getNodeParameter('pageSize', index, 10) as number;
  const pageToken = this.getNodeParameter('pageToken', index, '') as string;

  const query: IDataObject = {
    pageSize,
  };

  if (pageToken) {
    query.pageToken = pageToken;
  }

  const response = await remoteConfigRequest.call(this, 'GET', ':listVersions', undefined, query);

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
export async function getConditions(
  this: IExecuteFunctions,
  _index: number,
): Promise<INodeExecutionData[]> {
  const response = await remoteConfigRequest.call(this, 'GET');

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
export async function getParameters(
  this: IExecuteFunctions,
  _index: number,
): Promise<INodeExecutionData[]> {
  const response = await remoteConfigRequest.call(this, 'GET');

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
export async function execute(
  this: IExecuteFunctions,
  operation: string,
  index: number,
): Promise<INodeExecutionData[]> {
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
