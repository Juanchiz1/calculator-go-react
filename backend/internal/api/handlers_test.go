package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestCalculate(t *testing.T) {
	router := NewRouter("")

	tests := []struct {
		name       string
		path       string
		body       string
		wantStatus int
		wantResult float64
		wantCode   string
	}{
		{"add", "/api/v1/add", `{"a": 2, "b": 3}`, http.StatusOK, 5, ""},
		{"divide", "/api/v1/divide", `{"a": 10, "b": 4}`, http.StatusOK, 2.5, ""},
		{"zero is a valid operand", "/api/v1/multiply", `{"a": 0, "b": 7}`, http.StatusOK, 0, ""},
		{"sqrt takes one operand", "/api/v1/sqrt", `{"a": 16}`, http.StatusOK, 4, ""},
		{"percentage", "/api/v1/percentage", `{"a": 20, "b": 150}`, http.StatusOK, 30, ""},

		{"division by zero", "/api/v1/divide", `{"a": 1, "b": 0}`, http.StatusUnprocessableEntity, 0, "DIVISION_BY_ZERO"},
		{"sqrt of negative", "/api/v1/sqrt", `{"a": -4}`, http.StatusUnprocessableEntity, 0, "NEGATIVE_SQRT"},
		{"overflow", "/api/v1/multiply", `{"a": 1e308, "b": 10}`, http.StatusUnprocessableEntity, 0, "NON_FINITE_RESULT"},

		{"missing operand", "/api/v1/add", `{"a": 2}`, http.StatusBadRequest, 0, "MISSING_OPERAND"},
		{"null operand", "/api/v1/add", `{"a": 2, "b": null}`, http.StatusBadRequest, 0, "MISSING_OPERAND"},
		{"extra operand for sqrt", "/api/v1/sqrt", `{"a": 4, "b": 2}`, http.StatusBadRequest, 0, "INVALID_REQUEST"},
		{"string operand", "/api/v1/add", `{"a": "2", "b": 3}`, http.StatusBadRequest, 0, "INVALID_REQUEST"},
		{"unknown field", "/api/v1/add", `{"a": 1, "b": 2, "c": 3}`, http.StatusBadRequest, 0, "INVALID_REQUEST"},
		{"malformed json", "/api/v1/add", `{"a": 1,`, http.StatusBadRequest, 0, "INVALID_REQUEST"},
		{"empty body", "/api/v1/add", ``, http.StatusBadRequest, 0, "INVALID_REQUEST"},
		{"array body", "/api/v1/add", `[1, 2]`, http.StatusBadRequest, 0, "INVALID_REQUEST"},
		{"multiple objects", "/api/v1/add", `{"a": 1, "b": 2}{"a": 3}`, http.StatusBadRequest, 0, "INVALID_REQUEST"},
		{"body too large", "/api/v1/add", `{"a": 1, "b": 2` + strings.Repeat(" ", 2048) + `}`, http.StatusRequestEntityTooLarge, 0, "PAYLOAD_TOO_LARGE"},

		{"unknown operation", "/api/v1/modulo", `{"a": 1, "b": 2}`, http.StatusNotFound, 0, "UNKNOWN_OPERATION"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rec := doRequest(t, router, http.MethodPost, tt.path, tt.body)

			if rec.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d (body: %s)", rec.Code, tt.wantStatus, rec.Body)
			}
			if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
				t.Errorf("Content-Type = %q, want application/json", ct)
			}

			if tt.wantCode != "" {
				var got errorResponse
				decodeBody(t, rec, &got)
				if got.Error == nil || got.Error.Code != tt.wantCode {
					t.Errorf("error = %+v, want code %s", got.Error, tt.wantCode)
				}
				return
			}

			var got calculationResponse
			decodeBody(t, rec, &got)
			if got.Result != tt.wantResult {
				t.Errorf("result = %v, want %v", got.Result, tt.wantResult)
			}
			if want := strings.TrimPrefix(tt.path, "/api/v1/"); got.Operation != want {
				t.Errorf("operation = %q, want %q", got.Operation, want)
			}
		})
	}
}

func TestHealth(t *testing.T) {
	rec := doRequest(t, NewRouter(""), http.MethodGet, "/health", "")
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
}

func TestMethodNotAllowed(t *testing.T) {
	rec := doRequest(t, NewRouter(""), http.MethodGet, "/api/v1/add", "")
	if rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusMethodNotAllowed)
	}
}

func doRequest(t *testing.T, h http.Handler, method, path, body string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func decodeBody(t *testing.T, rec *httptest.ResponseRecorder, dst any) {
	t.Helper()
	if err := json.NewDecoder(rec.Body).Decode(dst); err != nil {
		t.Fatalf("decoding response: %v (body: %s)", err, rec.Body)
	}
}

func TestServesStaticFilesAlongsideAPI(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "index.html"), []byte("<h1>calculator</h1>"), 0o644); err != nil {
		t.Fatal(err)
	}

	router := NewRouter(dir)

	rec := doRequest(t, router, http.MethodGet, "/", "")
	if rec.Code != http.StatusOK {
		t.Fatalf("GET / status = %d, want %d", rec.Code, http.StatusOK)
	}
	if !strings.Contains(rec.Body.String(), "<h1>calculator</h1>") {
		t.Errorf("GET / did not serve index.html, got: %s", rec.Body)
	}

	rec = doRequest(t, router, http.MethodPost, "/api/v1/add", `{"a": 1, "b": 2}`)
	if rec.Code != http.StatusOK {
		t.Errorf("API route status = %d, want %d", rec.Code, http.StatusOK)
	}
}
