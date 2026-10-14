package calculator

import (
	"errors"
	"math"
	"testing"
)

const epsilon = 1e-9

func TestBinaryOperations(t *testing.T) {
	tests := []struct {
		name    string
		op      func(a, b float64) (float64, error)
		a, b    float64
		want    float64
		wantErr error
	}{
		{"add positives", Add, 2, 3, 5, nil},
		{"add negatives", Add, -2, -3, -5, nil},
		{"add decimals", Add, 0.1, 0.2, 0.3, nil},
		{"add overflow", Add, math.MaxFloat64, math.MaxFloat64, 0, ErrNonFiniteResult},

		{"subtract", Subtract, 10, 4, 6, nil},
		{"subtract to negative", Subtract, 4, 10, -6, nil},

		{"multiply", Multiply, 3, 4, 12, nil},
		{"multiply by zero", Multiply, 5, 0, 0, nil},
		{"multiply overflow", Multiply, 1e308, 10, 0, ErrNonFiniteResult},

		{"divide", Divide, 10, 4, 2.5, nil},
		{"divide negative", Divide, -9, 3, -3, nil},
		{"divide by zero", Divide, 5, 0, 0, ErrDivisionByZero},
		{"divide zero by zero", Divide, 0, 0, 0, ErrDivisionByZero},

		{"power", Power, 2, 10, 1024, nil},
		{"power negative exponent", Power, 2, -1, 0.5, nil},
		{"power zero to negative exponent", Power, 0, -1, 0, ErrNonFiniteResult},
		{"power negative base fractional exponent", Power, -8, 0.5, 0, ErrNonFiniteResult},
		{"power overflow", Power, 10, 400, 0, ErrNonFiniteResult},

		{"percentage", Percentage, 20, 150, 30, nil},
		{"percentage of zero", Percentage, 50, 0, 0, nil},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := tt.op(tt.a, tt.b)
			assertResult(t, got, err, tt.want, tt.wantErr)
		})
	}
}

func TestSqrt(t *testing.T) {
	tests := []struct {
		name    string
		a       float64
		want    float64
		wantErr error
	}{
		{"perfect square", 16, 4, nil},
		{"zero", 0, 0, nil},
		{"irrational result", 2, math.Sqrt2, nil},
		{"negative input", -4, 0, ErrNegativeSqrt},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Sqrt(tt.a)
			assertResult(t, got, err, tt.want, tt.wantErr)
		})
	}
}

func assertResult(t *testing.T, got float64, err error, want float64, wantErr error) {
	t.Helper()

	if wantErr != nil {
		if !errors.Is(err, wantErr) {
			t.Fatalf("expected error %v, got %v", wantErr, err)
		}
		return
	}
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if math.Abs(got-want) > epsilon {
		t.Errorf("got %v, want %v", got, want)
	}
}
