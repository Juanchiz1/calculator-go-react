## 1. Planning and architecture
**Prompt** (originally in Spanish, translated):
> I'm applying to this job: [pasted the full job posting]. They sent me this
> assessment: [pasted the full assignment]. Guide me step by step to design
> it and do as well as possible on this technical assessment.

**Outcome:** I asked for step-by-step guidance instead of a finished solution,
because Go is new to me and I want to understand everything I submit.
Kept from the answer:
- Monorepo with `backend/` (Go) and `frontend/` (React + TS)
- stdlib `net/http` with Go 1.22 routing patterns instead of a framework
- REST contract `POST /api/v1/{op}` with a consistent error shape (400 / 422 / 404)
- Edge cases to cover: missing fields vs. zero (`*float64`), Inf/NaN results,
  unknown JSON fields, body size limit
- Single multi-stage Dockerfile, validated in GitHub Actions since Docker
  Desktop doesn't run on my machine

## 2. Calculator domain package (TDD)
**Prompt:** No new prompt. I shared my `go version` (1.27.2) and `node -v`
(v24.11.0) output to confirm the environment, which was the agreed signal
to continue with the next step of the plan.

**Outcome:**
- Wrote `calculator_test.go` first and confirmed it failed to compile
  before writing the implementation
- Table-driven tests with `t.Run` subtests and a `t.Helper()` assertion
  helper; floats compared with an epsilon instead of `==`
- Sentinel errors (`ErrDivisionByZero`, `ErrNegativeSqrt`,
  `ErrNonFiniteResult`) checked with `errors.Is`, so the HTTP layer can map
  them to status codes without comparing strings
- Every operation returns `(float64, error)`, including `Add`, because
  overflow to `+Inf` is possible; the uniform signature also lets the API
  look operations up in a map
- A `finite()` guard rejects Inf/NaN results (overflow, `0^-1`,
  `(-8)^0.5`), which JSON can't encode anyway
- Assumption: percentage means "a percent of b" (`a * b / 100`)
- Result: 100.0% coverage, `go vet` and `gofmt -l` clean



## 3. HTTP layer
**Prompt:** No new prompt. I shared the step 2 coverage output to continue
with the plan.

**Outcome:**
- Four small files in `internal/api`: router, handlers, request decoding,
  and error mapping
- One generic handler for every operation: a map from the `{op}` path
  segment to an `operation{operands, apply}`; `sqrt` is wrapped to fit the
  binary signature and `operands` drives validation
- Request decoding rejects empty bodies, malformed JSON, non-numeric
  operands, unknown fields, trailing data, and bodies over 1 KB (413)
- Pointer operands so a missing or `null` field returns `MISSING_OPERAND`
  instead of being treated as zero
- Domain errors mapped with `errors.Is` to 422; error codes are stable
  constants meant for clients to branch on
- Tests use `httptest` against the real router and check status,
  Content-Type, error code, and result
- Result: 93.8% coverage on `api`; the uncovered lines are defensive
  branches (unknown domain error, failed response write)
- Found that `gofmt -l` flagged every file because of CRLF line endings on
  Windows; fixed with `gofmt -w` and a `.gitattributes` that enforces LF

## 4. Server entrypoint
**Prompt:** No new prompt. I confirmed `gofmt` was clean and asked to
continue with the project.

**Outcome:**
- `cmd/server/main.go` only wires dependencies; logic lives in `internal/`
- `PORT` from the environment with 8080 as default (needed later for Docker)
- `http.Server` with explicit timeouts instead of `http.ListenAndServe`,
  which has none and is exposed to slow-client attacks
- Graceful shutdown with `signal.NotifyContext` on SIGINT/SIGTERM and a
  10 s drain window
- `run()` returns errors to `main()` so deferred cleanup runs before `os.Exit`
- Request-logging middleware using `log/slog`, tested by capturing JSON
  log output in a buffer
- Checked every endpoint manually with curl; piped JSON through stdin
  because PowerShell strips double quotes from native command arguments