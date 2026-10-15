# Calculator (Go + React)

![CI](https://github.com/Juanchiz1/calculator-go-react/actions/workflows/ci.yml/badge.svg)

A full-stack calculator: a Go REST API that does the math and a React +
TypeScript frontend that consumes it. Supports addition, subtraction,
multiplication, division, exponentiation, square root and percentage.

## Requirements

- Go 1.27 or newer
- Node.js 22 or newer (developed on Node 24)
- Docker (optional)

## Running locally

Backend:

```bash
cd backend
go run ./cmd/server
```

It listens on http://localhost:8080. Set `PORT` to use another port.

Frontend, in a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` and `/health`
to the backend, so both need to be running.

### Production mode without Docker

The Go server can serve the built frontend itself:

```bash
cd frontend && npm ci && npm run build && cd ..
cd backend
STATIC_DIR=../frontend/dist go run ./cmd/server
```

Open http://localhost:8080. On PowerShell, set the variable with
`$env:STATIC_DIR = "..\frontend\dist"` before `go run`.

## Running with Docker

```bash
docker build -t calculator .
docker run --rm -p 8080:8080 calculator
```

Open http://localhost:8080. The image contains the Go binary and the built
frontend, served from the same port.

## Configuration

| Variable     | Default | Description                                                       |
|--------------|---------|-------------------------------------------------------------------|
| `PORT`       | `8080`  | Port the server listens on                                        |
| `STATIC_DIR` | empty   | Folder with the built frontend. When empty, only the API is served |

## Tests and coverage

Backend:

```bash
cd backend
go test ./... -cover
go test ./... -coverprofile=coverage.out && go tool cover -html=coverage.out -o coverage.html
```

Frontend:

```bash
cd frontend
npm test
npm run coverage   # summary in the terminal, HTML report in frontend/coverage/
```

| Area                          | Coverage                    |
|-------------------------------|-----------------------------|
| `backend/internal/calculator` | 100%                        |
| `backend/internal/api`        | 94.5%                       |
| `backend/cmd/server`          | 0%, wiring only (see below) |
| `frontend`                    | 100% lines, 98.5% branches  |

`npm run coverage` fails if frontend coverage drops below 90%. CI uploads
both reports as artifacts on every run.

## API

Every operation is `POST /api/v1/{operation}` with a JSON body.

| Operation    | Body                   | Result            |
|--------------|------------------------|-------------------|
| `add`        | `{"a": 2, "b": 3}`     | `5`               |
| `subtract`   | `{"a": 10, "b": 4}`    | `6`               |
| `multiply`   | `{"a": 3, "b": 4}`     | `12`              |
| `divide`     | `{"a": 10, "b": 4}`    | `2.5`             |
| `power`      | `{"a": 2, "b": 10}`    | `1024`            |
| `percentage` | `{"a": 20, "b": 150}`  | `30` (20% of 150) |
| `sqrt`       | `{"a": 16}`            | `4`               |

A successful response is `200`:

```json
{"operation": "divide", "result": 2.5}
```

Errors always have the same shape:

```json
{"error": {"code": "DIVISION_BY_ZERO", "message": "division by zero is not allowed"}}
```

| Status | Code                | When                                                                                     |
|--------|---------------------|------------------------------------------------------------------------------------------|
| 400    | `INVALID_REQUEST`   | Malformed or empty JSON, non-numeric operand, unknown field, `b` sent to `sqrt`, extra data after the object |
| 400    | `MISSING_OPERAND`   | `a` or `b` missing or `null`                                                             |
| 404    | `UNKNOWN_OPERATION` | Operation not in the table above                                                         |
| 405    | none                | Wrong HTTP method (plain text, from Go's router)                                         |
| 413    | `PAYLOAD_TOO_LARGE` | Body larger than 1 KB                                                                    |
| 422    | `DIVISION_BY_ZERO`  | `b` is 0                                                                                 |
| 422    | `NEGATIVE_SQRT`     | Square root of a negative number                                                         |
| 422    | `NON_FINITE_RESULT` | The result would be infinite or NaN, e.g. overflow, `0^-1`, `(-8)^0.5`                   |

`GET /health` returns `{"status":"ok"}`.

### Examples

```bash
curl -s -X POST http://localhost:8080/api/v1/divide \
  -H 'Content-Type: application/json' -d '{"a": 10, "b": 4}'
# {"operation":"divide","result":2.5}

curl -s -X POST http://localhost:8080/api/v1/sqrt \
  -H 'Content-Type: application/json' -d '{"a": 16}'
# {"operation":"sqrt","result":4}

curl -s -X POST http://localhost:8080/api/v1/divide \
  -H 'Content-Type: application/json' -d '{"a": 1, "b": 0}'
# {"error":{"code":"DIVISION_BY_ZERO","message":"division by zero is not allowed"}}

curl -s -X POST http://localhost:8080/api/v1/add \
  -H 'Content-Type: application/json' -d '{"a": 2}'
# {"error":{"code":"MISSING_OPERAND","message":"field \"b\" is required"}}
```

On Windows PowerShell, pass the JSON through stdin, since PowerShell can strip
quotes from arguments to native programs:

```powershell
'{"a": 10, "b": 4}' | curl.exe -s -X POST -H "Content-Type: application/json" --data-binary '@-' http://localhost:8080/api/v1/divide
```

## Project structure

```
backend/
  cmd/server/            entrypoint: config, HTTP server, graceful shutdown
  internal/calculator/   arithmetic only, no HTTP
  internal/api/          routing, request decoding, error mapping, logging middleware
frontend/src/
  api/                   typed API client
  lib/                   validation, formatting and error messages (pure functions)
  hooks/                 useCalculator: form state and request lifecycle
  components/            UI components, one CSS file each
Dockerfile               multi-stage build of frontend and backend into one image
.github/workflows/       CI: Go and frontend checks, Docker build and smoke test
PROMPTS.md               AI usage log
```

## Design decisions

### Backend

- Standard library only. Since Go 1.22, `net/http` routing supports methods
  and path parameters, which is all this API needs. There are no external
  dependencies, which is why there is no `go.sum`.
- The arithmetic lives in `internal/calculator` and knows nothing about HTTP.
  Every operation returns `(float64, error)` with sentinel errors, and the API
  layer maps them to status codes with `errors.Is`. Because the signature is
  uniform, one handler serves every operation from a map.
- 400 means the request is malformed; 422 means it is well-formed but the math
  can't produce a number. A client can tell "fix the format of your request"
  apart from "this operation is undefined".
- Operands are `*float64`, so `{"a": 5}` is reported as a missing operand
  instead of silently becoming `5 / 0`.
- Infinite and NaN results are errors. JSON can't represent them anyway.
- Decoding is strict: unknown fields, trailing data and bodies over 1 KB are
  rejected.
- `http.Server` has explicit timeouts and shuts down gracefully on
  SIGINT/SIGTERM. `main` only wires things together, so `cmd/server` has no
  tests; everything with logic is in `internal/`.

### Frontend

- The client validates format and the server validates math. The UI checks
  that each input is a number; division by zero and negative square roots are
  left to the API, so domain rules live in one place.
- Inputs are `type="text"` with a strict parser. `type="number"` reports
  invalid input as an empty string, so there is no way to say what is wrong,
  and `Number()` alone accepts `""` (as 0), `"0x10"` and `"Infinity"`.
- Results are shown with 15 significant digits, so `0.1 + 0.2` displays `0.3`.
  The API still returns the raw float64.
- The API client uses a discriminated union, so `b` is required for binary
  operations and rejected for `sqrt` at compile time. Responses are checked at
  runtime with type guards instead of casts.
- I chose a form over a keypad layout: two inputs and an operation picker make
  validation explicit and keep state simple. Operations are native radio
  inputs, so keyboard navigation and screen readers work without extra code.
- The layout doesn't shift when errors appear: error lines reserve their space
  and the card is anchored to the top of the page.
- Component tests render the whole calculator and only stub `fetch`, so they
  exercise the hook, validation, formatting and API client together.

### Deployment

- In production a single Go process serves both the API and the built
  frontend (`STATIC_DIR`): one container, one port, no CORS. In development,
  the Vite proxy gives the same single-origin setup.
- The runtime image is distroless with a static binary (`CGO_ENABLED=0`),
  running as a non-root user.
- CI runs on GitHub Actions. Sezzle uses GitLab CI; the pipeline would
  translate directly (parallel jobs, a dependent Docker stage, artifacts).

## Assumptions

- Percentage means "a percent of b": `percentage(20, 150) = 30`.
- Numbers are IEEE 754 float64, so integers above 2^53 lose precision. There
  is no arbitrary-precision arithmetic.
- Each calculation is a single operation (`a op b`, or `√a`). There is no
  expression parsing or operator precedence.

## Known limitations and next steps

- In development, if the backend is down, the Vite proxy answers 500 and the
  UI shows a generic error instead of "can't reach the server". In production
  both parts are served by the same process, so this doesn't apply.
- My machine doesn't support hardware virtualization, so I couldn't run Docker
  locally. The image is built and smoke-tested in CI on every push.
- With more time: end-to-end tests with Playwright against the Docker image,
  an OpenAPI spec for the API, and a short calculation history.

## AI usage

I used Claude as a pair programmer, working one step at a time. The prompts,
and what I kept or changed from each answer, are in [PROMPTS.md](PROMPTS.md).

Time spent: about 2 hours, including getting up to speed with Go.