---
title: Measuring microcontroller performance using Coremark.
date: 2020-06-10 20:03:16.000000000 +05:30
published: true
categories:
- Articles
- Tutorial
tags:
- Embedded
- performance

excerpt: "A hands-on approach to porting the Coremark benchmark to measure and compare bare-metal microcontroller performance."

---

<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
</style>

{% include base_path %}

Source code for this article is at [vppillai/CoremarkH3](https://github.com/vppillai/CoremarkH3){:target="\_blank"}.
{: .notice--info}

## Introduction
Measuring the performance of a microcontroller is not a trivial task. There are too many architectural nuances to consider. Parameters like the number of cores, execution memory pipelines, code optimization, and toolchain increase analysis complexity even further. All this makes comparing the performance of different microcontrollers a challenging task. Numerous benchmarking stacks have been developed over time to address this challenge. However, porting these to a bare-metal system as part of silicon or board bring-up often consumes much effort. This article will go through the steps required to port, compile, and execute the Coremark benchmark tests on a PIC32 microcontroller. However, the steps enumerated here are generic enough to be used with any microcontroller. Let's go.

The [Embedded Microprocessor Benchmark Consortium](https://www.eembc.org/coremark/) website says, "CoreMark is a simple, yet sophisticated benchmark that is designed specifically to test the functionality of a processor core. Running CoreMark produces a single-number score allowing users to make quick comparisons between processors.". It replaces the antiquated Dhrystone benchmark and contains implementations of the algorithms such as list processing (find and sort), matrix manipulation (common matrix operations), state machine (determine if an input stream contains valid numbers), and CRC (cyclic redundancy check). It is designed to run on devices from 8-bit microcontrollers to 64-bit microprocessors. To ensure compilers cannot pre-compute the results at compile-time, every operation in the benchmark derives a value that is not available at compile-time. Furthermore, all code used within the timed portion of the benchmark is part of the benchmark itself and does not rely on library calls. The result is a single number that can quantify a CPU's ability.

The code for Coremark is available [on Github](https://github.com/eembc/coremark). However, since the benchmark can run on bare-metal and Linux systems alike, porting it to a new bare-metal platform can be confusing.

### Platform Code

The main components required to port and execute Coremark on a bare-metal platform are

1.  System initialization code.

2.  A mechanism to measure and report time.

3.  A UART driver to report the results.

In the case of PIC32, we can quickly generate these using the Harmony 3 framework. The project graph for this setup would look like this:

{% include image.html
	img="/images/posts/coremark/image1.png"
	width="480"
	caption="Project Configuration"
%}

The source code for Coremark includes the main() routine. So, we configure the harmony project not to create application files and the main source file. Besides this, there are no changes made to the default device configuration.

{% include image.html
	img="/images/posts/coremark/image2.png"
	width="480"
	caption="Disable main file generation"
%}

{% include image.html
	img="/images/posts/coremark/image3.png"
	width="480"
	caption="Disable app file generation"
%}

With these configurations, we generate the base code framework to start porting Coremark on a PIC32 device. In case you are using a different platform, there are for sure steps equivalent to this that you can perform to create a base project that includes the system initialization sequence. In the next section, we look at how the platform code can is hooked up to the Coremark porting layer.

### Porting layer

The default Coremark package is straightforward to use with a system with 'Make.' However, in most cases like ours, we would have an existing compilation system. To make it easy to integrate Coremark with our platform code, we include the following essential files into the project:

{% include image.html
	img="/images/posts/coremark/image4.png"
	width="480"
	caption="Include Coremark Source files"
%}


`core_portme` files are copied from the base template is available in the 'simple' folder of Coremark source.

To initialize the system, we include a call to `SYS_Initialize ( NULL );` the first item in `portable_init()` function within `core_portme.c`. It ensures that the system clock and peripherals initialize to the proper state before we start any operation.

Since we include the Harmony 3 time system service, all the required timing-related structures and functions are hooked-up automatically. However, we need to implement the `time()` function manually. We first register a periodic callback with `SYS_TIME` from within the `portable_init()` function with :

```c
SYS_TIME_CallbackRegisterMS(MyCallback, (uintptr_t)0, 1000, SYS_TIME_PERIODIC);
```

Within the callback, we increment a variable to keep track of the number of seconds elapsed since init.

```c

uint32_t timeSec=0;

void MyCallback ( uintptr_t context){
  timeSec++;
}
```

Then we implement the time function with

```C
time_t time(time_t *tod)

{
  if (tod != NULL)
    *tod = timeSec;
  return timeSec;
}

>> **Note**: The code compiles even without the implementation of `time()` using a stub. However, functionality is impaired, and execution fails.

Next, we define the execution parameter macros under project properties.

{% include image.html
	img="/images/posts/coremark/image5.png"
	width="480"
	caption="Define execution variables"
%}


`ITERATIONS` determines the number of cycles the benchmark executes. It should be tweaked to let the benchmark execute for at least 10s for valid results.

`PERFORMANCE_RUN` is required to get results for reporting back to EEMBC.

Next, we update `COMPILER_FLAGS` and `MEM_LOCATION` (`STACK`) in `core_portme.h`.

### Additional compiler flags

The following compiler flags can be enabled to improve the overall score. Some of these options might require a pro compiler.

  - Enable top-level reordering (`-ftoplevel-reorder`)

  - O3 optimization (`-O3`)

  - Loop Unrolling (`-funroll-loops`)

  - Pre and post-optimization instruction scheduling (`-fschedule-insns` `-fschedule-insns2`)

### Execution

Compile the program, flash it into your device, and wait for the results to appear in the UART console. How long you need to wait depends on your value of `ITERATIONS`. I had to wait for 10s with `ITERATIONS=6000`.

The results are quite good, with a score of `600` or `3 Coremark / MHz`. It can be compared with other devices on the [official coremark scores website](https://www.eembc.org/coremark/scores.php).

```

2K performance run parameters for coremark.
CoreMark Size : 666
Total ticks : 10
Total time (secs): 10.000000
Iterations/Sec : 600.000000
Iterations : 6000
Compiler version : GCC4.8.3 MPLAB XC32 Compiler v2.40
Compiler flags : -O3
Memory location : STACK
seedcrc : 0xe9f5
[0]crclist : 0xe714
[0]crcmatrix : 0x1fd7
[0]crcstate : 0x8e3a
[0]crcfinal : 0xa14c

Correct operation validated. See README.md for run and reporting rules.
CoreMark 1.0 : 600.000000 / GCC4.8.3 MPLAB XC32 Compiler v2.40 -O3 / STACK

```
