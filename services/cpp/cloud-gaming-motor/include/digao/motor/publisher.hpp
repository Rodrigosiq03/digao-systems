#pragma once

#include <string>

#include "digao/motor/frame.hpp"

namespace digao::motor {

class EncodedFramePublisher {
 public:
  virtual ~EncodedFramePublisher() = default;
  virtual bool publish(const EncodedFrame& frame) = 0;
};

class UnixSocketPublisher final : public EncodedFramePublisher {
 public:
  explicit UnixSocketPublisher(std::string socket_path);
  ~UnixSocketPublisher() override;

  bool publish(const EncodedFrame& frame) override;

 private:
  bool ensure_connected();
  void disconnect();
  bool write_all(const std::uint8_t* data, std::size_t len);

  std::string socket_path_;
  int fd_{-1};
};

} // namespace digao::motor
