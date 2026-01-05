/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { authRequest } from '../../transport/firebaseApi';
import { isValidEmail, isValidPhoneNumber, parseJson } from '../../utils/helpers';
import type { IFirebaseUser } from '../../types/FirebaseTypes';

/**
 * Format user response
 */
function formatUserResponse(user: IFirebaseUser): IDataObject {
  return {
    uid: user.localId,
    email: user.email || null,
    emailVerified: user.emailVerified || false,
    displayName: user.displayName || null,
    photoUrl: user.photoUrl || null,
    phoneNumber: user.phoneNumber || null,
    disabled: user.disabled || false,
    createdAt: user.createdAt ? new Date(parseInt(user.createdAt, 10)).toISOString() : null,
    lastLoginAt: user.lastLoginAt ? new Date(parseInt(user.lastLoginAt, 10)).toISOString() : null,
    customClaims: user.customAttributes ? JSON.parse(user.customAttributes) : null,
    providerData: user.providerUserInfo || [],
  };
}

/**
 * Create a new user
 */
export async function createUser(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const email = this.getNodeParameter('email', index, '') as string;
  const password = this.getNodeParameter('password', index, '') as string;
  const displayName = this.getNodeParameter('displayName', index, '') as string;
  const phoneNumber = this.getNodeParameter('phoneNumber', index, '') as string;
  const photoUrl = this.getNodeParameter('photoUrl', index, '') as string;
  const disabled = this.getNodeParameter('disabled', index, false) as boolean;
  const emailVerified = this.getNodeParameter('emailVerified', index, false) as boolean;

  if (email && !isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
    throw new Error('Invalid phone number format. Use E.164 format (e.g., +1234567890)');
  }

  const body: IDataObject = {};

  if (email) body.email = email;
  if (password) body.password = password;
  if (displayName) body.displayName = displayName;
  if (phoneNumber) body.phoneNumber = phoneNumber;
  if (photoUrl) body.photoUrl = photoUrl;
  if (disabled) body.disabled = disabled;
  if (emailVerified) body.emailVerified = emailVerified;

  const response = await authRequest.call(this, 'POST', '/accounts', body);

  return [{ json: formatUserResponse(response as unknown as IFirebaseUser) }];
}

/**
 * Get user by UID
 */
export async function getUser(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const uid = this.getNodeParameter('uid', index, '') as string;

  const body: IDataObject = {
    localId: [uid],
  };

  const response = await authRequest.call(this, 'POST', '/accounts:lookup', body);

  const users = (response.users as IFirebaseUser[]) || [];
  if (users.length === 0) {
    throw new Error(`User not found: ${uid}`);
  }

  return [{ json: formatUserResponse(users[0]) }];
}

/**
 * Get user by email
 */
export async function getUserByEmail(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const email = this.getNodeParameter('email', index, '') as string;

  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  const body: IDataObject = {
    email: [email],
  };

  const response = await authRequest.call(this, 'POST', '/accounts:lookup', body);

  const users = (response.users as IFirebaseUser[]) || [];
  if (users.length === 0) {
    throw new Error(`User not found with email: ${email}`);
  }

  return [{ json: formatUserResponse(users[0]) }];
}

/**
 * List all users
 */
export async function listUsers(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const maxResults = this.getNodeParameter('maxResults', index, 100) as number;
  const pageToken = this.getNodeParameter('pageToken', index, '') as string;

  const query: IDataObject = {
    maxResults,
  };

  if (pageToken) {
    query.nextPageToken = pageToken;
  }

  const response = await authRequest.call(this, 'GET', '/accounts:batchGet', undefined, query);

  const users = ((response.users as IFirebaseUser[]) || []).map(formatUserResponse);

  return [
    {
      json: {
        users,
        nextPageToken: response.nextPageToken || null,
      },
    },
  ];
}

/**
 * Update user
 */
export async function updateUser(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const uid = this.getNodeParameter('uid', index, '') as string;
  const email = this.getNodeParameter('email', index, '') as string;
  const password = this.getNodeParameter('password', index, '') as string;
  const displayName = this.getNodeParameter('displayName', index, '') as string;
  const phoneNumber = this.getNodeParameter('phoneNumber', index, '') as string;
  const photoUrl = this.getNodeParameter('photoUrl', index, '') as string;
  const disabled = this.getNodeParameter('disabled', index, undefined) as boolean | undefined;
  const emailVerified = this.getNodeParameter('emailVerified', index, undefined) as boolean | undefined;

  if (email && !isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
    throw new Error('Invalid phone number format. Use E.164 format (e.g., +1234567890)');
  }

  const body: IDataObject = {
    localId: uid,
  };

  if (email) body.email = email;
  if (password) body.password = password;
  if (displayName) body.displayName = displayName;
  if (phoneNumber) body.phoneNumber = phoneNumber;
  if (photoUrl) body.photoUrl = photoUrl;
  if (disabled !== undefined) body.disableUser = disabled;
  if (emailVerified !== undefined) body.emailVerified = emailVerified;

  const response = await authRequest.call(this, 'POST', '/accounts:update', body);

  return [{ json: formatUserResponse(response as unknown as IFirebaseUser) }];
}

/**
 * Delete user
 */
export async function deleteUser(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const uid = this.getNodeParameter('uid', index, '') as string;

  const body: IDataObject = {
    localId: uid,
  };

  await authRequest.call(this, 'POST', '/accounts:delete', body);

  return [
    {
      json: {
        success: true,
        uid,
        operation: 'delete',
      },
    },
  ];
}

/**
 * Generate password reset link
 */
export async function generatePasswordResetLink(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const email = this.getNodeParameter('email', index, '') as string;

  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  const body: IDataObject = {
    requestType: 'PASSWORD_RESET',
    email,
    returnOobLink: true,
  };

  const response = await authRequest.call(this, 'POST', '/accounts:sendOobCode', body);

  return [
    {
      json: {
        email,
        link: response.oobLink,
      },
    },
  ];
}

/**
 * Generate email verification link
 */
export async function generateEmailVerificationLink(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const email = this.getNodeParameter('email', index, '') as string;

  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  const body: IDataObject = {
    requestType: 'VERIFY_EMAIL',
    email,
    returnOobLink: true,
  };

  const response = await authRequest.call(this, 'POST', '/accounts:sendOobCode', body);

  return [
    {
      json: {
        email,
        link: response.oobLink,
      },
    },
  ];
}

/**
 * Set custom claims for user
 */
export async function setCustomClaims(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const uid = this.getNodeParameter('uid', index, '') as string;
  const claimsInput = this.getNodeParameter('customClaims', index, '{}') as string;

  const claims = parseJson(claimsInput);

  const body: IDataObject = {
    localId: uid,
    customAttributes: JSON.stringify(claims),
  };

  await authRequest.call(this, 'POST', '/accounts:update', body);

  return [
    {
      json: {
        success: true,
        uid,
        customClaims: claims,
      },
    },
  ];
}

/**
 * Revoke refresh tokens for user
 */
export async function revokeRefreshTokens(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const uid = this.getNodeParameter('uid', index, '') as string;

  const body: IDataObject = {
    localId: uid,
    validSince: Math.floor(Date.now() / 1000).toString(),
  };

  await authRequest.call(this, 'POST', '/accounts:update', body);

  return [
    {
      json: {
        success: true,
        uid,
        operation: 'revokeRefreshTokens',
        revokedAt: new Date().toISOString(),
      },
    },
  ];
}

/**
 * Execute Authentication operation
 */
export async function execute(
  this: IExecuteFunctions,
  operation: string,
  index: number,
): Promise<INodeExecutionData[]> {
  switch (operation) {
    case 'createUser':
      return createUser.call(this, index);
    case 'getUser':
      return getUser.call(this, index);
    case 'getUserByEmail':
      return getUserByEmail.call(this, index);
    case 'listUsers':
      return listUsers.call(this, index);
    case 'updateUser':
      return updateUser.call(this, index);
    case 'deleteUser':
      return deleteUser.call(this, index);
    case 'generatePasswordResetLink':
      return generatePasswordResetLink.call(this, index);
    case 'generateEmailVerificationLink':
      return generateEmailVerificationLink.call(this, index);
    case 'setCustomClaims':
      return setCustomClaims.call(this, index);
    case 'revokeRefreshTokens':
      return revokeRefreshTokens.call(this, index);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}
