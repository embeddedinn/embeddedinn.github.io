---
title: Setting up a development environment for RISCV-FreeRTOS on QEMU
date: 2024-06-04 06:00:06.000000000 -07:00
classes: wide
published: true
categories:
- Articles
- Tutorial
tags:
- RISCV
- FreeRTOS
- QEMU

header:
  teaser: "images/posts/whyBlog/whyBlog.png"
  og_image: "images/posts/whyBlog/whyBlog.png"
excerpt: "I recently had a discussion about the importance of writing about what you learn. This post delves into why this practice is essential and how it has personally benefited me and why I think you should do it too."

---

<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
</style>

{% include base_path %}

FreeRTOS is a popular real-time operating system that is widely used in embedded systems. It is open-source and has a large user base. It is known for its small footprint and ease of use. In this post, we will explore how to setup a development environment for FreeRTOS on RISCV using QEMU. this includes setting up the RISCV toolchain, QEMU, and building and executing FreeRTOS examples. We will also explore some techniques to debug FreeRTOS applications running on QEMU.

## Setting up the Environment

### Toolchain

To get started, we need to set up a RISCV toolchain and QEMU. We will be building the Toolchain from source. The steps to build the toolchain are as follows:

1. Install dependencies. (I am using debian based system, so the commands might be different for other systems)

    ```bash
    sudo apt-get install autoconf automake autotools-dev curl python3 python3-pip libmpc-dev libmpfr-dev libgmp-dev gawk build-essential bison flex texinfo gperf libtool patchutils bc zlib1g-dev libexpat-dev ninja-build git cmake libglib2.0-dev libslirp-dev
    ```

2. Setup the installation directory for the toolchain:

    ```bash
    sudo mkdir -p /opt/riscv
    sudo chown $USER:$USER /opt/riscv
    ```


3. Clone the RISCV toolchain repository from GitHub:

    ```bash
    git clone https://github.com/riscv/riscv-gnu-toolchain
    ```

4. Build and install the multilib toolchain:

    ```bash
    cd riscv-gnu-toolchain
    ./configure --prefix=/opt/riscv --enable-multilib
    make -j$(nproc)
    ```
`
5. Add the toolchain to your PATH:

    ```bash
    export PATH=$PATH:/opt/riscv/bin
    ```

6. Verify the installation:

    ```bash
    which riscv64-unknown-elf-gcc
    ```

    You should see the path to the toolchain binary. You can also verify the version of the toolchain using the following command:

    ```bash
    riscv64-unknown-elf-gcc --version
    ```

    At the time of writing, this is the output I get:

    ```bash
    riscv64-unknown-elf-gcc (gc891d8dc23e) 13.2.0
    Copyright (C) 2023 Free Software Foundation, Inc.
    This is free software; see the source for copying conditions.  There is NO
    warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
    ```

### Qemu


Next, we need to install QEMU. We will be building QEMU from source in order to get the latest . The steps to build QEMU are as follows:

1. install dependencies:

    ```bash
    sudo apt-get install libglib2.0-dev libpixman-1-dev
    ```

2. Setup the installation directory for QEMU:

    ```bash
    sudo mkdir -p /opt/qemu
    sudo chown $USER:$USER /opt/qemu
    ```

3. Clone the QEMU repository from GitHub:

    ```bash
    git clone https://git.qemu.org/git/qemu.git
    ```

4. Build and install QEMU:

    ```bash
    cd qemu
    ./configure --prefix=/opt/qemu
    make -j$(nproc)
    make install
    ```

5. Export the QEMU path:

    ```bash
    export PATH=$PATH:/opt/qemu/bin
    ```

6. Verify the installation:

    ```bash
    which qemu-system-riscv64
    ```

    You should see the path to the QEMU binary. You can also verify the version of QEMU using the following command:

    ```bash
    qemu-system-riscv64 --version
    ```

    At the time of writing, this is the output I get:

    ```bash
    QEMU emulator version 9.0.50 (v9.0.0-1157-g121e47c8bf)
    Copyright (c) 2003-2024 Fabrice Bellard and the QEMU Project developers
    ```

### FreeRTOS

    Next, we need to clone the FreeRTOS repository from GitHub:

    ```bash
    git config --global core.symlinks true
    git clone https://github.com/FreeRTOS/FreeRTOS.git --recurse-submodules
    ```

## Building and executing FreeRTOS examples

    FreeRTOS provides a set of examples that can be used to understand the working of the OS. We will be using the example under `FreeRTOS/Demo/RISC-V_RV32_QEMU_VIRT_GCC` as a starting point to build and execute FreeRTOS for RISCV on QEMU. 

    The example includes a readme file that provides instructions on how to build the example. The key steps are as follows:

1. Build the example:

    ```bash
    cd FreeRTOS/Demo/RISC-V_RV32_QEMU_VIRT_GCC
    make -C build/gcc DEBUG=1
    ```

    This generates the output binary `make -C build/gcc`

2. Execute the binary using QEMU:

    ```bash
    qemu-system-riscv32 -nographic -machine virt -net none \
    -chardev stdio,id=con,mux=on -serial chardev:con \
    -mon chardev=con,mode=readline -bios none \
    -smp 4 -kernel ./build/gcc/output/RTOSDemo.elf
    ```

    The output looks like this:

    ```bash
    FreeRTOS Demo Start
    FreeRTOS Demo SUCCESS: : 5033
    FreeRTOS Demo SUCCESS: : 10034
    FreeRTOS Demo SUCCESS: : 15033
    FreeRTOS Demo SUCCESS: : 20034
    FreeRTOS Demo SUCCESS: : 25033
    FreeRTOS Demo SUCCESS: : 30034
    FreeRTOS Demo SUCCESS: : 35033
    FreeRTOS Demo SUCCESS: : 40033
    FreeRTOS Demo SUCCESS: : 45034
    FreeRTOS Demo SUCCESS: : 50033
    FreeRTOS Demo SUCCESS: : 55034
    FreeRTOS Demo SUCCESS: : 60033
    FreeRTOS Demo SUCCESS: : 65033
    FreeRTOS Demo SUCCESS: : 70033
    FreeRTOS Demo SUCCESS: : 75033
    FreeRTOS Demo SUCCESS: : 80033
    FreeRTOS Demo SUCCESS: : 85033
    ```

## Debugging the application

We will use the GDB capabilities of QEMU and VScode to debug the application. To do this, we need to start QEMU with the GDB server enabled. The steps are as follows:

1. Start QEMU with the GDB server enabled by adding the `-s` flag. `-S` ensures that the CPU is halted until GDB connects to it. Here is the command to start QEMU:

    ```bash
    qemu-system-riscv32 -nographic -machine virt -net none \
    -chardev stdio,id=con,mux=on -serial chardev:con \
    -mon chardev=con,mode=readline -bios none \
    -smp 4 -kernel ./build/gcc/output/RTOSDemo.elf -s -S
    ```

2. Start GDB and connect to QEMU. We will test the commandline GDB first, before moving to VScode. Here is the command to start GDB:

    ```bash
    # start GDB and connect to QEMU on port 1234
    riscv64-unknown-elf-gdb ./build/gcc/output/RTOSDemo.elf -ex "target remote :1234"
    ```

To start executing the code, type `c` in the GDB prompt. You can set breakpoints and step through the code using the GDB commands.

### Debugging using VScode

1. Install the `native-debug` extension in VScode from https://marketplace.visualstudio.com/items?itemName=webfreak.debug
2. Open the debug pannel (`Ctrl+Sift+D`) and create a `launch.json` file with the following contents:
    
    ```json
    {
    "configurations": [
            {
                "type": "gdb",
                "request": "attach",
                "name": "Attach to gdbserver",
                "executable": "${workspaceFolder}/build/gcc/output/RTOSDemo.elf",
                "target": ":1234",
                "remote": true,
                "cwd": "${workspaceRoot}",
                "gdbpath": "/opt/riscv/bin/riscv64-unknown-elf-gdb",
                "valuesFormatting": "parseText"
            }
        ]
    }
    ```
3. Click on the "Run and Debug" button and select the "Attach to gdbserver" configuration. This will start the debugging session. In the image below, I have put a breakpoint in `main()`. The callstack and registers are visible in the debug window.

    {% include image.html
        img="images/posts/freertosQemuGdb/debugWindow.png"
        width="800"
        caption="Debug window"
    %}

## Conclusion

In this post, we explored how to set up a development environment for FreeRTOS on RISCV using QEMU. We built the RISCV toolchain and QEMU from source and executed a FreeRTOS example on QEMU. We also explored how to debug the application using GDB and VScode. This setup can be used to develop and debug FreeRTOS applications on RISCV using QEMU. In future posts, we will explore more of FreeRTOS on RISCV. Stay tuned!