FROM golang:1.22-bookworm AS build
WORKDIR /src

COPY go.mod go.sum* ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/cloud-gaming ./cmd/server

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    bash \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /out/cloud-gaming /app/cloud-gaming

EXPOSE 8080
ENTRYPOINT ["/app/cloud-gaming"]
