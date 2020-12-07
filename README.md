# Custom Metrics in New Relic using Open Telemetry and Prometheus

## Install Dependencies

```
npm install --save @opentelemetry/metrics
npm install --save @opentelemetry/exporter-prometheus
```

## Setup Exporter and Metrics

1. Create the OpenTelemetry Prometheus exporter. This will start the server on port 8080. We will setup Prometheus server in a future step that will connect to this exporter server to scrape metric data.

    ```javascript
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
    ```

1. Create an OpenTelemetry metric

    ```javascript
    const { MeterProvider } = require('@opentelemetry/metrics')

    const meterProvider = new MeterProvider({
      exporter,
      interval: 500
    })
    const meter = meterProvider.getMeter('express-otel-metrics')

    requestCount = meter.createCounter('requests', {
      description: 'Count all incoming requess'
    })
    ```

1. Create an Express middleware that uses the OpenTelemetry metric

    ```javascript
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
    ```

## Use Metrics Middleware

1. Add middleware to an Express app

    ```javascript
    const metricsMiddleware = require('./metrics')

    const app = express()

    app.use(metricsMiddleware())
    ```

1. Run the server

    ```bash
    ...
    Example app listening on port 8000!
    Prometheus endpoint: http://localhost:8080/metrics
    ```

1. Navigate to http://localhost:8000 to generate a metric

1. Navigate to http://localhost:8080/metrics to view the metric

## Setup Prometheus to Export to New Relic

1. Follow [these](https://docs.newrelic.com/docs/integrations/prometheus-integrations/get-started/send-prometheus-metric-data-new-relic) instructions for setting up a remote write URL for Prometheus.

1. Create a configuration file for the Prometheus server using the remote write URL and token from New Relic:
    ```
    global:
      scrape_interval: 5s
    scrape_configs:
      - job_name: "express-otel-metrics"
        static_configs:
          - targets: ["docker.for.mac.host.internal:8080"]
    remote_write:
      - url: <remote_write_url>
        bearer_token: <redacted>
    ```

1. Run the Prometheus exporter

    ```bash
    docker run --rm -p 9090:9090 -v `pwd`/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus:v2.20.1
    ```
