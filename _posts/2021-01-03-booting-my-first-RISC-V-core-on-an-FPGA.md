---
title: Booting up my first RISC-V core on an FPGA.
date: 2021-01-03 21:01:06.000000000 +05:30
classes: wide
published: true
categories:
- Articles
- Tutorial
tags:
- Embedded
- FPGA
- RISC-V

excerpt: "This article comments on how I built-up my first ARM host tethered Rocket RISC-V core on a Xilinx Zynq-7000 FPGA."

---

<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
</style>

{% include base_path %}


## Introduction

RISC-V is an emerging open standard ISA that is set to take the computing world by storm. The beauty of the RISC-V ISA lies in the fact that it is boring. It started as a clean slate design at UC Berkeley to build an easy to learn and easy to teach RISC architecture. So, the core architecture should be pretty straightforward to understand. But, as-it-is, it is just an ISA. To be useful beyond an academic exercise, the ISA should be built into an SoC with other essential components, including a system bus and a memory subsystem. This is a work in progress, and it is this community effort that will eventually make RISC-V a success. There are very few physical RISC-V hard-cores that are commercially available today. Since the economies of scale are yet to kick in, this hardware is yet to be affordable and readily available (for me ). But, I have my FPGAs with me, and I can start experimenting with “soft” cores the way the rest of the development world is doing. So, this article is all about getting a [RISC-V Rocket core](https://github.com/chipsalliance/rocket-chip) up on my Xilinx Zynq-7000 Zybo board from Digilent.

### A Quickstart

Typically, I follow a bottom-up approach for activities like this. In this case, I decided to go top-down since the Xilinx toolchain is often finicky, and every version comes with some bug or the other. So, the first step was to go with the getting started steps given in [ucb-bar/FPGA-zynq](https://github.com/vppillai/fpga-zynq) . Though this is an abandoned project, I felt positive since I had access to the tools mentioned in the article – Xilinx Vivado and the Digilent Zybo board. The steps here mention that [Quick Instructions](https://github.com/vppillai/fpga-zynq#quickinst) is the easiest way to get started.

I did the following steps from a git-bash since I wanted to use my Windows PC with my Vivado license.

```sh

make fetch-images

make load-sd SD=/e

```

These steps essentially clone the images repo and copy the content to the SD card. I was happy to see the petalinux prompt, but that happiness was short-lived.

{% include image.html
	img="images/posts/riscv_fpga/image1.png"
	width="480"
	caption="The first petalinux prompt"
%}

*<span class="underline">Note to self</span>: Username is root, the password is root. The defaults in petalinux are retained.*

When I tried `./fesvr-zynq pk hello,` I was disappointed. The manual says that this step should load a proxy kernel image into the Rocket Core memory and execute it. But, all I got was an `ERROR: No cores found` message. . However, this was resolved after a reboot. I am yet to figure out how/why this worked.

The next step was to boot riscv-linux on the Rocket core. I was not yet ready to spend a lot of time re-compiling the kernel [following steps in the documentation.](https://github.com/vppillai/fpga-zynq#37--buildingobtaining-riscv-linux) So, after digging around, I found

[pkorolov /zynq-fpga](https://github.com/pkorolov/zynq-fpga) with a pre-compiled RISC-V vmlinux image. So, I replaced the contents of the SD card with what I got from the repo and issued the command :

```sh

mkdir /sdcard

mount /dev/mmcblk0p1 /sdcard

./fesvr-zedboard +disk=/sdcard/riscv/root/_spike.bin /sdcard/riscv/vmlinux

```

And we have liftoff. It doesn’t matter how many times you have seen Linux boot; the feeling you get when you see it coming up on an FPGA is always priceless.

{% include image.html
	img="images/posts/riscv_fpga/image2.png"
	width="480"
	caption="Linux on RISC-V Rocket core."
%}

### The obligatory, “Hello World.”

Once Linux is up on a new platform, not building and running hello world is bad juju.

To begin, I got the toolchain from [chipsalliance/rocket-tools](https://github.com/chipsalliance/rocket-tools) and compiled them for my Linux box. Instructions are pretty clear in the repo. You just need to load the submodules and run `build.sh`. Though just the GCC toolchain is sufficient for hello world, I decided to build the entire solution since they will come in handy later. But, build takes a long time to compete as expected.

> Or, as I figured out later, just run `sudo apt install gcc-riscv64-unknown-elf`

I compiled a simple hello world c code using the freshly minted toolchain. I connected zybo to my home network, configured a static IP in the same subnet and copied the output (a.out) into the ARM linux root using Filezilla.

I tried executing my code by issuing :

```sh

./fesvr-zedboard pk a.out

```

But, I was greeted with an error : `An illegal instruction was executed!`

{% include image.html
	img="images/posts/riscv_fpga/image3.png"
	width="480"
	caption="Illegal Instruction Error"
%}

After researching further, this seems to be a side effect of using the latest toolchain with an outdated version of the pre-compiled image's proxy kernel (PK). I need to get more understanding of what is happening here to resolve this.

### So, what is going on here ? (*fesvr*?) 

While the core was up, and I was able to execute my code on the Linux image that came up, I wondered how the communication is happening here? I have an ARM core on which I am issuing a `fesvr` command that is somehow getting it across to the RISC-V core on the PL (aka FPGA) side of the Zynq.

The mode in which the Rocket Core works in Zynq is called a tethered mode. In this mode, the Rocket core exposes two interfaces

1.  A host interface

2.  A memory interface.

{% include image.html
	img="images/posts/riscv_fpga/image4.png"
	width="480"
	caption="HIF used by fesvr"
%}

The ARM host uses the host interface (HIF) to control the Rocket core. This is a slave port, and the ARM core acts as the master. This communication uses a valid-ready protocol that is typical in AXI. However, the Rocket Host slave is not AXI4 compliant. So, a translation layer is implemented.

The memory interface in the Rocket core is AXI4 compliant. This is a master interface, and the Rocket core generates memory requests to the ARM core. Since this is an AXI interface, these memory operations are handled entirely in hardware.

This tethered model means that the core cannot work standalone. The ***<span class="underline">F</span>***ront***<span class="underline">E</span>***nd ***<span class="underline">S</span>***er***<span class="underline">V</span>***e***<span class="underline">R</span>*** (fesvr) runs on host machine and serves as a bootloader. It also executes I/O syscalls on behalf of the proxy kernel since all the actual hardware is connected to the Host ARM core.

The main memory (the DDR3 on the zybo, connected to the Zynq-7000) is shared between the ARM and Rocket cores. The lower 256MB is allocated to ARM and the upper 256 MB is allocated to the RISC-V core.

When we execute a pk command, this loads the proxy kernel and executes the application on top of the PK. PK is responsible for initializing and configuring the system for code execution.

To move out of the outdated tools, let us build our own HW bitstream and SW images.

### Building a bitstream and system Software

After cloning and initializing the submodules from [ucb-bar](https://github.com/ucb-bar) / [fpga-zynq](https://github.com/ucb-bar/fpga-zynq) , I got a version of the Rocket Core configured by Chisel for my zybo board. This process also creates a Vivado project that we can use to explore the Zynq platform.

{% include image.html
	img="images/posts/riscv_fpga/image5.png"
	width="480"
	caption="Vivado Block design of ARM PS for RISCV tether"
%}

We can see the AXI master and slave ports in the HIF clearly in the block diagram generated by Vivado.

The implementation diagram and slice utilization details are shown in the images below.

{% include image.html
	img="images/posts/riscv_fpga/image6.png"
	width="480"
	caption="Slice Utilization Report"
%}

{% include image.html
	img="images/posts/riscv_fpga/image7.png"
	width="480"
	caption="System Implementation"
%}

At the end of this process, the bitstream and hardware platform files are ready. We import this into the Vitis SDK to create the ***<span class="underline">F</span>***irst ***<span class="underline">S</span>***tage ***<span class="underline">B</span>***oot ***<span class="underline">L</span>***oader and the Arm PS linux image and uboot. I followed the steps in [ucb-bar](https://github.com/ucb-bar) / [fpga-zynq](https://github.com/ucb-bar/fpga-zynq) for this.

Additionally, I also re-compiled pk to match the toolchain for my hello world and updated the ramdisk image with it.

This is how the old linux was.

{% include image.html
	img="images/posts/riscv_fpga/image8.png"
	width="480"
	caption="Pre-Built Linux image"
%}

This is how the new linux came up.

{% include image.html
	img="images/posts/riscv_fpga/image9.png"
	width="480"
	caption="Newly built Linux image"
%}

Finally, I copied the a.out that failed to execute before and ran it successfully.

{% include image.html
	img="images/posts/riscv_fpga/image10.png"
	width="480"
	caption="SUCCESS!!!"
%}

