---
title: Decrypting embedded TLS communication
date: 2019-11-26 16:30:19.000000000 +05:30
header:
  og_image: /images/posts/wolfDecrypt/header.png
published: true
categories:
- Articles
- Tutorial
tags:
- Networking
- Security

excerpt: "While developing cloud connected products, one of the major challenges is debugging application layer errors within a TLS connection. This article describes a scalable method to decrypt application level communication within a TLS connection even when it happens with a cloud based server."

---
<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
</style>



{% include base_path %}

## Introduction
{% include toc title="Table of contents" icon="file-text" %}

A typical cloud connected device communicates with the server over a TLS connection. All data in this communication will be encrypted using a set of session specific keys derived at the time of connection. Even if the network traffic is sniffed, this data cannot be decrypted unless you get access to either the negotiated key or the server's private key. Getting access to the server's private key in the case of a cloud service like AWS IoT is impractical. So we resort to the second (and most foolproof) method.

In the case I am describing below, the communication is happening between a PIC32 device running WolfSSL and AWS IoT core. The communication uses MQTT protocol and we need to decrypt the application level exchanges happening over the TLS1.2 transport layer. I will not be going into the details of how the Wi-Fi traffic was sniffed. We start from the point where we have a setup to capture and view the network traffic in Wireshark (v3.0.6-0-g908c8e357d0f) .

## Modus operandi

To decrypt TLS traffic we need access to the `master secret` that is negotiated as part of the TLS connection process. Wireshark can accept a NSS Key Log Formatted file containing the `client random` and corresponding `master secret` for the session and use it to decrypt TLS traffic. 

The simple file structure that we would be using looks like:

<pre style="background-color:black; font-size: 75%">
<b style="color:Crimson ">CLIENT_RANDOM</b> <<i style="color:Bisque ">Client Hello Random</i>> <<i style="color:Coral  ">master secret</i>>
</pre>

More details about the file format can be found [here](https://developer.mozilla.org/en-US/docs/Mozilla/Projects/NSS/Key_Log_Format). 

## Code changes

 We get this dumped out of the firmware by adding the following lines of code in WolfSSL's `tls.c` file.

 ```c
printf("CLIENT_RANDOM ");

//printf("\r\nclient Random (tls.c): ");
for (i = 0; i < RAN_LEN; i++)
  printf("%02x", ssl->arrays->clientRandom[i]);
printf(" ");
        
//printf("\r\nmaster secret (tls.c): ");
for (i = 0; i < SECRET_LEN; i++)
  printf("%02x", ssl->arrays->masterSecret[i]);
printf("\r\n");     

 ```

This will generate a print like the one below for each session it establishes. 

<pre style="background-color:black;font-size: 75% ">
<b style="color:Crimson ">CLIENT_RANDOM</b> <a style="color:Bisque ">1d38a12474f12447cff5013d88a85b1afc83b100a7ff92e5a1fc5171f6dfe101 </a> <a style="color:Coral  ">331fd5c8d5e52fce44e4cd13a34beadd14c533b40f3a1839de0feb04d069ea58045cf04ef25f22e71dbcbe00b88ef4e2</a>
</pre>

Copy these into a text file. If there are multiple sessions , copy each of the prints into a newline within the file. 

## Decrypting TLS traffic with Wireshark

In your capture , right click on one of the TLS lines and click on the menu item to provide a master secret log file as shown in the menu below. (you can filter the capture with the `tls` expression to reduce clutter.)


{% include image.html
	img="/images/posts/wolfDecrypt/menu1.png"
	width="480"
	caption="Log file context menu"
%}

{% include image.html
	img="/images/posts/wolfDecrypt/menu2.png"
	width="480"
	caption="Log file menu and options"
%}


Once this file is provided, Wireshark will decrypt all traffic in the stream that has a matching `random` from the `client hello` phase of the session.

{% include image.html
	img="/images/posts/wolfDecrypt/clientRandom.png"
	width="480"
	caption="Client Random"
%}

{% include image.html
	img="/images/posts/wolfDecrypt/Decrypted.png"
	width="480"
	caption="Decrypted traffic"
%}