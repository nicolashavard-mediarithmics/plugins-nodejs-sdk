export interface AssetFilePropertyResource {
  original_file_name?: string;
  original_name?: string;
  asset_id?: string;
  file_path?: string;
  file?: string;
}

export interface AssetFolderPropertyResource {
  original_name?: string;
  asset_id?: string;
  path?: string;
}

export interface DataFilePropertyResource {
  uri?: string;
  last_modified?: number;
}

export interface UrlPropertyResource {
  url?: string;
}

export interface StringPropertyResource {
  value?: string;
}

export interface AdLayoutPropertyResource {
  id?: string;
  version?: string;
}

export interface StyleSheetPropertyResource {
  id?: string;
  version?: string;
}

export interface PixelTagPropertyResource {
  value?: string;
}

export interface DoublePropertyResource {
  value?: number;
}

export interface BooleanPropertyResource {
  value?: boolean;
}

export interface IntPropertyResource {
  value?: number;
}

export interface RecommenderPropertyResource {
  recommender_id?: string;
}

export interface NativeDataPropertyResource {
  required_display?: boolean;
  type?: number;
  value?: string;
}

export interface NativeTitlePropertyResource {
  required_display?: boolean;
  value?: string;
}

export interface NativeImagePropertyResource {
  required_display?: boolean;
  width?: number;
  height?: number;
  type?: number;
  original_file_name?: string;
  asset_id?: string;
  file_path?: string;
}

export type DeviceIdRegistryType =
  | 'INSTALLATION_ID'
  | 'MUM_ID'
  | 'NETWORK_DEVICE_ID'
  | 'CUSTOM_DEVICE_ID'
  | 'MOBILE_ADVERTISING_ID'
  | 'MOBILE_VENDOR_ID'
  | 'TV_ADVERTISING_ID';

export interface IdentifyingAccount {
  type: 'USER_ACCOUNT';
  compartment_id?: string;
}

export interface IdentifyingEmail {
  type: 'USER_EMAIL';
}

export interface IdentifyingDeviceTechnicalId {
  type: 'USER_DEVICE_TECHNICAL_ID';
  registry_type: DeviceIdRegistryType;
  registry_id?: string;
}

export interface IdentifyingProfile {
  type: 'USER_PROFILE';
  compartment_id?: string;
}

export type IdentifyingResourceShape =
  | IdentifyingAccount
  | IdentifyingEmail
  | IdentifyingDeviceTechnicalId
  | IdentifyingProfile;
