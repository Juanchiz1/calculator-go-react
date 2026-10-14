package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
)

// maxBodyBytes is far above any valid request; it only guards against abuse.
const maxBodyBytes = 1 << 10 // 1 KB

// decodeJSON reads exactly one JSON object into dst, rejecting unknown
// fields, trailing data and oversized bodies.
func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) *apiError {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)

	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	if err := dec.Decode(dst); err != nil {
		return decodeError(err)
	}
	if err := dec.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return badRequest("request body must contain a single JSON object")
	}
	return nil
}

func decodeError(err error) *apiError {
	var syntaxErr *json.SyntaxError
	var typeErr *json.UnmarshalTypeError
	var maxErr *http.MaxBytesError

	switch {
	case errors.Is(err, io.EOF):
		return badRequest("request body must not be empty")

	case errors.As(err, &syntaxErr), errors.Is(err, io.ErrUnexpectedEOF):
		return badRequest("request body contains malformed JSON")

	case errors.As(err, &typeErr):
		if typeErr.Field == "" {
			return badRequest("request body must be a JSON object")
		}
		return badRequest(fmt.Sprintf("field %q must be a number", typeErr.Field))

	// encoding/json has no typed error for unknown fields, so the message
	// is matched. The tests cover this case in case it ever changes.
	case strings.HasPrefix(err.Error(), "json: unknown field "):
		field := strings.TrimPrefix(err.Error(), "json: unknown field ")
		return badRequest("unknown field " + field)

	case errors.As(err, &maxErr):
		return newError(http.StatusRequestEntityTooLarge, codePayloadTooLarge,
			fmt.Sprintf("request body must not exceed %d bytes", maxErr.Limit))

	default:
		return badRequest("invalid request body")
	}
}
