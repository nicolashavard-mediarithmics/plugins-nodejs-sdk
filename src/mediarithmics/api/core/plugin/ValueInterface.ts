import { AudienceFeedConnectorBaseInstanceContext } from '../../../plugins/audience-feed-connector/AudienceFeedConnectorBasePlugin';
import { UserDeviceTechnicalIdentifierType } from '../../reference/UserIdentifierInterface';

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

export type IdentifyingResourceType = 'USER_ACCOUNT' | 'USER_EMAIL' | 'USER_DEVICE_TECHNICAL_ID' | 'USER_PROFILE';

interface AbstractIdentifyingResource {
  type: IdentifyingResourceType;
}

export interface IdentifyingAccount extends AbstractIdentifyingResource {
  type: 'USER_ACCOUNT';
  compartment_id?: string;
}

export interface IdentifyingEmail extends AbstractIdentifyingResource {
  type: 'USER_EMAIL';
}

export interface IdentifyingDeviceTechnicalId extends AbstractIdentifyingResource {
  type: 'USER_DEVICE_TECHNICAL_ID';
  registry_type: UserDeviceTechnicalIdentifierType;
  registry_id?: string;
}

export interface IdentifyingProfile extends AbstractIdentifyingResource {
  type: 'USER_PROFILE';
  compartment_id?: string;
}

export type IdentifyingResourceShape =
  | IdentifyingAccount
  | IdentifyingEmail
  | IdentifyingDeviceTechnicalId
  | IdentifyingProfile;

export const isIdentifyingAccount = (resourceShape: IdentifyingResourceShape): resourceShape is IdentifyingAccount => {
  return resourceShape.type === 'USER_ACCOUNT';
};

export const isIdentifyingEmail = (resourceShape: IdentifyingResourceShape): resourceShape is IdentifyingEmail => {
  return resourceShape.type === 'USER_EMAIL';
};

export const isIdentifyingDeviceTechnicalId = (
  resourceShape: IdentifyingResourceShape,
): resourceShape is IdentifyingDeviceTechnicalId => {
  return resourceShape.type === 'USER_DEVICE_TECHNICAL_ID';
};

export const isIdentifyingProfile = (resourceShape: IdentifyingResourceShape): resourceShape is IdentifyingProfile => {
  return resourceShape.type === 'USER_PROFILE';
};

const getHasIdentifyingSelectedResource = <T extends AudienceFeedConnectorBaseInstanceContext>(
  isIdentifyingResourceFunction: (resourceShape: IdentifyingResourceShape) => resourceShape is IdentifyingResourceShape,
) => {
  return (baseInstanceContext: T): boolean => {
    const selectedIdentifyingResources = baseInstanceContext.feed.selected_identifying_resources;

    return (
      selectedIdentifyingResources !== undefined &&
      selectedIdentifyingResources.filter(isIdentifyingResourceFunction).length !== 0
    );
  };
};

export const [
  hasIdentifyingAccountSelectedResource,
  hasIdentifyingEmailSelectedResource,
  hasIdentifyingDeviceTechnicalIdSelectedResource,
  hasIdentifyingProfileSelectedResource,
] = [isIdentifyingAccount, isIdentifyingEmail, isIdentifyingDeviceTechnicalId, isIdentifyingProfile].map((fn) => {
  return getHasIdentifyingSelectedResource(fn);
});
