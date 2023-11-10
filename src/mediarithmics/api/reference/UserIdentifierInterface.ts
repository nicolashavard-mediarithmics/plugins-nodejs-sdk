export type UserIdentifierInfoType = 'USER_POINT' | 'USER_ACCOUNT' | 'USER_EMAIL' | 'USER_AGENT' | 'USER_DEVICE_POINT';

export type UUID = string;

export type VectorId = string;
export type TimeStamp = number; //long
export type UserEmailIdentifierProviderResource = unknown; //TODO
export type UserAgentInfo = unknown; //TODO

export type UserIdentifierInfo = UserDevicePointIdentifierInfo | UserPointIdentifierInfo | UserEmailIdentifierInfo | UserAccountIdentifierInfo | UserAgentIdentifierInfo;

export enum UserDeviceTechnicalIdentifierType {
  MUM_ID = 'MUM_ID',
  MOBILE_ADVERTISING_ID = 'MOBILE_ADVERTISING_ID',
  MOBILE_VENDOR_ID = 'MOBILE_VENDOR_ID',
  INSTALLATION_ID = 'INSTALLATION_ID',
  CUSTOM_DEVICE_ID = 'CUSTOM_DEVICE_ID',
  NETWORK_DEVICE_ID = 'NETWORK_DEVICE_ID',
  TV_ADVERTISING_ID = 'TV_ADVERTISING_ID',
}

export interface UserDevicePointIdentifierTechnicalIdentifierResource {
  type: UserDeviceTechnicalIdentifierType;
  user_agent_id: string;
  registry_id: string;
  creation_ts: TimeStamp;
  last_activity_ts: TimeStamp;
  expiration_ts?: TimeStamp;
}

export interface UserDevicePointIdentifierInfo {
  type: 'USER_DEVICE_POINT';
  id?: string;
  device?: UserAgentInfo;
  creation_ts: TimeStamp;
  last_activity_ts: TimeStamp;
  technical_identifiers: Array<UserDevicePointIdentifierTechnicalIdentifierResource>;
}

export interface UserPointIdentifierInfo {
  type: 'USER_POINT';
  user_point_id: UUID;
  creation_ts: TimeStamp;
}

export interface UserEmailIdentifierInfo {
  type: 'USER_EMAIL';
  hash: string;
  email?: string;
  operator?: string;
  creation_ts: TimeStamp;
  last_activity_ts: TimeStamp;
  providers: Array<UserEmailIdentifierProviderResource>;
}

export interface UserAccountIdentifierInfo {
  type: 'USER_ACCOUNT';
  user_account_id: string;
  creation_ts: TimeStamp;
  compartment_id?: number; //To Be changed to `string` when the back will be updated
}

export interface UserAgentIdentifierInfo {
  type: 'USER_AGENT';
  vector_id: VectorId;
  device?: UserAgentInfo;
  creation_ts: TimeStamp;
  last_activity_ts: TimeStamp;
  providers: Array<UserAgentIdentifierProviderResource>;
  mappings: Array<UserAgentIdMappingResource>;
}

export interface UserAgentIdMappingResource {
  user_agent_id: string;
  realm_name: string;
  last_activity_ts: number;
}

export interface UserAgentIdentifierProviderResource {
  technical_name: string;
  creation_ts?: TimeStamp;
  last_activity_ts?: TimeStamp;
  expiration_ts?: TimeStamp;
}
