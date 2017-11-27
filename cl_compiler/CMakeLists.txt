cmake_minimum_required (VERSION 3.3)
project (OpenCL_builder)

set(CMAKE_CXX_STANDARD 11) # C++11...
set(CMAKE_CXX_STANDARD_REQUIRED ON) #...is required...
set(CMAKE_CXX_EXTENSIONS OFF) 

if(DEFINED ENV{AMDAPPSDKROOT})
 set(OpenCL_INCLUDE_DIRS "$ENV{AMDAPPSDKROOT}/include")
 set(OPENCL_LIBRARIES "$ENV{AMDAPPSDKROOT}/lib/x86_64/sdk/libOpenCL.so")
else()
  find_package( OpenCL REQUIRED )
  if (NOT ${OpenCL_FOUND})
    message(FATAL_ERROR "OpenCl not found")
  endif ()
endif()

add_executable (opencl_builder "src/main.cpp")
message(STATUS "Opencl dir: " ${OpenCL_INCLUDE_DIRS})
target_include_directories(opencl_builder SYSTEM PRIVATE ${OpenCL_INCLUDE_DIRS} )
target_link_libraries(opencl_builder ${OPENCL_LIBRARIES})
