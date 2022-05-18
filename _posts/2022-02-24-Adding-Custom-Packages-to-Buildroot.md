---
title: Adding Custom Packages to Buildroot
date: 2022-02-24 12:42:06.000000000 +05:30
classes: wide
published: true
categories:
- Articles
- Tutorial
tags:
- buildroot
- linux
- riscv
header:
  teaser: "images/posts/buildrootCust/buildrootCust_teaser.png"
  og_image: "images/posts/buildrootCust/buildrootCust_teaser.png"
excerpt: "This article talks about adding a custom package into buildroot for creating your own Linux distribution for embedded and emulation targets."

---


<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
</style>

{% include base_path %}

This is a quick tutorial on adding a custom package into buildroot for creating your own Linux distribution for embedded and emulation targets. You can find detailed instructions in the [buildroot documentation](https://buildroot.org/downloads/manual/manual.html#adding-packages)

[Buildroot](https://buildroot.org/) allows you to quickly generate full-fledged cross-compiled Linux systems. It comes with a tonne of packages that you can select while configuring. They are then cross-compiled into the final root file system generated by Buildroot. But, how do you add a new package into Buildroot? It might be a proprietary tool or a package not yet upstreamed into Buildroot. This article covers the basics of how this can be done.

There are two main methods to add a custom package into buildroot. The first method includes adding a package directly into the source tree and is described here. The second involves the use of an external package tree. A reference to using the second method is provided at the end of this article. 

Let us consider that you have a custom package (`embeddedinn`) that you would like to include in your Root FS created with buildroot. This package will consist of a source file and a makefile in the most straightforward case.

#### Source (`embeddedinn.c`): 

```c
#include <stdio.h>

int main(void) {
printf("EMBEDDEDINN\r\n");
}
```

#### Makefile

```

.PHONY: clean

embeddedinn: embeddedinn.c
    $(CC) -o '$@' '$<'

clean:
    rm embeddedinn
```

Now, let us create a package definition for this package in the buildroot source tree. In this case, we are assuming that the package is located in the `/packages/` directory and is locally available. Buildroot also lets you pull package contents from `git`, `svn`, `wget`, `tar.gz` etc. 

Within the Buildroot source tree, you can create an `embeddedinn` directory under the `package` directory and create two files: `hello.mk` and `Config.in` within the `hello` directory.


#### `package/embeddedinn/Config.in`

```
config BR2_PACKAGE_EMBEDDEDINN
    bool "embeddedinn"
    help
        embeddedinn package.

        https://embeddedinn.xyz
```

#### `package/embeddedinn/embeddedinn.mk`

```
################################################################################
#
# embeddedinn package
#
################################################################################

EMBEDDEDINN_VERSION = 1.0
EMBEDDEDINN_SITE = /packages/embeddedinn/src
EMBEDDEDINN_SITE_METHOD = local # Other methods like git,wget,scp,file etc. are also available.

define EMBEDDEDINN_BUILD_CMDS
    $(MAKE) CC="$(TARGET_CC)" LD="$(TARGET_LD)" -C $(@D)
endef

define EMBEDDEDINN_INSTALL_TARGET_CMDS
    $(INSTALL) -D -m 0755 $(@D)/embeddedinn  $(TARGET_DIR)/usr/bin
endef

$(eval $(generic-package))
```

Now create a link to the `Config.in` file by making an entry in the `package/Config.in` file of Buildroot.

#### `package/Config.in`:

```
menu "EMBEDDEDINN Packages"
    source "package/embeddedinn/Config.in"
endmenu
```

At this stage, the package will become visible in the menu and can be enabled to make an entry in the .config file.

{% include image.html
    img="images/posts/buildrootCust/menu1.png"
    width="600"
    caption="Menu for EMBEDDEDINN packages"
%}

{% include image.html
    img="images/posts/buildrootCust/menu2.png"
    width="600"
    caption="EMBEDDEDINN package details"
%}


> To configure the package, I did `make qemu_riscv64_virt_defconfig` and then `make menuconfig`. The new package will be available under `Target Packages`

Issuing a make command will build the package and include it into the generated root file system.

In this case, I am executing the generated RFS on a RISCV QEMU `virt` machine using the `start-qemu` script generated by buildroot. The `embeddedinn` command is now available in the generated RFS. 
    
{% include image.html
    img="images/posts/buildrootCust/qemu.png"
    width="600"
    caption="EMBEDDEDINN command in RFS"
%}

## BR2_EXTERNAL

If you want to maintain the project-specific source code outside the buildroot tree, you can use the `BR2_EXTERNAL` mechanism detailed in the [Buildroot documentation](https://buildroot.org/downloads/manual/manual.html#outside-br-custom). The path to BR2_EXTERNAL is passed to `make` invocation, and from that point onwards, buildroot considers the external tree as a part of the buildroot build process. A `.br2-external.mk` file is also generated in the output directory to avoid entering the `BR2_EXTERNAL` paths for every `make` invocation. 