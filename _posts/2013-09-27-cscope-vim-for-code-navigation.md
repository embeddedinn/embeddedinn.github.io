---
title: cscope + vim for code navigation
date: 2013-09-27 13:22:55.000000000 +05:30
published: true 
categories: 
- Articles
- Tutorial
tags: 
- CSCOPE
- vim

excerpt: "A tutorial on 8 bit PIC Microcontroller architecture and development tools"
---
<style>
div {
	text-align: justify;
	text-justify: inter-word;
}
</style>


{% include base_path %}

This article has been migrated from my [original post](https://embeddedinn.wordpress.com/tutorials/cscope-vim-for-code-navigation/){:target="_blank"}  at [embeddedinn.wordpress.com](http://embeddedinn.wordpress.com){:target="_blank"}.   
{: .notice--info}

When you are working with a large code base, you need a powerful tool to navigate through the code seamlessly . There are many paid tools put there that does this efficiently and for the open source enthusiast in you, you have [OpenGrok](http://opengrok.github.io/OpenGrok/){:target="_blank"} that gives and web interface to your code and [Cscope](http://cscope.sourceforge.net/){:target="_blank"} that provides a command line interface to code navigation.

In my project where I had to make changes to parts of code that includes thousands of file that pours in from teams across geographies, I found it difficult to open up Cscope each time I had to find the reference to a variable or search for a definition. Then I came across [this](http://cscope.sourceforge.net/cscope_vim_tutorial.html){:target="_blank"} tutorial in the cscope website that illustrates how we can integrate cscope with my favorite editor – [vim](http://www.vim.org/){:target="_blank"} .

With cscope integrated vim (and some getting used to), code navigation is easier, faster and all the more interesting. In this tutorial, I will describe how to integrate vim and cscope in quick steps and provide some shell functions that will make your life easier.

*NOTE*: It goes without saying that this is all applicable for non-GUI code editors like me who prefer to use FOS tools for your day to day activities

**STEP 1**:

Install vim and cscope . – – – you figure out how to do it :stuck_out_tongue: 

**STEP 2**:

Download the cscope vim map from here and copy it to your `~/.vim/plugin` folder

I had to move the `set nocscopeverbose` line from the end of CSCOPE_DB addition branch to the beginning of the branch to avoid some prints at vim start-up . (from line 49 to above line 33 in teh 2002/3/7 version of the file)

**STEP 3**:

Add the following functions to your `~/.profile` (or `~/.bashrc`) file

```bash
function build_cscope_db_func()
{
	find $PWD -name *.c \
		-o -name *.h \
		-o -name *.mk \
		-o -name *.xml\
		-o -name *.cfg\
		-o -name *.ini\
		-o -name *.dat\
		-o -name *.cpp > $PWD/cscope.files
		cscope -RCbk
		export CSCOPE_DB=$PWD/cscope.out
}
alias csbuild=build_cscope_db_func

function cscope_export_db_func()
{
	export CSCOPE_DB=$PWD/cscope.out
}
alias csexport=cscope_export_db_func
```

Once this is in place , save the file and import it into your environment by executing `. ~/.profile` .

*NOTE*: you can alter the type of files to be included in cscope parsing in the above function to suite your needs

**STEP 4**:

Now go to the root folder of your code and execute `csbuild`. This operation might take some time depending on your code size and type of files included in the csbuild function. This operation is valid until there is code change to be parsed.

**STEP 5**:

Now open vim and you are ready to navigate your mighty code base. To start with , suppose you want to fins the file main.c, issue the vim command ` :cs f f main.c ` [i.e. cscope find files of name main.c]

Another commands that can be issued ` :cs f s main  ` to find all references to the symbol `main`. List of all commands will be listed on issuing ` :cs h ` to vim.

Once a file is open, to perform the operations (like “s” to find all references to a symbol under the cursor), while in vim command mode, do a ` ctrl + \    s`. Same goes for other commands (like f to open a file with name under the cursor)

**STEP 6**:

Once a cscope database is built (using csbuild), its link to vim is valid only until the session is active (since it is controlled using an environment variable). Once you open a new session, you have to go to the location of the cscope.out file (root folder of your code) and do a csexport.

This is also valid when you want to switch between projects (code bases). csbuild can be executed on all project roots and csexport can be used to switch between projects
