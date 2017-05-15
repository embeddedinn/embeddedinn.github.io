---
title: Hijacking openssl renegotiated keys for server wiretaps
date: 2017-05-15 23:30:19.000000000 +05:30
published: true 
categories:
- Articles
- Tutorial
tags:
- openssl
- Security
- Azure
- MQTT

excerpt: "Notes on how I hijacked the re-negotiated SSL keys between Azure server and openssl s_client to decrypt TLS1.2 protected communication logs"

---
<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
</style>


{% include base_path %}

## Introduction and problem statement

I was recently working on setting up an Azure IoT hub  based system for MQTT messaging and had to explore some low level stuff while debugging communication issues. It was then that I came across the fact that Azure does TLS re-negotiation while authenticating clients that use X.509 certificates. 

To re-create the scenario, let us use openssl's `s_client` to post a message to the event hub using HTTP post. The command to use would be: 

```bash
openssl s_client -host vysakh-testHub1.azure-devices.net -port 443 -cert selfsigned.crt -key selfsigned.key
```

This command will connect to Azure IoT hub over a secure channel, do a full ssl handshake and derive a session specific `Master secret`. This key will be printed in the console and it can be used to decrypt application logs using wireshark. At this point, device certificate is not requested.

When the actual request is posted, if authentication mode of the requesting device is X.509, Azure IoT hub will perform a TLS re-negotiation by sending a `hello request` TLS handshake. This triggers a full handshake between the device and server but this time, it would include a `certificate request` handshake. At the end of this re-negotiation, a new `Master secret` is derived and it would be used for further application data transfer. However, s_client does not print this re-negotiated key and using default setups, it would be impossible to decrypt further application data exchange between the device and client.

Another issue is while using a standard MQTT client like `mosquitto_pub` over secure channels. Once the channel is established, there is no way to observe application level data.

{% include image.html
	img="/images/posts/opensslMqttHack/masterSecret1.png"
	width="480"
	caption="s_client Master Secret"
%}

{% include image.html
	img="/images/posts/opensslMqttHack/helloRequest.png"
	width="480"
	caption="helloRequest followed by encrypted data"
%}

I will be describing how to decrypt TLS traffic using wireshark in upcoming sections
{: .notice--info}

## overview of the hack

Even without detailed understanding of openssl, it is easy to understand that the sure-shot way to hijack/print keys from the stack is to modify `SSL_read()` or `SSL_write()`. These functions will definitely be called by all code written on top of openssl when it has to send or receive data over a TLS socket. 

These API takes an argument (`s`) of type `struct ssl_st`. On digging a bit through the code, it was clear that this can be used to print the master key using the member: `s->session->master_key`

## modifying and compiling libssl

Latest release version of openssl can be downloaded from its website. To compile the code, use the following commands after unpacking the archives. At the time of writing, latest version was `openssl-1.1.0e`

```bash
./config
make
```

Before compiling, we will modify the read function to print `master_key` of the calling session with the following patch in `ssl/ssl_lib.c`

{% include image.html
	img="/images/posts/opensslMqttHack/codeChange.png"
	width="480"
	caption="SSL_read() patch to print key"
%}

We can now run the freshly compiled openssl app using the modified library by running the following command:

```bash
LD_LIBRARY_PATH=. apps/openssl s_client -connect google.com:443
```

Once the session is established, send a dummy `GET /` request to see the patch in action

{% include image.html
	img="/images/posts/opensslMqttHack/patchAction1.png"
	width="480"
	caption="SSL_read() patch printing master_key"
%}

## using the hack with re-negotiating servers

Now that we have the capability to print out the session master_key using our modified openssl library, we can use it with Azure to see the re-negotiated key.

I have already created a device that uses X.509 certificates for authentication. Issue the following command to connect to Azure IoT and POST  an event request as this device:

```bash
LD_LIBRARY_PATH=. apps/openssl s_client -connect vysakh-TestHub1.azure-devices.net:443 -cert ../selfsigned.crt -key ../selfsigned.key
```

Once a connection is established, post an event using the below HTTP request:

```bash
POST /devices/testDevice2/messages/events?api-version=2016-02-03 HTTP/1.1
Host: vysakh-TestHub1.azure-devices.net
User-Agent: testDevice
Content-Length: 8
Accept: application/json

testData
```

From the console output of our patch, you can see that a new key has been negotiated 

{% include image.html
	img="/images/posts/opensslMqttHack/patchAction2.png"
	width="480"
	caption="SSL_read() patch printing re-negotiated master_key"
%}

## decrypting re-negotiated session using wireshark

Wireshark comes with an inbuilt capability to decrypt TLS traffic if master_key can be provided. Master key is matched to the sessions `random` send as part of `Client hello` using a "master-secret log file"

You can tell Wireshark where to find the key file via Edit→Preferences→Protocols→SSL→(Pre)-Master-Secret log filename. Key log file format is :

```bash
CLIENT_RANDOM <space> <64 bytes of hex encoded client_random> <space> <96 bytes of hex encoded master secret>
```

Client random can be obtained form the encrypted logs itself. In this case, we will first log the entire transaction using wireshark, fetch the initial client random from the logs and then match them to the master_keys printed by our patch.

{% include image.html
	img="/images/posts/opensslMqttHack/clientRandom1.png"
	width="480"
	caption="copying first client ramdom"
%}

In the encrypted logs we will be able to see only the first `Client Hello` since the re-negotiated hello will be under the encryption of the first session. Copy the random as a "hex stream" by right clicking `random` as shown in the image. Paste it along with the first master secret printed by our patch into a file in the format described above. 

After saving the file, point wireshark to it and reload the file by clicking ![reload_button](/images/posts/opensslMqttHack/reload.png)
 
Upon reloading, the re-negotiation client hello will be available in clear. 

{% include image.html
	img="/images/posts/opensslMqttHack/reClientHello.png"
	width="480"
	caption="copying first client ramdom"
%}

Now, copy the new `random`, append it to the key log file along with the re-negotiated master key from our patch and re-load the file to see the entire log in clear.

Decryption of re-negotiated traffic was recently fixed in wireshark. I was not able to see it in action in release `Version 2.2.6 (v2.2.6-0-g32dac6a)`. Instead, I used automated build version `Wireshark-win64-2.3.0-3548-gc30bb2c`
{: .notice--warning}

{% include image.html
	img="/images/posts/opensslMqttHack/renegDecrypt.png"
	width="480"
	caption="decrypted re-negotiated traffic"
%}

## decrypting secure MQTT traffic

Now that we have a modified TLS library that can provide us required information, we can use it to have more fun. For instance, I used it to decrypt MQTT traffic that is going through a secure channel. An alternate option would have been to modify the MQTT client source to print the session keys. But where is the fun in that??

However, I faced some issues in doing this using the library that we just compiled. At first, `ldd` command showed that default mosquitto_pub in my system was linked against v1.0.0 of libssl. So, I downloaded sources of openssl 1.0.0k adn compiled it with the patch. However, upon running the tool against the newly compiled library, I faced another issue where it complaints about missing version information 

```bash
mosquitto_pub: ./libcrypto.so.1.0.0: no version information available (required by /usr/local/lib/libmosquitto.so.1)
mosquitto_pub: ./libssl.so.1.0.0: no version information available (required by /usr/local/lib/libmosquitto.so.1)
mosquitto_pub: ./libssl.so.1.0.0: no version information available (required by /usr/local/lib/libmosquitto.so.1)
```

I figured out that this is because debian patches for openssl that is expected by my mosquitto_pub client is missing in the official sources. So, I downloaded the official debian version sources and patches and compiled it.

### applying debian patches and compiling sources

debian use `quilt` for applying patches to official sources. For applying these patches and compiling, download the following files from ubuntu repository:

- original sources: openssl_1.0.2g.orig.tar.gz
- patches and rules: openssl_1.0.2g-1ubuntu11.debian.tar.xz

unpackage both the archives and copy `debian` folder from the patch package into original souces folder. Now, to apply the patch, issue the following commands:

```bash
export QUILT_PATCHES=debian/patches
quilt push -a
```  

instlall debhelper package using `sudo apt install debhelper` before building.
{: .notice--info}

Now, make the same changes to SSL_read() as we did before and issue the following command to compile the package

```bash
debian/rules
```

Once compilation is through, run `mosquitto_pub` using the following command to see the patch in action. Wireshark based decryption uses the same method above

```bash
mosquitto_pub -h iot.eclipse.org -p 8883 -t "testTopic" -m "testMessage" --capath /etc/ssl/certs/ -d
```

{% include image.html
	img="/images/posts/opensslMqttHack/mosquittoPub.png"
	width="480"
	caption="mosquitto_pub over secure channel"
%}


{% include image.html
	img="/images/posts/opensslMqttHack/mqttDecrypt.png"
	width="480"
	caption="decrypted MQTT traffic"
%}

