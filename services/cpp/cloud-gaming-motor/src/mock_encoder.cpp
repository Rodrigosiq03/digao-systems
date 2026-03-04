#include "digao/motor/encoder.hpp"

namespace digao::motor {

EncodedFrame MockH264Encoder::encode(const RawFrame& frame) {
  EncodedFrame encoded;
  encoded.pts_us = frame.pts_us;

  // Mock payload with H.264 Annex-B style prefix. Replace with NVENC pipeline in production.
  encoded.h264_annexb.reserve(5 + 48);
  encoded.h264_annexb.push_back(0x00);
  encoded.h264_annexb.push_back(0x00);
  encoded.h264_annexb.push_back(0x00);
  encoded.h264_annexb.push_back(0x01);
  encoded.h264_annexb.push_back(0x65);

  const std::size_t sample = frame.rgba.size() < 48 ? frame.rgba.size() : 48;
  if (sample > 0) {
    encoded.h264_annexb.insert(encoded.h264_annexb.end(), frame.rgba.begin(), frame.rgba.begin() + sample);
  }

  return encoded;
}

} // namespace digao::motor
