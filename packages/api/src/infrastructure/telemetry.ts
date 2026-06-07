import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { metrics, Meter } from '@opentelemetry/api';

// PrometheusExporter: levanta un server HTTP en puerto 9464
// que expone /metrics para que Prometheus lo scrapee (modelo pull)
const prometheusExporter = new PrometheusExporter({
  port: 9464,
  endpoint: '/metrics',
});

// NodeSDK: orquesta la recolección de metricas y trazas
// - metricReader: usa el PrometheusExporter para exponer metricas
// - instrumentations: parchea HTTP y Fastify automaticamente
const sdk = new NodeSDK({
  metricReader: prometheusExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {},
      '@opentelemetry/instrumentation-fastify': {},
    }),
  ],
});

sdk.start();

// Meter: fabrica de instrumentos de metricas
// Lo usamos para crear counters/histograms en los controllers
const meter = metrics.getMeter('alentapp-api');

export function createREDMetrics(meter: Meter) {
  const requestCounter = meter.createCounter('http.requests.total', {
    description: 'Total de requests HTTP',
  });
  const errorCounter = meter.createCounter('http.requests.errors', {
    description: 'Total de errores HTTP',
  });
  const requestDuration = meter.createHistogram('http.request.duration', {
    description: 'Duracion de requests',
    unit: 'ms',
  });
  return { requestCounter, errorCounter, requestDuration };
}

export { sdk, meter, prometheusExporter };