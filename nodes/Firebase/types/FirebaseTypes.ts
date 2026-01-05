/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject } from 'n8n-workflow';

// Credential types
export interface IFirebaseCredentials {
  projectId: string;
  serviceAccountEmail: string;
  privateKey: string;
  databaseUrl?: string;
  storageBucket?: string;
}

// JWT types
export interface IJwtPayload {
  iss: string;
  sub: string;
  aud: string;
  iat: number;
  exp: number;
  scope: string;
}

export interface ITokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

// Realtime Database types
export interface IRealtimeDbQuery {
  orderBy?: string;
  equalTo?: string | number | boolean;
  startAt?: string | number | boolean;
  endAt?: string | number | boolean;
  limitToFirst?: number;
  limitToLast?: number;
  shallow?: boolean;
}

// Firestore types
export interface IFirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  nullValue?: null;
  arrayValue?: { values: IFirestoreValue[] };
  mapValue?: { fields: { [key: string]: IFirestoreValue } };
  geoPointValue?: { latitude: number; longitude: number };
  referenceValue?: string;
  bytesValue?: string;
}

export interface IFirestoreDocument {
  name?: string;
  fields?: { [key: string]: IFirestoreValue };
  createTime?: string;
  updateTime?: string;
}

export interface IFirestoreQuery {
  structuredQuery: {
    from?: Array<{ collectionId: string; allDescendants?: boolean }>;
    where?: IFirestoreFilter;
    orderBy?: Array<{ field: { fieldPath: string }; direction: 'ASCENDING' | 'DESCENDING' }>;
    limit?: number;
    offset?: number;
    startAt?: { values: IFirestoreValue[]; before?: boolean };
    endAt?: { values: IFirestoreValue[]; before?: boolean };
    select?: { fields: Array<{ fieldPath: string }> };
  };
}

export interface IFirestoreFilter {
  fieldFilter?: {
    field: { fieldPath: string };
    op:
      | 'EQUAL'
      | 'NOT_EQUAL'
      | 'LESS_THAN'
      | 'LESS_THAN_OR_EQUAL'
      | 'GREATER_THAN'
      | 'GREATER_THAN_OR_EQUAL'
      | 'ARRAY_CONTAINS'
      | 'ARRAY_CONTAINS_ANY'
      | 'IN'
      | 'NOT_IN';
    value: IFirestoreValue;
  };
  compositeFilter?: {
    op: 'AND' | 'OR';
    filters: IFirestoreFilter[];
  };
  unaryFilter?: {
    op: 'IS_NAN' | 'IS_NULL' | 'IS_NOT_NAN' | 'IS_NOT_NULL';
    field: { fieldPath: string };
  };
}

export interface IFirestoreBatchWrite {
  writes: Array<{
    update?: IFirestoreDocument;
    delete?: string;
    updateMask?: { fieldPaths: string[] };
    currentDocument?: { exists?: boolean; updateTime?: string };
  }>;
}

// Authentication types
export interface IFirebaseUser {
  localId: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
  photoUrl?: string;
  phoneNumber?: string;
  disabled?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  customAttributes?: string;
  providerUserInfo?: IProviderUserInfo[];
}

export interface IProviderUserInfo {
  providerId: string;
  displayName?: string;
  photoUrl?: string;
  federatedId?: string;
  email?: string;
  rawId?: string;
  screenName?: string;
  phoneNumber?: string;
}

export interface ICreateUserRequest {
  email?: string;
  password?: string;
  displayName?: string;
  phoneNumber?: string;
  photoUrl?: string;
  disabled?: boolean;
  emailVerified?: boolean;
}

export interface IUpdateUserRequest extends ICreateUserRequest {
  localId: string;
  deleteAttribute?: string[];
  deleteProvider?: string[];
  customAttributes?: string;
}

// Cloud Messaging types
export interface IFcmMessage {
  message: {
    token?: string;
    topic?: string;
    condition?: string;
    notification?: IFcmNotification;
    data?: { [key: string]: string };
    android?: IAndroidConfig;
    apns?: IApnsConfig;
    webpush?: IWebpushConfig;
    fcmOptions?: { analyticsLabel?: string };
  };
}

export interface IFcmNotification {
  title?: string;
  body?: string;
  image?: string;
}

export interface IAndroidConfig {
  collapseKey?: string;
  priority?: 'normal' | 'high';
  ttl?: string;
  restrictedPackageName?: string;
  data?: { [key: string]: string };
  notification?: IAndroidNotification;
  fcmOptions?: { analyticsLabel?: string };
  directBootOk?: boolean;
}

export interface IAndroidNotification {
  title?: string;
  body?: string;
  icon?: string;
  color?: string;
  sound?: string;
  tag?: string;
  clickAction?: string;
  bodyLocKey?: string;
  bodyLocArgs?: string[];
  titleLocKey?: string;
  titleLocArgs?: string[];
  channelId?: string;
  ticker?: string;
  sticky?: boolean;
  eventTime?: string;
  localOnly?: boolean;
  notificationPriority?: 'PRIORITY_UNSPECIFIED' | 'PRIORITY_MIN' | 'PRIORITY_LOW' | 'PRIORITY_DEFAULT' | 'PRIORITY_HIGH' | 'PRIORITY_MAX';
  defaultSound?: boolean;
  defaultVibrateTimings?: boolean;
  defaultLightSettings?: boolean;
  vibrateTimings?: string[];
  visibility?: 'VISIBILITY_UNSPECIFIED' | 'PRIVATE' | 'PUBLIC' | 'SECRET';
  notificationCount?: number;
  image?: string;
}

export interface IApnsConfig {
  headers?: { [key: string]: string };
  payload?: {
    aps?: {
      alert?: string | { title?: string; body?: string; subtitle?: string };
      badge?: number;
      sound?: string | { critical?: number; name?: string; volume?: number };
      contentAvailable?: boolean;
      mutableContent?: boolean;
      category?: string;
      threadId?: string;
    };
    [key: string]: IDataObject | undefined;
  };
  fcmOptions?: { analyticsLabel?: string; image?: string };
}

export interface IWebpushConfig {
  headers?: { [key: string]: string };
  data?: { [key: string]: string };
  notification?: IDataObject;
  fcmOptions?: { analyticsLabel?: string; link?: string };
}

export interface ITopicManagementRequest {
  to: string;
  registration_tokens: string[];
}

// Remote Config types
export interface IRemoteConfigTemplate {
  conditions?: IRemoteConfigCondition[];
  parameters?: { [key: string]: IRemoteConfigParameter };
  parameterGroups?: { [key: string]: IRemoteConfigParameterGroup };
  version?: IRemoteConfigVersion;
  etag?: string;
}

export interface IRemoteConfigCondition {
  name: string;
  expression: string;
  tagColor?:
    | 'CONDITION_DISPLAY_COLOR_UNSPECIFIED'
    | 'BLUE'
    | 'BROWN'
    | 'CYAN'
    | 'DEEP_ORANGE'
    | 'GREEN'
    | 'INDIGO'
    | 'LIME'
    | 'ORANGE'
    | 'PINK'
    | 'PURPLE'
    | 'TEAL';
}

export interface IRemoteConfigParameter {
  defaultValue?: IRemoteConfigParameterValue;
  conditionalValues?: { [key: string]: IRemoteConfigParameterValue };
  description?: string;
  valueType?: 'STRING' | 'BOOLEAN' | 'NUMBER' | 'JSON';
}

export interface IRemoteConfigParameterValue {
  value?: string;
  useInAppDefault?: boolean;
}

export interface IRemoteConfigParameterGroup {
  description?: string;
  parameters?: { [key: string]: IRemoteConfigParameter };
}

export interface IRemoteConfigVersion {
  versionNumber?: string;
  updateTime?: string;
  updateUser?: { email?: string; name?: string; imageUrl?: string };
  updateOrigin?: 'REMOTE_CONFIG_UPDATE_ORIGIN_UNSPECIFIED' | 'CONSOLE' | 'REST_API' | 'ADMIN_SDK_NODE';
  updateType?: 'REMOTE_CONFIG_UPDATE_TYPE_UNSPECIFIED' | 'INCREMENTAL_UPDATE' | 'FORCED_UPDATE' | 'ROLLBACK';
  rollbackSource?: string;
  isLegacy?: boolean;
  description?: string;
}

// Dynamic Links types
export interface IDynamicLinkInfo {
  domainUriPrefix: string;
  link: string;
  androidInfo?: {
    androidPackageName?: string;
    androidFallbackLink?: string;
    androidMinPackageVersionCode?: string;
  };
  iosInfo?: {
    iosBundleId?: string;
    iosFallbackLink?: string;
    iosCustomScheme?: string;
    iosIpadFallbackLink?: string;
    iosIpadBundleId?: string;
    iosAppStoreId?: string;
  };
  navigationInfo?: {
    enableForcedRedirect?: boolean;
  };
  analyticsInfo?: {
    googlePlayAnalytics?: {
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      utmTerm?: string;
      utmContent?: string;
      gclid?: string;
    };
    itunesConnectAnalytics?: {
      at?: string;
      ct?: string;
      mt?: string;
      pt?: string;
    };
  };
  socialMetaTagInfo?: {
    socialTitle?: string;
    socialDescription?: string;
    socialImageLink?: string;
  };
}

export interface ICreateShortLinkRequest {
  dynamicLinkInfo?: IDynamicLinkInfo;
  longDynamicLink?: string;
  suffix?: { option: 'UNGUESSABLE' | 'SHORT' };
}

export interface ICreateShortLinkResponse {
  shortLink: string;
  previewLink: string;
}

export interface ILinkStats {
  linkEventStats: Array<{
    platform: 'DESKTOP' | 'ANDROID' | 'IOS' | 'OTHER';
    count: string;
    event: 'CLICK' | 'REDIRECT' | 'APP_INSTALL' | 'APP_FIRST_OPEN' | 'APP_RE_OPEN';
  }>;
}

// Cloud Storage types
export interface IStorageObject {
  kind: string;
  id: string;
  selfLink: string;
  mediaLink: string;
  name: string;
  bucket: string;
  generation: string;
  metageneration: string;
  contentType: string;
  storageClass: string;
  size: string;
  md5Hash: string;
  crc32c: string;
  etag: string;
  timeCreated: string;
  updated: string;
  timeStorageClassUpdated: string;
  metadata?: { [key: string]: string };
}

export interface IStorageObjectList {
  kind: string;
  items?: IStorageObject[];
  prefixes?: string[];
  nextPageToken?: string;
}

// API Error types
export interface IFirebaseError {
  error: {
    code: number;
    message: string;
    status?: string;
    errors?: Array<{
      message: string;
      domain: string;
      reason: string;
    }>;
  };
}

// Resource and operation types
export type FirebaseResource =
  | 'realtimeDatabase'
  | 'firestore'
  | 'auth'
  | 'messaging'
  | 'remoteConfig'
  | 'dynamicLinks'
  | 'storage';

export type RealtimeDatabaseOperation = 'read' | 'write' | 'update' | 'push' | 'delete' | 'query';

export type FirestoreOperation =
  | 'createDocument'
  | 'getDocument'
  | 'listDocuments'
  | 'updateDocument'
  | 'deleteDocument'
  | 'query'
  | 'batchWrite'
  | 'runTransaction';

export type AuthOperation =
  | 'createUser'
  | 'getUser'
  | 'getUserByEmail'
  | 'listUsers'
  | 'updateUser'
  | 'deleteUser'
  | 'generatePasswordResetLink'
  | 'generateEmailVerificationLink'
  | 'setCustomClaims'
  | 'revokeRefreshTokens';

export type MessagingOperation =
  | 'sendMessage'
  | 'sendMulticast'
  | 'sendToTopic'
  | 'sendToCondition'
  | 'subscribeToTopic'
  | 'unsubscribeFromTopic';

export type RemoteConfigOperation =
  | 'getTemplate'
  | 'publishTemplate'
  | 'rollback'
  | 'listVersions'
  | 'getConditions'
  | 'getParameters';

export type DynamicLinksOperation = 'createShortLink' | 'getLinkStats';

export type StorageOperation =
  | 'upload'
  | 'download'
  | 'delete'
  | 'getMetadata'
  | 'updateMetadata'
  | 'listFiles';
