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

## 5. Frontend scaffold and API client
**Prompt:** No new prompt. I shared the manual curl results and asked to
continue with the next stage.

**Outcome:**
- Vite + React + TypeScript, with Vitest, React Testing Library and v8 coverage
- Vite dev proxy for `/api` and `/health`, so the backend needs no CORS setup
- Typed API client: a discriminated union makes `b` required for binary
  operations and forbidden for `sqrt` at compile time
- Response bodies treated as `unknown` and checked with type guards instead
  of casts; backend errors become a typed `ApiError` with a stable `code`
- Handles network failures, non-JSON error bodies (Go's plain-text 405) and
  unknown error codes
- Tests stub `fetch` with `vi.stubGlobal`; no real network calls
- Result: XX% coverage on `src/api`

## 6. UI logic (validation, formatting, error messages)
**Prompt:** No new prompt. I shared the frontend coverage output and asked
to continue.

**Outcome:**
- Split responsibilities: the client validates number format, the backend
  validates the math (division by zero is left to the API on purpose, so
  domain rules live in one place)
- Strict number parsing with a regex, because `Number()` accepts `""`,
  `"0x10"` and `"Infinity"`; a specific message for comma decimals
- Results rounded to 15 significant digits for display, so `0.1 + 0.2`
  shows `0.3`; the API still returns the raw float64
- Stable backend error codes mapped to user-facing messages in one place
- Operation metadata typed as `Record<Operation, ...>`, so a new operation
  won't compile until it has labels
- Result: XX% coverage on `src/lib`


## 7. Calculator UI
**Prompt:** No new prompt. I shared the step 6 coverage output and asked to
continue.

**Outcome:**
- `useCalculator` hook holds state; the result is a discriminated union
  (`idle | loading | success | error`) so impossible states can't exist
- Inputs keep raw strings and are only parsed on submit, so partial input
  like `-` or `1.` is allowed while typing
- `type="text"` instead of `type="number"`, which returns `""` for invalid
  input and gives no way to explain what is wrong; no `inputMode="decimal"`
  because the iOS decimal keypad has no minus key
- Operations are native radio inputs styled as buttons: arrow-key
  navigation and screen reader support for free
- `aria-invalid`, `aria-describedby` and an `aria-live` result region
- CSS custom properties with automatic dark mode; 48 px touch targets;
  layout checked at 375 px
- Found while testing: with the backend down, the Vite dev proxy answers
  500, so the UI shows the generic error instead of the network error


## 8. UX fixes after manual testing
**Prompt** (originally in Spanish, translated):
> Everything works, but the interface sometimes doesn't feel very friendly.
> It's missing a button to clear everything I typed, and the calculator
> changes size when error messages appear.

**Outcome:**
- Found two causes for the layout shift: error paragraphs were mounted and
  unmounted, and the card was vertically centered, so any height change
  moved its top edge too
- Error lines are now always rendered with a reserved height (also a more
  reliable `role="alert"` live region); the card is anchored to the top
- Shortened the comma error so it fits on one line at 375 px
- Added a secondary Clear button (`type="button"`, disabled while loading
  to avoid a stale response refilling the result) that returns focus to
  the first field, using React 19's `ref` as a regular prop
- Fixed the `xʸ` symbol spacing caused by the monospace font  


## 9. Component tests
**Prompt** (originally in Spanish, translated):
> Done. Next time don't forget to give me the commands to run the backend
> and the frontend. Let's continue with the project.

**Outcome:**
- `Calculator` tested as a whole through `userEvent`, with only `fetch`
  stubbed, so tests exercise the hook, validation, formatting and API
  client together and survive internal refactors
- Queries by role and label (`getByRole('radio', { name: 'Divide' })`),
  which doubles as an accessibility check; `toHaveAccessibleDescription`
  verifies the `aria-describedby` wiring
- Covered: happy path, Enter-key submit, field errors without an API call,
  error clearing on input, API error messages, sqrt with one operand,
  buttons disabled during a pending request (manually resolved promise),
  and Clear restoring focus
- Shared `jsonResponse` test helper in `src/test/`
- Coverage thresholds at 90% so `npm run coverage` fails on regressions
- Also caught by tests: changing an error message in `validation.ts`
  without updating its test failed two cases, as it should
- Result: XX% overall frontend coverage

## 10. Docker and CI
**Prompt:** No new prompt. I shared the frontend coverage output and asked
to continue.

**Outcome:**
- The Go server optionally serves the built frontend (`STATIC_DIR`), so
  production is one process, one port and no CORS; tested with a temp dir
- Verified production mode locally without Docker by pointing `STATIC_DIR`
  at `frontend/dist`
- Multi-stage Dockerfile: Node and Go only at build time; runtime is a
  static binary (`CGO_ENABLED=0`) plus assets on distroless, as non-root
- `.dockerignore` keeps the Windows `node_modules` out of the Linux build
- GitHub Actions: Go (gofmt check, vet, tests with `-race`) and frontend
  (lint, coverage with thresholds, build) in parallel, then a Docker job
  that builds the image and smoke-tests the running container
- Coverage reports uploaded as CI artifacts
- Docker Desktop doesn't run on my machine, so CI is where the image is
  built and verified

## 11. README
**Prompt:** No new prompt. I confirmed the CI workflow folder was set up
correctly and asked to continue.

**Outcome:**
- README covering setup, running each part, Docker, configuration, tests
  and coverage, API reference with error codes and curl examples (including
  the PowerShell variant), project structure, design decisions, assumptions
  and known limitations
- Removed the README generated by the Vite template
