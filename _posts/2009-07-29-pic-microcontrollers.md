---
title: PIC microcontrollers
date: 2009-07-29 10:23:00.000000000 +05:30
published: false 
categories: 
 - Articles
 - Tutorial
tags: 
 - PIC microcontrollers
 - MPLAB IDE

excerpt: "A tutorial on 8 bit PIC Microcontroller architecture and development tools"
---
<style>
div {
    text-align: justify;
    text-justify: inter-word;
}
</style>


{% include base_path %}

<b>NOTE:</b> The IDE used in this article has been phased out by Microchip. However, basic techniques and architecture described herein holds good. 
{: .notice--warning}

The first instance of this article originated at my [google site page](https://sites.google.com/site/vysakhpillai/pic-microcontrollers){:target="_blank"}. It was further migrated to wordpress and not this page. 
{: .notice--info}

## INTRODUCTION TO MICRO-CONTROLLERS

A micro-controller, in simple words, is a miniature computer with a central processing unit and some peripherals integrated into a single integrated circuit package.

The central processing unit can can execute some instructions resulting in some outcomes. This instructions define the architecture of the controllers central processor in a macro scale.This gives rise to the a major classifications in processor architecture as

-   <u><b>R</b></u>educed <u><b>I</b></u>nstruction <u><b>S</b></u>et <u><b>C</b></u>omputer (<b>RISC</b>)
-   <u><b>C</b></u>omplex <u><b>I</b></u>nstruction <u><b>S</b></u>et <u><b>C</b></u>omputer (<b>CISC</b>)

To learn about controllers, processors and architectures in a general and abstract manner is tedious, time consuming and at-times dry. So here we are considering a simple microcontroller – the PIC 16F877a as an example to begin with.

PIC 16F877a is a mid range microcontroller from [microchip inc](www.microchip.com){:target="_blank"}. It is a CMOS FLASH-based 8-bit microcontroller with a RISC architecture that can handle 35 instructions.

When studying any electronic device or part, the bible is its datasheet. The data sheet describes in detail the architecture, capabilities and requirements of the part. PIC16F877a ‘s datasheet can be found here.

Download it and keep it for further reference throughout the tutorial. A printout of section 15 of the datasheet (only 6 pages) will be a great help during the programming exercises.

## Getting Started

As said in the introduction, PIC micro controller, like any other micro controller executes the instructions one at a time in a sequential order as stored in its program memory and it is the skill of the developer to use these instructions (35 in this case) to create magics (like an intelligent robot). The programs written using these basic instructions are called assembly language programs and is the most primitive (not exactly, but close [:D]) and optimized form of programming.

An assembly language program will look something like the snippet given below   

```
	movlw 0xfa movwf 0x20 movlw 0xdf addwf ox20,1
```

The above snippet is to add two numbers and does what the algorithm below does. 

```
	x=250; x=x+223;
```

The second form is easier to understand and manipulate from a programmers point of view. But to learn the architecture and functionality of the micro controller, we have to deal with the assembly language programming. Since it gives a clear cut idea as to what is happening inside the device – i.e. the data flow within the device and which internal modules are involved, we can also optimize our code for best performance.

Now, to get started with, we need two things.

A software that can simulate the internal working of the PIC micro controller and the datasheet of the device.

MPLAB IDE from microchip to simulate the device. MPLAB Integrated Development Environment (IDE) is a free, integrated toolset for the development of embedded applications employing Microchip’s PIC<sup>®</sup> and dsPIC<sup>®</sup> microcontrollers. The latest version can be downloaded for free here.   
We will be using this software to simulate instruction flow within the PIC microcontroller and there by understand its architecture.

The data sheet is the document in which the device vendor release with the product. It will have all the device details and specifications for end users. Once we are familiar with the basic concepts of microcontrollers, we can explore the data sheet on our own and discover newer tricks. The datasheet of PIC 16f877a can be downloaded from [here](http://ww1.microchip.com/downloads/en/DeviceDoc/30292c.pdf){:target="_blank"}.

## Architecture – A general Introduction

{% include image.html
            img="/images/posts/PIC/arch.jpg"
            caption="General Processor Architecture" %}


