---
title: Docker 101 for embedded systems DevOps
date: 2022-01-15 12:42:06.000000000 +05:30
classes: wide
published: true
categories:
- Articles
- Tutorial
tags:
- docker
- devops
- mplabx
header:
  teaser: images/posts/dockerDevops/teaser.png
  og_image: images/posts/dockerDevops/teaser.png
excerpt: "I started using docker back in 2016 and ever since, I have been using it in the context of embedded systems DevOps. This article condenses the learning so that someone starting afresh can get to speed quickly. You can read my article on bring-up a buildroot image on docker in the article https://embeddedinn.xyz/articles/tutorial/docker-scratching-an-itch-to-build-from-ground-up/."

---


<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
</style>

{% include base_path %}

## Docker 101 for embedded systems DevOps. 

I started using docker back in 2016 and ever since, I have been using it in the context of embedded systems DevOps. This article condenses the learning so that someone starting afresh can get to speed quickly. You can read my article on bring-up a buildroot image on docker in the article [Docker: Scratching an itch to build from ground up](/articles/tutorial/docker-scratching-an-itch-to-build-from-ground-up/).

I’ll first introduce some of the key concepts and commands, and then we will look at some docker for embedded systems DevOps use-cases.

## Docker what?

To understand what docker is, first, you need to understand the concept of containers.

A container is pretty much like a pre-configured VM at a high level. It lets you package all your tools, configurations, and dependencies. It provides an isolated execution environment for your code without worrying about the dependency versions, configuration mismatch, etc. But, unlike a VM, a complete OS (and baggage) is not part of the container. Its leaner and leverages the capabilities of the underlying OS. It also comes pre-configured with purpose-specific tools. (That way, it is closer to a python virtual environment than a VM?)

Containers use the underlying OS kernel to provide application-level virtualization. Due to this, a container image created for an OS might not work with another OS. (Docker toolbox addresses this.)

Docker is one of the tools that let you create, configure, and use containers. Podman is another example of a container tool.

Practically, containers are stored in a container repository. [DocerHub](https://hub.docker.com/) is an example of a public container repo. It contains official and unofficial images. You can use docker to fetch and start one of these images. Your entire development/deployment environment will be up and running with a single command. This is one of the primary docker use cases.

For instance, if you want to try out the latest RISC-V clang nightly build without messing up your environment, pull it from DockerHub and use it in the container with:

```bash
docker run -dit tuxmake/riscv_clang-nightly
```

followed by `docker attach <container ID>`

If you ended up opening many, close all with `docker container prune`.

# Architecture

Docker has a client-server architecture. The client communicates to the daemon (server) using a REST API. So, the daemon can be local or be in the network. You will read more about the components shown in teh diagram below in the following sections.

{% include image.html
	img="images/posts/dockerDevops/architecture.svg"
    width="800"
	caption="(Source: docs.docker.com)"
%}


> Docker is written in the Go programming language and takes advantage of several features of the Linux kernel to deliver its functionality. Docker uses a technology called namespaces to provide the isolated workspace called the container. When you run a container, Docker creates a set of namespaces for that container.These namespaces provide a layer of isolation. Each aspect of a container runs in a separate namespace and its access is limited to that namespace. (Source: <docs.docker.com>)

## Docker Images

A docker container “executes” a docker image. The container includes all the essential components required to execute an image. This consists of a virtual FS, networking, etc.

A docker image is built by layering different images. The base image is typically a Linux distribution. When you do a `docker pull` or `docker run`, these layers are downloaded and stacked on top of each other to create the final container image.

## Essential Commands

<table>
<colgroup>
<col style="width: 28%" />
<col style="width: 71%" />
</colgroup>
<tbody>
<tr class="odd">
<td>pull</td>
<td>Brings in images from a repo into your machine.</td>
</tr>
</tbody>
<tbody>
<tr class="odd">
<td>images</td>
<td>List all the local images.</td>
</tr>
<tr class="even">
<td>run</td>
<td><p>Run an image in a new container.</p>
<table>
<colgroup>
<col style="width: 20%" />
<col style="width: 79%" />
</colgroup>
<tbody>
<tr class="odd">
<td>-d</td>
<td>Run in detached mode</td>
</tr>
<tr class="odd">
<td>--name</td>
<td>Provide a docker name</td>
</tr>
<tr class="even">
<td>-e</td>
<td>To pass environment variables inside the container</td>
</tr>
<tr class="odd">
<td>--net</td>
<td>Network to use</td>
</tr>
<tr class="even">
<td>-v</td>
<td>Volume mapping</td>
</tr>
</tbody>
</table></td>
</tr>
<tr class="odd">
<td>ps</td>
<td><p>List all running containers.</p>
<table>
<colgroup>
<col style="width: 20%" />
<col style="width: 79%" />
</colgroup>
<tbody>
<tr class="odd">
<td>-a</td>
<td>List even stopped containers</td>
</tr>
</tbody>
<tbody>
</tbody>
</table></td>
</tr>
<tr class="even">
<td>stop</td>
<td>Stop the container</td>
</tr>
<tr class="odd">
<td>start</td>
<td>Start a stopped container</td>
</tr>
<tr class="even">
<td>logs</td>
<td>List logs of a container.</td>
</tr>
<tr class="odd">
<td>exec</td>
<td><p>Execute a command in a container. Provide container id and the command to execute.</p>
<table>
<colgroup>
<col style="width: 20%" />
<col style="width: 79%" />
</colgroup>
<tbody>
<tr class="odd">
<td>-it</td>
<td>Two arguments i and t are used together for an interactive terminal.</td>
</tr>
</tbody>
<tbody>
</tbody>
</table></td>
</tr>
<tr class="even">
<td>container prune</td>
<td>Clear stopped containers.</td>
</tr>
<tr class="odd">
<td>rmi</td>
<td>Delete an image</td>
</tr>
<tr class="even">
<td>tag</td>
<td>Image rename</td>
</tr>
<tr class="odd">
<td>system prune</td>
<td>Clean all images and containers.</td>
</tr>
</tbody>
</table>

## Docker Networking 

Like an application running in a VM, an application virtualized in a container is unaware it is executing within it. So, applications in different container instances can open the same ports. To use these ports, we need to bind a `host port` to a `container port`.

To bind a container port to a host port, use the `-p` argument to `docker run`.

```bash
docker run -p8000:6379 redis
```

Docker also has internal networking that lets containers talk to each other. To list the networks that are available use:

```bash
docker network ls
```

To create a custom network, use:

```bash
docker network <network name>
```

Once a network is created, you can pass it in the run command using the `–net` argument. The required ports should also be bound using `-p` while adding a container to a network.

Containers within the same network can talk to each other using the container name.

## Building docker images 

A Dockerfile is a recipe for building docker images. Key commands that can be used in a Dockerfile are listed below

|        |                                                 |
|-       |-                                                |
| `FROM` | Denotes the base image                          |
| `ENV`  | Environment variables                           |
| `RUN`  | Execute a command within the container          |
| `COPY` | Copy something from the host into the container |
| `CMD`  | Entry point command to execute after boot       |

Once you create a Dockerfile, you build it with

```bash
docker build -t myApp:0.1 .
```

The image is built and stored locally. It can be listed with docker images. It can then be pushed to a registry using

```bash
docker push
```

When you push updated versions, only the changed layers are pushed.

For private registries, you can use Amazon ECR, Digital Ocean, etc. You can use DockerHub for public registries.

## Persistent Volumes

The data generated and written into the virtual container filesystem is destroyed when the container stops. We use persistent volumes to overcome this.

Volumes maps (mounts) host file system paths into the container file system.

They are three types of volumes

1.  ### Host Volumes

    Pass the host and destination paths within the container using the `-v` argument to the run command.

    ```bash
    docker run -v /home/embeddedinn/data:/var/lib/mysql/data
    ```

2.  ### Anonymous Volumes

    Only the container directory is passed to `-v` argument. A directory is created within the host to map this automatically. In Linux, this is created in the `/var/lib/docker/volumes` folder.

3.  ### Named Volumes

    Similar to anonymous, but a name for the volume can be passed.

    ```bash
    docker -v name:/var/lib/mysql/data
    ```

    This is the recommended method. For shared volumes, the same name can be used across containers.

## Usecase 1: Setting up a custom RISC-V toolchain image

Let’s consider a development ecosystem to enable developers and CI to use a standard, custom toolchain version. This can be enabled using docker with the following steps.

1. Cloning and Compiling the toolchain in a docker container

    To create the toolchain in a clean environment, lets first bring up a container with a persistent volume, then clone the git repo, install dependencies and compile the toolchain.

    ```bash
    docker run -it -v /home/embeddedinn/docker/volume/toolInstall:/opt/riscv ubuntu:20.04 /bin/bash

    sudo apt-get install autoconf automake autotools-dev curl python3 libmpc-dev libmpfr-dev bgmp-dev gawk build-essential bison flex texinfo gperf libtool patchutils bc zlib1g-dev bexpat-dev git
    
    git clone https://github.com/riscv/riscv-gnu-toolchain
    
    cd riscv-gnu-toolchain
    ./configure --prefix=/opt/riscv --with-arch=rv32gc --with-abi=ilp32d --enable-multilib
    make -j$(nproc)
    make -j$(nproc) linux
    ```

    At the end of this process, the compiled toolchain will be available in the `/home/embeddedinn/docker/volume/toolInstall` folder mapped as a volume to `/opt/riscv` within the container.

2. Creating a docker image

    Now that we have compiled the toolchain that works on ubuntu `20.04`, we can go ahead and package it into a docker image that other developers and the CI can pull.

    This is how the Dockerfile will look like

    ```docker
    FROM ubuntu:20.04
    RUN mkdir /opt/riscv
    COPY toolInstall/\* /opt/riscv/
    ENV PATH="/opt/riscv:${PATH}"
    CMD /bin/bash
    ```

    You can build the image using

    ```bash
    docker build -t riscv-toolchain:0.1 .
    ```

    Once the build completes, the image will be available locally. You can use `docker images` to see it.

3.  Pushing the docker image to the container registry

    For others to use the image, you created you need to make it available through a container registry. Depending on the registry you are using, there will be different steps to push the image. In this case, we are using DockerHub. The image needs to be renamed (tagged) to the format appropriate to the registry.

    ```bash
    docker tag riscv-toolchain:0.1 vppillai/riscv-toolchain:0.1
    ```

    Then login to the registry and push the image.

    ```bash
    docker login
    docker push vppillai/riscv-toolchain:0.1
    ```
Once pushed, you can see the image details from the hub interface  <https://hub.docker.com/r/vppillai/riscv-toolchain/>

4.  Using the image

    Now that the image has been pushed, developers and CI can use it with

    ```bash
    docker run -it vppillai/riscv-toolchain:0.1
    ```

{% include image.html
	img="images/posts/dockerDevops/image2.png"
	width="640"
	caption="Container with the new RISC-V toolchain"
%}

If you want to compile a codebase in your local machine with this toolchain, you can mount the volume into the container while running it.

## Usecase 2: Compiling MPLABX projects with a custom Docker image

Microchip MPLABX project builds can be automated in a CI/CD pipeline using a Docker image with the tools pre-configured. MPLABX 6.0 even provides a CI/CD wizard tool to generate Docker files finetuned for your project needs.

{% include image.html
	img="images/posts/dockerDevops/image1.png"
	width="640"
	caption="MPLAB X CI/CD Wizard"
%}

A sample Dockerfile generated using the wizard looks like this:

```docker
# This file was generated by the CI/CD Wizard version 1.0.391.
# See the user guide for information on how to customize and use this file.

FROM debian:buster-slim

ENV DEBIAN_FRONTEND noninteractive

USER root
RUN dpkg --add-architecture i386 \
    && apt-get update -yq \
    && apt-get install -yq --no-install-recommends \
        ca-certificates \
        curl \
        make \
        unzip \
        procps \
    && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
# Download and install MPLAB X IDE version 6.00
ENV MPLABX_VERSION 6.00

RUN curl -fSL -A "Mozilla/4.0" -o /tmp/mplabx-installer.tar \
         "https://ww1.microchip.com/downloads/en/DeviceDoc/MPLABX-v${MPLABX_VERSION}-linux-installer.tar" \
 && tar xf /tmp/mplabx-installer.tar -C /tmp/ && rm /tmp/mplabx-installer.tar  \
 && USER=root ./tmp/MPLABX-v${MPLABX_VERSION}-linux-installer.sh --nox11 \
    -- --unattendedmodeui none --mode unattended \
 && rm ./tmp/MPLABX-v${MPLABX_VERSION}-linux-installer.sh \
 && rm -rf /opt/microchip/mplabx/v${MPLABX_VERSION}/packs/Microchip/*_DFP \
 && rm -rf /opt/microchip/mplabx/v${MPLABX_VERSION}/mplab_platform/browser-lib
ENV PATH /opt/microchip/mplabx/v${MPLABX_VERSION}/mplab_platform/bin:$PATH
ENV PATH /opt/microchip/mplabx/v${MPLABX_VERSION}/mplab_platform/mplab_ipe:$PATH
ENV XCLM_PATH /opt/microchip/mplabx/v${MPLABX_VERSION}/mplab_platform/bin/xclm

ENV TOOLCHAIN xc32
ENV TOOLCHAIN_VERSION 4.00

# Download and install toolchain
RUN curl -fSL -A "Mozilla/4.0" -o /tmp/${TOOLCHAIN}.run \
    "https://ww1.microchip.com/downloads/en/DeviceDoc/${TOOLCHAIN}-v${TOOLCHAIN_VERSION}-full-install-linux-installer.run" \
 && chmod a+x /tmp/${TOOLCHAIN}.run \
 && /tmp/${TOOLCHAIN}.run --mode unattended --unattendedmodeui none \
    --netservername localhost --LicenseType NetworkMode \
 && rm /tmp/${TOOLCHAIN}.run
ENV PATH /opt/microchip/${TOOLCHAIN}/v${TOOLCHAIN_VERSION}/bin:$PATH

# DFPs needed for default configuration

# Download and install Microchip.PIC32MZ-W_DFP.1.5.203
RUN curl -fSL -A "Mozilla/4.0" -o /tmp/tmp-pack.atpack \
         "https://packs.download.microchip.com/Microchip.PIC32MZ-W_DFP.1.5.203.atpack" \
 && mkdir -p /opt/microchip/mplabx/v${MPLABX_VERSION}/packs/PIC32MZ-W_DFP/1.5.203 \
 && unzip -o /tmp/tmp-pack.atpack -d /opt/microchip/mplabx/v${MPLABX_VERSION}/packs/PIC32MZ-W_DFP/1.5.203 \
 && rm /tmp/tmp-pack.atpack
ENV BUILD_CONFIGURATION default

```


Once you build the docker image, you can mount volumes and compile code with the RISCV toolchain.

> **Note**: Before compilation, you need to regenerate the Makefiles to reflect the local paths using the prjMakefilesGenerator command, passing the path to the project Makefile folder. The command path is exported

Alternately, we can include git into the Docker image, clone the repo into the container, and compile it without mounting a volume. This might be useful in the case of some CI systems.


## Usecase 3: Using the container with GitHub Actions

The GitHub actions file to use the container we created in the previous use-case will look like this.

```yml
name: containerTest
on: push

jobs:
    rvTC-docker:
        runs-on: ubuntu-latest
        container:
            image: vppillai/riscv-toolchain:0.1
        steps:
          - name : gcc version check
            run: riscv32-unknown-linux-gnu-gcc -v
```

The execution result shows that the compiler is useable in the Action.

{% include image.html
	img="images/posts/dockerDevops/image3.png"
    width="1000"
	caption="Github Actions result"
%}

Though this file simply lists the tool version, we can use additional run commands to clone your code, compile it, and run tests.
