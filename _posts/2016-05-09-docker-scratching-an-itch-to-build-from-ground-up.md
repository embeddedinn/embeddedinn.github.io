---
title: 'Docker : Scratching an itch to build from ground up'
date: 2016-05-09 23:30:41.000000000 +05:30
published: true 
categories: 
 - Articles
 - Tutorial
tags: 
 - Docker

excerpt: "Understand the innards of Docker container system by building one from scratch (including a minimal fs)"
---
<style>
div {
    text-align: justify;
    text-justify: inter-word;
}
</style>


{% include base_path %}

If you have never heard of docker the server container holder ever before, then this post is not for you. For a tech enthusiast, Docker is an interesting and current piece of tech that you should at least be aware of. But there are hundreds of well written and well produced tutorials out there to help you with that.

By nature, I need to understand how things work. And, I prefer hands on trial and error as the way to gain this understanding. So, when the tutorials started off by telling me how to run existing Docker containers and how to build on top of existing ones using a Dockerfile, that was not enough for me. Useless as it is, I wanted to build a lean , bare minimal , functional Linux container using my experience with bringing up Linux on new platforms.Be aware that Docker is just a container that uses the hostOS kernel and the docker image contents as a file system. So , even though you might see that the kernel is being compiled in the below steps, it is simply because that is the simplest approach to the given problem. The compiled kernel image will not be used as such.
Le Platform

From a tutorial per-say, it is always better to prep the development environment from scratch and list all steps and dependencies as it is done. So for this tutorial, I spun up a Digitalocean instance with Ubuntu 14.04 as the base OS. Following are the packages  that I installed after an apt-get update.

```bash
apt-get install vim git unzip libncurses5-dev docker.io build-essential
```

In case you are not familiar with Digitalocean, it is a simple cloud computing solution built for developers (just as their tagline says). If you are new to it, you can get a $10 start up credit if you register with [this link](https://m.do.co/c/010611f6f206){:target="_blank"}

I will be using [buildroot](https://buildroot.org/){:target="_blank"} to generate the minimal linux image that will form our base image. I took the latest buildroot image (2016.02) from [here](https://buildroot.org/download.html){:target="_blank"} and got it into the instance and unpacked it using the following commands. If you are interested to know more about using buildroot to build systems from scratch, follow my tutorial [here](articles/tutorial/booting-your-first-cross-compiled-linux-based-embedded-system/){:target="_blank"}.

```bash
wget https://buildroot.org/downloads/buildroot-2016.02.tar.gz
tar xvf buildroot-2016.02.tar.gz
```

I decided to go with an `x86_64` image and configured it as the target, selected apache under `Target packages > networking applications` and fired off a build with 16 parallel jobs.

After a lot of number crunching, the self contained, minimal rootfs.tar archive will be generated at `output/images`. This will be our base image for running docker. The interesting part is that , including an apache installation, the image is just 5.4MB

## Stage 1 Testing

Now that we have our minimal rootfs built, it is time to test the system.

To import the tar as a docker image and see it in docker image listing using the following commands.

```bash
docker import - testrfs < rootfs.tar
docker images
```

Now, you can run this new image using the following command:

```bash	
docker run -it testrfs /bin/sh
```

This step will execute the busybox shell on the host ubuntu kernel . You can verify this using the following two commands.

```bash
docker run -it testrfs /bin/sh
uname -a
```

With a docker diff, you can see that the root of the image has changed. This change (docker adding a couple of files) is how docker binds itself to the rootfs hat we created. (I assume)

Output of the uname command will show that we are still running over the host (ubuntu) kernel.

## Configuring Docker Apache

Unfortunately,  due to a bug (which I am yet to figure our a solution for), we need to manually enable a module in the httpd config file for this to work. Remove the commenting # from the below line of `/etc/apache2/httpd.conf`

```bash
vi /etc/apache2/httpd.conf
LoadModule slotmem_shm_module; modules/mod_slotmem_shm.so
```

With this httpd can be started successfully. (issue `httpd -k start` command and observe the `ps -ef`)

## Docker PID1

As we have discussed in some of our Linux tutorials, as soon as the kernel comes up, the link to user land is setup using the init process. However, since docker is running over the host kernel, we end up with some issues here.

We need apache to run automatically when docker runs our image. As we discussed in the Linux cross compilation tutorial, we could have used the busybox init and inittab mechanism to achieve this. However, Docker presence a challenge here.

On a normal system built with an inittab based init (as in the case of most embedded systems), you just have to register a startup script at the appropriate run level in the init.d folder. The rcS and rcK scripts triggered from init will take care of executing the start and stop commands. Buildroot has already taken care of creating a startup script for apache. We just have to link it to the init.d folder using the following command

```bash
cd /etc/init.d
ln -s /usr/bin/apachectl ./S50apachectrl
```

However, this will work only if `init` is executed. As you can see with a simple `ps -ef` command while you are in the docker bash, within the container, the default `PID`=1 is for either a `/bin/sh` (in case you pass the `-t` flag to run) command or any command that we explicitly pass to the docker run command.

If we pass `init` as the command to be executed by docker run, then a shell will not be spawned , and we will not be able to attach to the  docker image and send signals to it or perform operations from the shell.

To overcome this problem, we will write a small script that will launch apache demon as well as a shell, and create a Dockerfile to call that script as soon as the image is run.

Create a file `/bin/start.sh` with the following contents and provide execute permissions to that file with `chmod a+x /bin/start.sh`

```bash
#!/bin/sh
apachectl start&amp;amp;
/bin/sh
```

## Creating the final image

Now that we have made all required changes and configurations to our rootfs, we need to commit the snapshot and create a new base image with these changes . Use the following commands to achieve this.

```bash
docker commit 3a4c6d3e80e2 apachemin:v01 #hash obtained from docker ps -a
```

Now create a Dockerfile with the following lines:

```bash
FROM apachemin:v01
CMD /bin/start.sh
```

Now issue the build command to get the new docker image that will spawn the processes automatically:

```bash
docker build -t=&quot;apacheinit:v01&quot; .
```

Now, for the final testing, run the following command and try loading the default httpd index page from a browser ar port 8080 after issuing the following command:

```bash
docker run -p 8080:80 -it apacheinit:v01
```

For changes, the default DocumentRoot points to `/usr/htdocs`

Happy hacking. . . . happy learning. . .

