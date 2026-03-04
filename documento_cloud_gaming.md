Documento de Requisitos de Software (DRS) - Sistema de Cloud Gaming (MVP)
1. Visão Geral do Sistema
O sistema tem como objetivo permitir o streaming de jogos de um servidor local (CachyOS) para dispositivos clientes remotos (Ubuntu/macOS) através de uma rede VPN (Tailscale). A arquitetura utilizará o padrão WebRTC para garantir baixíssima latência. O backend será dividido em um "Motor" de captura/encode (C/C++) e um "Cérebro" de rede e orquestração (Go). O cliente será uma aplicação Web leve.

2. Escopo do MVP (Fase 1)
O escopo inicial foca estritamente na entrega de vídeo de alta performance e controles básicos, postergando áudio e suporte a joysticks para fases futuras. O objetivo é validar a viabilidade da latência e da qualidade de imagem na infraestrutura atual.

3. Requisitos Funcionais (RF)
RF01 - Captura de Tela (Motor): O sistema deve capturar os frames de vídeo do servidor de display Wayland utilizando a API do PipeWire no CachyOS.

RF02 - Codificação de Vídeo (Motor): O sistema deve codificar os frames capturados em formato H.264 utilizando aceleração de hardware exclusiva da GPU NVIDIA (via NVENC).

RF03 - Comunicação Interprocessos (Ponte): O "Motor" (C/C++) deve transferir os frames já codificados para o "Cérebro" (Go) com o menor overhead de memória possível (idealmente zero-copy ou compartilhamento de memória).

RF04 - Streaming de Vídeo (Cérebro): O backend em Go deve empacotar os frames H.264 e transmiti-los via protocolo WebRTC (utilizando a biblioteca Pion).

RF05 - Cliente Web: Deve existir uma interface web (HTML5/JS) capaz de se conectar ao servidor Go, estabelecer a conexão WebRTC (Sinalização) e exibir o stream de vídeo em um elemento <video>.

RF06 - Captura de Input (Cliente): O cliente web deve capturar eventos de pressionamento de teclas (Keyboard) e movimentos/cliques de mouse e enviá-los de volta ao servidor via WebRTC Data Channels.

RF07 - Injeção de Input (Servidor): O servidor Go deve receber os comandos do cliente e simulá-los no nível do sistema operacional do CachyOS utilizando a interface uinput (dispositivos virtuais do kernel Linux).

4. Requisitos Não Funcionais (RNF)
RNF01 - Resolução e Taxa de Quadros: O stream deve ser fixado em 1920x1080 pixels (Full HD) a 60 Quadros Por Segundo (FPS).

RNF02 - Linguagens e Tecnologias base: O Motor será desenvolvido em C ou C++; o Servidor de rede em Go; o Cliente em HTML/Vanilla JS.

RNF03 - Ambiente do Servidor: O servidor deve rodar exclusivamente em ambiente Linux (CachyOS) sob o protocolo Wayland.

RNF04 - Ambiente do Cliente: O cliente deve ser acessível via navegadores modernos (baseados em Chromium ou WebKit) no Ubuntu e macOS M1.

RNF05 - Rede: O tráfego deve trafegar pela rede local ou túnel Tailscale existente, não exigindo abertura de portas no roteador (NAT traversal não é o foco inicial).

5. Fora de Escopo (Fase 1)
Captura e transmissão de áudio do sistema ou do microfone.

Suporte a Gamepads (Controles de Xbox, PlayStation, etc.).

Ajuste dinâmico de bitrate (a qualidade não vai cair se a rede ficar ruim, ela simplesmente vai travar no MVP).

Interface gráfica complexa de login ou biblioteca de jogos (o cliente apenas abre direto na tela).