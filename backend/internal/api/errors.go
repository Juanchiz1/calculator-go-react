package api

import (
	"errors"
	"net/http"

	"github.com/Juanchiz1/calculator-go-react/backend/internal/calculator"
)

// Error codes are part of the API contract: clients branch on them,
// so they must stay stable even if the messages change.
const (
	codeInvalidRequest   = "INVALID_REQUEST"
	codeMissingOperand   = "MISSING_OPERAND"
	codePayloadTooLarge  = "PAYLOAD_TOO_LARGE"
	codeUnknownOperation = "UNKNOWN_OPERATION"
	codeDivisionByZero   = "DIVISION_BY_ZERO"
	codeNegativeSqrt     = "NEGATIVE_SQRT"
	codeNonFiniteResult  = "NON_FINITE_RESULT"
	codeInternal         = "INTERNAL_ERROR"
)

type apiError struct {
	Status  int    `json:"-"`
	Code    string `json:"code"`
	Message string `json:"message"`
}

type errorResponse struct {
	Error *apiError `json:"error"`
}

func newError(status int, code, message string) *apiError {
	return &apiError{Status: status, Code: code, Message: message}
}

func badRequest(message string) *apiError {
	return newError(http.StatusBadRequest, codeInvalidRequest, message)
}

// fromDomainError translates calculator errors into HTTP errors.
// They use 422 instead of 400: the request is well-formed,
// but the operation cannot produce a valid number.
func fromDomainError(err error) *apiError {
	switch {
	case errors.Is(err, calculator.ErrDivisionByZero):
		return newError(http.StatusUnprocessableEntity, codeDivisionByZero, err.Error())
	case errors.Is(err, calculator.ErrNegativeSqrt):
		return newError(http.StatusUnprocessableEntity, codeNegativeSqrt, err.Error())
	case errors.Is(err, calculator.ErrNonFiniteResult):
		return newError(http.StatusUnprocessableEntity, codeNonFiniteResult, err.Error())
	default:
		return newError(http.StatusInternalServerError, codeInternal, "unexpected error")
	}
}
