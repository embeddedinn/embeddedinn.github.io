---
title: Adding new menu item to PuTTY
date: 2013-03-04 15:40:48.000000000 +05:30
published: true 
categories: 
 - Articles
 - Tutorial
tags: 
 - PIC microcontrollers
 - MPLAB IDE

excerpt: "I came across a requirement to add a new easy access menu item to the putty terminal window for Windows. This article explains how I did it."
---

<style>
div {
    text-align: justify;
    text-justify: inter-word;
}
</style>


{% include base_path %}


I came across a requirement to add a new easy access menu item to the putty terminal window for Windows. This article explains how I did it.

## Requirement

I collect a lot of debug logs for my Linux development boards while working with some new problem. While I have some environment constraints that force me to work with my Windows Box, I find it difficult to split the log files just before a particular scenario occurs (so that it will be easier to identify what went wrong)

The general approach I take is to go change the logging in putty re-configuration to none, apply it and then change it again back to “All Session Output”. But doing this every time was not fun.

{% include image.html
            img="/images/posts/putty/reconf.jpg"
%}

So, I decided to include a  new menu item that automatically does this.

The problem was, there are no architecture documentation available for PuTTY (at least none that I came across). So, I had to dig through the code and here is how I achieved my objective

## Code

I used the latest release source code for Windows available [here](http://the.earth.li/~sgtatham/putty/latest/putty-src.zip){:target="_blank"}

I used the express version of MS Visual Studio 2012 available for download [here](http://www.microsoft.com/visualstudio/eng/downloads){:target="_blank"}

The code changes I made are

1. Define the  `SECURITY_WIN32` macro in `putty.h` to avoid compilation errors

```c
#ifndef SECURITY_WIN32
#define SECURITY_WIN32
#endif
```

2) define the new `SYSCOMMAND` message in `windows.c`

```c
#define IDM_RELOG    0x0080
```

3) Add the menu item in `WinMain()` of `windows.c`

```c
AppendMenu(m, MF_ENABLED, IDM_RELOG, “RESTART LOG FILE”);
```

4) Add the callback handle code to `WndProc()` of `windows.c`

```c
case IDM_RELOG:
{
	cfg.logtype=LGTYP_NONE;
	log_reconfig(logctx, &cfg);
	cfg.logtype=LGTYP_DEBUG;
	log_reconfig(logctx, &cfg);
}
break;
```

Compile the code, and you now have a new menu item to restart the log file

{% include image.html
            img="/images/posts/putty/newmenu.jpg"
						width="300"
%}


