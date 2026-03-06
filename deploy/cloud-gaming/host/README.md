# Host Hardening (Notebook Tampa Fechada)

Objetivo: manter servidor acessivel e apto a stream mesmo com tampa fechada.

## 1) Aplicar modo tampa-fechada (root)

```bash
cd /data/apps/worktrees/cloud-gaming/deploy/cloud-gaming/host
sudo bash ./enable-lid-closed-mode.sh rodrigo
```

Isso configura:

- `HandleLidSwitch=ignore`
- desativa suspend/hibernate no `systemd`
- habilita `linger`, `sshd` e `tailscaled`

## 2) Sunshine no usuario

```bash
systemctl --user enable --now sunshine
```

## 3) Monitor virtual / externo

Para captura confiavel com tampa fechada, mantenha:

- monitor externo ligado, **ou**
- HDMI dummy plug conectado

Sem isso, captura KMS/PipeWire pode falhar em alguns boots.

## 4) Preflight de prontidao

```bash
cd /data/apps/worktrees/cloud-gaming/deploy/cloud-gaming/host
./preflight.sh
```

Saidas:

- `PASS`: pronto
- `WARN`: roda, mas com risco (ex.: sem monitor)
- `FAIL`: precisa corrigir antes (ex.: sem ssh/tailscale)
