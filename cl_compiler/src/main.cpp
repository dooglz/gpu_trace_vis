#define __CL_ENABLE_EXCEPTIONS
#if defined CL_CONTEXT_OFFLINE_DEVICES_AMD
#pragma OPENCL EXTENSION CL_CONTEXT_OFFLINE_DEVICES_AMD : enable
#endif

#include <cstdio>
#include <cstdlib>
#include <iostream>
#include "CL/cl.hpp"
#include <string>
using namespace std;
const char* kernel_code = "__kernel void hello(__global char* string)"
"{double gg = 12.0;"
"string[0] = 'H';"
"string[1] = 'e';"
"string[2] = 'l';"
"string[3] = 'l';"
"string[4] = 'o';"
"string[5] = ',';"
"string[6] = ' ';"
"string[7] = 'W';"
"string[8] = 'o';"
"string[9] = 'r';"
"string[10] = 'l';"
"string[11] = 'd';"
"string[12] = '!';"
"string[13] = 0;}";

bool buildme(cl::Device& dev, cl::Context& ctx, const char* src)
{
  cout << "\n\nBuilding!\n";
  cout << "Name:\t" << dev.getInfo<CL_DEVICE_NAME>() << endl; 
  cout << "Ver:\t" << dev.getInfo<CL_DEVICE_VERSION>() << endl;
  cout << "vendor:\t" << dev.getInfo<CL_DEVICE_VENDOR>() << endl;
  cout << "Type:\t" << dev.getInfo<CL_DEVICE_TYPE>() << endl;
  cout << "Driver:\t" <<dev.getInfo<CL_DRIVER_VERSION>() << endl;

  cl::Program::Sources source(1,std::make_pair(src, strlen(src)));
  cl::Program program = cl::Program(ctx, source);
/*
  try{
   auto  err = clBuildProgram(src, 1, dev,"-cl-std=CL1.2", NULL, NULL);
     if (err != CL_SUCCESS)
      // show_build_log(src_prog, n_devices, devices, err);
     }
  }catch (...){
  }
*/

  try {
    program.build(std::vector<cl::Device>{dev},"\0-cl-std=CL1.2 -x clc");
  }
  catch (...) {
    cl_int buildErr = CL_SUCCESS;
    auto buildInfo = program.getBuildInfo<CL_PROGRAM_BUILD_LOG>(dev);
    cout << "build failed\n" << buildInfo << endl;
    //for (auto &pair : buildInfo) {
     // std::cerr << pair.second << std::endl << std::endl;
    //}
    return false;
  }
  cout << program.getBuildInfo<CL_PROGRAM_BUILD_LOG>(dev);
  cout << "\nBuilt?" <<endl;
  return false;
}

int main(void)
{
  cl_int err = CL_SUCCESS;
  try {
    std::vector<cl::Platform> platforms;
    cl::Platform::get(&platforms);
    if (platforms.size() == 0) {
      std::cout << "No platforms!\n";
      return -1;
    }
    // Print number of platforms and list of platforms
    std::cout << "Platform available: " << platforms.size() << std::endl;
    std::string platformVendor;
    for (unsigned int i = 0; i < platforms.size(); ++i) {
      platforms[i].getInfo((cl_platform_info)CL_PLATFORM_VENDOR, &platformVendor);
      std::cout << "---\nPlatform is by: " << platformVendor << std::endl;
      string extensions;
      platforms[i].getInfo(CL_PLATFORM_EXTENSIONS, &extensions);
      cout << "Supported Extensions: " << extensions << endl;
      if (strstr(extensions.c_str(), "cl_amd_offline_devices")) {
        std::cout << "amd_offline supported" <<std::endl;
        cl_context_properties properties[] =
        {
          CL_CONTEXT_OFFLINE_DEVICES_AMD,(cl_context_properties) 1,
          CL_CONTEXT_PLATFORM,(cl_context_properties)(platforms[i])(),
          0
        };
        cl::Context context(CL_DEVICE_TYPE_ALL, properties);
        std::vector<cl::Device> devices = context.getInfo<CL_CONTEXT_DEVICES>();
        // Print number of devices and list of devices
        std::cout << "Available Devices: " << devices.size() << std::endl;
        cl::Device* tahiti_device = nullptr;
        for (unsigned int i = 0; i < devices.size(); ++i) {
          std::cout << "Device #" << i << ": " << devices[i].getInfo<CL_DEVICE_NAME>() << std::endl;
          if(devices[i].getInfo<CL_DEVICE_NAME>() == "Tonga"){
           tahiti_device = &devices[i];
          }
        }
        if(tahiti_device != nullptr){
          buildme(*tahiti_device,context,kernel_code);
        }
      }
    }
  }
  catch (cl::Error err) {
    std::cerr << "ERROR: "<< err.what() << "(" << err.err() << ")" << std::endl;
    return 1;
  }
  return 0;
}
