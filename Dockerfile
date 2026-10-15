# syntax=docker/dockerfile:1

# ---- Build the frontend ----
FROM node:24-slim AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Build the backend ----
FROM golang:1.27-alpine AS backend
WORKDIR /src
COPY backend/go.mod ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /server ./cmd/server

# ---- Runtime: static binary + built frontend, nothing else ----
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=backend /server /server
COPY --from=frontend /app/dist /static
ENV PORT=8080 \
    STATIC_DIR=/static
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/server"]