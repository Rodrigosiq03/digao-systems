#include "digao/motor/capture.hpp"

namespace digao::motor {

MockFrameCapturer::MockFrameCapturer(MotorConfig config) : config_(std::move(config)) {}

RawFrame MockFrameCapturer::capture_next() {
  RawFrame frame;
  frame.width = static_cast<std::uint32_t>(config_.width);
  frame.height = static_cast<std::uint32_t>(config_.height);
  frame.pts_us = frame_index_ * static_cast<std::uint64_t>(1000000 / config_.fps);

  frame.rgba.resize(static_cast<std::size_t>(frame.width) * frame.height * 4, 0);

  const std::uint8_t v = static_cast<std::uint8_t>(frame_index_ % 255);
  for (std::size_t i = 0; i + 3 < frame.rgba.size(); i += 4) {
    frame.rgba[i + 0] = v;
    frame.rgba[i + 1] = static_cast<std::uint8_t>((v + 64) % 255);
    frame.rgba[i + 2] = static_cast<std::uint8_t>((v + 128) % 255);
    frame.rgba[i + 3] = 255;
  }

  ++frame_index_;
  return frame;
}

} // namespace digao::motor
