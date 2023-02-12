---
title: Building a custom RISCV QEMU machine
date: 2022-09-30 00:58:06.000000000 -07:00
classes: wide
published: false
categories:
- Articles
- Tutorial
tags:
- QEMU
- RISC-V
- SSO
header:
  teaser: "images/posts/github_vouch-proxy/vouch-sso-github-banner.png"
  og_image: "images/posts/github_vouch-proxy/vouch-sso-github-banner.png"
excerpt: "Build your own RSIC-V machine model in QEMU. In some of my previous articles on QEMU, I covered how to add custom peripherals into existing machine models. Here I go into how a new machine model itself can be created."

---


<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
</style>

{% include base_path %}

{% include toc title="Table of contents" icon="file-text" %}

## What is a machine model?

A QEMU machine model is essentially a definition of the hardware components of a particular machine that you are emulating in QEMU. The machine model is used to create a QEMU virtual machine (VM) instance with a specified CPU(s) and a set of peripherals in a memory map. The machine model is defined in a C file, which is compiled into the QEMU binary. The machine model is then selected by passing the machine name to the QEMU command line. For instance, the `virt` machine model is selected by passing `-machine virt` to the QEMU command line. Once this machine model is selected, all software running in the VM will see the hardware components of the `virt` machine model and should be compliant with it.


## Building a base QEMU version

To build a base QEMU version from the release tag, run the following commands:

```bash
git clone github.com/qemu/qemu.git
cd qemu
git submodule update --init --recursive
git checkout v7.1.0
./configure --target-list=riscv64-softmmu,riscv64-linux-user --prefix=${PWD}/install
make -j$(nproc) install
cd install/bin
```

QEMU will be compiled and installed in the `install` directory. The `--target-list` option specifies the target architecture and modes to build QEMU for. In this case, we are building QEMU for the RISC-V architecture in system and user modes. Available targets are assembled in the `target` directory. The `--prefix` option specifies the installation directory for QEMU. In this case, we are installing QEMU in the `install` directory. The `make -j$(nproc) install` command builds and installs QEMU. The `-j$(nproc)` option specifies the number of parallel jobs to run. In this case, we are running the number of parallel jobs equal to the number of CPU cores on the machine.

Within the `install/bin` directory, we can run the QEMU binary to start a QEMU VM instance. The system emulator named `qemu-system-riscv64` emulates full machine models including CPUs, peripherals, memory maps, system bus etc. The user emulator named `qemu-riscv64` can be used to run RV64 linux binaries against the host kernel. It mainly emulates RV64 CPU instructions set and forward system calls to the host Linux kernel. We will focus on system emulation in this article.

## emulation vs virtualization

In the QEMU context, emulation refers to its capability to  dynamically translate target instruction set architecture (ISA) to host ISA using its Just-In-Time compiler (TCG). Vitualization refers to QEMU's capability to utilize the underlying host CPUs (and OS) virtualization capabilities to run virtualized VMs of the same target type (e.g. running x86 windows on an x86 host). In this article, we will focus on emulation capabilities of QEMU to emulate a RSIC-V machine on an x86 host.


## What machine models are available?

The list of machine models and CPUS available in QEMU can be found by running the following command:

```bash
    qemu-system-riscv64 -machine help
    qemu-system-riscv64 -cpu help
```

The output of the above commands is as follows:

```bash
    $ ./qemu-system-riscv64 -machine help
    Supported machines are:
    microchip-icicle-kit Microchip PolarFire SoC Icicle Kit
    none                 empty machine
    shakti_c             RISC-V Board compatible with Shakti SDK
    sifive_e             RISC-V Board compatible with SiFive E SDK
    sifive_u             RISC-V Board compatible with SiFive U SDK
    spike                RISC-V Spike board (default)
    virt                 RISC-V VirtIO board

    $ ./qemu-system-riscv64 -cpu help
    any
    rv64
    shakti-c
    sifive-e51
    sifive-u54
    x-rv128
```

## QEMU Object Model (QOM)

Components emulated within a QEMU machine model (like teh CPU, peripherals etc) are represented as QOM objects. QOM is a framework for creating and managing trees of objects in QEMU. Object types are often created with a typename string and can be used to reference the objects later. Being a tree, objects also have parent nodes and properties attached to it. Objects are created with heap allocated memory and are deleted when the last reference is dropped.

QOM is very well documented in its [header files](https://github.com/qemu/qemu/blob/master/include/qom)

## Creating a new machine model

To create a basic machine model, we start with creating the following source and header files.
We will call this machine **`param`**

The machine will be very basic with simple CPU, memory and UART peripherals.

***`qemu/hw/riscv/param.c`***

```c

```




















## Talking to QEMU with the QEMU machine protocol (QMP)



## testing with Avocado
