# Host Hardening and Dev V1 Launchers

Objetivo: manter servidor acessivel e apto a stream mesmo com tampa fechada e preparado para o dev v1 do Digao Cloud Gaming com Sunshine como provider.

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

No dev v1, o Sunshine e o provider de stream principal. O backend Go continua sendo o hub de auth, catalogo e sessao, mas nao entrega video no navegador.

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

## 5) Catalogo manual e launchers do dev v1

Arquivos:

- `catalog.dev-v1.json`: catalogo manual do hub
- `start-steam-game.sh`: wrapper de jogos Steam aprovados
- `start-rpcs3-game.sh`: wrapper de jogos RPCS3 aprovados
- `cloud-gaming.host.env.example`: env base para o backend em modo Sunshine

Observacao sobre o RPCS3:

- o wrapper procura nesta ordem:
  - `RPCS3_BIN` no ambiente
  - `rpcs3` no `PATH`
  - AppImage padrao em `/data/downloads/rpcs3-v0.0.38-18397-5a9083e4_linux64.AppImage`

Fluxo esperado:

1. o hub autentica o usuario
2. o usuario inicia um jogo no catalogo
3. o backend reserva a sessao e executa o launcher correspondente
4. o jogo sobe no host
5. o stream segue no Sunshine, fora do navegador

O catalogo atual do dev v1 inclui:

- Steam: `Weed Shop 3`, `Schedule I`
- RPCS3: `God of War III`
- Ryujinx: apenas placeholder desabilitado

## 6) Validacao manual minima

1. subir o backend com `STREAM_PROVIDER=sunshine`
2. abrir o hub
3. iniciar `Weed Shop 3`
4. parar a sessao
5. iniciar `God of War III`
6. confirmar que o item de Ryujinx nao aparece no catalogo ativo
