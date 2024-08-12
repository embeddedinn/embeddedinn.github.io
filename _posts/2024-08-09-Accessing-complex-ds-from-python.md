---
title: Accessing Complex C Data Structures from Python
date: 2024-08-09 21:49:06.000000000 -07:00
classes: wide
published: true
categories:
- Articles
- Tutorial
tags:
- Python
- C
- ctypes
- SWIG

header:
  teaser: "images/posts/SWIG-C-DS/SWIG-C-DS-Banner.png"
  og_image: "images/posts/SWIG-C-DS/SWIG-C-DS-Banner.png"
excerpt: "Explore advanced techniques for interfacing complex C data structures with Python using ctypes and SWIG. Learn how to seamlessly pass complex data structures between C and Python, perform operations on them, and package the Python infrastructure as a shared library or package for streamlined distribution."

---

<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
</style>

{% include base_path %}

## Overview

Consider a scenario where a device equipped with a sensor provides data encapsulated within a C structure. The interface to access this data might utilize buses ranging from simple ones like UART or SPI to more complex ones like USB or PCI. When such a device connects to a host (e.g., a PC), the host typically leverages a C library to retrieve sensor data. This C library not only provides APIs to access the sensor but also interfaces with the host's low-level OS functions to facilitate communication over the designated bus.

Once the data is available on the host, processing often requires a high-level programming language like Python that is easier to work with. 

The primary challenge lies in seamlessly interfacing the C library with Python, especially when dealing with complex data structures. This is where `ctypes` and SWIG come into play.


## ctypes

`ctypes` is Python's Foreign Function Interface (FFI) library, enabling direct interaction with C libraries. It offers C-compatible data types and allows Python code to call functions within DLLs or shared libraries. Beyond calling functions, `ctypes` facilitates passing simple data types and pointers to data structures between C and Python.

Being a part of the Python standard library, ctypes is universally available across platforms supporting Python, making it a robust choice for interfacing with C libraries.

## SWIG

`SWIG`, an acronym for Simplified Wrapper and Interface Generator, is a powerful tool that connects C and C++ programs with a multitude of high-level programming languages. It's compatible with scripting languages such as Perl, PHP, Python, Tcl, Ruby, and PHP, as well as non-scripting languages like C#, Java, Lua, Modula-3, OCAML, Octave, and R.

`SWIG` stands out when dealing with complex data structures. It not only generates the necessary Python code to interface with C but also creates the requisite shared libraries. Its capability to simplify and maintain interfaces between C code and Python makes it an invaluable tool in the developer's arsenal.

## ctypes Example

Let's start with a simple example of accessing a C data structure from Python using `ctypes`. Consider the following `C` code:

```c
// point.c
#include <stdio.h>

typedef struct {
    int x;
    int y;
} Point;

void print_point(Point *p) {
    printf("Point: (%d, %d)\n", p->x, p->y);
}
```

This code defines a simple Point structure with two integer fields, `x` and `y`, and a function `print_point` that prints the coordinates.

To build this into a shared library:

```bash
gcc -shared -o libpoint.so -fPIC point.c
```

The `-fPIC` flag ensures position-independent code generation, essential for shared libraries, while the `-shared` flag specifies the creation of a shared library.

In Python, using `ctypes` to interact with this library:

```python
import ctypes

class Point(ctypes.Structure):
    _fields_ = [("x", ctypes.c_int),
                ("y", ctypes.c_int)]

lib = ctypes.CDLL("./libpoint.so")
lib.print_point.argtypes = [ctypes.POINTER(Point)]
lib.print_point.restype = None

p = Point(10, 20)
lib.print_point(ctypes.byref(p))
```

Here, we define the `Point` class mirroring the `C` structure. The shared library is loaded, and the print_point function's argument and return types are specified. Finally, a Point instance is created and passed to the C function.

## Handling More Complex Structures with ctypes

When dealing with intricate data structures, direct interaction via ctypes becomes more involved. Let's enhance our C code:

```c
// point.c
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int x;
    int y;
    struct {
        int a;
        int b;
    } z;
    union {
        int c;
        int d;
    } w;
} Point;

Point *create_point(int x, int y, int a, int b, int c) {
    Point *p = (Point *)malloc(sizeof(Point));
    p->x = x;
    p->y = y;
    p->z.a = a;
    p->z.b = b;
    p->w.c = c;
    return p;
}

void update_point(Point *p, int x, int y, int a, int b, int c) {
    p->x = x;
    p->y = y;
    p->z.a = a;
    p->z.b = b;
    p->w.c = c;
}

```

We build this into a shared library using the following command:

```bash
gcc -shared -o libpoint.so -fPIC point.c
```

After building the shared library similarly as before, the corresponding Python code using ctypes would be:


```python
import ctypes

class Point(ctypes.Structure):
    _fields_ = [("x", ctypes.c_int),
                ("y", ctypes.c_int),
                ("z", ctypes.c_int * 2),
                ("w", ctypes.c_int)]

lib = ctypes.CDLL("./libpoint.so")
lib.create_point.argtypes = [ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_int]
lib.create_point.restype = ctypes.POINTER(Point)

lib.update_point.argtypes = [ctypes.POINTER(Point), ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_int]
lib.update_point.restype = None

p = lib.create_point(10, 20, 30, 40, 50)
print("Point: (%d, %d, %d, %d, %d)" % (p.contents.x, p.contents.y, p.contents.z[0], p.contents.z[1], p.contents.w))

lib.update_point(p, 100, 200, 300, 400, 500)
print("Point: (%d, %d, %d, %d, %d)" % (p.contents.x, p.contents.y, p.contents.z[0], p.contents.z[1], p.contents.w))
```

In this code, we define a more complex `Point` structure with nested structures and unions. We define two functions in the C code: `create_point` that allocates and initializes a `Point` structure and `update_point` that updates the fields of a `Point` structure. We then access these functions from Python using ctypes.

## SWIG Example

While `ctypes` is powerful, redefining complex structures in Python can be tedious and error-prone. `SWIG` streamlines this process by auto-generating the necessary Python wrappers.

First, let's externalize our data structure definition into a header file, `point.h`:

```c
// point.h
#ifndef POINT_H
#define POINT_H

typedef struct {
    int x;
    int y;
    struct {
        int a;
        int b;
    } z;
    union {
        int c;
        int d;
    } w;
} Point;

Point *create_point(int x, int y, int a, int b, int c);
void update_point(Point *p, int x, int y, int a, int b, int c);

#endif

```

Next, we create a SWIG interface file `point.i`. This interface definition can be done directly in the headerfile as well. However, we will keep it separate for extensibility. The interface file defines the functions that need to be exposed to Python:

```c
%module point

%{
#include "point.h"
%}

%include "point.h"
```

This interface file exposes all the functions and data structures defined in the `point.h` file. 

The next step requires SWIG to be installed on the system. SWIG can be installed using the following command:

```bash
sudo apt install swig
```

We can now generate the Python code and the shared library using the following command:

```bash
swig -python point.i
```

This step generates a `point_wrap.c` file that contains the interface code that be used to generate the shared library. It also generates the `point.py` file that contains the Python code that interfaces with the shared library.

To build the shared library, we use the following command:

```bash
gcc -shared -o _point.so -fPIC point.c point_wrap.c -I/usr/include/python3.11
```

Note that the `-I` flag is used to specify the path to the Python header files. You need the python development files installed on your system to build the shared library. You can install it with 

```bash
sudo apt install python3-dev
```

The shared library is named `_point.so` because it is a Python extension module. It is linked to the `point.c` file and the `point_wrap.c` file generated by SWIG.

Now, we can import the `point` module in Python and access the functions and data structures defined in the C code:

```python
import point

p = point.create_point(10, 20, 30, 40, 50)
print("Point: (%d, %d, %d, %d, %d)" % (p.x, p.y, p.z.a, p.z.b, p.w.c))

point.update_point(p, 100, 200, 300, 400, 500)
print("Point: (%d, %d, %d, %d, %d)" % (p.x, p.y, p.z.a, p.z.b, p.w.d))
```

In this code, we import the `point` module generated by SWIG and access the `create_point` and `update_point` functions. We also access the fields of the `Point` structure directly. 

As we can see, SWIG simplifies the process of interfacing C code with Python and makes it easier to maintain the code. It also generates the Python code that interfaces with the C code and the shared library that can be used by Python.


## Advanced SWIG

We can now look at some advanced features of SWIG that can be used to implement some complex use cases. SWIG provides a lot of features that can be used to customize the interface between C and Python.

### Typemaps

`Typemaps` are used to convert data between C and Python. SWIG provides a lot of built-in `typemaps` that can be used to convert data between C and Python. `Typemaps` can be used to convert simple data types, pointers, arrays, structures, and classes between C and Python.

For example, consider the following C code:

```c
// point.h
#ifndef POINT_H
#define POINT_H

typedef struct {
    int x;
    int y;
} Point;

Point *create_point(int x, int y);
int update_point(Point *p, Point data);

#endif
```


```c
// point.c
#include <stdio.h>
#include <stdlib.h>
#include "point.h"

Point *create_point(int x, int y) {
    Point *p = (Point *)malloc(sizeof(Point));
    p->x = x;
    p->y = y;
    return p;
}

int update_point(Point *p, Point data) {
    p->x = data.x;
    p->y = data.y;
    return 0;
}
```

We can define a `typemap` in the SWIG interface file to convert the `Point` structure to a Python tuple and vice versa in the `point.i` file:

```c
%module point

%{
#include "point.h"
%}

%include "point.h"

%typemap(in) Point {
    $1 = (Point *)malloc(sizeof(Point));
    $1->x = PyLong_AsLong(PyTuple_GetItem($input, 0));
    $1->y = PyLong_AsLong(PyTuple_GetItem($input, 1));
}

%typemap(argout) Point {
    $result = PyTuple_Pack(2, PyLong_FromLong($1->x), PyLong_FromLong($1->y));
}

%typemap(freearg) Point {
    free($1);
}
```

In this code, we define an `in` `typemap` that converts a Python tuple to a `Point` structure. We also define an `argout` `typemap` that converts a `Point` structure to a Python tuple. We also define a `freearg` `typemap` that frees the memory allocated for the `Point` structure.

Now, regenerate the interface code and the shared library using SWIG and the following commands:

```bash
swig -python point.i
gcc -shared -o _point.so -fPIC point.c point_wrap.c -I/usr/include/python3.11
```

We test this with the following Python code:


```python
import point

p = point.create_point(10, 20)
print("Point: (%d, %d)" % (p.x, p.y))

p1 = point.create_point(30, 40)
print("Point: (%d, %d)" % (p1.x, p1.y))

point.update_point(p, p1)
print("Point: (%d, %d)" % (p.x, p.y))
```


## creating transmittable data structure blobs

In some cases, we may need to transmit the data structure over a network or save it to a file. We can create a blob that contains the data structure and then transmit it over the network or save it to a file. We can use the `struct` module in Python to create a blob that contains the data structure.

An example of this use case is to generate configuration data stored in the device memory based on user inputs. The tool to generate the configuration data can be written in Python and the configuration data can be transmitted to the device over a configuration interface like UART or SPI. A SWIG based interface can be used to ensure that the configuration data is correctly formatted and transmitted to the device.

The configuration data-structure can be defined in C as follows:

```c
// config.h
#ifndef CONFIG_H
#define CONFIG_H

#include <stdint.h>

#pragma pack(1)

typedef struct {
        uint8_t i2cAddress;
        uint32_t i2cCtrlConfig[2];
    }  i2cConfig_t;

typedef struct {
    uint32_t config1;
    uint32_t ledConfig;
    i2cConfig_t i2cConfig;
    char deviceName[256];
} config_t;

#endif
```
Note that this structure contains a "complex data structure" that swig might not be able to handle directly. We can use some inline functions and extensions to handle this.

The SWIG interface file `config.i` can be defined as follows:

```c
%module config

%{
#include "config.h"
%}

%include "config.h"
%include "stdint.i"


%inline %{
// inline function to set device name
void setDeviceName(config_t *configData, const char *name) {
    //error if name is longer than 256
    if(strlen(name) > 256) {
        fprintf(stderr, "Device name is too long\n");
        return;
    }
    strncpy(configData->deviceName, (char*)name, 256);
}

// inline function to get device name
const char *getDeviceName(config_t *configData) {
    return configData->deviceName;
}

%}

%extend i2cConfig_t {
    void setI2cCtrlConfig(int index, uint32_t value) {
        $self->i2cCtrlConfig[index] = value;
    }
    uint32_t getI2cCtrlConfig(int index) {
        return $self->i2cCtrlConfig[index];
    }
}

//implement a serialization function in c to serialize the config_t struct to a file
%extend config_t {
    int serialize(const char *filename) {
        FILE *f = fopen(filename, "wb");
        int len=fwrite($self, sizeof(config_t), 1, f);
        fclose(f);
        return len*sizeof(config_t);
    }
}
```

The Python code to generate the configuration data blob can be written as follows:

```python
#create.py
import config

configData = config.config_t()
configData.config1 = 0x12345678
configData.ledConfig = 0x87654321
config.setDeviceName(configData, "MyDevice")

i2cConfig = config.i2cConfig_t()
i2cConfig.i2cAddress = 0x50
i2cConfig.setI2cCtrlConfig(0, 0x12345678)
i2cConfig.setI2cCtrlConfig(1, 0x87654321)
configData.i2cConfig = i2cConfig

#print data being written to file in hex

print(f"config1: {hex(configData.config1)}")
print(f"ledConfig: {hex(configData.ledConfig)}")
print(f"deviceName: {config.getDeviceName(configData)}")
print(f"i2cAddress: {hex(configData.i2cConfig.i2cAddress)}")
print(f"i2cCtrlConfig0: {hex(configData.i2cConfig.getI2cCtrlConfig(0))}")
print(f"i2cCtrlConfig1: {hex(configData.i2cConfig.getI2cCtrlConfig(1))}")


fileLen=configData.serialize("config.bin")
print("File length: ", fileLen)
```
In this code we define a `configData` object of type `config_t` and set its fields. We also define an `i2cConfig` object of type `i2cConfig_t` and set its fields. We then set the `i2cConfig` object as a field of the `configData` object. We then print the contents of the `configData` object and save it to a file using the `serialize` function.


<b>NOTE:</b> the code aligns the data to 1 byte boundaries using `#pragma pack(1)`. This is important as the data structure may be padded by the compiler to align it to 4 byte boundaries. Make sure that you update this to match the alignment of the data structure in your C code.
{: .notice--warning}

build the interface and run the code to create the configuration binary with :

```bash
swig -python config.i
gcc -shared -o _config.so -fPIC config_wrap.c -I/usr/include/python3.11
python3 create.py
```

We then generate the configuration data blob in Python and save it to a file. The configuration data blob can then be transmitted over the network or saved to a file. To read this in C, we can use the following code:

```c
//read_config.c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "config.h"

int main() {
    config_t *configData = (config_t *)malloc(sizeof(config_t));
    FILE *f = fopen("config.bin", "rb");
    fread(configData, sizeof(config_t), 1, f);
    fclose(f);

    printf("config1: 0x%x\n", configData->config1);
    printf("ledConfig: 0x%x\n", configData->ledConfig);
    printf("deviceName: %s\n", configData->deviceName);
    printf("i2cAddress: 0x%x\n", configData->i2cConfig.i2cAddress);
    printf("i2cCtrlConfig[0]: 0x%x\n", configData->i2cConfig.i2cCtrlConfig[0]);
    printf("i2cCtrlConfig[1]: 0x%x\n", configData->i2cConfig.i2cCtrlConfig[1]);
    
    free(configData);
    return 0;
}
```

We can build and execute the C code using the following command:

```bash
gcc -o read_config read_config.c
./read_config
```

<b>NOTE:</b> This example assumes that the systems executing the python code and the C code have similar endianess and data alignment requirements. If the systems have different architectural requirements additional processing or conversion may be required.
{: .notice--warning}

## Packaging the Python code
 We can package the interface code and the shared library into a Python package for easy distribution. We will explore two methods - one that involves a build process at install time and one that involves a build process at package creation time.

 Performing build at install time lets the interface be compiled on the target system. This is useful when the target system may have different architectures or requirements. The package can be installed on the target system and the interface can be compiled during the installation process.

 ### Building the interface in the target system at install time

To package the Python code, we need to create a `setup.py` file that contains the package information and the build instructions. The `setup.py` file can be defined as follows:

```python
# setup.py
from setuptools import setup, Extension

setup(
    name='config',
    version='1.0',
    ext_modules=[Extension('_config', ['config.i', 'config.c'])],
    py_modules=["config"],
)
```

In this code, we define the `config` package with the `config` module. We also define the shared library `_config` with the `config.i` and `config.c` files. The `config.i` file contains the SWIG interface definition and the `config.c` file contains the C code.

We can now build the package using the following command:

```bash
python3 setup.py build
``` 

The python3 setup.py build command will build the shared library and the Python module. The shared library will be built in the build/lib.linux-x86_64-3.11 directory and the Python module will be built in the build/lib directory. The SWIG command will be executed during the build process to generate the interface code as setuptools knows how to handle the .i files mentioned in the Extension object.

The package can be installed using the following command:

```bash
python3 setup.py install
```

<b>NOTE:</b> It is adviced that the package be installed in a virtual environment to avoid conflicts with system packages. The package can also be installed using the --user flag to install it in the user's home directory.
{: .notice--warning}


This package can now be distributed and installed on any system. To do this with a package manager like pip, we can create a source distribution using the following command:

```bash
python3 setup.py sdist
```

This command will create a `dist` directory with a `.tar.gz` file that contains the package. The package can be installed using the following command:

```bash
pip install dist/config-1.0.tar.gz
```

### Building the interface in the build system at package creation time

We can use the same setup.py file with the bist_wheel command to build a wheel package that contains the shared library and the Python module. The wheel package can be installed on any system without the need to compile the shared library.

```bash
python3 setup.py bdist_wheel
```

> Note: Make sure that the system has the `wheel` package installed. This can be installed with `pip install wheel`

This step creates a `dist` directory with a `.whl` file that contains the package. The package can be installed using the following command:

```bash
pip install dist/config-1.0-py3-none-any.whl
```

This package can now be distributed and installed on any system without the need to compile the shared library. This is useful when the target system may not have the required build tools or dependencies to compile the shared library.

## Conclusion

In this post, we explored how to access complex C data structures from Python using ctypes and SWIG. We also explored how to pass complex data structures between C and Python and perform a few operations on them. The Python infrastructure was also packaged as a shared library / Package for easy distribution. We also explored two methods of packaging the Python code - one that involves a build process at install time and one that involves a build process at package creation time.