
FROM debian:stretch
MAINTAINER DOOGLZ

WORKDIR /amd

RUN apt update --fix-missing &&  apt install bzip2 sudo && rm -rf /var/lib/apt 

ADD http://games.soc.napier.ac.uk/files/AMD-APP-SDKInstaller-linux64.bz2.zip /amd/
RUN tar -xvjf AMD-APP-SDKInstaller-linux64.bz2.zip 

RUN ./AMD-APP-SDK-*.sh -- --acceptEULA 'yes' -s

# Remove installation files
RUN rm AMD-APP-SDK-*.sh && rm -rf AMDAPPSDK-*

# Put the includes and library where they are expected to be
#RUN ln -s /opt/AMDAPPSDK-3.0/include/CL /usr/include/ && ln -s /opt/AMDAPPSDK-3.0/lib/x86_64/libOpenCL.so.1 /usr/lib/libOpenCL.so
