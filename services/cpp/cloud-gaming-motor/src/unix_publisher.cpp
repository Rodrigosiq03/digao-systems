#include "digao/motor/publisher.hpp"

#include <arpa/inet.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <unistd.h>

#include <cerrno>
#include <cstring>

namespace digao::motor {

UnixSocketPublisher::UnixSocketPublisher(std::string socket_path)
    : socket_path_(std::move(socket_path)) {}

UnixSocketPublisher::~UnixSocketPublisher() { disconnect(); }

bool UnixSocketPublisher::publish(const EncodedFrame& frame) {
  if (!ensure_connected()) {
    return false;
  }

  const std::uint32_t payload_size = static_cast<std::uint32_t>(frame.h264_annexb.size());
  const std::uint32_t net_size = htonl(payload_size);

  if (!write_all(reinterpret_cast<const std::uint8_t*>(&net_size), sizeof(net_size))) {
    disconnect();
    return false;
  }

  if (payload_size == 0) {
    return true;
  }

  if (!write_all(frame.h264_annexb.data(), frame.h264_annexb.size())) {
    disconnect();
    return false;
  }

  return true;
}

bool UnixSocketPublisher::ensure_connected() {
  if (fd_ >= 0) {
    return true;
  }

  fd_ = ::socket(AF_UNIX, SOCK_STREAM, 0);
  if (fd_ < 0) {
    return false;
  }

  sockaddr_un addr {};
  addr.sun_family = AF_UNIX;

  if (socket_path_.size() >= sizeof(addr.sun_path)) {
    disconnect();
    return false;
  }

  std::strncpy(addr.sun_path, socket_path_.c_str(), sizeof(addr.sun_path) - 1);

  if (::connect(fd_, reinterpret_cast<sockaddr*>(&addr), sizeof(addr)) != 0) {
    disconnect();
    return false;
  }

  return true;
}

void UnixSocketPublisher::disconnect() {
  if (fd_ >= 0) {
    ::close(fd_);
    fd_ = -1;
  }
}

bool UnixSocketPublisher::write_all(const std::uint8_t* data, std::size_t len) {
  std::size_t offset = 0;
  while (offset < len) {
    const ssize_t written =
        ::write(fd_, data + offset, static_cast<unsigned long>(len - offset));
    if (written < 0) {
      if (errno == EINTR) {
        continue;
      }
      return false;
    }
    if (written == 0) {
      return false;
    }
    offset += static_cast<std::size_t>(written);
  }

  return true;
}

} // namespace digao::motor
