package api

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestLogRequests(t *testing.T) {
	tests := []struct {
		name       string
		handler    http.HandlerFunc
		wantStatus int
	}{
		{
			name: "explicit status",
			handler: func(w http.ResponseWriter, _ *http.Request) {
				w.WriteHeader(http.StatusTeapot)
			},
			wantStatus: http.StatusTeapot,
		},
		{
			name: "implicit 200",
			handler: func(w http.ResponseWriter, _ *http.Request) {
				_, _ = w.Write([]byte("ok"))
			},
			wantStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var buf bytes.Buffer
			logger := slog.New(slog.NewJSONHandler(&buf, nil))

			req := httptest.NewRequest(http.MethodPost, "/api/v1/add", nil)
			rec := httptest.NewRecorder()
			LogRequests(logger, tt.handler).ServeHTTP(rec, req)

			if rec.Code != tt.wantStatus {
				t.Fatalf("response status = %d, want %d", rec.Code, tt.wantStatus)
			}

			var entry map[string]any
			if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
				t.Fatalf("log output is not valid JSON: %v (%s)", err, buf.String())
			}
			if entry["method"] != http.MethodPost {
				t.Errorf("method = %v, want %s", entry["method"], http.MethodPost)
			}
			if entry["path"] != "/api/v1/add" {
				t.Errorf("path = %v, want /api/v1/add", entry["path"])
			}
			if entry["status"] != float64(tt.wantStatus) {
				t.Errorf("status = %v, want %d", entry["status"], tt.wantStatus)
			}
			if _, ok := entry["duration"]; !ok {
				t.Error("duration missing from log entry")
			}
		})
	}
}
