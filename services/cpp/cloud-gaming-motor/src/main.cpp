#include <csignal>
#include <iostream>
#include <memory>

#include "digao/motor/capture.hpp"
#include "digao/motor/config.hpp"
#include "digao/motor/encoder.hpp"
#include "digao/motor/motor_service.hpp"
#include "digao/motor/publisher.hpp"

namespace {
std::atomic_bool running{true};

void handle_signal(int) { running.store(false); }
} // namespace

int main() {
  std::signal(SIGINT, handle_signal);
  std::signal(SIGTERM, handle_signal);

  auto config = digao::motor::load_config_from_env();

  std::cout << "[motor] socket=" << config.stream_socket_path << " fps=" << config.fps
            << " resolution=" << config.width << "x" << config.height
            << " mock_mode=" << (config.mock_mode ? "true" : "false") << std::endl;

  auto capturer = std::make_unique<digao::motor::MockFrameCapturer>(config);
  auto encoder = std::make_unique<digao::motor::MockH264Encoder>();
  auto publisher =
      std::make_unique<digao::motor::UnixSocketPublisher>(config.stream_socket_path);

  digao::motor::MotorService service(
      config,
      std::move(capturer),
      std::move(encoder),
      std::move(publisher));

  return service.run(running);
}
