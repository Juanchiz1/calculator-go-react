// Package calculator implements the arithmetic operations exposed by the API.
// It has no knowledge of HTTP or JSON, which keeps it easy to test in isolation.
package calculator

import (
	"errors"
	"math"
)

var (
	ErrDivisionByZero  = errors.New("division by zero is not allowed")
	ErrNegativeSqrt    = errors.New("square root of a negative number is not a real number")
	ErrNonFiniteResult = errors.New("result is not a finite number")
)

// Add returns a + b.
func Add(a, b float64) (float64, error) {
	return finite(a + b)
}

// Subtract returns a - b.
func Subtract(a, b float64) (float64, error) {
	return finite(a - b)
}

// Multiply returns a * b.
func Multiply(a, b float64) (float64, error) {
	return finite(a * b)
}

// Divide returns a / b. It fails when b is zero.
func Divide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, ErrDivisionByZero
	}
	return finite(a / b)
}

// Power returns a raised to the power of b.
func Power(a, b float64) (float64, error) {
	return finite(math.Pow(a, b))
}

// Sqrt returns the square root of a. It fails when a is negative.
func Sqrt(a float64) (float64, error) {
	if a < 0 {
		return 0, ErrNegativeSqrt
	}
	return math.Sqrt(a), nil
}

// Percentage returns a percent of b, e.g. Percentage(20, 150) = 30.
func Percentage(a, b float64) (float64, error) {
	return finite(a * b / 100)
}

// finite rejects Inf and NaN, which can come from overflow or from
// operations like 0^-1. JSON cannot represent those values either.
func finite(v float64) (float64, error) {
	if math.IsInf(v, 0) || math.IsNaN(v) {
		return 0, ErrNonFiniteResult
	}
	return v, nil
}
