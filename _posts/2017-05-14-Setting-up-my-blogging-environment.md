---
title: Setting up my blogging environment
date: 2017-05-14 23:00:19.000000000 +05:30
published: true 
categories:
- Tutorials
tags:
- Blogging

excerpt: "My notes on how to setup the blogging environment for adding pages to embeddedinn"

---
<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
</style>


{% include base_path %}

I use jekyll with minimal mistakes for publishing the blog. Here are the steps to setup a local server to write new pages in the existing framework.

In this case I am starting off with a fresh install of Ubuntu17.04 in a virtual machine. It came with ruby installed so, `gem` command was already available, but `ruby-dev` had to be installed along with couple of other tools.

```bash
sudo apt-get install build-essential patch ruby-dev zlib1g-dev liblzma-dev jekyll bundler

```

Once the tools are installed, got to the cloned blog folder and run the following command to install missing gems and dependencies. 

```bash
bundle config build.nokogiri --use-system-libraries     --with-xml2-lib=/usr/lib     --with-xml2-include=/usr/include/libxml2     --with-xslt-lib=/usr/lib     --with-xslt-include=/usr/include
bundle install

```

`nokogiri` setup is required for latest version to compile with system versions of xml libs.

Once all installations are successful, run the following command to serve the blog in localhost

```bash
bundle exec jekyll serve
```

Use the `--incremental` flag when writing pages since the process will be faster

