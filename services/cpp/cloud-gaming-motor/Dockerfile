FROM debian:bookworm AS build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    ninja-build \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /src
COPY . .

RUN cmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=Release \
  && cmake --build build --target cloud-gaming-motor

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /src/build/cloud-gaming-motor /usr/local/bin/cloud-gaming-motor

ENV STREAM_SOCKET_PATH=/tmp/digao-cloud-gaming/stream.sock
ENV FPS=60
ENV WIDTH=1920
ENV HEIGHT=1080
ENV MOCK_MODE=true

ENTRYPOINT ["/usr/local/bin/cloud-gaming-motor"]
