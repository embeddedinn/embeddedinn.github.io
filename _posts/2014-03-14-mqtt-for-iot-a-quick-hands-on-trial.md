---
title: MQTT for IoT - a quick hands-on trial
date: 2014-03-14 12:06:31.000000000 +05:30
published: true 
categories: 
- Articles
- Tutorial
tags: 
- MQTT
- IOT

excerpt: "Give MQTT a test drive"
---
<style>
div {
	text-align: justify;
	text-justify: inter-word;
}
</style>


{% include base_path %}

MQTT is a light weight, opensource, publish-subscribe protocol designed with small devices and IoT in mind. MQTT stands for Message Queue Telemetry Transport and aims at devices with a small code footprint requirement. The smallest valid packed is 2 bytes in length with the fixed header.

MQTT is primarily designed to work over TCP/IP with optional TLS security. However, there also exist a variant called MQTT-SN for sensor networks over non-TCP transports like Zigbee.

Facebook mobile messenger is one of the big players who has adopted MQTT. It is used for functionality like presence notification to limit bandwidth usage and enhance battery life.

## Hands-on

There are numerous MQTT broker and client libraries of varying complexities available out there. I used the Mosquitto MQTT broker and client to get a feel of this protocol.

For ubuntu, Mozquitto broker and client are available from a  standard repository. To add the repo, and install, use:

`sudo apt-add-repository ppa:mosquitto-dev/mosquitto-ppa`

`sudo apt-get install mosquitto mosquitto-clients`

To start the server, use

`mosquitto -d`

This will start the server in a daemon mode at TCP port `1883`

Now, some basics of MQTT pub/sub model

- `publish` and `subscribe` are done to topics arranged in a tree. The node separator is `/`	. So, topics can be like `books/science`, `books/art`, `books/science/physics`, `books/science/chemistry`

- Subscription can be to a specific topic of a wildcard topic tree   
	- `+` represents a single node. So, +/science can refer to “books/science” or “papers/science”   
  - `#` represents a node set (like `*` in regex). So, `books/#` refers to `books/science` as well as `books/art`   

- There is no need to create a topic. As soon as a pub/sub is done to a topic, it is created

Time to get your hands dirty. In a terminal session, run the following command to subscribe to `books/science/+`

`mosquitto_sub -h localhost -p 1883 -t “books/science/+”`

Now, to publish to the topic, open another terminal and run:

`mosquitto_pub -p 1883 -h sid -m “physics” -t “books/science/physics”`

`mosquitto_pub -p 1883 -h sid -m “physics” -t “books/science/chemistry”`

Both messages will be received at the subscription terminal.

If the messages are published with a -r flag, the last published message will be retained and any subscriber to the topic will receive it as soon as they subscribe to the topic.

A publisher can set a `will` and `will-topic` when it first connects to the server. This will will be published in the will topic if the publisher disconnects unexpectedly

In the example here, we did not enforce security. However, SSL and user based authentication is provided for by the protocol and supported by Mosquitto implementation
