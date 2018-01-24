---
title: Writing Linux Device Drivers - Part 2
date: 2013-10-29 11:46:30.000000000 +05:30
published: true 
categories: 
 - Articles
 - Tutorial
 - Device drivers
tags: 
 - Linux
 - Kernel
 - Drivers

excerpt: "This tutorial gives a quick introduction to writing Linux device drivers. [Part 2]"
---

<style>
div {
    text-align: justify;
    text-justify: inter-word;
}
</style>


This article has been migrated from my [original post](https://embeddedinn.wordpress.com/tutorials/writing-linux-device-drivers-part-2/){:target="_blank"}  at [embeddedinn.wordpress.com](http://embeddedinn.wordpress.com){:target="_blank"}.   
{: .notice--info}


The first part of this article is available [here](/articles/tutorial/device drivers/writing-linux-device-drivers-part-1/){:target="_blank"}.

In this second part we will discuss some of the advanced topics related to writing Linux device drivers

<b><u>Associating multiple devices to same module – method 1</u></b>

The same kernel module can be used to associate functionality to different devices. This is implemented using the concept of major and minor numbers. One kernel module will be identified by the major number and the different devices that can be controlled controlled by the module will have different minor numbers.

When different devices to be controlled by the same module are created using mknod, different minor numbers are provided. When an operation is performed on the file, the minor number of the device can be identified from the inode structure that is passed into the module. (if inode is not directly passed in, it can be read from the file structure pointer as `filep->f_dentry->d_inode)`. The minor number is obtained using the macro `iminor()`.

Once you compile the module [here](https://raw.github.com/vppillai/LinuxDeviceDrivers_WPArticle/master/filep/filep.c){:target="_blank"} and insert it, you have to create two nodes using the following comand: `sudo mknod filep1 c 250 1` and `sudo mknod filep1 c 250 0`. The module implements a forked read that returns a message according to the device minor number of the node in use.

<b><u>Associating multiple devices to same module – method 2</u></b>

If the functionality to be implemented on the fops for different minor numbers are very much different, we can have a different fops set for different minor numbers. This is done by tweaking the `f_op` stored in the file structure pointer upon open based on the minor number used in open. This is illustrated in the module code [here](https://raw.github.com/vppillai/LinuxDeviceDrivers_WPArticle/master/fops/fops.c){:target="_blank"}

<b><u>Procfs</u></b>

Creating entries in proc file system is a common way to provide quick information about the modules that are inserted in the kernel. Some of the popular procfs entries created be the kernel are self, cpuinfo, modules etc ehich are used by many user space applications to report what is happening within the kernel. Though it is not a good practice to clutter the procfs with custom entries, it is a good starting point to understand how creating an entry there works.

A simple read entry in procfs is very  much similar to the read implementation for character devices. `proc_create` can be used with a `file_operations` pointer to create the entry as illustrated [here](https://raw.github.com/vppillai/LinuxDeviceDrivers_WPArticle/master/procfs/procfs.c){:target="_blank"}. The easiest (not the best) way to put this entry inside a directory is to first create the directory before inserting the module and include the full path in the create call.

However, more complex mechanisms are required for larger procfs entries.
