---
title: Buildroot and Raspberry Pi
date: 2014-10-20 14:24:21.000000000 +05:30
published: true
categories: 
- Articles
- Tutorial
tags: 
- Buildroot
- linux
- Raspberry Pi 

excerpt: "Steps to compile and bring up a minimalist kernel for Raspberry Pi using Buildroot"
---
<style>
div {
	text-align: justify;
	text-justify: inter-word;
}
</style>

{% include base_path %}

I reticently got a RaspberryPi on loan and started exploring the options. Being an embedded guy, I did not want to go with the miniature computer concept where you write and compile your programs in the target (RPi) itself. Rather, I wanted to cross compile and boot my own kernel and bring up a minimalist system up on the RPi .

## Compiling and booting the image

To start with, I looked up buildroot support for the Pi and was happy to find a default configuration on the buildroot snapshot  The last one I checked is here. Following are the steps to get started:

1. Download Buildroot and uncompress it to a work folder   
1. Build the configuration with the command `make raspberrypi_defconfig`   
1. Build the image with the command `make`. This will take long time to download the sources and compile the toolchain and images . (took around 1.5 hours in my old laptop)      
1. Once the build is completed, you can find all the required files in `output/images` folder   
1. Now, partition your SD card with two partitions (I use gparted to avoid nuking my hard disks by mistake)   
    1. The primary `fat32` partition marked as `bootable` – to hold the primary boot data   
    1. The second `ext4` partition to hold by root file system   
1. Copy zImage and all files in rpi-firmware folder to the primary partition   
    1. By default , serial console is not supported in the generated image. So, open your `commandline.txt` and append the following to the existing line:    
`console=ttyAMA0,115200 kgdboc=ttyAMA0,115200`   
1. login as root and untar the contents of rootfs.tar to the second partition   
    1. `sudo tar xf rootfs.tar -C /media/partition2`   
    1. To enable a login console via serial port, add the following line in `etc/inittab` after copying the files:   
`ttyAMA0::respawn:/sbin/getty -L ttyAMA0 115200 vt100`
1. sync your write buffers with “sudo sync” and unplug your SD card when done
1. Boot your RPi with your own kernel and enjoy.

## Using the serial interface

I used the minicom interface with a USB to serial converted in my Laptop that has ubuntu installed. To configure minicom, start minicom with `sudo minicom -s`. Configure the port to use `/dev/ttyUSB0` with `115200` baud, `8N1` (8 bits, no parity and one stop bit) and no flow control (hardware or software). For further use, just issue `sudo minicom`

## Device driver support

The minimalist kernel we compiled before has the bare minimum configuration to bootup Linux in the RPi. To support additional hardware, we need to enable additional drivers. We will look into the steps to enable some of the drivers and using them.

### 1) USB Mass storage driver

Open the Linux configuration from buildroot work directory using `make linux-menuconfig`.

In the device drivers section, enable `SCSI device support` and `SCSI disk support` as `builtin` (not “M”odule)

In the `USB Support` section, enable `USB Mass storage support` as `builtin`. Save the configuration and exit

Recompile the required parts (kernel alone) by issuing `make`. Since we have enabled the modules to be supported as builtin, only the `zImage` needs to be copied into the SD Card.

To verify that everything works fine, boot up your Pi with the new kernel and plug in a USB Flash drive. On giving the `dmesg` command, you should be able to find the device not name (`SDA`, `SDB` etc) from the logs. You can mount the device to a folder and start accessing the flash drive content.

### 2) Onboard LEDs

The green on-board LED can be controlled via a `sysfs` entry if the appropriate kernel module is available.

To enable driver support for the LED, compile the kernel with `GPIO LED` and `LED trigger` modules enabled in the kernel configuration

Once the kernel is compiled and “installed” with these drivers, the led trigger can be controlled by writing to the `sysfs` entry:

```bash
cd /sys/devices/platform/leds-gpio/leds/led0
cat trigger
```

This will list all the triggers available for the led device. To switch it on do:

```bash
echo default-on > /sys/devices/platform/leds-gpio/leds/led0/trigger
```

and to switch off,

```bash
echo none > /sys/devices/platform/leds-gpio/leds/led0/trigger
```

After each operation, you can cat the trigger file and see the change reflecting.

My next post will illustrate how an end to end system was built using this kernel and `rootfs`.

Cheers
