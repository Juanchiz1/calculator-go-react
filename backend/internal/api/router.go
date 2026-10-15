// Package api exposes the calculator over HTTP.
package api

import (
	"net/http"

	"github.com/Juanchiz1/calculator-go-react/backend/internal/calculator"
)

type operation struct {
	operands int
	apply    func(a, b float64) (float64, error)
}

// operations maps the {op} path segment to its implementation.
// Adding a new operation is one line here plus its tests.
var operations = map[string]operation{
	"add":        {2, calculator.Add},
	"subtract":   {2, calculator.Subtract},
	"multiply":   {2, calculator.Multiply},
	"divide":     {2, calculator.Divide},
	"power":      {2, calculator.Power},
	"percentage": {2, calculator.Percentage},
	"sqrt":       {1, func(a, _ float64) (float64, error) { return calculator.Sqrt(a) }},
}

// NewRouter returns the HTTP handler with all API routes registered.
// When staticDir is not empty, it also serves the built frontend from it.
func NewRouter(staticDir string) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", handleHealth)
	mux.HandleFunc("POST /api/v1/{op}", handleCalculate)

	if staticDir != "" {
		mux.Handle("GET /", http.FileServer(http.Dir(staticDir)))
	}

	return mux
}
