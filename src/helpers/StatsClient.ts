import { StatsD, Tags } from 'hot-shots';

import winston = require('winston');

export enum MetricsType {
  GAUGE = 'gauge',
  INCREMENT = 'increment',
}

export interface InitOptions {
  /**
   * interval to send stats to datadog in ms (default = 10 minutes)
   */
  timerInMs?: number;

  /**
   * Used to init or not the stats client.
   * When running production, NODE_ENV should be "production".
   * If running tests, NODE_ENV should be "development".
   */
  environment?: string | undefined;

  /**
   * An optional logger to send Metrics into logs (in debug mode)
   */
  logger?: winston.Logger;
}

export interface addOrUpdateMetricsOptions {
  /**
   * @example
   * ```
   * declare your metrics, their types, value and optionals tags.
   * {metrics: {processed_users: { type: MetricsType.GAUGE, value: 4, tags: {datamart_id: '4521'}}, users_with_mobile_id_count: {type: MetricsType.INCREMENT, value: 1, tags: {datamart_id: '4521'}}}}
   * {processed_users: 4}
   */
  metrics: {
    [metricName: string]: MetricOptions;
  };
}

export interface MetricOptions {
  type: MetricsType;
  value: number;
  tags?: Tags;
}

export type MetricsSet = Map<string, MetricsOptionsWithName>;

export interface MetricsOptionsWithName extends MetricOptions {
  metricName: string;
}

/**
 * Send stats to datadog
 */
export class StatsClient {
  private static instance: StatsClient;
  private interval: NodeJS.Timer;
  private metrics: MetricsSet;
  private client: StatsD;

  private constructor(timerInMs: number, environment: string | undefined) {
    this.metrics = new Map();
    this.client = new StatsD({
      protocol: environment === 'production' ? 'uds' : undefined,
    });

    if (!this.interval) {
      this.interval = setInterval(() => this.sendStats(), timerInMs);
    }
  }

  /**
   * @example
   * ```
   * private this.statsClient: StatsClient
   * constructor() {
   *   this.statsClient = StatsClient.init({ environment: process.env.NODE_ENV });
   * }
   * ```
   */
  static init({ timerInMs = 10 * 60 * 1000, environment = process.env.NODE_ENV, logger }: InitOptions): StatsClient {
    logger?.info(
      `StatsClient - environment is ${
        environment ? environment : 'undefined'
      } mode - Timer is ${timerInMs} - Initialization.`,
    );
    return this.instance || (this.instance = new StatsClient(timerInMs, environment));
  }

  /**
   * Increment some metrics
   * @example
   * ```
   * this.statClient.addOrUpdateMetrics({metrics: {processed_users: { type: MetricsType.GAUGE, value: 4, tags: {datamart_id: '4521'}}, users_with_mobile_id_count: {type: MetricsType.INCREMENT, value: 1, tags: {datamart_id: '4521'}}}})
   * this.statClient.addOrUpdateMetrics({metrics: {apiCallsError: { type: MetricsType.GAUGE, value: 10, tags: {statusCode: '500'}}}})
   * ```
   */
  public addOrUpdateMetrics({ metrics }: addOrUpdateMetricsOptions): void {
    Object.entries(metrics).forEach(([metricName, options]) => {
      const customKey = metricName + '/' + JSON.stringify(options.tags);
      if (this.metrics.has(customKey)) {
        const metricOptions = this.metrics.get(customKey) as MetricsOptionsWithName;
        this.metrics.set(customKey, {
          metricName,
          type: metricOptions.type,
          value: metricOptions.value + options.value,
          tags: { ...options.tags },
        });
      } else {
        this.metrics.set(customKey, {
          metricName,
          type: options.type,
          value: options.value,
          tags: options.tags,
        });
      }
    });
  }

  private sendStats(): void {
    [...this.metrics.entries()].forEach(([customKey, options]) => {
      if (options.type === MetricsType.GAUGE) {
        this.client.gauge(options.metricName, options.value, { ...options.tags });
      } else {
        this.client.increment(options.metricName, options.value, { ...options.tags });
        this.resetIncrementMetric(customKey, options.metricName);
      }
    });
  }

  private resetIncrementMetric(customKey: string, metricName: string) {
    const metricOptions = this.metrics.get(customKey) as MetricOptions;
    this.metrics.set(customKey, {
      metricName,
      type: metricOptions.type,
      value: 0,
      tags: { ...metricOptions.tags },
    });
  }
}
