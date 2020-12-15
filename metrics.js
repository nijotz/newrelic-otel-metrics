const { MeterProvider } = require('@opentelemetry/metrics')
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus')

const exporter = new PrometheusExporter(
  {
    startServer: true,
    port: 8080,
  },
  () => {
    console.log('Prometheus endpoint: http://localhost:8080/metrics')
  }
)

const meterProvider = new MeterProvider({
  exporter,
  interval: 5000
})
const meter = meterProvider.getMeter('express-otel-metrics')

requestCount = meter.createCounter('requests', {
  description: 'Count all incoming requess'
})


const boundInstruments = new Map()

function makeMiddleware(options = {}) {
  return (req, res, next) => {
    if (!boundInstruments.has(req.path)) {
      const labels = { route: req.path }
      const boundCounter = requestCount.bind(labels)
      boundInstruments.set(req.path, boundCounter)
    }

    boundInstruments.get(req.path).add(1)

    return next()
  }
}

module.exports = makeMiddleware
