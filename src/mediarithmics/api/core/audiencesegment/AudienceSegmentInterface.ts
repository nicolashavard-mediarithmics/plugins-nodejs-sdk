import { DataResponse } from '../common/Response';
import { IdentifyingResourceShape } from '../plugin/ValueInterface';

export type AudienceSegmentexternalResourceResponse = DataResponse<AudienceSegmentExternalFeedResource>;

export interface AudienceSegmentExternalFeedResource {
  id: string;
  plugin_id: string;
  organisation_id: string;
  group_id: string;
  artifact_id: string;
  version_id: string;
  selected_identifying_resources?: IdentifyingResourceShape[];
}

export type AudienceSegmentResourceResponse = DataResponse<AudienceSegmentResource>;

export interface AudienceSegmentResource {
  id: string;
  organisation_id: string;
  name: string;
  short_description: string;
  technical_name: string;
  default_ttl?: number;
  datamart_id: string;
  provider_name: string;
  persisted: boolean;
}
