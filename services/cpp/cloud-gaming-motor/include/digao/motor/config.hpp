#pragma once

#include <string>

namespace digao::motor {

struct MotorConfig {
  std::string stream_socket_path;
  int fps{60};
  int width{1920};
  int height{1080};
  bool mock_mode{true};
};

MotorConfig load_config_from_env();

} // namespace digao::motor
