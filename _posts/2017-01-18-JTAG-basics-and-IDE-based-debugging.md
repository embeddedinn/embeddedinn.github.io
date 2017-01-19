---
title: JTAG basics and IDE based debugging
date: 2017-01-18 08:36:19.000000000 +05:30
published: false
categories:
- Articles
- Tutorial
tags:
- Microcontrollers
- FPGA
- JTAG

excerpt: "JTAG is omnipresent in the microcontroller and FPGA world in the form of programmers and debuggers. Let us peek under the hood and understand how JTAG works and understand how IDE based debug works with microcontrollers."
---
<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
</style>


{% include base_path %}

## Introduction

JTAG stands for **J**oint **T**est **A**ccess **G**roup and is an association that was formed initially to derive a specification to test connectivity between chips in a PCB. Later this spec was formalized into an IEEE standard (1149.1), entitled "Standard Test Access Port and Boundary-Scan Architecture" The latest update to this spec was done in 2013.

The original intention of this specification was to have standard "boundary scan" provisions in an IC that will allow monitoring and controlling the I/O pads so as to test connectivity between devices in a PCB. However, the open provisions of the standard was soon exploited by chip manufacturers to use it for internal circuitry testing as well as controlling the hardware and achieve effective programming and debugging over a serial interface. 

The JTAG standard is more like XML that defines a lingo that allows a lot of implementation flexibility. This has lead to large variety of implementations over the JTAG standard that caters to the needs of individual chip makers. 

In this article we will be concentrating more on the debug and programming aspects of JTAG than the boundary scan aspect of it.

## JTAG Operation
 
The JTAG interface includes 5 lines:

- Test data input (TDI)
- Test data output (TDO)
- Test mode select (TMS)
- Test clock input (TCK)
- Test reset input (TRST\*) - optional

These pins connects into a **T**est **A**ccess **P**ort (TAP) hardware within the device. The TAP controller hosts a state machine that is defined in the spec. 

{% include image.html
	img="/images/posts/JTAG/statemachine.png"
	width="480"
	caption="JTAG TAP controller statemachine"
%}

This state machine can be used to request the TAP controlled to talk to the device specific debug engine. This is illustrated in the figure below:

{% include image.html
	img="/images/posts/JTAG/debugInterface.png"
	width="260"
	caption="TAP and device debug interface"
%}

Examples of device debug engines include "EJtag" in case of MIPS, "OCI" in case of some 8051s etc. They tie into the CPU logic to enable provisions like stepping through, PC redirection, instruction and data trace etc. We will later look into the specifics of one of these. For now, we will understand how JTAG can be used to communicate to these implementations in a generalized way.

To understand how the JTAG TAP state-machine, operates, we need to first look into some more details of a generalized TAP pseudo implementation.

The TAP controller will have an "Instruction Register (IR)" and one or more "Data Registers (DR)". At any given point in time of operation, the TAP controller will place one of these between the TDI and TDO lines. Data will be shifted into the register from TDI on the raising edge of TCK and data will be captured into TDO in the falling edge of TCK. 

The TMS line is used to navigate the state-machine. The state transition values shown in the state-machine are the TMS values at the raising edge of TCK. So, for instance, to go into the `shift-IR` state from `Test-logic-reset`, TMS should have the following values at the raising edges od subsequent TCKs : `01100` . Once the tap reaches `shift-IR` state, it will stay there as long as TMS is `0` . That means, TCK can be used for other purposes , without moving out of the state. 

> The state-machine is designed in such a way that holding TMS high for 5 subsequent raising edges of TCK will take it into "test-logic-reset" state irrespective of the current state. This is a quick escape hatch in case you screw-up :grimacing:

When the state-machine is in any of the `IR` states (like `shift-IR`, `capture-IR`, `update-IR` etc), the instruction register will be placed between TDI and TDO.  

Length of the instruction register, binary encoding of an instruction and the instructions that are supported in a device are implementation dependent. However, certain instructions like `IDCODE` are recommended to be implemented on all devices. Implementation details are generally documented in the devices programming manual as well as in the devices BSDL file. VSDL stands for boundary scan description language and is a subset of VHDL specification. Most JTAG based tools like Lauterbach Trace32 IDE has a provision to import a BSDL file and the instruction mnemonics can be used in a portable manner.  

Assuming a 5 bit IR, and the binary encoding `00010` for `IDCODE`, placing the pattern in the TDI pin serially (LSB first) on subsequent raising edges of TCK while in `shift-IR` state will push in the IDCODE instruction into the IR that is between TDI and TDO in that state.

While the last bit is being latched in, TMS need to be modified to go into `capture-IR` state. It is in this state that the TAP controlled decodes the instruction that has just been placed in IR. Next clock will push the state-machine out of `capture-IR` state into `exit1-IR` or "shift-IR" based on TMS state. 

> `exit1-IR` state will terminate the scanning process and moving into subsequent states to reach `capture-IR` from `shift-IR` will not alter the contents that were just shifted into IR

Once an instruction has been captured, the corresponding data register will be placed between TDI and TDO in the next "capture-**DR**" state. In this case, a data register containing the device identifier will be placed between TDI and TDO. So, once the TAP enters "capture-DR" state, contents of the ID register can be serially shifted out into TDO line at subsequent falling edges of TCK.

> while the data register is being shifted out at falling edges of TCK, data in TDI will be shifted into the same register. So, assuming that TDI is held low during the process of reading out data via TDO, the register will end up with all `0`s at the end of read. 


