/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { dynamicLinksRequest } from '../../transport/firebaseApi';

/**
 * Create a short dynamic link
 */
export async function createShortLink(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const domainUriPrefix = this.getNodeParameter('domainUriPrefix', index, '') as string;
  const link = this.getNodeParameter('link', index, '') as string;
  const suffixOption = this.getNodeParameter('suffixOption', index, 'UNGUESSABLE') as string;

  // Optional parameters
  const androidPackageName = this.getNodeParameter('androidPackageName', index, '') as string;
  const androidFallbackLink = this.getNodeParameter('androidFallbackLink', index, '') as string;
  const androidMinVersion = this.getNodeParameter('androidMinVersion', index, '') as string;

  const iosBundleId = this.getNodeParameter('iosBundleId', index, '') as string;
  const iosFallbackLink = this.getNodeParameter('iosFallbackLink', index, '') as string;
  const iosAppStoreId = this.getNodeParameter('iosAppStoreId', index, '') as string;

  const socialTitle = this.getNodeParameter('socialTitle', index, '') as string;
  const socialDescription = this.getNodeParameter('socialDescription', index, '') as string;
  const socialImageLink = this.getNodeParameter('socialImageLink', index, '') as string;

  const utmSource = this.getNodeParameter('utmSource', index, '') as string;
  const utmMedium = this.getNodeParameter('utmMedium', index, '') as string;
  const utmCampaign = this.getNodeParameter('utmCampaign', index, '') as string;

  // Build dynamic link info
  const dynamicLinkInfo: IDataObject = {
    domainUriPrefix,
    link,
  };

  // Android info
  if (androidPackageName || androidFallbackLink || androidMinVersion) {
    dynamicLinkInfo.androidInfo = {};
    if (androidPackageName) (dynamicLinkInfo.androidInfo as IDataObject).androidPackageName = androidPackageName;
    if (androidFallbackLink) (dynamicLinkInfo.androidInfo as IDataObject).androidFallbackLink = androidFallbackLink;
    if (androidMinVersion) (dynamicLinkInfo.androidInfo as IDataObject).androidMinPackageVersionCode = androidMinVersion;
  }

  // iOS info
  if (iosBundleId || iosFallbackLink || iosAppStoreId) {
    dynamicLinkInfo.iosInfo = {};
    if (iosBundleId) (dynamicLinkInfo.iosInfo as IDataObject).iosBundleId = iosBundleId;
    if (iosFallbackLink) (dynamicLinkInfo.iosInfo as IDataObject).iosFallbackLink = iosFallbackLink;
    if (iosAppStoreId) (dynamicLinkInfo.iosInfo as IDataObject).iosAppStoreId = iosAppStoreId;
  }

  // Social meta tags
  if (socialTitle || socialDescription || socialImageLink) {
    dynamicLinkInfo.socialMetaTagInfo = {};
    if (socialTitle) (dynamicLinkInfo.socialMetaTagInfo as IDataObject).socialTitle = socialTitle;
    if (socialDescription) (dynamicLinkInfo.socialMetaTagInfo as IDataObject).socialDescription = socialDescription;
    if (socialImageLink) (dynamicLinkInfo.socialMetaTagInfo as IDataObject).socialImageLink = socialImageLink;
  }

  // Analytics info
  if (utmSource || utmMedium || utmCampaign) {
    dynamicLinkInfo.analyticsInfo = {
      googlePlayAnalytics: {},
    };
    if (utmSource) ((dynamicLinkInfo.analyticsInfo as IDataObject).googlePlayAnalytics as IDataObject).utmSource = utmSource;
    if (utmMedium) ((dynamicLinkInfo.analyticsInfo as IDataObject).googlePlayAnalytics as IDataObject).utmMedium = utmMedium;
    if (utmCampaign) ((dynamicLinkInfo.analyticsInfo as IDataObject).googlePlayAnalytics as IDataObject).utmCampaign = utmCampaign;
  }

  const body: IDataObject = {
    dynamicLinkInfo,
    suffix: {
      option: suffixOption,
    },
  };

  const response = await dynamicLinksRequest.call(this, 'POST', '/shortLinks', body);

  return [{ json: response }];
}

/**
 * Get link statistics
 */
export async function getLinkStats(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const shortLink = this.getNodeParameter('shortLink', index, '') as string;
  const durationDays = this.getNodeParameter('durationDays', index, 7) as number;

  // Encode the short link for the URL
  const encodedLink = encodeURIComponent(shortLink);

  const query: IDataObject = {
    durationDays: durationDays.toString(),
  };

  const response = await dynamicLinksRequest.call(
    this,
    'GET',
    `/${encodedLink}/linkStats`,
    undefined,
    query,
  );

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
export async function execute(
  this: IExecuteFunctions,
  operation: string,
  index: number,
): Promise<INodeExecutionData[]> {
  switch (operation) {
    case 'createShortLink':
      return createShortLink.call(this, index);
    case 'getLinkStats':
      return getLinkStats.call(this, index);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}
