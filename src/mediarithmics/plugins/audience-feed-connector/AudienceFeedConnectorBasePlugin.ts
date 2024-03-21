/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/unbound-method */

import express from 'express';
import _ from 'lodash';

import { PluginProperty, PluginPropertyResponse } from '../../';
import {
  AudienceSegmentExternalFeedResource,
  AudienceSegmentexternalResourceResponse,
  AudienceSegmentResource,
  AudienceSegmentResourceResponse,
} from '../../api/core/audiencesegment/AudienceSegmentInterface';
import { BatchUpdateHandler } from '../../api/core/batchupdate/BatchUpdateHandler';
import { BatchUpdatePluginResponse, BatchUpdateRequest } from '../../api/core/batchupdate/BatchUpdateInterface';
import {
  BatchedUserSegmentUpdatePluginResponse,
  ExternalSegmentConnectionPluginResponse,
  ExternalSegmentCreationPluginResponse,
  ExternalSegmentTroubleshootResponse,
  UserSegmentUpdatePluginResponse,
} from '../../api/plugin/audiencefeedconnector/AudienceFeedConnectorPluginResponseInterface';
import {
  AudienceFeedBatchContext,
  ExternalSegmentConnectionRequest,
  ExternalSegmentCreationRequest,
  ExternalSegmentTroubleshootRequest,
  UserSegmentUpdateRequest,
} from '../../api/plugin/audiencefeedconnector/AudienceFeedConnectorRequestInterface';
import { BasePlugin, PropertiesWrapper } from '../common';

export interface AudienceFeedConnectorBaseInstanceContext {
  feed: AudienceSegmentExternalFeedResource;
  feedProperties: PropertiesWrapper;
}

abstract class GenericAudienceFeedConnectorBasePlugin<
  T,
  R extends BatchedUserSegmentUpdatePluginResponse<T> | UserSegmentUpdatePluginResponse,
> extends BasePlugin<AudienceFeedConnectorBaseInstanceContext> {
  constructor(enableThrottling = false) {
    super(enableThrottling);

    this.initExternalSegmentCreation();
    this.initExternalSegmentConnection();
    this.initUserSegmentUpdate();
    this.initTroubleshoot();
  }

  async fetchAudienceSegment(feedId: string): Promise<AudienceSegmentResource> {
    const response = await super.requestGatewayHelper<AudienceSegmentResourceResponse>(
      'GET',
      `${this.outboundPlatformUrl}/v1/audience_segment_external_feeds/${feedId}/audience_segment`,
    );
    this.logger.debug(`Fetched External Segment: FeedId: ${feedId} - ${JSON.stringify(response.data)}`);
    return response.data;
  }

  async fetchAudienceFeed(feedId: string): Promise<AudienceSegmentExternalFeedResource> {
    const response = await super.requestGatewayHelper<AudienceSegmentexternalResourceResponse>(
      'GET',
      `${this.outboundPlatformUrl}/v1/audience_segment_external_feeds/${feedId}`,
    );
    this.logger.debug(`Fetched External Feed: ${feedId} - ${JSON.stringify(response.data)}`);
    return response.data;
  }

  // Method to build an instance context
  // To be overriden to get a cutom behavior

  async fetchAudienceFeedProperties(feedId: string): Promise<PluginProperty[]> {
    const response = await super.requestGatewayHelper<PluginPropertyResponse>(
      'GET',
      `${this.outboundPlatformUrl}/v1/audience_segment_external_feeds/${feedId}/properties`,
    );
    this.logger.debug(`Fetched External Feed Properties: ${feedId} - ${JSON.stringify(response.data)}`);
    return response.data;
  }

  async createAudienceFeedProperties(feedId: string, property: PluginProperty): Promise<PluginProperty[]> {
    const response = await super.requestGatewayHelper<PluginPropertyResponse>(
      'POST',
      `${this.outboundPlatformUrl}/v1/audience_segment_external_feeds/${feedId}/properties`,
      property,
    );
    this.logger.debug(`Created External Feed Properties: ${feedId} - ${JSON.stringify(response.data)}`);
    return response.data;
  }

  async updateAudienceFeedProperties(feedId: string, property: PluginProperty): Promise<PluginProperty[]> {
    const response = await super.requestGatewayHelper<PluginPropertyResponse>(
      'PUT',
      `${this.outboundPlatformUrl}/v1/audience_segment_external_feeds/${feedId}/properties/technical_name=${property.technical_name}`,
      property,
    );
    this.logger.debug(`Updated External Feed Properties: ${feedId} - ${JSON.stringify(response.data)}`);
    return response.data;
  }

  // This is a default provided implementation
  protected async instanceContextBuilder(feedId: string): Promise<AudienceFeedConnectorBaseInstanceContext> {
    const audienceFeedP = this.fetchAudienceFeed(feedId);
    const audienceFeedPropsP = this.fetchAudienceFeedProperties(feedId);

    const results = await Promise.all([audienceFeedP, audienceFeedPropsP]);

    const audienceFeed = results[0];
    const audienceFeedProps = results[1];

    const context: AudienceFeedConnectorBaseInstanceContext = {
      feed: audienceFeed,
      feedProperties: new PropertiesWrapper(audienceFeedProps),
    };

    return context;
  }

  protected abstract onExternalSegmentCreation(
    request: ExternalSegmentCreationRequest,
    instanceContext: AudienceFeedConnectorBaseInstanceContext,
  ): Promise<ExternalSegmentCreationPluginResponse>;

  protected abstract onExternalSegmentConnection(
    request: ExternalSegmentConnectionRequest,
    instanceContext: AudienceFeedConnectorBaseInstanceContext,
  ): Promise<ExternalSegmentConnectionPluginResponse>;

  protected abstract onUserSegmentUpdate(
    request: UserSegmentUpdateRequest,
    instanceContext: AudienceFeedConnectorBaseInstanceContext,
  ): Promise<R>;

  protected onTroubleshoot(
    request: ExternalSegmentTroubleshootRequest,
    instanceContext: AudienceFeedConnectorBaseInstanceContext,
  ): Promise<ExternalSegmentTroubleshootResponse> {
    return Promise.resolve({ status: 'not_implemented' });
  }

  private logErrorMessage(err: Error) {
    this.logger.error(
      `Something bad happened : ${(err as Error).message} - ${
        (err as Error).stack ? ((err as Error).stack as string) : 'stack undefined'
      }`,
    );
  }

  protected async getInstanceContext(
    feedId: string,
    forceRefresh?: boolean,
  ): Promise<AudienceFeedConnectorBaseInstanceContext> {
    if (forceRefresh || !this.pluginCache.get(feedId)) {
      void this.pluginCache.put(
        feedId,
        this.instanceContextBuilder(feedId).catch((err) => {
          this.logger.error(`Error while caching instance context: ${(err as Error).message}`);
          this.pluginCache.del(feedId);
          throw err;
        }),
        this.getInstanceContextCacheExpiration(),
      );
    }
    return this.pluginCache.get(feedId) as Promise<AudienceFeedConnectorBaseInstanceContext>;
  }

  protected emptyBodyFilter(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (!req.body || _.isEmpty(req.body)) {
      const msg = {
        error: 'Missing request body',
      };
      this.logger.error(`POST /v1/${req.url} : %s`, JSON.stringify(msg));
      res.status(500).json(msg);
    } else {
      next();
    }
  }

  private initExternalSegmentCreation(): void {
    this.app.post(
      '/v1/external_segment_creation',
      this.emptyBodyFilter,
      async (req: express.Request, res: express.Response) => {
        try {
          this.logger.debug(`POST /v1/external_segment_creation ${JSON.stringify(req.body)}`);

          if (!this.httpIsReady()) {
            throw new Error('Plugin not initialized');
          }

          const request = req.body as ExternalSegmentCreationRequest;

          if (!this.onExternalSegmentCreation) {
            throw new Error('No External Segment Creation listener registered!');
          }

          const instanceContext = await this.getInstanceContext(request.feed_id, true);

          const response = await this.onExternalSegmentCreation(request, instanceContext);

          this.logger.debug(`Returning: ${JSON.stringify(response)}`);

          const pluginResponse: ExternalSegmentCreationPluginResponse = {
            status: response.status,
            visibility: response.visibility || 'PUBLIC',
          };

          if (response.message) {
            pluginResponse.message = response.message;
          }

          const statusCode = response.status === 'ok' ? 200 : 500;

          return res.status(statusCode).send(JSON.stringify(pluginResponse));
        } catch (err) {
          this.logErrorMessage(err);
          const pluginResponse: ExternalSegmentCreationPluginResponse = {
            status: 'error',
            message: `${(err as Error).message}`,
            visibility: 'PRIVATE',
          };
          return res.status(500).send(pluginResponse);
        }
      },
    );
  }

  private initExternalSegmentConnection(): void {
    this.app.post(
      '/v1/external_segment_connection',
      this.emptyBodyFilter,
      async (req: express.Request, res: express.Response) => {
        try {
          this.logger.debug(`POST /v1/external_segment_connection ${JSON.stringify(req.body)}`);

          if (!this.httpIsReady()) {
            throw new Error('Plugin not initialized');
          }

          const request = req.body as ExternalSegmentConnectionRequest;

          if (!this.onExternalSegmentConnection) {
            throw new Error('No External Segment Connection listener registered!');
          }

          const instanceContext = await this.getInstanceContext(request.feed_id);

          const response = await this.onExternalSegmentConnection(request, instanceContext);

          this.logger.debug(`FeedId: ${request.feed_id} - Plugin impl returned: ${JSON.stringify(response)}`);

          const pluginResponse: ExternalSegmentConnectionPluginResponse = {
            status: response.status,
          };

          if (response.message) {
            pluginResponse.message = response.message;
          }

          let statusCode;

          switch (response.status) {
            case 'external_segment_not_ready_yet':
              statusCode = 502;
              break;
            case 'ok':
              statusCode = 200;
              break;
            case 'error':
              statusCode = 500;
              break;
            default:
              statusCode = 500;
          }

          this.logger.debug(`FeedId: ${request.feed_id} - Returning: ${statusCode} - ${JSON.stringify(response)}`);

          return res.status(statusCode).send(JSON.stringify(pluginResponse));
        } catch (err) {
          this.logErrorMessage(err);
          return res.status(500).send({ status: 'error', message: `${(err as Error).message}` });
        }
      },
    );
  }

  private initUserSegmentUpdate(): void {
    this.app.post(
      '/v1/user_segment_update',
      this.emptyBodyFilter,
      async (req: express.Request, res: express.Response) => {
        try {
          this.logger.debug(`POST /v1/user_segment_update ${JSON.stringify(req.body)}`);

          const request = req.body as UserSegmentUpdateRequest;

          if (!this.onUserSegmentUpdate) {
            throw new Error('No User Segment Update listener registered!');
          }

          const instanceContext = await this.getInstanceContext(request.feed_id);

          const response: R = await this.onUserSegmentUpdate(request, instanceContext);

          this.logger.debug(`Returning: ${JSON.stringify(response)}`);

          if (response.next_msg_delay_in_ms) {
            res.set('x-mics-next-msg-delay', response.next_msg_delay_in_ms.toString());
          }

          let statusCode: number;
          switch (response.status) {
            case 'ok':
              statusCode = 200;
              break;
            case 'error':
              statusCode = 500;
              break;
            case 'retry':
              statusCode = 429;
              break;
            case 'no_eligible_identifier':
              statusCode = 400;
              break;
            default:
              statusCode = 500;
          }

          return res.status(statusCode).send(JSON.stringify(response));
        } catch (err) {
          this.logErrorMessage(err);
          return res.status(500).send({ status: 'error', message: `${(err as Error).message}` });
        }
      },
    );
  }

  private initTroubleshoot(): void {
    this.app.get('/v1/troubleshoot', this.emptyBodyFilter, async (req: express.Request, res: express.Response) => {
      try {
        this.logger.debug(`POST /v1/troubleshoot ${JSON.stringify(req.body)}`);

        const request = req.body as ExternalSegmentTroubleshootRequest;

        const instanceContext = await this.getInstanceContext(request.feed_id);

        const response = await this.onTroubleshoot(request, instanceContext);

        this.logger.debug(`Returning: ${JSON.stringify(response)}`);

        let statusCode: number;
        switch (response.status) {
          case 'ok':
            statusCode = 200;
            break;
          case 'error':
            statusCode = 500;
            break;
          case 'not_implemented':
            statusCode = 400;
            break;
          default:
            statusCode = 500;
        }

        return res.status(statusCode).send(JSON.stringify(response));
      } catch (err) {
        this.logErrorMessage(err);
        return res.status(500).send({ status: 'error', message: `${(err as Error).message}` });
      }
    });
  }
}

export abstract class BatchedAudienceFeedConnectorBasePlugin<T> extends GenericAudienceFeedConnectorBasePlugin<
  T,
  BatchedUserSegmentUpdatePluginResponse<T>
> {
  constructor(enableThrottling = false) {
    super(enableThrottling);

    const batchUpdateHandler = new BatchUpdateHandler<AudienceFeedBatchContext, T>(
      this.app,
      this.emptyBodyFilter,
      this.logger,
    );

    batchUpdateHandler.registerRoute(async (request) => {
      const instanceContext = await this.getInstanceContext(request.context.feed_id);
      return this.onBatchUpdate(request, instanceContext);
    });
  }

  protected abstract onBatchUpdate(
    request: BatchUpdateRequest<AudienceFeedBatchContext, T>,
    instanceContext: AudienceFeedConnectorBaseInstanceContext,
  ): Promise<BatchUpdatePluginResponse>;
}

export abstract class AudienceFeedConnectorBasePlugin extends GenericAudienceFeedConnectorBasePlugin<
  void,
  UserSegmentUpdatePluginResponse
> {
  constructor(enableThrottling = false) {
    super(enableThrottling);
    this.initBatchUpdate();
  }

  private initBatchUpdate(): void {
    this.app.post('/v1/batch_update', this.emptyBodyFilter, async (req: express.Request, res: express.Response) => {
      res.status(500).send({ status: 'error', message: "Plugin doesn't support batch update" });
    });
  }
}
