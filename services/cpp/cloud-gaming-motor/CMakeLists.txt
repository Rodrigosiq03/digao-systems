cmake_minimum_required(VERSION 3.20)
project(digao_cloud_gaming_motor VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_library(motor_lib
  src/config.cpp
  src/mock_capture.cpp
  src/mock_encoder.cpp
  src/unix_publisher.cpp
  src/motor_service.cpp
)

target_include_directories(motor_lib PUBLIC include)

target_compile_options(motor_lib PRIVATE -Wall -Wextra -Wpedantic)

add_executable(cloud-gaming-motor src/main.cpp)
target_link_libraries(cloud-gaming-motor PRIVATE motor_lib)

enable_testing()

add_executable(motor-config-test tests/motor_config_test.cpp src/config.cpp)
target_include_directories(motor-config-test PRIVATE include)
add_test(NAME motor_config_test COMMAND motor-config-test)
