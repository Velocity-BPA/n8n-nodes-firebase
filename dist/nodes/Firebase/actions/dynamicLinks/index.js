"use strict";
/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShortLink = createShortLink;
exports.getLinkStats = getLinkStats;
exports.execute = execute;
const firebaseApi_1 = require("../../transport/firebaseApi");
/**
 * Create a short dynamic link
 */
async function createShortLink(index) {
    const domainUriPrefix = this.getNodeParameter('domainUriPrefix', index, '');
    const link = this.getNodeParameter('link', index, '');
    const suffixOption = this.getNodeParameter('suffixOption', index, 'UNGUESSABLE');
    // Optional parameters
    const androidPackageName = this.getNodeParameter('androidPackageName', index, '');
    const androidFallbackLink = this.getNodeParameter('androidFallbackLink', index, '');
    const androidMinVersion = this.getNodeParameter('androidMinVersion', index, '');
    const iosBundleId = this.getNodeParameter('iosBundleId', index, '');
    const iosFallbackLink = this.getNodeParameter('iosFallbackLink', index, '');
    const iosAppStoreId = this.getNodeParameter('iosAppStoreId', index, '');
    const socialTitle = this.getNodeParameter('socialTitle', index, '');
    const socialDescription = this.getNodeParameter('socialDescription', index, '');
    const socialImageLink = this.getNodeParameter('socialImageLink', index, '');
    const utmSource = this.getNodeParameter('utmSource', index, '');
    const utmMedium = this.getNodeParameter('utmMedium', index, '');
    const utmCampaign = this.getNodeParameter('utmCampaign', index, '');
    // Build dynamic link info
    const dynamicLinkInfo = {
        domainUriPrefix,
        link,
    };
    // Android info
    if (androidPackageName || androidFallbackLink || androidMinVersion) {
        dynamicLinkInfo.androidInfo = {};
        if (androidPackageName)
            dynamicLinkInfo.androidInfo.androidPackageName = androidPackageName;
        if (androidFallbackLink)
            dynamicLinkInfo.androidInfo.androidFallbackLink = androidFallbackLink;
        if (androidMinVersion)
            dynamicLinkInfo.androidInfo.androidMinPackageVersionCode = androidMinVersion;
    }
    // iOS info
    if (iosBundleId || iosFallbackLink || iosAppStoreId) {
        dynamicLinkInfo.iosInfo = {};
        if (iosBundleId)
            dynamicLinkInfo.iosInfo.iosBundleId = iosBundleId;
        if (iosFallbackLink)
            dynamicLinkInfo.iosInfo.iosFallbackLink = iosFallbackLink;
        if (iosAppStoreId)
            dynamicLinkInfo.iosInfo.iosAppStoreId = iosAppStoreId;
    }
    // Social meta tags
    if (socialTitle || socialDescription || socialImageLink) {
        dynamicLinkInfo.socialMetaTagInfo = {};
        if (socialTitle)
            dynamicLinkInfo.socialMetaTagInfo.socialTitle = socialTitle;
        if (socialDescription)
            dynamicLinkInfo.socialMetaTagInfo.socialDescription = socialDescription;
        if (socialImageLink)
            dynamicLinkInfo.socialMetaTagInfo.socialImageLink = socialImageLink;
    }
    // Analytics info
    if (utmSource || utmMedium || utmCampaign) {
        dynamicLinkInfo.analyticsInfo = {
            googlePlayAnalytics: {},
        };
        if (utmSource)
            dynamicLinkInfo.analyticsInfo.googlePlayAnalytics.utmSource = utmSource;
        if (utmMedium)
            dynamicLinkInfo.analyticsInfo.googlePlayAnalytics.utmMedium = utmMedium;
        if (utmCampaign)
            dynamicLinkInfo.analyticsInfo.googlePlayAnalytics.utmCampaign = utmCampaign;
    }
    const body = {
        dynamicLinkInfo,
        suffix: {
            option: suffixOption,
        },
    };
    const response = await firebaseApi_1.dynamicLinksRequest.call(this, 'POST', '/shortLinks', body);
    return [{ json: response }];
}
/**
 * Get link statistics
 */
async function getLinkStats(index) {
    const shortLink = this.getNodeParameter('shortLink', index, '');
    const durationDays = this.getNodeParameter('durationDays', index, 7);
    // Encode the short link for the URL
    const encodedLink = encodeURIComponent(shortLink);
    const query = {
        durationDays: durationDays.toString(),
    };
    const response = await firebaseApi_1.dynamicLinksRequest.call(this, 'GET', `/${encodedLink}/linkStats`, undefined, query);
    return [
        {
            json: {
                shortLink,
                durationDays,
                ...response,
            },
        },
    ];
}
/**
 * Execute Dynamic Links operation
 */
async function execute(operation, index) {
    switch (operation) {
        case 'createShortLink':
            return createShortLink.call(this, index);
        case 'getLinkStats':
            return getLinkStats.call(this, index);
        default:
            throw new Error(`Unknown operation: ${operation}`);
    }
}
//# sourceMappingURL=index.js.map