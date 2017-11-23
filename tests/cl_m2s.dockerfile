FROM debian:stretch
MAINTAINER DOOGLZ

WORKDIR /amd

RUN apt update --fix-missing && apt install -y bzip2 sudo wget unzip git gcc build-essential automake autoconf \
   libtool zlib1g-dev lib32gcc1 gcc-multilib libgtk-3-dev gdb \
   && rm -rf /var/lib/apt 


ADD https://github.com/Multi2Sim/m2s-bench-amdsdk-2.5-src/archive/master.zip /amd/bench/
ADD http://games.soc.napier.ac.uk/files/AMD-APP-SDKInstaller-linux64.bz2.zip /amd/
RUN unzip bench/master.zip -d /amd/bench && rm bench/master.zip
RUN tar -xvjf AMD-APP-SDKInstaller-linux64.bz2.zip 

RUN ./AMD-APP-SDK-*.sh -- --acceptEULA 'yes' -s

# Remove installation files
RUN rm AMD-APP-SDK-*.sh && rm -rf AMDAPPSDK-*

# Put the includes and library where they are expected to be
#RUN ln -s /opt/AMDAPPSDK-3.0/include/CL /usr/include/ && ln -s /opt/AMDAPPSDK-3.0/lib/x86_64/libOpenCL.so.1 /usr/lib/libOpenCL.so

RUN cd /tmp && git clone https://github.com/Multi2Sim/multi2sim.git && cd multi2sim && git checkout 2f0771c9a93b && git clean -d -x -f
RUN cd /tmp/multi2sim && libtoolize && aclocal && autoconf && automake --add-missing && \
   ln -s /usr/bin/llvm-config-3.9 /usr/bin/llvm-config-3.4 && \
   ./configure CXXFLAGS="-Disnan=std::isnan -w -Wno-misleading-indentation" --enable-debug && \
   sed -i 's/isnan/std::isnan/g' `grep "isnan" -rl` && \
   make -j 4 CXXFLAGS="-Wno-misleading-indentation"  && make -j 4 CXXFLAGS="-Wno-misleading-indentation" install



