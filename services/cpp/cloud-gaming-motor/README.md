# Cloud Gaming Motor (C++)

Motor de captura/encode do cloud gaming, separado no monorepo para evoluir do mock para PipeWire + NVENC.

## Estrutura

- `include/`: contratos do motor
- `src/`: implementacoes (captura, encoder, IPC e loop principal)
- `tests/`: testes de parser/config

## Build local

```bash
cd services/cpp/cloud-gaming-motor
cmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build build
ctest --test-dir build --output-on-failure
```

## Execucao

```bash
STREAM_SOCKET_PATH=/tmp/digao-cloud-gaming/stream.sock ./build/cloud-gaming-motor
```

O payload atual e mock (Annex-B sintetico) para validar pipeline de transporte. O proximo passo e trocar `MockFrameCapturer`/`MockH264Encoder` por PipeWire + NVENC.
