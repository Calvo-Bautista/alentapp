import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { FastifyInstrumentation } from '@opentelemetry/instrumentation-fastify';
import { metrics } from '@opentelemetry/api';

// No arrancar el SDK en los tests (si no, levanta el puerto 9464 en cada test)
if (process.env.NODE_ENV !== 'test') {
  const prometheusExporter = new PrometheusExporter({ port: 9464, endpoint: '/metrics' });
  const sdk = new NodeSDK({
    metricReader: prometheusExporter,
    instrumentations: [
      new HttpInstrumentation(),
      new FastifyInstrumentation(),
    ],
  });
  sdk.start();
  ['SIGTERM', 'SIGINT'].forEach((sig) =>
    process.on(sig, () => { sdk.shutdown().finally(() => process.exit(0)); })
  );
}

const meter = metrics.getMeter('alentapp-api');

export const httpRequests = meter.createCounter('http_requests_total', { description: 'Total de requests HTTP' });
export const httpErrors = meter.createCounter('http_requests_errors', { description: 'Total de errores HTTP (4xx/5xx)' });
export const httpDuration = meter.createHistogram('http_request_duration', { description: 'Duración de requests', unit: 'ms' });
export const activeRequests = meter.createUpDownCounter('http_requests_active', { description: 'Requests en curso' });

meter
  .createObservableGauge('process_memory_usage_bytes', { description: 'Memoria del proceso (RSS)' })
  .addCallback((result) => result.observe(process.memoryUsage().rss));