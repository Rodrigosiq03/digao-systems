#include "digao/motor/config.hpp"

#include <cstdlib>

namespace digao::motor {
namespace {

int get_int_env(const char* key, int fallback) {
  const char* raw = std::getenv(key);
  if (raw == nullptr || *raw == '\0') {
    return fallback;
  }

  try {
    return std::stoi(raw);
  } catch (...) {
    return fallback;
  }
}

bool get_bool_env(const char* key, bool fallback) {
  const char* raw = std::getenv(key);
  if (raw == nullptr || *raw == '\0') {
    return fallback;
  }

  std::string value(raw);
  if (value == "1" || value == "true" || value == "TRUE") {
    return true;
  }

  if (value == "0" || value == "false" || value == "FALSE") {
    return false;
  }

  return fallback;
}

std::string get_string_env(const char* key, const std::string& fallback) {
  const char* raw = std::getenv(key);
  if (raw == nullptr || *raw == '\0') {
    return fallback;
  }

  return std::string(raw);
}

} // namespace

MotorConfig load_config_from_env() {
  MotorConfig config;
  config.stream_socket_path =
      get_string_env("STREAM_SOCKET_PATH", "/tmp/digao-cloud-gaming/stream.sock");
  config.fps = get_int_env("FPS", 60);
  config.width = get_int_env("WIDTH", 1920);
  config.height = get_int_env("HEIGHT", 1080);
  config.mock_mode = get_bool_env("MOCK_MODE", true);

  if (config.fps <= 0) {
    config.fps = 60;
  }

  if (config.width <= 0) {
    config.width = 1920;
  }

  if (config.height <= 0) {
    config.height = 1080;
  }

  return config;
}

} // namespace digao::motor
