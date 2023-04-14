---
title: A Hands-On Guide to Sharing Files and Folders between Host and RISC-V QEMU Machine
date: 2023-04-14 00:58:06.000000000 -07:00
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
- sshfs
header:
  teaser: "images/posts/qemu-sshfs/qemu_sshfs.png"
  og_image: "images/posts/qemu-sshfs/qemu_sshfs.png"
excerpt: "Transferring files between your host and RISC-V QEMU machine is often a daunting task. typical solutions include using the 9P FS which requires host kernel level modifications, which might not always be practical. In this hands-on guide, I'll go through the steps to configure Buildroot and Linux for RSIC-V to use seamless ssh based filesystem mounts. Say goodbye to the inefficiencies of manual file transfers and hello to a more streamlined workflow with this step-by-step guide."

---

<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
</style>

{% include base_path %}

{% include toc title="Table of contents" icon="file-text" %}

## Introduction

Transferring files between your host and RISC-V QEMU machine is often a daunting task. typical solutions include using the 9P FS which requires host kernel level modifications, which might not always be practical. In the following sections,we will build a RISC-V Linux image using Buildroot and then boot it using QEMU. We will then configure the Linux image to use sshfs to mount the host filesystem. This will allow us to seamlessly transfer files between the host and the RISC-V QEMU machine.

## Development Environment

I am using a clean Windows machine with WSL2 Ubuntu `22.04` as my development environment. Install basic packages with:

  ```bash
  sudo apt update && sudo apt -y upgrade
  sudo apt install -y  build-essential unzip bc libncurses-dev openssh-server
  ```

SSH server will not be started by default since WSL does not bring up `systemd`. I took the easy route and enabled systemd on the Ubuntu image with the following line in `/etc/wsl.conf`:

  ```bash
  [boot]
  systemd=true
  ```

WSL `$PATH` includes spaces and special characters that are not compatible with Buildroot and Kconfig. To fix this, we need to add the following line to `/etc/wsl.conf`:

  ```bash
  [interop]
  appendWindowsPath=false
  ```

Alternatively, you can also add the following line to your `.bashrc`, or run it in your terminal in a new bash session:

  ```bash
  export PATH=$(echo $PATH | tr -d '()[:space:]')
  ```

Restart WSL by issuing the following command in a PowerShell terminal:

  ```bash
  wsl --shutdown
  ```

## Compiling RFS, Kernel and QMEU with Buildroot

1. Download the latest Buildroot release from [here](https://buildroot.org/download.html). I am using `2023.02` for this tutorial. Extract the archive and navigate to the extracted directory. 

  ```bash
  wget https://buildroot.org/downloads/buildroot-2023.02.tar.gz
  tar xvf buildroot-2023.02.tar.gz
  cd buildroot-2023.02
  ```

2. Configure Buildroot for RISC-V with the following command:

  ```bash
  make qemu_riscv64_virt_defconfig
  ```

3. Eanble `sshfs` in Buildroot with menuconfig. 

  ```bash
  make menuconfig
  ```
  Navigate to `Target packages -> Filesystem and flash utilities -> sshfs (FUSE)` and enable it. Save the config and exit. 

4. `sshfs` requires `FUSE` (Filesystem in Userspace) support in the kernel to operate. To enable this, launch the Buildroot Linux configuration menu with:

  ```bash
  make linux-menuconfig
  ```

  Navigate to `File systems -> FUSE (Filesystem in Userspace) support` and enable it to be built as an inbuilt module (`*` instead of `M` in menuconfig). Save the config and exit.

5. Build the RISC-V Linux kernel image, RFS and QEMU with:

  ```bash
  make
  ```
  This will take a while to complete. Once the build is complete, you will find the RISC-V Linux kernel image, RFS and QEMU binaries in `output/images/`.


## Booting RISC-V Linux with QEMU

To launch the newly compiled system, execute the `output/images/start-qemu.sh` script. This will launch QEMU with the RISC-V Linux kernel image and RFS.

The default username is `root` without a password. 

## Mounting a host directory with sshfs

Issue the following command in the QEMU shell to mount a host directory with sshfs. Make sure that the ssh server is up and running on the host machine.

  ```bash
  sshfs -o allow_other,default_permissions <username>@10.0.2.2:<host path> /mnt 
  ```

Contents of the host directory will now be available in the QEMU shell at `/mnt`. 

`10.0.2.2` is the default IP address of the host machine in the QEMU network. The Buildroot generated startup script sets up the SLIRP network for QEMU makingthe host accessible over this "special" IP address. You can read more about this [here](https://wiki.qemu.org/Documentation/Networking#User_Networking_.28SLIRP.29).

## Conclusion

In this tutorial, we built a RISC-V Linux image using Buildroot and then booted it using QEMU. We then configured the Linux image to use sshfs to mount the host filesystem. This allowed us to seamlessly transfer files between the host and the RISC-V QEMU machine.
