---
title: Fun with FPGAs
date: 2015-12-28 20:10:49.000000000 +05:30
published: true 
categories: 
 - Articles
 - Tutorial
tags: 
 - FPGA

excerpt: "Joting down my experiences with using an FPGA for developing systems"
---
<style>
div {
    text-align: justify;
    text-justify: inter-word;
}
</style>


{% include base_path %}


This article has been migrated from my [original post](https://embeddedinn.wordpress.com/tutorials/fun-with-fpga/){:target="_blank"}  at [embeddedinn.wordpress.com](http://embeddedinn.wordpress.com){:target="_blank"}.   
{: .notice--info}


I used to play a lot with FPGAs, primarily for hardware design during my college days and the start of my career. Later on, when the embedded software industry caught my interest, I started to focus more on it  rather than hardware design. Now that I have explored both the fields to a considerable extend, I am going to club them together.

I am starting a series of articles here that will be tutorials for anyone interested in venturing to this field of hardware software co-design. I will begin off by introducing some hardware design concepts using HDLs and FPGAs and later move on to embedded system design . There we will be visiting concepts of designing hardware to run software on. I’ll be using the microblaze soft-core processor as a tool to introduce that. Later on I’ll illustrate how to compile and run linux on an FPGA as well as how to write drivers for custom peripherals that you design.

## Table of contents

01. HDLs and hardware design – A quick start guide
02. Creating your FPGA development setup
03. Understanding microblaze soft-core processor
04. Microblaze peripheral bus and peripherals
05. Linux on Microblaze
06. Adding a peripheral – the Linux way
07. Writing a device driver for your own peripheral

