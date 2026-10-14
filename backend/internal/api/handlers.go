package api

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
)

// Operands are pointers so a missing field (nil) can be told apart
// from an explicit zero, which is a valid operand.
type calculationRequest struct {
	A *float64 `json:"a"`
	B *float64 `json:"b"`
}

type calculationResponse struct {
	Operation string  `json:"operation"`
	Result    float64 `json:"result"`
}

func handleHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func handleCalculate(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("op")

	op, ok := operations[name]
	if !ok {
		writeError(w, newError(http.StatusNotFound, codeUnknownOperation,
			fmt.Sprintf("operation %q is not supported", name)))
		return
	}

	var req calculationRequest
	if apiErr := decodeJSON(w, r, &req); apiErr != nil {
		writeError(w, apiErr)
		return
	}
	if apiErr := validateOperands(req, op.operands); apiErr != nil {
		writeError(w, apiErr)
		return
	}

	var b float64
	if req.B != nil {
		b = *req.B
	}

	result, err := op.apply(*req.A, b)
	if err != nil {
		writeError(w, fromDomainError(err))
		return
	}

	writeJSON(w, http.StatusOK, calculationResponse{Operation: name, Result: result})
}

func validateOperands(req calculationRequest, operands int) *apiError {
	switch {
	case req.A == nil:
		return newError(http.StatusBadRequest, codeMissingOperand, `field "a" is required`)
	case operands == 2 && req.B == nil:
		return newError(http.StatusBadRequest, codeMissingOperand, `field "b" is required`)
	case operands == 1 && req.B != nil:
		return badRequest(`field "b" is not allowed for this operation`)
	}
	return nil
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		slog.Error("failed to write response", "err", err)
	}
}

func writeError(w http.ResponseWriter, e *apiError) {
	writeJSON(w, e.Status, errorResponse{Error: e})
}
