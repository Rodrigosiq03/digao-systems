#pragma once

#include "digao/motor/config.hpp"
#include "digao/motor/frame.hpp"

namespace digao::motor {

class FrameCapturer {
 public:
  virtual ~FrameCapturer() = default;
  virtual RawFrame capture_next() = 0;
};

class MockFrameCapturer final : public FrameCapturer {
 public:
  explicit MockFrameCapturer(MotorConfig config);
  RawFrame capture_next() override;

 private:
  MotorConfig config_;
  std::uint64_t frame_index_{0};
};

} // namespace digao::motor
