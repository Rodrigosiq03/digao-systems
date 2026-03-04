Documento de Arquitetura Técnica - Digão Cloud Gaming (Fase Dev/MVP)
1. O que o Backend Exporá (A Abordagem "Zero-React")
O backend em Go atuará como um servidor web e de streaming simultaneamente. Ele expõe apenas três rotas/serviços fundamentais, eliminando a necessidade de qualquer servidor frontend separado (como Nginx ou Node.js):

GET / (Servidor de Arquivos Estáticos): O Go utilizará a diretiva //go:embed para embutir um arquivo index.html e um app.js (Vanilla JavaScript) diretamente dentro do binário compilado. Quando o cliente acessar o IP do Tailscale, o Go entrega essa interface levíssima em milissegundos.

WS /ws (WebSocket para Sinalização): Antes do vídeo rodar, o navegador e o servidor precisam trocar "coordenadas" (ofertas e respostas SDP do WebRTC). O WebSocket mantém uma conexão bidirecional rápida apenas para essa negociação inicial.

Portas UDP Dinâmicas (Tráfego WebRTC): Após a sinalização via WebSocket, a biblioteca Pion (no Go) abre portas UDP de alta performance diretamente pela rede host para enviar o vídeo (H.264) e receber os inputs via Data Channels.

2. A Interface Minimalista (O Cliente Dev)
O index.html servido pelo Go terá apenas:

Um elemento <video autoplay muted playsinline id="game-stream"></video> que ocupará 100% da tela.

O app.js fará a conexão WebSocket, criará o objeto RTCPeerConnection nativo do navegador, injetará o stream recebido na tag de vídeo e capturará eventos globais do document (keydown, mousemove, etc.), enviando-os como JSON puro via WebRTC Data Channel.

3. Containerização (O docker-compose.yml de Dev)
Para rodar esse monólito Go/C++ acessando a GTX 1050 e o Wayland, o Docker Compose precisa de privilégios específicos. O arquivo base será estruturado assim:

YAML

version: '3.8'

services:
  digao-cloud-gaming:
    build: .
    container_name: digao-backend
    network_mode: "host" # Crítico para o WebRTC não sofrer com NAT do Docker
    privileged: true     # Necessário para injeção de input via uinput
    environment:
      - DISPLAY=$DISPLAY
      - WAYLAND_DISPLAY=$WAYLAND_DISPLAY
      - XDG_RUNTIME_DIR=/run/user/1000
    volumes:
      # Socket do PipeWire para captura de tela (Wayland)
      - /run/user/1000/pipewire-0:/run/user/1000/pipewire-0
      # Dispositivo virtual para injeção de teclado/mouse
      - /dev/uinput:/dev/uinput
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia # Habilita acesso ao NVENC da GTX 1050
              count: 1
              capabilities: [gpu, video]
4. Pipeline de CI/CD (GitHub Actions Self-Hosted)
Como o runner do GitHub Actions já está ativo na própria máquina, o pipeline se torna um script de automação de deploy extremamente rápido, sem precisar enviar imagens Docker para um registry externo (como o Docker Hub).

O arquivo .github/workflows/deploy.yml executará os seguintes passos a cada git push na branch main:

Checkout do Código: Baixa a versão mais recente do repositório.

Build do Binário e Imagem: Executa docker build -t digao-cloud-gaming:latest . (O Dockerfile multi-stage cuidará de instalar as dependências em C, compilar o Go com CGO e gerar a imagem final).

Deploy Automático: Executa docker compose down seguido de docker compose up -d para reiniciar o serviço com o código novo.

Limpeza: Executa um docker image prune -f para não lotar o seu HD de 1TB com imagens antigas.

5. Plano de Ação - O Mínimo para Funcionar Hoje
Para termos algo palpável o mais rápido possível, a ordem de execução deve isolar as complexidades:

Passo 1: Criar um servidor Go simples que serve um HTML estático contendo um <video> de teste (um arquivo .mp4 local em loop), apenas para validar o acesso pelo browser no Mac/Ubuntu via Tailscale.

Passo 2: Substituir o .mp4 por uma conexão WebRTC (Pion) real, gerando frames de cores sólidas aleatórias em Go e enviando para o browser. (Valida a rede UDP e a sinalização).

Passo 3: Implementar a chamada CGO que puxa um frame real do PipeWire e joga no stream WebRTC.

Passo 4: Ativar o NVENC para compressão.

Passo 5: Implementar a injeção de input (uinput).