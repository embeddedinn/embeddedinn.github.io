---
title: A refresher of new C coding features for embedded system developers 
date: 2017-12-25 22:36:19.000000000 +05:30
published: true
categories:
- Articles
- Tutorial
tags:
- C programming

excerpt: "A refresher of new C coding features included in C99 and C11 for embedded system developers."

---
<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
</style>


{% include base_path %}

## Introduction

As embedded system developers, we are often baned to work with archaic vendor compilers and more often than not, to base our work on historic code bases. One of the major flip sides of this is that we do not get to use and slowly lose touch with some of the relatively new and exciting C standard and compiler features. We will look at some of them in this article. 

**Note** you might have to use the `--std=c11` flag with your compiler to try out some of these features. I will be using `clang` throughout this article. Since clang uses an extended version of C11, the explicit flag is not required. To keep things simple, I am not enabling any extra compilation flags unless otherwise specified. 

## Link time optimzsation (LTO)

Traditionally the C compiler compiles each file in to an object file and does optimization within these compilation units. Potential cross file optimizations where not visible to the compiler until recently. For a while, the gcc and Clang compilers have been supporting LTO. With LTO, the compiler compiles each file into a source aware annotated object file that has enough information to perform an additional round of optimization at link time. In gcc use the `-flto` flag to enable this. 

## data types

Gone are the days where you write long declarations like `unsigned long long int` . The best way to do this now is to use the standard definitions like `int8_t`, `uint32_t` etc. that is offered by `stdint.h`. But then, this is not very new to embedded system developers since we already had this convention going for a while. 

In addition to the fixed length types, there are `fast` and `least` types defined in `stdint.h` spec. Fast types like `int_fast8_t` or `uint_fast32_t` guarantees at least `x` bits of storage while it might upgrade to a larger type if it has faster performance in the platform.`least` types like `uint_least16_t` or `int_least64_t` provides the most compact number of bits to accommodate the request. 

The use of `char` to indicate 8 bit data is frowned upon. You should instead use `uint8_t`.

For pointer math, `stdint.h` provides `uintptr_t`,`intptr_t` etc. This is in addition to `ptrdiff_t` from `stddef.h`

`intmax_t`/`uintmax_t` is the safest cast to hold the largest integer that a given platform can hold.

## variable declaration

Since C99, you can declare variables right before they are used and not just at the beginning of a file or function. Loop variables can also be defined within the loops scope like:

```c

for(int i=0;i<10;i++){}

```

Use of this feature makes the code more readable. 

## the once pragma

Most new compilers lets you place a `#pragma once` at the top of your (header) file to make sure that the file is included only once so that you do not have to use the header file name definition guard in your files.

## array initialization

Arrays can be initialized to known values without having to do `memset` by using the following :

```c

uint32_t testVector[32]={0};

```

The same holds true for structures. However, padding bits might not be initialized.  
