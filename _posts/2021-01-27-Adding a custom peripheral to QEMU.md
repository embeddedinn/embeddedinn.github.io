---
title: Adding a custom peripheral to QEMU RISC-V machine emulation & interacting with it using bare-metal C code
date: 2021-01-27 23:42:06.000000000 +05:30
classes: wide
published: true
categories:
- Articles
- Tutorial
tags:
- QEMU
- Butter_Robot
- RISC-V
header:
  teaser: /images/posts/riscv_qemuPeriph/image14.png
  og_image: images/posts/riscv_qemuPeriph/image14.png
excerpt: "QEMU is an excellent platform to emulate hardware platforms. But, we often end up using ready-made platforms without thinking twice about how QEMU emulates them. This article dives into the depth of how a new peripheral can be added to an existing QEMU machine and how to interact with it using bare-metal C code. Ultimately, we will build a RISC-V machine that has our custom peripheral and driver for that peripheral."

---


<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
</style>

{% include base_path %}


## Introduction

QEMU is an excellent platform to emulate hardware platforms. But, we often end up using ready-made platforms without thinking twice about how QEMU emulates them. This article dives into the depth of how a new peripheral can be added to an existing QEMU machine and how to interact with it using bare-metal C code. Ultimately, we will build a RISC-V machine that has our custom peripheral and driver for that peripheral.

## Compiling QEMU and understanding the build system:

> For detailed steps on setting up the tooling and compiling all the required pieces, refer to my previous article: [Linux & Python on RISC-V using QEMU from scratch](https://embeddedinn.xyz/articles/tutorial/Linux-Python-on-RISCV-using-QEMU-from-scratch/).

Before we add things to QEMU, we need first to understand the development ecosystem. I am compiling the latest `5.2.0` version of QEMU for this.

QEMU has a build flow similar to the `autoconf` tools based flow – we first do a `configure` and then `make`. However, recently, QEMU started using uses [Meson](https://mesonbuild.com/) build system under the hood instead of GNU `autotools`. The main difference we note at first is that only [VPATH builds](https://www.gnu.org/software/automake/manual/html_node/VPATH-Builds.html) are supported. Configuration environment properties are identified by the `configure` script, recipes by `Kconfig`, Meson takes over at that point to tie together the build. Even though `Kconfig` is used, there is no UI to manage the configurations. This info will come in handy when we later add our peripherals into the machine emulation.

To build QEMU for the RISC-V machine,

```sh
git clone https://github.com/qemu/qemu.git
git checkout v5.2.0
cd qemu
mkdir build
cd build

../configure --target-list=riscv64-softmmu,riscv64-linux-user --prefix=$RISCV

make -j$(nproc) install
```

> `$RISCV` is where we want the built images to be stored

> Note that we are building the `softmmu` version as well as the `linux-user` version.

From the [QEMU manual](https://qemu.readthedocs.io/en/latest/devel/kconfig.html), we know that :

> new targets and boards can be added without knowing in detail the architecture of the hardware emulation subsystems. Boards only have to list the components they need, and the compiled executable will include all the required dependencies and all the devices that the user can add to that board.

This is what we will leverage to add our first peripheral.

## Executing bare-metal RISC-V C code in QEMU

We will use [riscv-probe](https://github.com/michaeljclark/riscv-probe) as the base to start executing bare metal code. From the official repo readme, we know that:

> `riscv-probe` contains `libfemto` which is a lightweight bare-metal C library conforming to a reduced set of the *POSIX.1-2017 / IEEE 1003.1-2017* standard. `libfemto` can be used as a starting point for bare metal RISC-V programs that require interrupt handling, basic string routines, and `printf()`.

We clone the repo and compile it with:

```sh
git clone https://github.com/michaeljclark/riscv-probe.git
```

> the toolchain we compiled in the previous article was not compiled with `--enable-multilib.` So, I had to recompile it.

The default did not build !!

So, I had to define `riscv_excp_names` and `riscv_intr_names` as extern to get it to compile. After digging around, I found that [PR\#9](https://github.com/michaeljclark/riscv-probe/pull/9) fixes a whole bunch of these issues. So, I cloned the patch branch (patch1 of [axel-h](https://github.com/axel-h) / [riscv-probe](https://github.com/axel-h/riscv-probe)) and used it instead

```sh
git clone <https://github.com/axel-h/riscv-probe.git>
cd riscv-probe
git checkout patch1
make
```

Then execute the “hello world” code in the 64-bit `virt` machine using:

```sh
qemu-system-riscv64 -nographic -machine virt -kernel build/bin/rv64imac/virt/hello -bios none
```

> The `-bios none` option is not present in the official `riscv-probe` documentation. But with newer QEMU `virt` machines, you need to pass this option since the bios FW is loaded by default, and this overlaps with our bare-metal code.

{% include image.html
	img="images/posts/riscv_qemuPeriph/image1.png"
	width="640"
	caption="bare-metal hello world"
%}

### Understanding the libfemto code flow

Here are the initialization and execution sequence of the `riscv-probe` `femto` ecosystem. This understanding is essential to generate a stripped out version of `riscv-probe` for us to use.

1.  The C runtime (`crt.s` -\> `crtm.s`) contains the `_start` symbol that is the entry point to the C program post compilation. This function sets a generic trap handler and stack pointer and disables all hardware threads except hart 0. Next it calls ` libfemto_start_main()` that is defined in `libfemto\arch\riscv\start.c`

2. `libfemto_start_main()` initializes the memory required to load the C code as per the ABI and clears/inits the device handlers before calling `arch_setup()` and malloc memory initialization.

3.  `arch_setup()` is a platform-specific function that defines how the console and power-off sequence functions. For now, we will focus on the `virt` QEMU machine for RISC-V that supports VirtIO.
    
    1.  This board's UART console is based on ns16550a that is modeled in `libfemto/drivers/ns16550a.c`. We will soon realize the reason behind why we are using this specific part.

4.  Finally, the `main()` from our code will be executed.

{% include image.html
	img="images/posts/riscv_qemuPeriph/image2.png"
	width="720"
	caption="libfemto code flow"
%}

### Stripping down riscv-probe

Since the `Makefile` is dynamic, we start by deleting all `env` components other than `virt` and `common`. Then I deleted all the examples other than `hello` and cleaned up the make file to build just the 64-bit hello program. For now, this is what we will use as our “*SDK*.” I can now modify and run bare metal code.

{% include image.html
	img="images/posts/riscv_qemuPeriph/image4.png"
	width="480"
	caption="custom bare-metal code"
%}

## Understanding the QEMU UART flow

In the previous experiment, we did a `printf()`—a relatively simple task in the application software realm. But, there are a few moving pieces.

From the fundamental code flow analysis, we know that UART is emulated after a `ns16550a` device. Let us see how a single character passed to `printf()` reach QEMU frontend. I am beginning this analysis with an assumption that finally, a character gets written into a memory-mapped register processed by the UART emulation in QEMU.

Here is the code flow of `printf()` within `libfemto`.

{% include image.html
	img="images/posts/riscv_qemuPeriph/image5.png"
	width="720"
	caption="printf() code flow"
%}

The short version of the info present in the sequence chart is:

  - The `ns16550a` driver in `libfemto` writes each character from `printf()` into address `0x10000000`, where the UART transmit hold register (`UART_THR`) resides.

  - `qemu\hw\riscv\virt.c` file maps `VIRT_UART0` to the same address.

### The QEMU serial device

Now, the question is, how does QEMU know that the contents of UART\_THR have changed and that it needs to be printed on the console?

To understand this, we need first to understand how the UART device at 0x10000000 is mapped in QEMU. By looking at [riscv\virt.c](https://github.com/qemu/qemu/blob/553032db17440f8de011390e5a1cfddd13751b0b/hw/riscv/virt.c#L420) we know that the device is added as a flattened device tree (FDT). This info can also be pulled out of the pre-compiled QEMU instance by doing:

```sh
qemu-system-riscv64 -machine virt,dumpdtb=virt.dtb
dtc -I dtb -O dts virt.dtb \>virt.dts 
```

*More on this in the next section*

{% include image.html
	img="images/posts/riscv_qemuPeriph/image7.png"
	width="480"
	caption="the QEMU device tree"
%}

In [virt.c](https://github.com/qemu/qemu/blob/553032db17440f8de011390e5a1cfddd13751b0b/hw/riscv/virt.c#L681), we also see a call to `serial_mm_init()` where the `VIRT_UART0` address is passed on. Following this trail, we get to know how a `printf()` in the application code ends up in the emulated QEMU console.

  - As part of the `init` function, `serial_mm_realize()` registers `serial_mm_read()` and `serial_mm_write()` functions as callbacks for I/O operations in the `VIRT_UART0` address range.
    
      - The function `memory_region_init_io()` is used for this. This is in line with what the [QEMU documentation](https://qemu.readthedocs.io/en/latest/devel/memory.html) says :

> a range of guest memory that is implemented by host callbacks; each read or write causes a callback to be called on the host. You initialize these with `memory_region_init_io()`, passing it a MemoryRegionOps structure describing the callbacks.
 
> You can see this in action by passing the `-trace serial_ioport_write` flag while executing QEMU.

  - Depending on the emulated register to which the write happens, ` serial_mm_write()` takes the relevant action. In case of a character to transmit, it calls ` qemu_chr_fe_write ()` that ultimately results in the character to be pushed out of the relevant console interface.

{% include image.html
	img="images/posts/riscv_qemuPeriph/image8.png"
	width="480"
	caption="QEMU serial code flow"
%}

## QEMU & Device Trees

In the previous experiment, we dumped the device tree blob and converted it into a device tree source using the device tree compiler ( `dtc`). Then we also saw that the memory I/O callbacks are registered using ` memory_region_init_io()`. Let us take a closer look at how these are related.

The following is my empirical understanding. However, some parts of the system might break if you remove the FDT calls.

QEMU passes on the flattened device tree to the kernel as part of the boot loading process. This is for the kernel to understand the systems architecture – the usual device tree process. However, for bare-metal code to work, the flattened device tree need not be fully populated – unless you want to do some interrupt-based processing. To prove this point, I removed the `fdt` calls creating the `UART0` entry from `virt.c`, recompiled `qemu`, and executed the hello world code – It works as expected. One thing to note is that the `chosen` entry is mandatory. So, I hardcoded the string instead of passing the `name` argument.

{% include image.html
	img="images/posts/riscv_qemuPeriph/image10.png"
	width="480"
	caption="Modified device tree for test"
%}

## Adding a simple, custom peripheral – The butter robot.

Now that we have a relatively good understanding of how a new peripheral can be added in QEMU and controlled via SW let us put that understanding into practice.

We will design a relatively simple memory-mapped peripheral device. The target is to make it appear in the system memory map and access it through C code. The simplest peripheral would be a static register set with pre-defined contents that we can read. This rather useless peripheral’s purpose is to ensure that our understanding of the system architecture is accurate. This will let us graduate into more complex peripherals in the future. Let us call this peripheral “[The Butter Robot](https://rickandmorty.fandom.com/wiki/Butter_Robot).”

The life purpose of this peripheral is to host a read-only register that pass (the characters) “BUTTER”

{% include image.html
	img="images/posts/riscv_qemuPeriph/image11.png"
	width="720"
	caption="The butter robot system architecture"
%}

Here are the steps to follow to create the peripheral:

> You can see the full diff of changes in my [github QEMU fork](https://github.com/qemu/qemu/compare/v5.2.0...vppillai:theButterRobot).

1.  Add a `butter_robot` folder under `hw`

2.  Make it visible to the build system by editing `hw/meson.build`

3.  Create [hw/butter_robot/Kconfig](https://github.com/vppillai/qemu/blob/theButterRobot/hw/butter_robot/Kconfig) and include a symbol that can be used to control the inclusion of our peripheral into various machines.
    
    1.  And include it in `hw/Kconfig`

4.  Create a build config for our peripheral in [hw/butter_robot/meson.build](https://github.com/vppillai/qemu/blob/theButterRobot/hw/butter_robot/meson.build) and include the core files based on the Kconfig.

5.  Now, build the core logic in `[hw/butter_robot/butter_robot.c](https://github.com/vppillai/qemu/blob/theButterRobot/hw/butter_robot/butter_robot.c)` based on our understanding so far.

6.  Include `BUTTER_ROBOT` into the `RISCV_VIRT` machine configuration in ` hw/riscv/Kconfig`

7.  Map butter robot into the system’s memory map. I used the location 0x50000000 with a 256-byte address space. This is defined in [hw/riscv/virt.c](https://github.com/vppillai/qemu/blob/665d5a2bf6cbd5605ff1995ebfc60ba608ba4161/hw/riscv/virt.c#L69)

8.  Instantiate the peripheral by calling [br_create()](https://github.com/vppillai/qemu/blob/665d5a2bf6cbd5605ff1995ebfc60ba608ba4161/hw/riscv/virt.c#L683)

9.  `make` and `make install` the new machine.

I used the following code within the probe SDK we created before to test out the implementation.

```c
#include <stdio.h>

int main(int argc, char **argv)
{
char *ptr = (char *)(void *)0x50000000; //BUTTER_ROBOT is mapped to this address in the RISCV_VIRT machine
printf("\n\nButter Robot is giving you: %.6s\n\n",ptr);
}

```

{% include image.html
	img="images/posts/riscv_qemuPeriph/image12.png"
	width="720"
	caption="SUCCESS!!"
%}

### Debug notes:

1.  The min and max access size defined in the [ops structure](https://github.com/vppillai/qemu/blob/665d5a2bf6cbd5605ff1995ebfc60ba608ba4161/hw/butter_robot/butter_robot.c#L44) is critical.
    
    1.  I left this at 4 and faced a bug that was very tricky to find. Finally, I executed QEMU with the `-d guest_errors` flag and it gave me the reason very clearly. Until then, I was just getting an unhandled trap error.

{% include image.html
	img="images/posts/riscv_qemuPeriph/image13.png"
	width="520"
	caption="Exception trap debug"
%}