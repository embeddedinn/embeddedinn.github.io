---
title: Writing Linux Device Drivers - Part 1
date: 2013-10-04 17:02:00.000000000 +05:30
published: true 
categories: 
 - Articles
 - Tutorial
 - Device drivers
tags: 
 - Linux
 - Kernel
 - Drivers

excerpt: "This tutorial gives a quick introduction to writing Linux device drivers. It will not make you device driver experts, but will give you a starting point to start learning about Linux device drivers."
---
<style>
div {
    text-align: justify;
    text-justify: inter-word;
}
</style>

## Step 1:- Setup

This is the most important component that you require to start writing Linux device drivers. I use an Oracle VirtualBox with a 32 bit Ubuntu desktop image . This is essential when you start experimenting with kernel code and drivers since mistakes like a simple pointer corruption can even wipe your disk.

On this VM, install GCC (if not already present) and the linux kernel headers. I am using an older version of the kernel (found out by the command ” uname -a “). So I used the following command to get the headers.

`sudo apt-get install linux-headers-3.5.0-17-generic`

## Step 2 :- Compilation environment

To begin with, we will create a blank kernel module and get it compiled. This will prove the compilation environment and we will also try inserting it into the kernel.

You will need the following files and commands to do this.

- blank.c

```c
#include <linux/module.h>
MODULE_LICENSE("Dual BSD/GPL");
```

- Makefile

`obj-m := blank.o`

Use the following command to compile the module:

`make -C /usr/src/linux-headers-3.5.0-17-generic M=$PWD modules`

The `-C` option is to point to the root folder of compilation and the M= option is to point to the location at which the compilation has to happen.

This will give a `blank.ko` which can be inserted into the kernel using the command ` insmod blank.ko `. Once this is done, insertion can be verified by issuing the command ` lsmod `. To remove the kernel object, use the command ` rmmod blank.ko `. The inserted module and its major number can also be seen from `/proc/devices` file.

## Step 3 :- your first kernel print

Now we will make a kernel object that just prints some debugs when inserted and ejected. This illustrates how the kernel loads the drivers into itself.

You will need the following files:

- simple.c

```c
#include<linux/module.h>
#include<linux/init.h>
#include<linux/kernel.h>
MODULE_LICENSE("GPL");    /*else kernel complaints about kernel taint*/
int simple_init(void)
{
	 printk(KERN_ALERT"Hello kernel space world\n");   /*Kernel mode printf - messages appear in /var/log/messages . or use command dmesg | tail*/
	  return 0;
}
int simple_exit(void)
{
	 printk(KERN_ALERT"Bye bye kernel world\n");
	  return 0;
}
module_init(simple_init);    /* register the module init function to be executed on insmod*/
module_exit(simple_exit); /* register the module cleanup/exit function to be executed on rmmod*/
```

- Makefile

`obj-m := simple.o`

Use the same make command as above to compile the kernel module

On inserting the module, `simple_init` will be executed by the kernel and it will print the welcome message into kernel logs. On removing the module, `simple_exit` will be called. When the module is inserted, its presence can also be verified using `/proc/modules` (other than `lsmod`)

## Step 4 :- associating modules to devices

The beauty of Linux character devices is  that you can access a device and its buffers as if you are accessing a regular file (with some restrictions). What happens internally is that Linux maps generic system calls like open, close, read, write etc that targets a file into functions provided by the corresponding device driver. In the following example, this is exactly what we are doing. Since the actual device driver file is quite big, I have placed it [here](https://raw.github.com/vppillai/LinuxDeviceDrivers_WPArticle/master/device/device.c){:target="_blank"}. I will highlight the major APIs and the flow here. [Makefile is available [here](https://raw.github.com/vppillai/LinuxDeviceDrivers_WPArticle/master/device/Makefile){:target="_blank"}. Issue the same command as above to build the `ko`]

Ultimately, the `device.ko` that is inserted will be used to perform operations in the kernel space when certain system calls are made. Now, we need two items to achieve this – a way to link a device file to the ko and actual functions to perform the system calls

The mapping of system calls is done using a structure (device_fops) of type file_operations. This is further used to register the device into the kernel. So, for example, when an open systemcall is made the kernel will call device_open.

Now, there should be a unique identifier that can be used to identify the ko for it to be linked to a device. Since a single ko can handle multiple devices, module name is not appropriate. So, we use the concept of major number and minor number. A major number identifies a ko while a minor number identifies the devices it controls. We will be dynamically allocating major and minor numbers.

Once a module is inserted, we need to create a device node/file and associate it with the ko. For this, first read the allocated major and minor numbers from `/proc/devices` and use the `mknod` command to create the device file.

*device.c flow – device_init()*

- allocate device number with `alloc_chrdev_region`

- initialize and add the `cdev` structure using `cdev_add`

- while exiting, do `unregister_chrdev_region` and `cdev_del`

You can void manually creating the device node by using the `class_create` and `device_create` APIs from the ko itself. Make sure you do a `class_destroy` and `device_destroy` on exit. Sample code can be found here. You still need to provide permissions to the device file using `chmod`
