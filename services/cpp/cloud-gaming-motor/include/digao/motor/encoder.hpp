#pragma once

#include "digao/motor/frame.hpp"

namespace digao::motor {

class VideoEncoder {
 public:
  virtual ~VideoEncoder() = default;
  virtual EncodedFrame encode(const RawFrame& frame) = 0;
};

class MockH264Encoder final : public VideoEncoder {
 public:
  EncodedFrame encode(const RawFrame& frame) override;
};

} // namespace digao::motor
