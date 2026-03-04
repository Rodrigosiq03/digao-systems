FROM golang:1.22-bookworm AS build
WORKDIR /src

COPY go.mod go.sum* ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/cloud-gaming ./cmd/server

FROM gcr.io/distroless/base-debian12:nonroot
WORKDIR /app
COPY --from=build /out/cloud-gaming /app/cloud-gaming

EXPOSE 8080
ENTRYPOINT ["/app/cloud-gaming"]
