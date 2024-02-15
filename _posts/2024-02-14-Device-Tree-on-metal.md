---
title: Harnessing Device Tree for Bare-Metal Embedded Systems - A Non-Linux Approach
date: 2024-02-13 06:00:06.000000000 -07:00
classes: wide
published: true
categories:
- Articles
- Tutorial
tags:
- Device Tree
- Linux
- Embedded Systems

header:
  teaser: "images/posts/embeddedDeviceTrees/EmbeddedDeviceTrees.png"
  og_image: "images/posts/embeddedDeviceTrees/EmbeddedDeviceTrees.png"
excerpt: "Device trees are typically used in Linux systems to describe the hardware components of a system. However, device trees can be used in bare-metal systems, offering great interoperability and portability. This article describes how to use device trees in bare-metal systems." 

---

<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
</style>
<script src="https://unpkg.com/mermaid@10.8.0/dist/mermaid.min.js"></script>

{% include base_path %}

{% include toc title="Table of contents" icon="file-text" %}

## Introduction

Device trees are typically used in Linux systems to describe the hardware components of a system. Lately, RTOSes like Zephyr have made it more popular among developers of systems with lesser complexity. Device trees can be used in any bare-metal system to describe a system's hardware components and pass run-time parameters (as opposed to compile-time parameters). This approach offers a great deal of interoperability and portability. It also allows for a clear separation of hardware and software, making it easier to maintain and update the software. This article describes how to use device trees in bare-metal systems.

We will follow the latest 0.4 version of the [Device Tree Specification](https://github.com/devicetree-org/devicetree-specification/releases/tag/v0.4).

## Device Tree Overview

A Device tree is a hierarchical data structure often used to describe the hardware components and their configuration in a system. A device tree source (DTS) is a human-readable representation of the tree. The device tree compiler (DTC) is used to convert the DTS to a binary device tree blob (DTB) that can be used by software like a bootloader or the kernel.

Device tree bindings are similar to a schema in XML. It describes the properties and nodes used to describe a hardware component. The bindings are used to validate the device tree source and to generate documentation.

Device tree overlays (`dtbo`) are used to modify the device tree at runtime. This is useful for adding or removing hardware components from the device tree without modifying the device tree source. For example, when a beaglebone cape is added to the system, the device tree overlay can be used to add the cape to the device tree without modifying the device tree source.

Systems like Zephyr primarily convert device tree sources and bindings to produce a generated C header. However, in some systems, like an embedded system running Linux, the DTB is stored in a known location and is loaded into the kernel by the bootloader.

## Device Tree Syntax Basics

Before we get into the details of using device trees in bare-metal systems, let's review the basics of the device tree syntax.

### Properties

A property is a key-value pair that describes a hardware component. A property is defined using the following syntax:

```dts
property-name = <value>;
```

The property name is a unique identifier for the property. The value can be a number, a string, or a list of numbers.

```dts
compatible = "vendor,device";
reg = <0x12340000 0x1000>;
interrupts = <0 10 0>;
```

In this example, the `compatible` property is a string, the `reg` property is a list of numbers, and the `interrupts` property is a list of numbers.

Some of the standard properties from the specification are tabulated below:

| Property                           | Description                                                                                                                                                                                     |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatible`                       | A list of strings that describe the hardware component.                                                                                                                                         |
| `reg`                              | A list of numbers describing the hardware component's address and size.                                                                                                                 |
| `virtual-reg`                      | specifies an effective address that maps to the first physical address specified in the reg property of the device node.                                                                        |
| `interrupts`                       | A list of numbers that describe the interrupt number and type of the hardware component.                                                                                                        |
| `clocks`                           | A list of phandles that describe the clocks used by the hardware component.                                                                                                                     |
| `resets`                           | A list of phandles that describe the resets used by the hardware component.                                                                                                                     |
| `gpio`                             | A list of numbers that describe the GPIO pins used by the hardware component.                                                                                                                   |
| `pinctrl-0`                        | A phandle describing the pin configuration the hardware component uses.                                                                                                                  |
| `model`                            | A string that describes the model of the hardware component.                                                                                                                                    |
| `phandle`                          | A number that references a node in the device tree.                                                                                                                                   |
| `status`                           | A string that describes the status of the hardware component. Examples include "okay", "reserved", "disabled" etc.                                                                              |
| `#address-cells` and `#size-cells` | Numbers that describe the number of cells used to describe the address and size of the hardware component.                                                                                      |
| `ranges`                           | provides a means of defining a mapping or translation between the address space of the bus (the child address space) and the address space of the bus node’s parent (the parent address space). |




### Nodes

A node is a collection of properties that describe a hardware component. A node is defined using the following syntax:

```dts
node-name {
    property-name = <value>;
    ...
};
```

The node name is a unique identifier for the node. The properties are a collection of key-value pairs that describe the hardware component. The value can be a number, a string, or a list of numbers.

### Paths

A path is a unique identifier for a node in the device tree. It is a collection of node names separated by slashes. For example, the path `/soc/uart@12340000` refers to the node with the name `uart@12340000`, which is a child of the node with the name `soc.`

### Includes

The `#include` directive includes other device tree sources in the current device tree source. This is useful for reusing common device tree definitions across multiple sources.

```dts
#include "common.dtsi"
```

### Comments

Comments in the device tree source are similar to comments in the C programming language. They start with `//` and continue to the end of the line.

```dts
// This is a comment
```

### Example

Practically, a device tree corresponds to a hardware component. For example, consider an embedded system with a UART, a GPIO, and a SPI controller. The SPI controller is connected to a Flash memory, a temperature sensor, and an accelerometer. 

  <div class="mermaid">
  graph TD
      soc --> uart[UART @ 0x800000]
      soc --> gpio[GPIO @ 0x800100]
      soc --> spi[SPI @ 0x800200]
      spi --> flash[Flash @ CS0]
      spi --> temp-sensor[Temp Sensor @ CS1]
      spi --> accel[Accelerometer @ CS2]
  </div>

The DTS for this system would look something like this:

> **Note**: The following example is a simplified version of the device tree. The device tree would be more complex and include additional properties and nodes.

```dts
/dts-v1/;
/ {
    compatible = "vendor,device";
    #address-cells = <1>;
    #size-cells = <1>;

    soc {
        compatible = "vendor,soc";
        #address-cells = <1>;
        #size-cells = <1>;

        uart@800000 {
            compatible = "vendor,uart";
            reg = <0x800000 0x100>;
            interrupts = <10 0>;
        };

        gpio@800100 {
            compatible = "vendor,gpio";
            reg = <0x800100 0x100>;
            interrupts = <11 0>;
        };

        spi@800200 {
            compatible = "vendor,spi";
            reg = <0x800200 0x100>;
            interrupts = <12 0>;
            #address-cells = <1>;
            #size-cells = <1>;

            flash@0 {
                compatible = "vendor,flash";
                chip-select = <0>;
		        flash-size=<0x100000>;
            };

            temp-sensor@1 {
                compatible = "vendor,temp-sensor";
                chip-select = <1>;
            };

            accel@2 {
                compatible = "vendor,accel";
                chip-select = <2>;
            };
        };
    };
};

```

The idea is to change the hardware configuration without changing the software. This is especially useful in systems with many hardware components and systems that are expected to be used in different configurations. For example, we should be able to use the same software on a system with the chip select lines for the Flash and Temperature sensor swapped without changing the software.

To make this possible, the Flash and Temperature sensor device driver should not hardcode the chip select lines. Instead, it should use the device tree to find the chip select lines. This way, the device driver can be used on different systems without modification. The device tree will be loaded from a known location in the system, and the device driver will use the device tree to find the chip select lines.

## Using Device Trees in Bare-Metal Systems

First, we must compile the device tree into a binary device tree blob (DTB). Store the device tree from the example above in a file called `soc.dts`. Then, use the device tree compiler to compile the device tree into a binary device tree blob:

```bash
dtc -I dts -O dtb -o soc.dtb soc.dts
```

Since this is a simplified, non-standard example, you will see warnings about missing properties and nodes. You can safely ignore these warnings for now.

> **Note** `dtc` can also decompile a device tree blob into a device tree source. This is useful for debugging and understanding how the device tree compiler works. To decompile a device tree blob, use the `-I dtb` and `-O dts` options to specify the input and output formats, respectively.

The output of the device tree compiler is a binary device tree blob, often called the flat device tree (FDT). It is referred to as a flat device tree because it is a flat memory image that contains the entire device tree that also brings in the includes. 

The Devicetree `.dtb` Structure is depicted in the following diagram:

  <div class="mermaid">
    classDiagram
      class FDT {
        struct fdt_header
        free space
        memory reservation block
        free space
        structure block
        free space
        strings block
        free space
      }
  </div>

The `fdt_header` is a fixed-size header that contains information about the device tree. The layout of the header for the device tree is defined by the following `C` structure.

```c
struct fdt_header {
  uint32_t magic;              //0xd00dfeed
  uint32_t totalsize;          //total size of the device tree in bytes
  uint32_t off_dt_struct;      //offset in bytes of the structure block
  uint32_t off_dt_strings;     //offset in bytes of the strings block
  uint32_t off_mem_rsvmap;     //offset in bytes of the memory reservation block
  uint32_t version;            //format version
  uint32_t last_comp_version;  //last compatible version
  uint32_t boot_cpuid_phys;    //physical ID of the boot CPU. Not applicable in non-standard systems
  uint32_t size_dt_strings;   //size of the strings block in bytes
  uint32_t size_dt_struct;    //size of the structure block in bytes
};
```

Please refer to the Device Tree Specification for a full description of the header fields and the blob structure. 

We will be using the bare-metal `libfdt` implementation from within uboot to parse the device tree. While the full `libfdt` is part of the Linux kernel, the uboot version is a stripped-down version that provides essential capabilities. 

> **Note** The ubo0t libfdt supports FDT manipulation and hence contains a lot of code that is not needed for a bare-metal read-only system. For production use, this can be stripped down to the bare minimum.

## Building uboot `libfdt`

1. Clone the latest version of uboot from the official repository:

    ```bash
    git clone https://github.com/u-boot/u-boot.git

    ```
2. Change to the uboot directory and checkout the latest stable release:

    ```bash
    cd u-boot
    git checkout v2024.01
    ```
3. copy the `libfdt` directory to a new directory called `libfdt-uboot`:

    ```bash
    mkdir ../libfdt-uboot
    cp -r scripts/dtc/libfdt/ ../libfdt-uboot
    cd ../libfdt-uboot/libfdt
    ```
4. Create a makefile for the `libfdt`:
     
      ```bash
      touch Makefile
      ```
5. Add the following content to the makefile:
   
    ```makefile
    include Makefile.libfdt

    # Name of the library to create
    LIBFDT_LIB = libfdt.a

    # Rule to compile each source file into an object file
    %.o: %.c
      $(CC) -c $< -o $@ -I .  # override CC with your system toolchain

    # Rule to create the library from the object files
    $(LIBFDT_LIB): $(LIBFDT_OBJS)
      ar rcs $@ $^
      ranlib $@

    # Default rule
    all: $(LIBFDT_LIB)

    test: $(LIBFDT_LIB)
      $(CC) -o main main.c $(LIBFDT_LIB) -I .

    # Clean rule
    clean:
      rm -f $(LIBFDT_OBJS) $(LIBFDT_LIB)
    ```

6. Write a simple C program to parse the device tree:

    ```c
    #include <libfdt.h>
    #include <stdio.h>
    #include <stdlib.h>

    // function to read the dtb file
    static int read_dtb(char *dtbPath, void **fdt_blob) {
      FILE *fp = fopen(dtbPath, "rb");
      if (fp == NULL) {
        fprintf(stderr, "Error: Unable to open file\n");
        return 1;
      }

      fseek(fp, 0, SEEK_END);
      long fsize = ftell(fp);
      fseek(fp, 0, SEEK_SET);

      *fdt_blob = malloc(fsize);
      if (*fdt_blob == NULL) {
        fprintf(stderr, "Error: Unable to allocate memory\n");
        return 1;
      }

      fread(*fdt_blob, fsize, 1, fp);
      fclose(fp);

      return 0;
    }

    int main(int argc, char *argv[]) {
      const void *fdt = NULL;
      int err;
      void *fdt_blob = NULL;

      if (argc != 2) {
        fprintf(stderr, "Usage: %s <dtb file>\n", argv[0]);
        return 1;
      }

      read_dtb(argv[1], &fdt_blob);

      // check if the file is a valid fdt
      if (fdt_check_header(fdt_blob) != 0) {
        fprintf(stderr, "Error: Invalid device tree\n");
        return 1;
      }

      // get the /soc/spi tree and print the properties
      fdt = fdt_blob;
      int offset = fdt_path_offset(fdt, "/soc/spi");
      if (offset < 0) {
        fprintf(stderr, "Error: Unable to find /soc/spi\n");
        return 1;
      }

      int len;
      const char *prop = fdt_getprop(fdt, offset, "compatible", &len);
      if (prop == NULL) {
        fprintf(stderr, "Error: Unable to find compatible property\n");
        return 1;
      }
      printf("compatible: %s\n", prop);

      prop = fdt_getprop(fdt, offset, "reg", &len);
      if (prop == NULL) {
        fprintf(stderr, "Error: Unable to find reg property\n");
        return 1;
      }

      // print the reg address and size
      int i;
      for (i = 0; i < len / sizeof(uint32_t); i++) {
        printf("reg[%d]: 0x%x\n", i, fdt32_to_cpu(((fdt32_t *)prop)[i]));
      }
      printf("\n");

      // get all the spi nodes and print the properties
      int node;
      for (node = fdt_next_node(fdt, offset, NULL); node >= 0;
          node = fdt_next_node(fdt, node, NULL)) {
        char reg[32];
        const char *name = fdt_get_name(fdt, node, &len);
        if (name == NULL) {
          fprintf(stderr, "Error: Unable to find node name\n");
          return 1;
        }
        printf("node: %s\n", name);

        prop = fdt_getprop(fdt, node, "compatible", &len);
        if (prop == NULL) {
          fprintf(stderr, "Error: Unable to find compatible property\n");
          return 1;
        }
        printf("\tcompatible: %s\n", prop);

        // if compatible to "vendor,flash" print the flash-size property.
        if (strcmp(prop, "vendor,flash") == 0) {
          prop = fdt_getprop(fdt, node, "flash-size", &len);
          if (prop == NULL) {
            fprintf(stderr, "Error: Unable to find flash-size property\n");
            return 1;
          }

          // Assuming flash-size is a 32-bit integer
          int flash_size = fdt32_to_cpu(*(fdt32_t *)prop);
          printf("\tFlash size: 0x%x\n", flash_size);
        }

        prop = fdt_getprop(fdt, node, "chip-select", &len);
        if (prop == NULL) {
          fprintf(stderr, "Error: Unable to find chip-select property\n");
          return 1;
        }
        // convert property to string and print
        int cs = fdt32_to_cpu(*(fdt32_t *)prop);
        printf("\tChip Select: %d\n\n", cs);
      }

      free(fdt_blob);

      return 0;
    }
    ```
7. Compile and run the program:

    ```bash
    make test
    ./main soc.dtb
    ```
    The program should print the compatible and reg properties for the /soc/spi node and for each of the spi nodes.

    ```bash
    compatible: vendor,spi
    reg[0]: 0x800200
    reg[1]: 0x100

    node: flash@0
            compatible: vendor,flash
            Flash size: 0x100000
            Chip Select: 0

    node: temp-sensor@1
            compatible: vendor,temp-sensor
            Chip Select: 1

    node: accel@2
            compatible: vendor,accel
            Chip Select: 2
    ```

The program reads the device tree from the file `soc.dtb` and prints the compatible and reg properties for the `/soc/spi` node and each of the spi nodes. 


## Conclusion

Device trees are typically used in Linux systems to describe the hardware components of a system. However, device trees can be used in any bare-metal system to describe the hardware components of a system. This approach offers a great deal of interoperability and portability. It also allows for a clear separation of hardware and software, making it easier to maintain and update the software. This article showed how to use device trees in bare-metal systems.