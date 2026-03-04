# Deploy - Cloud Gaming

Subida conjunta do backend Go e motor C++.

## Subir

```bash
cd deploy/cloud-gaming
docker compose up -d --build
```

## Parar

```bash
cd deploy/cloud-gaming
docker compose down
```

## Logs

```bash
cd deploy/cloud-gaming
docker compose logs -f digao-cloud-gaming-backend digao-cloud-gaming-motor
```
