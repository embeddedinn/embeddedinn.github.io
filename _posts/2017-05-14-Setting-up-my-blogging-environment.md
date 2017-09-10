---
title: Setting up my blogging environment
date: 2017-05-14 23:00:19.000000000 +05:30
published: true 
categories:
- Articles
- Tutorial
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
sudo apt-get install ruby-dev
sudo gem install jekyll bundler
sudo apt-get install zlib1g-dev

```

Once the tools are installed, got to the cloned blog folder and run the following command to install missing gems and dependencies. 

```bash

bundle install

```

In the case where I wass etting it up to write this page, I had to re-run `bundle install` after running the following commands since I did not install zlib in the first place. 

```
sudo apt-get install zlib1g-dev
sudo gem install nokogiri -v '1.6.7.2'
```

Once all installations are successful, run the following command to serve the blog in localhost

```bash
bundle exec jekyll serve
```

Use the `--incremental` flag when writing pages since the process will be faster

