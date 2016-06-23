---
title: Booting your first cross-compiled Linux based embedded system
date: 2013-02-26 11:28:36.000000000 +05:30
published: true
categories: 
 - Articles
 - Tutorial
tags: 
 - embedded linux
 - linux
 - kernel

excerpt: "An introduction to getting started with embedded linux. This article will get you started with booting up your first cross compiled kernel"
---

<style>
div {
    text-align: justify;
    text-justify: inter-word;
}
</style>

{% include base_path %}

This article has been migrated from my [original post](https://embeddedinn.wordpress.com/tutorials/booting-your-first-cross-compiled-linux-based-embedded-system/){:target="_blank"}  at [embeddedinn.wordpress.com](http://embeddedinn.wordpress.com){:target="_blank"}.   
{: .notice--info}

This tutorial introduces you to the world of Linux based embedded systems. Here we will learn to cross-compile your own Linux kernel and bring up a complete system with that kernel. And the best part is, you do not have to own a development board or [brick](http://en.wikipedia.org/wiki/Brick_(electronics)){:target="_blank"} your PC while learning this.

The main components involved in our tutorial today are

- [Buildroot](http://buildroot.uclibc.org/){:target="_blank"}
- [Qemu](http://wiki.qemu.org/Main_Page){:target="_blank"}

Qemu is the emulator that will help up work around the requirement of a physical development machine by providing a virtualized environment to bring up our kernel without putting your actual system in “harms way” :smile:

Buildroot is basically a set of scripts the that will automate the process of cross-compiling the kernel and tool-chain for you.

First, to get the basics right, To bring up any software in any new platform, you first need to have a tool chain that includes libraries, compiler, assembler, linker etc that supports your platform. In our case, the platform is a virtualized environment. So, we first need to cross-compile the tool chain itself. so that it can generate binaries sporting the platform.

Following this, we need to compile the Linux kernel code using the cross-tool chain that we generated to produce a “Linux kernel boot executable” for the platform.

Now, in a general sense, the kernel needs a root file system (RFS) to boot up and be usable. (We will discuss the details of why this is required in a later session)

Buildroot does all the above for you automatically. We just have to tell the details of the platform to buildroot and it will generate the tool-chain, kernel image and minimal RFS for you.

For this, first download the latest buildroot from [here](http://buildroot.uclibc.org/download.html){:target="_blank"}. At the time of writing `buildroot-2012.11.1` is the latest and greatest. Once you download the archive, un-compress it and go inside the folder.

The list of platforms with ready made support is in the configs directory.

In this tutorial , we are going to build a system around `qemu_x86_defconfig`. So, give the following set of commands.

	make qemu_x86_defconfig   
	make

The first command will generate the `.config` file used by buildroot and the second command will download all necessary source packages and compile the actual images for you. (This will take some time:). I got the following time stat while compiling in 16x build server with 12 parallel jobs )

```
real 14m57.942s
user 39m29.166s
sys 5m57.716s
```

Once the build is done, you can go to the `output/images` folder and find the two output files:

-  `bzImage`: Linux kernel x86 boot executable RO-rootFS, swap_dev 0x1, Normal VGA
-  `rootfs.ext2`: Linux rev 0.0 ext2 filesystem data

The toolchain will be at `output/host/usr/bin`

Buildroot generates a toolchain based on [uclibc](http://www.uclibc.org/){:target="_blank"} which is a fully functional, yet size optimized avatar of glibc.

Now, we need to fire-up qemu. Here Iam going to show a GUI method to bring qemu up on Windows. However, the steps are similar in Linux based systems also.

Download Qemu Manager [here](http://www.sorted-systems.com/qmdown.html){:target="blank"} and install it. Open the qemu manager UI and do the following configuration.

Create a new Virtual machine named QemuLinuxTest with “Standard x86/x64 PC as the platform and “Linux Distribution” as the operating system.

{% include image.html
            img="/images/posts/quemu/qemuconf1.jpg"
%}

For now, choose “Do not use a Virtual disk image”

{% include image.html
            img="/images/posts/quemu/qemuconf2.jpg"
%}
<p/>
{% include image.html
            img="/images/posts/quemu/qemuconf3.jpg"
%}

Once this is done, Select the virtual machine from the panel in the left and do the following configuration.

{% include image.html
            img="/images/posts/quemu/qemuman1.jpg"
%}

Point “HardDisk 0” to the generated RFS image

{% include image.html
            img="/images/posts/quemu/qemuman0.jpg"
%}

Enter the kernel path and the additional command line append `root=/dev/sda` in the advanced tab.

{% include image.html
            img="/images/posts/quemu/qemuman1.jpg"
%}

Now, click the start icon and see your own cross-compiled kernel coming to life :smile:

{% include image.html
            img="/images/posts/quemu/qemufinalboot.jpg"
%}

## Tweaks

- Even without qemu manager, you can manage to run the virtual machine by issuing the following command

   ```
qemu-system-i386 -M pc -kernel output/images/bzImage -drive file=output/images/rootfs.ext2,if=ide -append root=/dev/sda
	 ```

- In case you are working in a non-graphic environment, you can use `-curses` option. In this case, use the `poweroff` command to return to your system.

- To make changes to the default configuration (`qemu_x86_defconfig`) issue the following command after [`make qemu_x86_defconfig`]
   
   `make menuconfig`

- To make changes to the linux kernel configuration , issue

   `make linux-menuconfig`

- To make changes to the uclibc configuraition, issue

   `make uclibc-menuconfig`
