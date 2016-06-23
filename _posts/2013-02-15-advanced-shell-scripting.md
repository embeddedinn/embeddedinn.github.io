---
title: Advanced Shell Scripting
date: 2013-02-15 15:40:20.000000000 +05:30
published: true 
categories: 
 - Articles
 - Tutorial
tags: 
 - shell scripting
 - linux

excerpt: "A collection of advanced tips and tricks to create wonderful shell scripts"
---

<style>
div {
    text-align: justify;
    text-justify: inter-word;
}
</style>

{% include base_path %}


This article has been migrated from my [original post](https://embeddedinn.wordpress.com/tutorials/advanced-shell-scripting/){:target="_blank"}  at [embeddedinn.wordpress.com](http://embeddedinn.wordpress.com){:target="_blank"}.   
{: .notice--info}

Shell scripting refers to an automated way of interacting with a computer system over command line interface (CLI) . This article deals specifically with scripting with the bash shell

## Shebang

Shebang is the method used in bash scripting to declare the interpreter to be used for the rest of the script. It is represented as `#!`. eg:

```bash
#!/bin/sh
```

## Execution

When interacting with external programs or scripts (referred to as, file in general) shell scripts uses three major execution modes 

## source

In this mode, the external file is executed in the current shell environment. Exit status of the last executed command is passed on as the return value. eg:    

```bash
source ./child.sh
```

or simply   

```bash
. ./child.sh
```

## eval

All arguments to eval are concatenated into one string and executed as a new command. eg:
 
``` bash 
eval "hello $USER"
```

## exec

The command specified as the argument to exec will replace the shell . The arguments becomes arguments to the command.

## Parallel Processing

### Spawning parallel processes

A task can be run in the background by appending an `&` to the end of the command. eg:

```bash
./child1 &
./child2 &
```

### A waiting parent

Once child a process is spawned, the parent has to wait until the child process returns. To wait for all children, put a `wait` at the end of the script. eg: 

```bash
./child1 &
./child2 &
wait
echo " exiting since all children are done"
```

To wait for a specific child, the child `PID` has to be passed to the wait command. The child `PID` can be fetched from the `$!` variable as soon as the child is spawned. eg:

```bash
./child1 &
PID1=$!
./child2 &
PID2=$!
wait PID1 PID2
```

To fetch the return values of the children, use the `$?` variable immediately after the wait for the corresponding child. eg:

```bash
./child1 &
PID1=$!
./child2 &
PID2=$!
wait PID1 
RET1=$?
wait PID2
RET2=$?
```

Irrespective of when the child finished processing, the return value will be collected when wait is called on its `PID`

### Pitfalls

If the parent is killed while waiting for the children to exit (say, by a `SIGINT` (`ctrl+c`)), the children becomes Zombies and will start to eat-up system resources. To avoid this, install a trap to catch the probable kill signals.eg:

```bash
trap “kill -9 $child; echo child killed;”  SIGHUP SIGINT SIGTERM
```

## Colorizing

To get color prints in the shell, use the following syntax

```bash
echo -e "33[COLORm Hello World"
```

or

```bash
printf "\e[COLORm Hello World"
```

List of colors available are

|color    |foreground|Background|
|---------|:--------:|:--------:|
|Black 	  | 30       |	40      |
|Red 	    | 31       |	41      |
|Green 	  | 32       |	42      |
|Yellow   | 33       |	43      |
|Blue 	  | 34       |	44      |
|Magentha | 35       |	45      |
|Cyan 	  | 36       |	46      |
|White 	  | 37       |	47      |

For example, to print a text in red with yellow background, and then reset the colors back to white text in black background , one fo the following can be done:

```bash
echo -e "33[31;43m Deleting33[37;40m"
```   

```bash
printf "\e[31;43m Deleting\e[37;40m"
```

Further possible effects are
		
|ANSI Code |	Meaning      |
|:--------:|---------------|
|		0      |	Normal       |
|		1      |	Bold         |
|		4      |	Underline    |
|		5      |	Blink        |
|		7      |	Reverse Video|

For example, to print bold red text in yellow background and then reset the colors back to white text in black background , one of the following can be done. 

```bash
echo -e "33[1;31;43m Deleting33[0;37;40m"
```

```bash
printf "\e[1;31;43m Deleting\e[0;37;40m"
```
	
## Outliving the sessions

When a session terminates, all processes that started from the session will receive a `SIGHUP` and will thus be terminated . However, the session can be outlived in one of the two ways.

- Install a `SIGHUP` trap at the beginning of the script    
   `trap "echo 'I wont go down'"  SIGHUP`

- Run your process under nohup   
		`nohup` is a POSIX command that will do the SIGHUP trapping for you.    
		`#nohup <scriptName.sh> &`

- disown the job (background process)   
    If the process to outlive the session is already in the background, it can be “disowned” so that the session termination will not terminate the process. one fo the following can be done for this.    

	``` 
  #my_script.sh &  
  disown <PID of my_script.sh>
	```

    ``` 
    #my_script.sh & disown
		```

I will keep adding more or these interesting  shell scripting stuff here. So, keep tuned . . .
