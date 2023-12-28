---
title: Building Bespoke Debian Distros for RISC-V
date: 2023-11-21 22:10:06.000000000 -07:00
classes: wide
published: true
categories:
  - Articles
  - Tutorial
tags:
  - Operating System
  - Debian
  - RISC-V
  - Linux
  - QEMU

header:
  teaser: "images/posts/debianDistro/debianDistro_poster.png"
  og_image: "images/posts/debianDistro/debianDistro_poster.png"
excerpt: "In this article we will go over the steps to build a bespoke Debian distro for RISC-V. We will use QEMU to emulate the RISC-V architecture and build a Debian distro for it."
---

<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
</style>
<link rel="stylesheet" type="text/css" href="/assets/css/asciinema-player.css" />
<script src="/assets/js/thirdparty/asciinema-player.min.js"></script>

{% include base_path %}

{% include toc title="Table of contents" icon="file-text" %}

## Introduction

In this article we will go over the steps to build a bespoke Debian distro for RISC-V. We will use QEMU to emulate the RISC-V architecture and build a Debian distro for it. A bespoke OS is a custom OS that is built for a specific purpose. In this case, we will build a Debian distro that is built for RISC-V architecture. This is especially useful for embedded systems where we need full control over the OS and the packages that are installed on it.



## Why Debian?

Debian is a very popular Linux distro that is used in many embedded systems. It is also the base for many other Linux distros like Ubuntu. Debian is also very popular in the RISC-V community. Debian provides a very robust package management system that allows us to install and manage packages on the OS. Debian also provides a very robust build system that allows us to build packages for the OS.

## Getting Started with libe-build (`lb`)

Debian Live Build (`lb`) is a tool that allows us to build a Debian distro from scratch. It is a very powerful tool that allows us to customize the distro to our needs. It also allows us to build a distro for a specific architecture. In this article we will use `lb` to build a Debian distro for RISC-V architecture. Live Build uses a configuration directory to completely automate and customize all aspects of building a Live image.

### Dependencies and Installation

I am using a clean debian system running on an x86 machine to build the distro.

Since we are creating a Debian distro for the RISC-V architecture on a x86 machine, we will use the `qemu-user-static` tool to emulate the RISC-V architecture.

Install the following dependencies:

```bash
sudo apt install qemu-user qemu-user-static qemu-system-riscv64 binutils-riscv64-linux-gnu-dbg binutils-riscv64-linux-gnu \
     libguestfs-tools binfmt-support build-essential git vim debian-archive-keyring debootstrap
```

In case of a non-systemd system (like WSL2), we need to enable binfmt support for qemu. This can be done by running the following command:

```bash
# running this explicitly since systemd does not start this on non-systemd systems like WSL2
sudo /usr/lib/systemd/systemd-binfmt 
# these two steps are to check if it is enabled. It should return `enabled` for the qemu-riscv64 format
sudo update-binfmts --enable qemu-riscv64
sudo cat /proc/sys/fs/binfmt_misc/status 
```

> **A side note on binfmt** <br/>
> `binfmt` lets us configure additional binary formats for executables at boot. It uses the [Kernel Support for miscellaneous Binary Formats `binfmt_misc`](https://docs.kernel.org/admin-guide/binfmt-misc.html) that allows us to register an intrepreter to use for a specific binary format. This is useful when we want to run binaries for a different architecture on our host machine. <br/>In our case, we are using `qemu-user-static` to emulate the RISC-V architecture on our x86 machine. We will use `binfmt` to register `qemu-user-static` as the interpreter for the RISC-V binary format. This will allow us to run RISC-V binaries on our x86 machine. <br/><br/> The magic number and other format elements used to identify the interpretor is stored in the following files <br/>`/etc/binfmt.d/*.conf`<br/>`/run/binfmt.d/*.conf`<br/>`/usr/lib/binfmt.d/*.conf`<br/><br/> the `systemd-binfmt` command registers these formats with the kernel. <br/> You can also register a format manually like this:<br> ```echo ':qemu-riscv64:M::\x7f\x45\x4c\x46\x02\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\xf3\x00:\xff\xff\xff\xff\xff\xff\xff\x00\xff\xff\xff\xff\xff\xff\xff\xff\xfe\xff\xff\xff:/usr/libexec/qemu-binfmt/riscv64-binfmt-P:OCPF' > /proc/sys/fs/binfmt_misc/register```



Set up packages for risc-v with the following steps:

```bash
sudo dpkg --add-architecture riscv64
sudo apt-get install gcc-riscv64-linux-gnu g++-riscv64-linux-gnu
```

Then do a `sudo apt update` to update the package list.

We will fetch the latest version of live-build from git and build it from source.

```bash
git clone https://salsa.debian.org/live-team/live-build.git
cd live-build
mkdir install
# temp fix for missing manpages
mkdir -p manpages/fr manpages/ja
touch manpages/fr/temp manpages/ja/temp
sudo make install
```

Check the installation with

```bash
lb --version
```

## Creating a distro configuration

Running `lb` without any arguments will create a default configuration directory in the current directory. Hpwever, we want to customize the configuration at creation time. We will use the following command to create a semi-customized configuration directory. Run this command in a directory of your choice.

```bash
export LB_BOOTSTRAP_INCLUDE="apt-transport-https gnupg"
lb config \
 --apt-indices false \
 --apt-secure false \
 --architectures riscv64 \
 --distribution unstable \
 --mirror-bootstrap http://deb.debian.org/debian/ \
 --mirror-binary http://deb.debian.org/debian/ \
 --keyring-packages "debian-archive-keyring debian-archive-keyring" \
 --security false \
 --archive-areas 'main contrib non-free' \
 --apt-options '--yes -oAPT::Get::AllowUnauthenticated=true' \
 --binary-filesystem ext4 \
 --binary-images tar \
 --bootappend-live "hostname=embeddedinn username=embeddedinn" \
 --bootstrap-qemu-arch riscv64 \
 --bootstrap-qemu-static /usr/bin/qemu-riscv64-static \
 --cache true \
 --firmware-binary false \
 --firmware-chroot false \
 --apt-source-archives false \
 --chroot-filesystem none \
 --compression gzip \
 --debootstrap-options "--keyring=/usr/share/keyrings/debian-archive-keyring.gpg --variant=minbase --include=apt-transport-https,apt-utils,gnupg,ca-certificates,ssl-cert,openssl" \
 --distribution unstable \
 --gzip-options '-9 --rsyncable' \
 --iso-publisher 'embeddedinn; https://embeddedinn.com/; vysakhpillai@embeddedinn.com' \
 --iso-volume 'embeddedinn riscv64 $(date +%Y%m%d)' \
 --linux-flavours none \
 --linux-packages none \
 --mode debian \
 --system normal \
 --updates false
```

Each of the options we passed are explained in the table below:

| Option | Description |
| --- | --- |
| `--apt-indices false` | Do not download apt indices |
| `--apt-secure false` | Do not use apt secure |
| `--architectures riscv64` | Build for the riscv64 architecture |
| `--distribution unstable` | Build for the unstable distribution. This is because we want to build for the latest version of Debian. |
| `--mirror-bootstrap http://deb.debian.org/debian/` | Use the Debian ports mirror for the bootstrap. Bootstrap is the first stage of the build process where we build the base system which is further used to build the final system. |
| `--mirror-binary http://deb.debian.org/debian/` | Use the Debian ports mirror for the binary. Binary is the second stage of the build process where we build the final system. |
| `--keyring-packages "debian-archive-keyring debian-archive-keyring"` | Use the Debian ports keyring for the build. |
| `--security false` | Do not use security updates. We are ignoring security updates for now. |
| `--archive-areas 'main contrib non-free'` | Use the main, contrib, and non-free archives to pull packages from. |
| `--apt-options '--yes -oAPT::Get::AllowUnauthenticated=true'` | Use the `--yes` option for apt and allow unauthenticated packages. |
| `--binary-filesystem ext4` | Use the ext4 filesystem for the binary. Other options are squashfs and tar. |
| `--binary-images tar` | Use the tar image for the binary. Other options are iso and netboot. |
| `--bootappend-live "hostname=embeddedinn username=embeddedinn"` | Append the `hostname` and `username` to the boot command line. |
| `--bootstrap-qemu-arch riscv64` | Use the riscv64 architecture for the bootstrap. Qemu will use this architecture to emulate the bootstrap machine to build the base system. |
| `--bootstrap-qemu-static /usr/bin/qemu-system-riscv64` | Use the qemu-system-riscv64 binary to emulate the bootstrap machine. We installed this binary in the dependencies section. An explicit path lets us use custom QEMU binaries. |
| `--cache true` | Use the cache to speed up the build process. This includes the apt cache and the package cache. |
| `--firmware-binary false` | Do not include firmware in the binary. Firware refers to components like the kernel and the initrd. We will build these components separately. here we are just building the OS rootfs. |
| `--firmware-chroot false` | Do not include firmware in the chroot. chroot is the root directory of the OS during the build process. |
| `--apt-source-archives false` | Do not include apt source archives.  We are not interested in the apt source archives since we are building a distro for an embedded system. We will talk about packages in a separate article. |
| `--chroot-filesystem none` | Do not use a chroot filesystem. Instead, use the host filesystem. We do this because we are building for a different architecture than the host. |
| `--compression gzip` | Use gzip compression for the output. |
| `--debootstrap-options` | debootstrap is the tool that is used to bootstrap the base system. We are passing the following options to debootstrap: <br> `--keyring=/usr/share/keyrings/debian-archive-keyring.gpg` - Use the Debian ports keyring for the bootstrap. <br> `--variant=minbase` - Use the minbase variant of debootstrap. This variant installs only the essential packages. <br> `--include=apt-transport-https,apt-utils,gnupg,ca-certificates,ssl-cert,openssl` - Include the following packages in the bootstrap: `apt-transport-https, apt-utils, gnupg, ca-certificates, ssl-cert, openssl.` |
| `--distribution unstable` | Build for the unstable distribution. This is because we are building for the latest version of Debian. |
| `--gzip-options '-9 --rsyncable'` | Use the `-9` option for gzip compression and use the `--rsyncable` option to make the output file rsync friendly. |
| `--iso-publisher` | Set the publisher of the iso. |
| `--iso-volume` | Set the volume of the iso. |
| `--linux-flavours none` | Do not include linux flavours. |
| `--linux-packages none` | Do not include linux packages. |
| `--mode debian` | Build a Debian distro. Other options are `live` and `netboot`. |
| `--system normal` | Build a normal system. Other options are `chroot` and `live`. |
| `--updates false` | Do not use updates. We will pull the latest packages from the Debian ports mirror. |


As a result of the command, the following files and directories will be created:

<pre>
<span style="font-weight:bold;color:#3333FF;">.</span>
├── <span style="font-weight:bold;color:#3333FF;">auto</span>
├── <span style="font-weight:bold;color:#3333FF;">config</span>
│   ├── <span style="font-weight:bold;color:#3333FF;">apt</span>
│   ├── <span style="font-weight:bold;color:#3333FF;">archives</span>
│   ├── binary
│   ├── <span style="font-weight:bold;color:#3333FF;">bootloaders</span>
│   ├── bootstrap
│   ├── chroot
│   ├── common
│   ├── <span style="font-weight:bold;color:#3333FF;">debian-installer</span>
│   ├── <span style="font-weight:bold;color:#3333FF;">hooks</span>
│   │   ├── <span style="font-weight:bold;color:#3333FF;">live</span>
│   │   │   ├── <span style="font-weight:bold;color:aqua;">0010-disable-kexec-tools.hook.chroot</span> -&gt; <span style="font-weight:bold;color:lime;">/usr/share/live/build/hooks/live/0010-disable-kexec-tools.hook.chroot</span>
│   │   │   └── <span style="font-weight:bold;color:aqua;">0050-disable-sysvinit-tmpfs.hook.chroot</span> -&gt; <span style="font-weight:bold;color:lime;">/usr/share/live/build/hooks/live/0050-disable-sysvinit-tmpfs.hook.chroot</span>
│   │   └── <span style="font-weight:bold;color:#3333FF;">normal</span>
│   │       ├── <span style="font-weight:bold;color:aqua;">1000-create-mtab-symlink.hook.chroot</span> -&gt; <span style="font-weight:bold;color:lime;">/usr/share/live/build/hooks/normal/1000-create-mtab-symlink.hook.chroot</span>
│   │       ├── <span style="font-weight:bold;color:aqua;">1010-enable-cryptsetup.hook.chroot</span> -&gt; <span style="font-weight:bold;color:lime;">/usr/share/live/build/hooks/normal/1010-enable-cryptsetup.hook.chroot</span>
│   │       ├── <span style="font-weight:bold;color:aqua;">1020-create-locales-files.hook.chroot</span> -&gt; <span style="font-weight:bold;color:lime;">/usr/share/live/build/hooks/normal/1020-create-locales-files.hook.chroot</span>
│   │       ├── <span style="font-weight:bold;color:aqua;">5000-update-apt-file-cache.hook.chroot</span> -&gt; <span style="font-weight:bold;color:lime;">/usr/share/live/build/hooks/normal/5000-update-apt-file-cache.hook.chroot</span>
│   │       ├── <span style="font-weight:bold;color:aqua;">5010-update-apt-xapian-index.hook.chroot</span> -&gt; <span style="font-weight:bold;color:lime;">/usr/share/live/build/hooks/normal/5010-update-apt-xapian-index.hook.chroot</span>
│   │       ├── <span style="font-weight:bold;color:aqua;">5020-update-glx-alternative.hook.chroot</span> -&gt; <span style="font-weight:bold;color:lime;">/usr/share/live/build/hooks/normal/5020-update-glx-alternative.hook.chroot</span>
│   │       ├── <span style="font-weight:bold;color:aqua;">5030-update-plocate-database.hook.chroot</span> -&gt; <span style="font-weight:bold;color:lime;">/usr/share/live/build/hooks/normal/5030-update-plocate-database.hook.chroot</span>
│   │       ├── <span style="font-weight:bold;color:aqua;">5040-update-nvidia-alternative.hook.chroot</span> -&gt; <span style="font-weight:bold;color:lime;">/usr/share/live/build/hooks/normal/5040-update-nvidia-alternative.hook.chroot</span>
│   │       ├── <span style="font-weight:bold;color:aqua;">8000-remove-adjtime-configuration.hook.chroot</span> -&gt; <span style="font-weight:bold;color:lime;">/usr/share/live/build/hooks/normal/8000-remove-adjtime-configuration.hook.chroot</span>
│   │       ├── <span style="font-weight:bold;color:aqua;">8010-remove-backup-files.hook.chroot</span> -&gt; <span style="font-weight:bold;color:lime;">/usr/share/live/build/hooks/normal/8010-remove-backup-files.hook.chroot</span>
│   │       ├── <span style="font-weight:bold;color:aqua;">8020-remove-dbus-machine-id.hook.chroot</span> -&gt; <span style="font-weight:bold;color:lime;">/usr/share/live/build/hooks/normal/8020-remove-dbus-machine-id.hook.chroot</span>
│   │       ├── <span style="font-weight:bold;color:aqua;">8030-truncate-log-files.hook.chroot</span> -&gt; <span style="font-weight:bold;color:lime;">/usr/share/live/build/hooks/normal/8030-truncate-log-files.hook.chroot</span>
│   │       ├── <span style="font-weight:bold;color:aqua;">8040-remove-mdadm-configuration.hook.chroot</span> -&gt; <span style="font-weight:bold;color:lime;">/usr/share/live/build/hooks/normal/8040-remove-mdadm-configuration.hook.chroot</span>
│   │       ├── <span style="font-weight:bold;color:aqua;">8050-remove-openssh-server-host-keys.hook.chroot</span> -&gt; <span style="font-weight:bold;color:lime;">/usr/share/live/build/hooks/normal/8050-remove-openssh-server-host-keys.hook.chroot</span>
│   │       ├── <span style="font-weight:bold;color:aqua;">8060-remove-systemd-machine-id.hook.chroot</span> -&gt; <span style="font-weight:bold;color:lime;">/usr/share/live/build/hooks/normal/8060-remove-systemd-machine-id.hook.chroot</span>
│   │       ├── <span style="font-weight:bold;color:aqua;">8070-remove-temporary-files.hook.chroot</span> -&gt; <span style="font-weight:bold;color:lime;">/usr/share/live/build/hooks/normal/8070-remove-temporary-files.hook.chroot</span>
│   │       ├── <span style="font-weight:bold;color:aqua;">8080-reproducible-glibc.hook.chroot</span> -&gt; <span style="font-weight:bold;color:lime;">/usr/share/live/build/hooks/normal/8080-reproducible-glibc.hook.chroot</span>
│   │       ├── <span style="font-weight:bold;color:aqua;">8090-remove-ssl-cert-snakeoil.hook.chroot</span> -&gt; <span style="font-weight:bold;color:lime;">/usr/share/live/build/hooks/normal/8090-remove-ssl-cert-snakeoil.hook.chroot</span>
│   │       ├── <span style="font-weight:bold;color:aqua;">8100-remove-udev-persistent-cd-rules.hook.chroot</span> -&gt; <span style="font-weight:bold;color:lime;">/usr/share/live/build/hooks/normal/8100-remove-udev-persistent-cd-rules.hook.chroot</span>
│   │       ├── <span style="font-weight:bold;color:aqua;">8110-remove-udev-persistent-net-rules.hook.chroot</span> -&gt; <span style="font-weight:bold;color:lime;">/usr/share/live/build/hooks/normal/8110-remove-udev-persistent-net-rules.hook.chroot</span>
│   │       ├── <span style="font-weight:bold;color:aqua;">9000-remove-gnome-icon-cache.hook.chroot</span> -&gt; <span style="font-weight:bold;color:lime;">/usr/share/live/build/hooks/normal/9000-remove-gnome-icon-cache.hook.chroot</span>
│   │       ├── <span style="font-weight:bold;color:aqua;">9010-remove-python-pyc.hook.chroot</span> -&gt; <span style="font-weight:bold;color:lime;">/usr/share/live/build/hooks/normal/9010-remove-python-pyc.hook.chroot</span>
│   │       └── <span style="font-weight:bold;color:aqua;">9020-remove-man-cache.hook.chroot</span> -&gt; <span style="font-weight:bold;color:lime;">/usr/share/live/build/hooks/normal/9020-remove-man-cache.hook.chroot</span>
│   ├── <span style="font-weight:bold;color:#3333FF;">includes</span>
│   ├── <span style="font-weight:bold;color:#3333FF;">includes.binary</span>
│   ├── <span style="font-weight:bold;color:#3333FF;">includes.bootstrap</span>
│   ├── <span style="font-weight:bold;color:#3333FF;">includes.chroot_after_packages</span>
│   ├── <span style="font-weight:bold;color:#3333FF;">includes.chroot_before_packages</span>
│   ├── <span style="font-weight:bold;color:#3333FF;">includes.installer</span>
│   ├── <span style="font-weight:bold;color:#3333FF;">includes.source</span>
│   ├── <span style="font-weight:bold;color:#3333FF;">package-lists</span>
│   ├── <span style="font-weight:bold;color:#3333FF;">packages</span>
│   ├── <span style="font-weight:bold;color:#3333FF;">packages.binary</span>
│   ├── <span style="font-weight:bold;color:#3333FF;">packages.chroot</span>
│   ├── <span style="font-weight:bold;color:#3333FF;">preseed</span>
│   ├── <span style="font-weight:bold;color:#3333FF;">rootfs</span>
│   └── source
└── <span style="font-weight:bold;color:#3333FF;">local</span>
    └── <span style="font-weight:bold;color:#3333FF;">bin</span>

25 directories, 30 files
</pre>


As you would have noticed, a lot of the hooks are pointing to defaults. These hooks are used to customize the build process. We will talk about some of the hooks we would want to add and/or replace with custom hooks in order to customize our image. 

## Customizing the distro

There are a lot of customiations that can be done to the distro. We will just focus on a few examples here to get started.

These files are typically stored in a seperate customization folder and then copied into the autogenerated configuration directory. This allows us to keep the autogenerated configuration directory clean and easy to maintain.

All the files below are created within the config folder. 

### packages list

This is a relatively random list of packages that I want to install in the distro. This is not a complete list and is just for demonstration purposes.

**filename**: `package-lists/embeddedinn-sid-server.list.chroot`

<span style="max-height:550px;overflow:auto;">

```bash
mkdir -p "./config/package-lists"
cat >"./config/package-lists/embeddedinn-sid-server.list.chroot" <<"EOM"
2ping
accountsservice
apparmor
apt-utils
arping
arpwatch
at
attr
bash-completion
bc
bcache-tools
bonnie++
bridge-utils
buffer
bzip2
build-essential
ca-certificates
cifs-utils
console-data
console-setup
cpio
cron
cryptsetup-bin
curl
dnsutils
dbus
debian-ports-archive-keyring
debootstrap
dmsetup
dnsutils
dosfstools
dselect
dump
ed
eject
elinks
etherwake
ethtool
exfat-fuse
exfatprogs
f2fs-tools
file
finger
fsarchiver
ftp
fuse3
gawk
gdbserver
gdisk
gdu
genromfs
git
gpart
gpg-agent
groff-base
hdparm
hexedit
htop
iftop
inetutils-telnet
info
iotop
ipcalc
iperf3
ipmitool
iptables
iptraf-ng
iputils-ping
iputils-tracepath
irqbalance
isc-dhcp-client
isc-dhcp-common
iso-codes
isomd5sum
kbd
keyboard-configuration
keyutils
less
lftp
lldpd
lm-sensors
locales
lrzsz
lsb-release
lshw
lsof
lvm2
lz4
lzip
lzop
makedev
man-db
manpages
mbr
memtester
mime-support
minicom
mtools
mtr-tiny
ncat
netcat-openbsd
netcat-traditional
net-tools
nicstat
nmap
ntfs-3g
ntpdate
ntpsec-ntpdate
ntpsec-ntpdig
nvme-cli
nwipe
openssh-client
perl
perl-modules
openssh-server
openssl
openvpn
p7zip
partclone
parted
patch
pciutils
perl
perl-modules
policykit-1
powermgmt-base
procinfo
psmisc
python3
python3-dbus
python3-distutils
python3-gdbm
python3-gi
resolvconf
rdate
rdiff-backup
rename
rlwrap
rmlint
rsync
rsyslog
screen
sdparm
setserial
sipcalc
smbclient
socat
squashfs-tools
sshfs
ssl-cert
strace
stress-ng
stunnel4
sudo
telnet
time
tcpdump
time
tmux
tofrodos
traceroute
ucf
udftools
ufw
unp
unzip
usbutils
uuid-runtime
vim
vlan
w3m
wakeonlan
wget
whois
wipe
xorriso
xxd
xxhash
xz-utils
zerofree
EOM
```

</span>

### user customizations

**filename**: `includes.chroot/root/.profile`

```bash
mkdir -p "./config/includes.chroot/root"
cat >"./config/includes.chroot/root/.profile" <<"EOM"
export LD_LIBRARY_PATH=$LIB:$LIBUSR:$LD_LIBRARY_PATH
EOM
```

**filename**: `includes.chroot/root/.bashrc`

```bash
mkdir -p "./config/includes.chroot/root"
cat >"./config/includes.chroot/root/.bashrc" <<"EOM"
export LD_LIBRARY_PATH=$LIB:$LIBUSR:$LD_LIBRARY_PATH
EOM
```

### etc files

**filename**: `includes.chroot/etc/resolv.conf`

```bash
mkdir -p "./config/includes.chroot/etc"
cat >"./config/includes.chroot/etc/resolv.conf" <<"EOM"
nameserver 8.8.8.8
EOM
```

**filename**: `includes.chroot/etc/rc.local`

```bash
mkdir -p "./config/includes.chroot/etc"
cat >"./config/includes.chroot/etc/rc.local" <<"EOM"
#!/bin/sh -e
#
# rc.local
#
# This script is executed at the end of each multiuser runlevel.
# Make sure that the script will "exit 0" on success or any other
# value on error.
#
# In order to enable or disable this script just change the execution
# bits.
#
# By default this script does nothing.

FLAG="/var/log/firstboot.log"
if [ ! -f ${FLAG} ]
then
	echo "First boot detected" >> ${FLAG}
	echo "Performing initial setup tasks." >> ${FLAG}
	echo "Creating ssh host keys..." >> ${FLAG}
	ssh-keygen -t dsa -f /etc/ssh/ssh_host_dsa_key -q -N ""
	ssh-keygen -t rsa -f /etc/ssh/ssh_host_rsa_key -q -N ""
fi

ntpdate -ub 0.pool.ntp.org > /dev/null

exit 0
EOM
chmod +x "./config/includes.chroot/etc/rc.local"
```

**filename**: `includes.chroot/etc/os-release`

```bash
mkdir -p "./config/includes.chroot/etc"
cat >"./config/includes.chroot/etc/os-release" <<"EOM"
NAME="embeddedinn RISC/V "
VERSION="13.0"
ID=embeddedinn
ID_LIKE=debian
PRETTY_NAME="embeddedinn RISC-V"
VERSION_ID="11.0"
HOME_URL="https://embeddedinn.com/"
SUPPORT_URL="https://embeddedinn.com/"
BUG_REPORT_URL="https://embeddedinn.com/"
EOM
```

**filename**: `includes.chroot/etc/lsb-release`

```bash
mkdir -p "./config/includes.chroot/etc"
cat >"./config/includes.chroot/etc/lsb-release" <<"EOM"
DISTRIB_ID=embeddedinn
DISTRIB_RELEASE=13
DISTRIB_CODENAME=Sid
DISTRIB_DESCRIPTION="embeddedinn Sid"
EOM
```

**filename**: `includes.chroot/etc/legal`

```bash
mkdir -p "./config/includes.chroot/etc"
cat >"./config/includes.chroot/etc/legal" <<"EOM"

The programs included with the Embeddedinn system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Embeddedinn comes with ABSOLUTELY NO WARRANTY, to the extent permitted by
applicable law.

EOM
```

**filename**: `includes.chroot/etc/issue.net`

```bash
mkdir -p "./config/includes.chroot/etc"
cat >"./config/includes.chroot/etc/issue.net" <<"EOM"
Embeddedinn Sid riscv64 
EOM
```

**filename**: `includes.chroot/etc/issue`

```bash
mkdir -p "./config/includes.chroot/etc"
cat >"./config/includes.chroot/etc/issue" <<"EOM"
Embeddedinn Sid RISC/V  \n \l
EOM
```

**filename**: `includes.chroot/etc/hosts`

```bash
mkdir -p "./config/includes.chroot/etc"
cat >"./config/includes.chroot/etc/hosts" <<"EOM"
127.0.0.1	localhost
::1		localhost ip6-localhost ip6-loopback
fe00::0		ip6-localnet
ff00::0		ip6-mcastprefix
ff02::1		ip6-allnodes
ff02::2		ip6-allrouters
127.0.1.1       embeddedinn
EOM
```

**filename**: `includes.chroot/etc/hostname`

```bash
mkdir -p "./config/includes.chroot/etc"
cat >"./config/includes.chroot/etc/hostname" <<"EOM"
embeddedinn
EOM
```

**filename**: `includes.chroot/etc/fstab`

```bash 
mkdir -p "./config/includes.chroot/etc"
cat >"./config/includes.chroot/etc/fstab" <<"EOM"
# <file system> <mount point> <type>  <options> <dump>  <pass>
proc /proc proc defaults 0 0
sysfs /sys sysfs defaults 0 0
tmpfs /tmp tmpfs defaults 0 0
tmpfs /run tmpfs defaults 0 0
tmpfs /var/log tmpfs defaults 0 0
tmpfs /var/tmp tmpfs defaults 0 0
tmpfs /var/spool tmpfs defaults 0 0
tmpfs /var/cache tmpfs defaults 0 0
EOM
```

**filename**: `includes.chroot/etc/update-motd.d/10-help-text`

```bash
mkdir -p "./config/includes.chroot/etc/update-motd.d"
cat >"./config/includes.chroot/etc/update-motd.d/10-help-text" <<"EOM"
#!/bin/sh
#
#    10-help-text - print the help text associated with the distro
#    Copyright (C) 2009-2010 Canonical Ltd.
#
#    Authors: Dustin Kirkland <kirkland@canonical.com>,
#             Brian Murray <brian@canonical.com>
#
#    This program is free software; you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation; either version 2 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License along
#    with this program; if not, write to the Free Software Foundation, Inc.,
#    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

[ -r /etc/lsb-release ] && . /etc/lsb-release

if [ -z "$DISTRIB_RELEASE" ] && [ -x /usr/bin/lsb_release ]; then
	# Fall back to using the very slow lsb_release utility
	DISTRIB_RELEASE=$(lsb_release -sr)
fi

URL="https://embeddedinn.com/"

printf "\n * Documentation:  %s\n" "$URL"
EOM
chmod +x "./config/includes.chroot/etc/update-motd.d/10-help-text"
```

**filename**: `includes.chroot/etc/skel/.profile`

```bash
mkdir -p "./config/includes.chroot/etc/skel"
cat >"./config/includes.chroot/etc/skel/.profile" <<"EOM"
# ~/.profile: executed by the command interpreter for login shells.
# This file is not read by bash(1), if ~/.bash_profile or ~/.bash_login
# exists.
# see /usr/share/doc/bash/examples/startup-files for examples.
# the files are located in the bash-doc package.

# the default umask is set in /etc/profile; for setting the umask
# for ssh logins, install and configure the libpam-umask package.
#umask 022

# if running bash
if [ -n "$BASH_VERSION" ]; then
    # include .bashrc if it exists
    if [ -f "$HOME/.bashrc" ]; then
	. "$HOME/.bashrc"
    fi
fi

# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/bin" ] ; then
    PATH="$HOME/bin:$PATH"
fi


export LD_LIBRARY_PATH=$LIB:$LIBUSR:$LD_LIBRARY_PATH

EOM
```

**filename**: `includes.chroot/etc/skel/.bashrc`

```bash
mkdir -p "./config/includes.chroot/etc/skel"
cat >"./config/includes.chroot/etc/skel/.bashrc" <<"EOM"
# ~/.bashrc: executed by bash(1) for non-login shells.
# see /usr/share/doc/bash/examples/startup-files (in the package bash-doc)
# for examples

# If not running interactively, don't do anything
case $- in
    *i*) ;;
      *) return;;
esac

# don't put duplicate lines or lines starting with space in the history.
# See bash(1) for more options
HISTCONTROL=ignoreboth

# append to the history file, don't overwrite it
shopt -s histappend

# for setting history length see HISTSIZE and HISTFILESIZE in bash(1)
HISTSIZE=1000
HISTFILESIZE=2000

# check the window size after each command and, if necessary,
# update the values of LINES and COLUMNS.
shopt -s checkwinsize

# If set, the pattern "**" used in a pathname expansion context will
# match all files and zero or more directories and subdirectories.
#shopt -s globstar

# make less more friendly for non-text input files, see lesspipe(1)
[ -x /usr/bin/lesspipe ] && eval "$(SHELL=/bin/sh lesspipe)"

# set variable identifying the chroot you work in (used in the prompt below)
if [ -z "${debian_chroot:-}" ] && [ -r /etc/debian_chroot ]; then
    debian_chroot=$(cat /etc/debian_chroot)
fi

# set a fancy prompt (non-color, unless we know we "want" color)
case "$TERM" in
    xterm-color) color_prompt=yes;;
esac

# uncomment for a colored prompt, if the terminal has the capability; turned
# off by default to not distract the user: the focus in a terminal window
# should be on the output of commands, not on the prompt
#force_color_prompt=yes

if [ -n "$force_color_prompt" ]; then
    if [ -x /usr/bin/tput ] && tput setaf 1 >&/dev/null; then
	# We have color support; assume it's compliant with Ecma-48
	# (ISO/IEC-6429). (Lack of such support is extremely rare, and such
	# a case would tend to support setf rather than setaf.)
	color_prompt=yes
    else
	color_prompt=
    fi
fi

if [ "$color_prompt" = yes ]; then
    PS1='${debian_chroot:+($debian_chroot)}\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '
else
    PS1='${debian_chroot:+($debian_chroot)}\u@\h:\w\$ '
fi
unset color_prompt force_color_prompt

# If this is an xterm set the title to user@host:dir
case "$TERM" in
xterm*|rxvt*)
    PS1="\[\e]0;${debian_chroot:+($debian_chroot)}\u@\h: \w\a\]$PS1"
    ;;
*)
    ;;
esac

# enable color support of ls and also add handy aliases
if [ -x /usr/bin/dircolors ]; then
    test -r ~/.dircolors && eval "$(dircolors -b ~/.dircolors)" || eval "$(dircolors -b)"
    alias ls='ls --color=auto'
    #alias dir='dir --color=auto'
    #alias vdir='vdir --color=auto'

    alias grep='grep --color=auto'
    alias fgrep='fgrep --color=auto'
    alias egrep='egrep --color=auto'
fi

# some more ls aliases
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'

# Add an "alert" alias for long running commands.  Use like so:
#   sleep 10; alert
alias alert='notify-send --urgency=low -i "$([ $? = 0 ] && echo terminal || echo error)" "$(history|tail -n1|sed -e '\''s/^\s*[0-9]\+\s*//;s/[;&|]\s*alert$//'\'')"'

# Alias definitions.
# You may want to put all your additions into a separate file like
# ~/.bash_aliases, instead of adding them here directly.
# See /usr/share/doc/bash-doc/examples in the bash-doc package.

if [ -f ~/.bash_aliases ]; then
    . ~/.bash_aliases
fi

# enable programmable completion features (you don't need to enable
# this, if it's already enabled in /etc/bash.bashrc and /etc/profile
# sources /etc/bash.bashrc).
if ! shopt -oq posix; then
  if [ -f /usr/share/bash-completion/bash_completion ]; then
    . /usr/share/bash-completion/bash_completion
  elif [ -f /etc/bash_completion ]; then
    . /etc/bash_completion
  fi
fi

export LD_LIBRARY_PATH=$LIB:$LIBUSR:$LD_LIBRARY_PATH


EOM
```

**filename**: `includes.chroot/etc/network/interfaces.d/eth0`

```bash
mkdir -p "./config/includes.chroot/etc/network/interfaces.d"
cat >"./config/includes.chroot/etc/network/interfaces.d/eth0" <<"EOM"
auto eth0
allow-hotplug eth0
iface eth0 inet dhcp
EOM
```

**filename**: `includes.chroot/etc/default/locale`

```bash
mkdir -p "./config/includes.chroot/etc/default"
cat >"./config/includes.chroot/etc/default/locale" <<"EOM"
LANG=en_US.UTF-8
EOM
```

### live boot hooks

Files in the `hooks/live` directory are executed during the live boot process. We will add a few hooks to customize the live boot process. filenames ending with `.chroot` are executed in the chroot environment.

**filename**: `hooks/live/98-update_password.chroot`

```bash
mkdir -p "./config/hooks/live"
cat >"./config/hooks/live/98-update_password.chroot" <<"EOM"
#!/bin/sh
echo "I: update password"
echo "root:embeddedinn" | chpasswd
EOM
chmod +x "./config/hooks/live/98-update_password.chroot"
```


The full list of customization files we created is shown below:

<pre>
<span style="font-weight:bold;color:blue;">.</span>
├── <span style="font-weight:bold;color:blue;">hooks</span>
│   └── <span style="font-weight:bold;color:blue;">live</span>
│       └── 98-update_password.chroot
├── <span style="font-weight:bold;color:blue;">includes.chroot</span>
│   ├── <span style="font-weight:bold;color:blue;">etc</span>
│   │   ├── <span style="font-weight:bold;color:blue;">default</span>
│   │   │   └── locale
│   │   ├── fstab
│   │   ├── hostname
│   │   ├── hosts
│   │   ├── issue
│   │   ├── issue.net
│   │   ├── legal
│   │   ├── lsb-release
│   │   ├── <span style="font-weight:bold;color:blue;">network</span>
│   │   │   └── <span style="font-weight:bold;color:blue;">interfaces.d</span>
│   │   │       └── eth0
│   │   ├── os-release
│   │   ├── rc.local
│   │   ├── resolv.conf
│   │   ├── <span style="font-weight:bold;color:blue;">skel</span>
│   │   └── <span style="font-weight:bold;color:blue;">update-motd.d</span>
│   │       └── 10-help-text
│   └── <span style="font-weight:bold;color:blue;">root</span>
└── <span style="font-weight:bold;color:blue;">package-lists</span>
    └── embeddedinn-sid-server.list.chroot

12 directories, 15 files
</pre>


## Building the distro

Now that we have a customized configuration directory, we can build the distro with the following command:

```bash
sudo lb build
```

The debian live build goes through the following high level stages:
1. **Bootstrap** - This is the first stage of the build process where we build the base system which is further used to build the final system. `debootstrap` is the tool that is used to bootstrap the base system. It brings up a minimal system that is used to build the final system.
2. **Chroot** - This is the second stage of the build process where we build the final system. The debootstrap minimal system is used to build the final system. This is done by chrooting into the debootstrap system and installing the packages that we want to install on the final system.


## Creating a filesystem image

This command will take a while to complete. Once it is done, the main file that we are interested in is the `live-image-riscv64.tar.tar.gz` file and its source - the `chroot` folder. They contain the rootfs of the distro. We can create an `ext2` filesystem with this file and use it to boot the distro on a RISC-V machine.

```bash
IMAGENAME=embeddedinn-sid-riscv64-$(date +%Y%m%d)
sudo virt-make-fs --partition=gpt --type=ext4 --size=10G ./chroot $IMAGENAME.img;
sudo chmod a+rwx $IMAGENAME.img; 
```



## Building a boot setup

As you would have noticed, we just created the rootfs of the distro. We still need to create the kernel and the initrd. I have covered this extensively in other articles on bringing up Linux on RISCV. So, for the time being, we will quickly build a vanilla kernel and use the bootloader that comes packaged with QEMU. 

> **NOTE** Livebuild has the capability to pull in and package one or more kernel flavours into the image by default, depending on the architecture. You can choose different flavours via the `--linux-flavours` option. We chose `none` since a custom kernel is ofetn practical for embedded systems.

We will build a kernel and initrd/rootfs with buildroot to make it easier to setup the system. you cna also just compile the kernel directly. 

```bash
sudo apt install flex bison bc unzip rsync libncurses-dev
wget https://buildroot.org/downloads/buildroot-2023.02.8.tar.gz
tar -xvf buildroot-2023.02.8.tar.gz
cd buildroot-2023.02.8
make qemu_riscv64_virt_defconfig
make
```

Before booting the debian distro, we can check if the kernel and initrd are working by booting the kernel and initrd with QEMU built by Buildroot. Buildroot provides a startup script that can be executed with:

```bash
output/images/start-qemu.sh
```

<div id="buildroot-cast"></div>
<script>AsciinemaPlayer.create('/images/posts/debianDistro/buildroot.cast', document.getElementById('buildroot-cast'));</script>


## Booting the distro on QEMU

To boot into the bespoke Debian disk image we built, instead of the buildroot disk , we will first coy the `.img` we created into the output folder and then modify the startup script to use the new image as below.

```bash
exec qemu-system-riscv64 -M virt -bios fw_jump.elf -kernel Image -append "rootwait root=/dev/vda1 rw" -m 4G -drive file=embeddedinn-sid-riscv64-20231228.img,format=raw,id=hd0 -device virtio-blk-device,drive=hd0 -netdev user,id=net0 -device virtio-net-device,netdev=net0 -nographic  ${EXTRA_ARGS}
```


<div id="debian-cast"></div>
<script>AsciinemaPlayer.create('/images/posts/debianDistro/debian.cast', document.getElementById('debian-cast'));</script>

Note that QEMU is using `virt-io` block device emulation to mount the disk image. In a real system, we would use a real block device like an SD card or an eMMC. The bootloader or the system ROM would initialise the hardwre interface and get it ready to be mounted by the kernel.

Looking at the boot and kernel logs , the high leve steps involved in juming into the debian system are:

1. Opensbi boots the kernel and jumps into the kernel entry point. QEMU loads the kernel into system memory. 
  1. we have discussed this in previous artoicles like [this one](https://embeddedinn.com/articles/tutorial/RISCV-Uncovering-the-Mysteries-of-Linux-Boot-on-RISC-V-QEMU-Machines/).
2. The kernel boots up and mounts the rootfs. An initrd is not required since we have a rootfs that is directly accessible over the virtio block device.
3. The kernel executes the init process. In our case, this is systemd init at `/sbin/init` which is a symbolic link to `/lib/systemd/systemd`. This was installed into the rootfs by livebuild when we added the `systemd-sysv` package to the package list.
4. The init process executes the startup scripts and starts the services. 
5. `getty` service starts the `getty` process on the console. This is the process that allows us to login to the system.
5. We login to the system and get a shell. We can now use the system as we would use any other Linux system.
