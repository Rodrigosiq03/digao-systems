#pragma once

#include <cstdint>
#include <vector>

namespace digao::motor {

struct RawFrame {
  std::uint32_t width{0};
  std::uint32_t height{0};
  std::uint64_t pts_us{0};
  std::vector<std::uint8_t> rgba;
};

struct EncodedFrame {
  std::uint64_t pts_us{0};
  std::vector<std::uint8_t> h264_annexb;
};

} // namespace digao::motor
