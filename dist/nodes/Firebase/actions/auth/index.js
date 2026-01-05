"use strict";
/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.getUser = getUser;
exports.getUserByEmail = getUserByEmail;
exports.listUsers = listUsers;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.generatePasswordResetLink = generatePasswordResetLink;
exports.generateEmailVerificationLink = generateEmailVerificationLink;
exports.setCustomClaims = setCustomClaims;
exports.revokeRefreshTokens = revokeRefreshTokens;
exports.execute = execute;
const firebaseApi_1 = require("../../transport/firebaseApi");
const helpers_1 = require("../../utils/helpers");
/**
 * Format user response
 */
function formatUserResponse(user) {
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
async function createUser(index) {
    const email = this.getNodeParameter('email', index, '');
    const password = this.getNodeParameter('password', index, '');
    const displayName = this.getNodeParameter('displayName', index, '');
    const phoneNumber = this.getNodeParameter('phoneNumber', index, '');
    const photoUrl = this.getNodeParameter('photoUrl', index, '');
    const disabled = this.getNodeParameter('disabled', index, false);
    const emailVerified = this.getNodeParameter('emailVerified', index, false);
    if (email && !(0, helpers_1.isValidEmail)(email)) {
        throw new Error('Invalid email format');
    }
    if (phoneNumber && !(0, helpers_1.isValidPhoneNumber)(phoneNumber)) {
        throw new Error('Invalid phone number format. Use E.164 format (e.g., +1234567890)');
    }
    const body = {};
    if (email)
        body.email = email;
    if (password)
        body.password = password;
    if (displayName)
        body.displayName = displayName;
    if (phoneNumber)
        body.phoneNumber = phoneNumber;
    if (photoUrl)
        body.photoUrl = photoUrl;
    if (disabled)
        body.disabled = disabled;
    if (emailVerified)
        body.emailVerified = emailVerified;
    const response = await firebaseApi_1.authRequest.call(this, 'POST', '/accounts', body);
    return [{ json: formatUserResponse(response) }];
}
/**
 * Get user by UID
 */
async function getUser(index) {
    const uid = this.getNodeParameter('uid', index, '');
    const body = {
        localId: [uid],
    };
    const response = await firebaseApi_1.authRequest.call(this, 'POST', '/accounts:lookup', body);
    const users = response.users || [];
    if (users.length === 0) {
        throw new Error(`User not found: ${uid}`);
    }
    return [{ json: formatUserResponse(users[0]) }];
}
/**
 * Get user by email
 */
async function getUserByEmail(index) {
    const email = this.getNodeParameter('email', index, '');
    if (!(0, helpers_1.isValidEmail)(email)) {
        throw new Error('Invalid email format');
    }
    const body = {
        email: [email],
    };
    const response = await firebaseApi_1.authRequest.call(this, 'POST', '/accounts:lookup', body);
    const users = response.users || [];
    if (users.length === 0) {
        throw new Error(`User not found with email: ${email}`);
    }
    return [{ json: formatUserResponse(users[0]) }];
}
/**
 * List all users
 */
async function listUsers(index) {
    const maxResults = this.getNodeParameter('maxResults', index, 100);
    const pageToken = this.getNodeParameter('pageToken', index, '');
    const query = {
        maxResults,
    };
    if (pageToken) {
        query.nextPageToken = pageToken;
    }
    const response = await firebaseApi_1.authRequest.call(this, 'GET', '/accounts:batchGet', undefined, query);
    const users = (response.users || []).map(formatUserResponse);
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
async function updateUser(index) {
    const uid = this.getNodeParameter('uid', index, '');
    const email = this.getNodeParameter('email', index, '');
    const password = this.getNodeParameter('password', index, '');
    const displayName = this.getNodeParameter('displayName', index, '');
    const phoneNumber = this.getNodeParameter('phoneNumber', index, '');
    const photoUrl = this.getNodeParameter('photoUrl', index, '');
    const disabled = this.getNodeParameter('disabled', index, undefined);
    const emailVerified = this.getNodeParameter('emailVerified', index, undefined);
    if (email && !(0, helpers_1.isValidEmail)(email)) {
        throw new Error('Invalid email format');
    }
    if (phoneNumber && !(0, helpers_1.isValidPhoneNumber)(phoneNumber)) {
        throw new Error('Invalid phone number format. Use E.164 format (e.g., +1234567890)');
    }
    const body = {
        localId: uid,
    };
    if (email)
        body.email = email;
    if (password)
        body.password = password;
    if (displayName)
        body.displayName = displayName;
    if (phoneNumber)
        body.phoneNumber = phoneNumber;
    if (photoUrl)
        body.photoUrl = photoUrl;
    if (disabled !== undefined)
        body.disableUser = disabled;
    if (emailVerified !== undefined)
        body.emailVerified = emailVerified;
    const response = await firebaseApi_1.authRequest.call(this, 'POST', '/accounts:update', body);
    return [{ json: formatUserResponse(response) }];
}
/**
 * Delete user
 */
async function deleteUser(index) {
    const uid = this.getNodeParameter('uid', index, '');
    const body = {
        localId: uid,
    };
    await firebaseApi_1.authRequest.call(this, 'POST', '/accounts:delete', body);
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
async function generatePasswordResetLink(index) {
    const email = this.getNodeParameter('email', index, '');
    if (!(0, helpers_1.isValidEmail)(email)) {
        throw new Error('Invalid email format');
    }
    const body = {
        requestType: 'PASSWORD_RESET',
        email,
        returnOobLink: true,
    };
    const response = await firebaseApi_1.authRequest.call(this, 'POST', '/accounts:sendOobCode', body);
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
async function generateEmailVerificationLink(index) {
    const email = this.getNodeParameter('email', index, '');
    if (!(0, helpers_1.isValidEmail)(email)) {
        throw new Error('Invalid email format');
    }
    const body = {
        requestType: 'VERIFY_EMAIL',
        email,
        returnOobLink: true,
    };
    const response = await firebaseApi_1.authRequest.call(this, 'POST', '/accounts:sendOobCode', body);
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
async function setCustomClaims(index) {
    const uid = this.getNodeParameter('uid', index, '');
    const claimsInput = this.getNodeParameter('customClaims', index, '{}');
    const claims = (0, helpers_1.parseJson)(claimsInput);
    const body = {
        localId: uid,
        customAttributes: JSON.stringify(claims),
    };
    await firebaseApi_1.authRequest.call(this, 'POST', '/accounts:update', body);
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
async function revokeRefreshTokens(index) {
    const uid = this.getNodeParameter('uid', index, '');
    const body = {
        localId: uid,
        validSince: Math.floor(Date.now() / 1000).toString(),
    };
    await firebaseApi_1.authRequest.call(this, 'POST', '/accounts:update', body);
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
async function execute(operation, index) {
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
//# sourceMappingURL=index.js.map