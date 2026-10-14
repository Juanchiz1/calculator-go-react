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



  