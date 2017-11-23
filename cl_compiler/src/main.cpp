#define __CL_ENABLE_EXCEPTIONS
#include <cstdio>
#include <cstdlib>
#include <iostream>
#include "CL/cl.hpp"


int main(void)
{
  cl_int err = CL_SUCCESS;
  try {
    std::vector<cl::Platform> platforms;
    cl::Platform::get(&platforms);
    if (platforms.size() == 0) {
      std::cout << "Platform size 0\n";
      return -1;
    }
    // Print number of platforms and list of platforms
    std::cout << "Platform number is: " << platforms.size() << std::endl;
    std::string platformVendor;
    for (unsigned int i = 0; i < platforms.size(); ++i) {
      platforms[i].getInfo((cl_platform_info)CL_PLATFORM_VENDOR, &platformVendor);
      std::cout << "Platform is by: " << platformVendor << std::endl;
    }

  }
  catch (cl::Error err) {
    std::cerr << "ERROR: "<< err.what() << "(" << err.err() << ")" << std::endl;
    return 1;
  }
  return 0;
}
