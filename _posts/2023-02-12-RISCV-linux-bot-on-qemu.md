---
title: Uncovering the Mysteries of Linux Boot on RISC-V QEMU Machines - A Deep Dive into the Boot Process
date: 2023-02-11 00:58:06.000000000 -07:00
classes: wide
published: true
categories:
- Articles
- Tutorial
tags:
- QEMU
- RISC-V
- Linux
- Buildroot
header:
  teaser: "images/posts/rvLinuxQemuBoot/rvLinuxQemuBoot.png"
  og_image: "images/posts/rvLinuxQemuBoot/rvLinuxQemuBoot.png"
excerpt: "Get ready to dive into the intricacies of Linux boot on a RISC-V machine! This comprehensive guide will walk you through the process of compiling QEMU, the Linux kernel, and the root filesystem from scratch. By the end of this journey, you'll have a deep understanding of the Linux boot flow and be equipped with the knowledge to write your own Linux bootloaders for RISC-V. So buckle up, grab your coffee, and let's get started!"

---

<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
</style>

{% include base_path %}

{% include toc title="Table of contents" icon="file-text" %}

Get ready to dive into the intricacies of Linux boot on a RISC-V machine! This comprehensive guide will walk you through the process of compiling QEMU, the Linux kernel, and the root filesystem from scratch. By the end of this journey, you'll have a deep understanding of the Linux boot flow and be equipped with the knowledge to write your own Linux bootloaders for RISC-V. So buckle up, grab your coffee, and let's get started!

## Getting the Build ready?

In previous blog posts, I’ve gone into the details of compiling QEMU, Linux and bare-metal programs. Here, we will rely on Buildroot to build all the components for us in one shot.
We start with downloading the latest buildroot release from [here](https://buildroot.org/download.html). I’m using `buildroot-2022.11.1` for this post. Extract the tarball and navigate to the buildroot directory.

```bash
wget https://buildroot.org/downloads/buildroot-2022.11.1.tar.gz
tar -xvf buildroot-2022.11.1.tar.gz
cd buildroot-2022.11.1
```

To build the images for RISC-V, we will use the  `qemu_riscv64_virt_defconfig` configuration file. This would compile QEMU, the Linux kernel and the root filesystem for us. We can also use the `make menuconfig` command to customize the build. For this post, we will use the default configuration.

```bash
make qemu_riscv64_virt_defconfig
make -j12
```

At the end of the build, the images will be available in the `output/images` directory. We will use the `rootfs.ext2` file as the root filesystem for our QEMU machine. A launch script `start-qemu.sh` will also be generated in the `output/images` directory. We will use this script to launch the QEMU machine.

```bash
cd output/images
./start-qemu.sh
```

```bash
OpenSBI v0.9
   ____                    _____ ____ _____
  / __ \                  / ____|  _ \_   _|
 | |  | |_ __   ___ _ __ | (___ | |_) || |
 | |  | | '_ \ / _ \ '_ \ \___ \|  _ < | |
 | |__| | |_) |  __/ | | |____) | |_) || |_
  \____/| .__/ \___|_| |_|_____/|____/_____|
        | |
        |_|

Platform Name             : riscv-virtio,qemu
Platform Features         : timer,mfdeleg
Platform HART Count       : 1
Firmware Base             : 0x80000000
Firmware Size             : 124 KB
Runtime SBI Version       : 0.2

Domain0 Name              : root
Domain0 Boot HART         : 0
Domain0 HARTs             : 0*
Domain0 Region00          : 0x0000000080000000-0x000000008001ffff ()
Domain0 Region01          : 0x0000000000000000-0xffffffffffffffff (R,W,X)
Domain0 Next Address      : 0x0000000080200000
Domain0 Next Arg1         : 0x0000000082200000
Domain0 Next Mode         : S-mode
Domain0 SysReset          : yes

Boot HART ID              : 0
Boot HART Domain          : root
Boot HART ISA             : rv64imafdcsuh
Boot HART Features        : scounteren,mcounteren,time
Boot HART PMP Count       : 16
Boot HART PMP Granularity : 4
Boot HART PMP Address Bits: 54
Boot HART MHPM Count      : 0
Boot HART MHPM Count      : 0
Boot HART MIDELEG         : 0x0000000000001666
Boot HART MEDELEG         : 0x0000000000f0b509
[    0.000000] Linux version 5.15.43 (vppillai@BBY-LT-C16658) (riscv64-linux-gcc.br_real (Buildroot 2022.11.1) 11.3.0, GNU ld (GNU Binutils) 2.38) #1 SMP Fri Feb 10 11:58:06 PST 2023
[    0.000000] OF: fdt: Ignoring memory range 0x80000000 - 0x80200000
[    0.000000] Machine model: riscv-virtio,qemu
[    0.000000] efi: UEFI not found.
[    0.000000] Zone ranges:
[    0.000000]   DMA32    [mem 0x0000000080200000-0x0000000087ffffff]
.
.
.
.
Starting network: udhcpc: started, v1.35.0
udhcpc: broadcasting discover
udhcpc: broadcasting select for 10.0.2.15, server 10.0.2.2
udhcpc: lease of 10.0.2.15 obtained from 10.0.2.2, lease time 86400
deleting routers
adding dns 10.0.2.3
OK

Welcome to Buildroot
buildroot login:
```

In the boot logs, you would see OpenSBI being loaded and then the Linux kernel being loaded. The kernel would then mount the root filesystem and start the init process. You can login to the machine using the username `root` with an empty password.

To exit , press `Ctrl+A` and then `X`.

Now, that we have a working QEMU machine, let’s dive into the boot process.

## Understanding the launch command.

The `start-qemu.sh` script is generated by the buildroot build process. Let’s take a look at the script.

```bash
#!/bin/sh
(
BINARIES_DIR="${0%/*}/"
cd ${BINARIES_DIR}

if [ "${1}" = "serial-only" ]; then
    EXTRA_ARGS='-nographic'
else
    EXTRA_ARGS=''
fi

export PATH="/home/vppillai/temp/buildroot-2022.11.1/output/host/bin:${PATH}"
exec qemu-system-riscv64 -M virt -bios fw_jump.elf \
                         -kernel Image -append "rootwait root=/dev/vda ro" \
                         -drive file=rootfs.ext2,format=raw,id=hd0 \
                         -device virtio-blk-device,drive=hd0 \
                         -netdev user,id=net0 -device virtio-net-device,netdev=net0 \
                         -nographic  ${EXTRA_ARGS}
```

We are mainly interested in the `exec` command. This is the command that launches the QEMU machine. Let’s do a quick break down the command in the table below. We will go into the details of each option later.

| Command | Description |
| --- | --- |
| `qemu-system-riscv64` | The QEMU binary to launch. |
| `-M virt` | The machine type to emulate. We are using the `virt` machine, a configurable machine model with the basic peripherals for a working machine. |
| `-bios fw_jump.elf` | The OpenSBI firmware to load. This is the first piece of "user code" that executes on QEMU and is responsible for bootloading Linux. Its built by buildroot |
| `-kernel Image` | The Linux kernel to load. This is the second "user code" piece that executes on QEMU. It's built by buildroot|
| `-append "rootwait root=/dev/vda ro"` | Additional kernel command line argument to use the disk mounted onto `/dev/vda` as the root file system after kernel init. |
| `-drive file=rootfs.ext2,format=raw,id=hd0` | Frontend option to mount a disk image.|
| `-device virtio-blk-device,drive=hd0` | Backend option to mount the disk image. We are using `virtio-blk-device` through the `virtio_mmio` interface to expose the disk image in the host device into the qemu machine |
| `-netdev user,id=net0` | Frontend option to configure the network interface. `user` initialize the `SLiRP` network between the host and guest |
| `-device virtio-net-device,netdev=net0` | Backend option to configure the network interface. We are using `virtio-net-device` through the `virtio_mmio` interface to expose the network interface in the host device into the qemu machine.|
| `-nographic` | Disable the graphical interface and use the serial console. |

## QEMU virt machine model Linux boot flow 

The source code of QEMU used for the buildroot build is located at `buildroot-2022.11.1/output/build/host-qemu-7.1.0`. The source code for the `virt` machine model is located at `buildroot-2022.11.1/output/build/host-qemu-7.1.0/hw/riscv/virt.c`. The corresponding online version is at `https://github.com/qemu/qemu/blob/v7.1.0/hw/riscv/virt.c`. Let’s take a look at the source code.

We will touch upon the portions relevant to the boot process. We'll do a deep dive into creating a custom machine model in a future post.

### Reset Vector

The default reset vector of the emulated CPUs is defined with `DEFAULT_RSTVEC` as `0x1000` in [`target/riscv/cpu_bits.h:579`](https://github.com/qemu/qemu/blob/621da7789083b80d6f1ff1c0fb499334007b4f51/target/riscv/cpu_bits.h#L579). Its set as the default using the `resetvec` property if the CPU in [`target/riscv/cpu.c:951`](https://github.com/qemu/qemu/blob/621da7789083b80d6f1ff1c0fb499334007b4f51/target/riscv/cpu.c#L951). It can be altered while creating the machine CPUs using the `qdev_prop_set_uint64()` API to set `resetvec` property of the CPU. The `virt` machine leaves to the default value.

The value of `resetvec` is consumed by `riscv_cpu_reset()` to set the CPUs PC value at reset, which is in turn used by `cpu_loop()`. 

In the virt machine, a `VIRT_MROM` is emulated at the reset vector. The following section looks at how QEMU populates this region before passing control to the CPU to execute code at the reset vector.

### Boot preparation

The boot setup of the virt machine starts with a call to the [riscv_setup_rom_reset_vec()](https://github.com/qemu/qemu/blob/621da7789083b80d6f1ff1c0fb499334007b4f51/hw/riscv/virt.c#L1299) function. But, before calling this function, a couple of steps are done by QEMU. 

- The `firmware` passed with the `-bios` option (OpenSBI in our case) will be parsed and loaded using `riscv_find_and_load_firmware()`. If the firmware is not provided, it will load the most relevant one from a set of images built/packaged with QEMU. The buildroot build this can be found at `buildroot-2022.11.1/output/host/share/qemu`. In the case of the `virt` machine, this is loaded to the `VIRT_FLASH` device at `0x20000000`.

- Next, the kernel passed with the `-kernel` option (Linux in our case) will be parsed and loaded using `riscv_load_kernel()`. The kernel must be loaded at a `2MiB` aligned address for a 64-bit machine. The following aligned address after the firmware is used to load the kernel is calculated using `riscv_calc_kernel_start_addr()`.

- Next, if an `initrd` image is passed with the `-initrd` option, it will be parsed and loaded using `riscv_load_initrd()`. The initrd image is loaded at an aligned offset kernel in the RAM without overlap with the other entries populated so far. Initrd is typically a compressed CPIO archive and contains minimal files required to boot the kernel. The initrd can also be packaged into the kernel image itself. In our case, the initrd image is not used. Instead, we use the root file system image directly along with the DTS entry to mount the root file system.
  - This is the `-append "rootwait root=/dev/vda ro"` option we passed to QEMU. The `rootwait` option tells the kernel to wait for the root file system to be mounted before proceeding with the boot process. The `root=/dev/vda` option tells the kernel to mount the root file system on the disk mounted on `/dev/vda`. The `ro` option tells the kernel to mount the root file system in read-only mode. 

- Next, the flattened device tree (FDT) will be generated and loaded. QEMU lets you pass an FDT file with the `-dtb` option. If no FDT file is passed, QEMU will generate an FDT based on the machine model. In our case, we are using the default FDT generated by QEMU. Before loading the FDT, the `initrd` address and any arguments passed with the `-append` option is added to the FDT. The following comment in the QEMU source code summarizes the FDT load requirements:
  > We should put fdt as far as possible to avoid kernel/initrd overwriting its content. But it should be addressable by 32-bit system as well. Thus, put it at a 2MB aligned address that is less than the fdt size from the end of a dram or 3GB, whichever is lesser.

## The Zero Stage Bootloader (ZSBL)

ZSBL refers to the first piece of code executed by the CPU at reset. In the case of the `virt` machine, this is the `VIRT_MROM` region. The `VIRT_MROM` region is populated by the `riscv_setup_rom_reset_vec()` function. In the case of Linux boot, the "firmware" used to boot Linux is OpenSBI. [OpenSBI](https://github.com/riscv-software-src/opensbi) is a RISC-V SBI (Supervisor Binary Interface) implementation. The SBI is a standard interface between the OS and the firmware. The SBI is used to initialize the hardware and provide OS services.  Therefore it can also act as the "second stage bootloader" that can boot Linux. Optionally, OpenSBI can launch a more complex bootloader like U-Boot. In our case, we are using OpenSBI as the launcher for Linux.

OpenSBI provides options like `fw_jump`, `fw_dynamic`, and `fw_payload` for the ZSBL to pass the information about the next stage it has to boot. In the case of booting Linux, this includes where the Kernel and DTS files are loaded. OpenSBI also consumes the DTS file and updates it in-memory before passing it on to the kernel if required.

QEMU uses the `fw_dynamic` mechanism by default. This involves populating a `struct fw_dynamic_info` with the information required to boot the next stage and passing its address in the `a2` register of the RISC-V CPU. The address must be aligned to 8 bytes on RV64 and 4 bytes on RV32. Code comments in the excerpt below from the OpenSBI source code summarize the requirements for the `struct fw_dynamic_info`:

```c
struct fw_dynamic_info {
         /* Expected value of info magic ('OSBI' ASCII string in hex) */
         /* #define FW_DYNAMIC_INFO_MAGIC_VALUE		0x4942534f*/
         unsigned long magic;
         /** Info version. The current latest is 0x2*/
         unsigned long version;
         /** Next booting stage address */
         unsigned long next_addr;
         /** Next booting stage mode */
         /* FW_DYNAMIC_INFO_NEXT_MODE_S = 0x1 */
         unsigned long next_mode;
         /** Options for OpenSBI library */
         unsigned long options;
         /**
          * Preferred boot HART id
          *
          * It is possible that the previous booting stage used the same link
          * address as the FW_DYNAMIC firmware. In this case, the relocation
          * lottery mechanism can potentially overwrite the previous booting
          * stage while other HARTs are still running in the previous booting
          * stage leading to a boot-time crash. To avoid this boot-time crash,
          * the previous booting stage can specify the last HART that will jump
          * to the FW_DYNAMIC firmware as the preferred boot HART.
          *
          * To avoid specifying a preferred boot HART, the previous booting
          * stage can set it to -1UL which will force the FW_DYNAMIC firmware
          * to use the relocation lottery mechanism.
          */
         unsigned long boot_hart;
 } 
 ```

 For Linux boot, `next_mode` is set to `S` to select a CPU that supports `S` mode to execute the Kernel. OpenSBI expects the fdt addr passed via the `a1` register. It can also be built into OpenSBI in the case of the `fw` or `fw_paylaod` modes. 

At boot, the RISC-V Linux kernel expects `a0` to contain a unique per-hart ID and `a1` to contain a pointer to the flattened device tree. OpenSBI ensures this. 

We will not go into the details of the OpenSBI source code in this post.

The `riscv_setup_rom_reset_vec()` function in QEMU sets up the `fw_dynamic_info`.

### THe QEMU ZSBL

QEMU generates a ZSBL with all the dynamic information based on user input to perform the steps described in the `reset_vec[]` array and loads it into the reset vector. 

The entire process can be visualized in the following animation:


{% include image.html
    img="images/posts/rvLinuxQemuBoot/bootAnimation.gif"
    width="1024"
    caption="The RISC-V Linux Boot Process"
%}