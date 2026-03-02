#pragma once

#include <atomic>
#include <memory>

#include "digao/motor/capture.hpp"
#include "digao/motor/config.hpp"
#include "digao/motor/encoder.hpp"
#include "digao/motor/publisher.hpp"

namespace digao::motor {

class MotorService {
 public:
  MotorService(MotorConfig config,
               std::unique_ptr<FrameCapturer> capturer,
               std::unique_ptr<VideoEncoder> encoder,
               std::unique_ptr<EncodedFramePublisher> publisher);

  int run(const std::atomic_bool& running);

 private:
  MotorConfig config_;
  std::unique_ptr<FrameCapturer> capturer_;
  std::unique_ptr<VideoEncoder> encoder_;
  std::unique_ptr<EncodedFramePublisher> publisher_;
};

} // namespace digao::motor
