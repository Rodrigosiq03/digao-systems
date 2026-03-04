#include <cstdlib>
#include <iostream>

#include "digao/motor/config.hpp"

int main() {
  ::setenv("STREAM_SOCKET_PATH", "/tmp/custom.sock", 1);
  ::setenv("FPS", "30", 1);
  ::setenv("WIDTH", "1280", 1);
  ::setenv("HEIGHT", "720", 1);
  ::setenv("MOCK_MODE", "false", 1);

  const auto config = digao::motor::load_config_from_env();

  if (config.stream_socket_path != "/tmp/custom.sock") {
    std::cerr << "unexpected socket path" << std::endl;
    return 1;
  }

  if (config.fps != 30 || config.width != 1280 || config.height != 720 || config.mock_mode) {
    std::cerr << "unexpected parsed values" << std::endl;
    return 1;
  }

  std::cout << "config test passed" << std::endl;
  return 0;
}
