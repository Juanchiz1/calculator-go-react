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



