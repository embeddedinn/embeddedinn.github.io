---
title: 'IoT: Networked embedded system caveats'
date: 2016-04-06 21:23:49.000000000 +05:30
published: true 
categories: 
 - Articles
 - Tutorial
tags: 
 - IoT
 - embedded networking

excerpt: "A tutorial on 8 bit PIC Microcontroller architecture and development tools"
---
<style>
div {
    text-align: justify;
    text-justify: inter-word;
}
</style>


{% include base_path %}

If you have experience developing software over the linux TCP/IP stack and start to develop something similar for an embedded system, you will soon realize that there are some things that cannot be granted while you work a level closer to silicon.

I recently got cocky with my experience and commuted to deliver a simple IoT device that uses a brand new platform and a well known service (foolishly) thinking that it can be done in a fairly small amount of time. Afterall, at the heart of it was a HTTP client and a couple of sockets . Boy was I wrong!!! Anyhow, finally after many sleepless nights and a ruined week end, I was able to deliver it a day before the deadline.

I am jotting down some pointers from this experience that would help anyone that is getting started with developing a networked embedded system.

## System definition:

My system has a TCP/IP stack that runs on bare metal and uses a loop to cooperate among other “tasks”. Luckily , I also had access to all the stack and MAC code.

## Issues, solutions and other pointers:

First and foremost, get comfortable with your networking tools. If you have a background working with networking, you would be already knowing that [Wireshark](https://www.wireshark.org/){:target="_blank"} is your friend. What complements it when you are developing stuff for embedded systems, is [netcat](http://nc110.sourceforge.net/){:target="_blank"}. Especially if you are communicating to an external server with minimal to no documentation made for small systems.

Netcat is a powerful yet simple tool that allows you to open a connection to a socket (IP+Port combination) and send ASCII to it as a client. It can also act as a server by listening on any available port in the system. Say you are trying to connect to a service over a `HTTP GET` request, you can frame request in your text editor, open a connection in nc and pump in the request. The response will be available in the same session and now you know what your service accepts, what it rejects and how it behaves to different commands. It can also act as a local server instance which can receive and display the requests being sent out from the device.

This become in case of servers that are intolerant to malformed requests. If you directly start pumping in the requests without first checking,  it might result in the server temporarily blocking your IP.

Another villain from the same clan is keep-alive timeout. From a firewall point of view, a TCP  socket opened can stay alive for a configured period of time or until either of the parties send a `FIN`,`ACK` . Typically this time is 30 minutes. However, since the server has to keep listening to this socket for the entire duration, most servers (HTTP in my case) will have their own time out configuration. Hence, if you open a socket and send a HTTP GET with a “connection: keep-alive” header, the server will initiate a `FIN`,`ACK` after a predefined period of time. In my case , it was 60s. To avoid this, you need to sent a HTTP request via the socket atleast once in 60s. One thing to be careful is, a bad request will disconnect the session immediately even though the request is for a `keep-alive` connection.

Now, say you have opened a socket to be kept alive, and you are sending the mandated pings, you are also expected to acknowledge the response to the requests that you are sending. For instance, it the server responds with  a `200 OK`, you need to read (and discard in my case) the response so that the TCP stack can `ACK` the packet.  Generally , server stacks will have a threshold for the number of such unacknowledged packets after which the socket will be terminated (`FIN`,`ACK`) . In my case, it was 45 messages.

In my case with HTTP requests, there is one peculiar behavior that was particularly tricky. The socket was able to handle only messages of the same type. So, when I use a GET request for a particular resource with a specific set of headers to start a keep-alive connection, future requests on the connection needs to have the same set of headers. I was opening my HTTP session with an additional ‘Accept’ type which the further keep-alive requests did not have. This was causing the server to drop the session after 45 unACKed transactions.

Many a times , IoT servers like those of messaging services will have a rate-limit associated with it. That means, you cannot send more than n messages in x seconds. In my case, it was a message every second. Though you can handle this using flood gates and timed mutexes, it is always better to check the server response for the corresponding header. General, trends are to send `X-RateLimit-Limit` and `X-RateLimit-Remaining`. There is also a `429 Too Many Requests` response code. Exact response will depend on your server implementation. Again, nc and wireshark are your friends who will help you find this out. Trigger a flood of requests via nc and observe the response. Capture wireshark traces for extra information.

In my system, the stack was designed to be close to real time and so, there where no provisions for blocking calls. This is particularly important to notice when you are working with an embedded system. Many of the calls would return immediately, but you have to wait for flags and callbacks to make sure the operation completed successfully. We would be inherently cautious when working with peripherals like SPI or I2C . But when it comes to networking, my experience of working with larger systems that take care of most of these things tend to kick me in the nuts more often than I would like.

 Embedded TCP/IP stacks , as rare as they are, might have some interesting configurations that are user controllable. The bugger of a configuration taught me about SYN flood attack trigger configurations in firewalls the hard way. What I essentially ended up doing was sending SYN requests to the server port at 60MHz . That is a lot of `SYN`s for a second , and the server was blocking my IP . Thanks to a friend with a handy firewall who almost smacked my head seeing the firewall logs, I learned a valuable lesson in embedded networking.

 The last thing that got me stuck when I about to ship my code was a connection issue. The device that was working well for the last 6 hours continuously, stopped connecting to the server all of a sudden when I just reset the device. From Wireshark logs, I could see that I was not getting a `SYN`,`ACK`. Back to the firewall guy and this time, he almost strangled me. I was using the same source port for every connection request. Remember the TCP socket timeout configuration of 30 min that I mentioned earlier in the article? Turns out, the firewall implements this by having a session entry that is tagged using the socket info (IP+Port). When I reset my device, since I did not send a `FIN` , the firewall session log thinks that the session is still alive , and does not allow another session with the same tag to be created.

 The interesting part of this problem is the root cause. Since this timing info is mentioned in the TCP RFC, the stack that I as using was already taking care of assigning a random ephemeral port. However, my hardware does not have a true random number generator (`TRNG`), and is very much deterministic by design. So, every time the rand() function is called to generate the port number, the LFSR generates the same port number. This was causing my local firewall to block the connection request.

 The solution I found for this problem was to rely on the small variation in time taken to get the DHCP IP assigned (uses a UDP port) every time. I have a timer being used by the TCP stack that is initialized at `init()`. I added the value generated by a floating ADC channel and temperature value, and used it to seed the `PRNG`. Though this is not 100% reliable, it is practical and worked for 100 trials. Any way, I have requested to add a `TRNG` add-on to the board. Fingers crossed.
