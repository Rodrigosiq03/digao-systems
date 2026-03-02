#include "digao/motor/motor_service.hpp"

#include <chrono>
#include <iostream>
#include <thread>

namespace digao::motor {

MotorService::MotorService(MotorConfig config,
                           std::unique_ptr<FrameCapturer> capturer,
                           std::unique_ptr<VideoEncoder> encoder,
                           std::unique_ptr<EncodedFramePublisher> publisher)
    : config_(std::move(config)),
      capturer_(std::move(capturer)),
      encoder_(std::move(encoder)),
      publisher_(std::move(publisher)) {}

int MotorService::run(const std::atomic_bool& running) {
  const auto frame_period = std::chrono::microseconds(1000000 / config_.fps);

  while (running.load()) {
    const auto started_at = std::chrono::steady_clock::now();

    auto frame = capturer_->capture_next();
    auto encoded = encoder_->encode(frame);
    if (!publisher_->publish(encoded)) {
      std::cerr << "[motor] publish failed; retrying..." << std::endl;
    }

    const auto elapsed =
        std::chrono::duration_cast<std::chrono::microseconds>(
            std::chrono::steady_clock::now() - started_at);
    if (elapsed < frame_period) {
      std::this_thread::sleep_for(frame_period - elapsed);
    }
  }

  return 0;
}

} // namespace digao::motor
