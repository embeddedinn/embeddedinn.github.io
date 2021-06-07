---
title: Building a barebones web-push server
date: 2021-06-07 22:41:06.000000000 +05:30
classes: wide
published: true
categories:
- Articles
- Tutorial
tags:
- QEMU
- RISC-V
- Virtualization
header:
  teaser: images/posts/webpush/image2.png
  og_image: images/posts/webpush/image2.png
excerpt: "We use push notifications from web-sites on a daily basis. This article is about building one from the ground-up in order to understand how the whole system pipeline works."

---


<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
</style>

{% include base_path %}

<script type="text/javascript" async
  src="/assets/js/thirdparty/mscgen-inpage.js ">
</script>

Most modern websites offer to “push” a notification to you when there are updates. This is typically enabled using the Notification permission ![](images/posts/webpush/image1.png) icon. This article looks at how web push notifications work.


{% include image.html
	img="images/posts/webpush/image2.png"
	width="480"
	caption="The webpush permission notification"
%}

## Introduction

Push & notifications are two different operations – a Push and a Notification. During a “push” operation the application server uses a ‘Push API’ to send a notification to a “service-worker” working in the background, in your PC, hosted by your browser. A Notification is an operation where the service worker displays the message coming from the push message on the user's screen. We will look into the details of these terminologies later. However, an overview of the process is shown in the sequence chart below.

<pre class='code mscgen mscgen_js' style="text-align: center;">
msc {
  hscale="0.7", wordwraparcs=1;

  user       [linecolor="#008800", textbgcolor="#CCFFCC", arclinecolor="#008800"],
  Browser [linecolor="#FF0000", textbgcolor="#FFCCCC", arclinecolor="#FF0000"],
  AppServer    [label="App Server ", linecolor="#0000FF", textbgcolor="#CCCCFF", arclinecolor="#0000FF"],
  PushServer  [label="Push Server",linecolor="#FF00FF", textbgcolor="#FFCCFF", arclinecolor="#FF00FF"];
  
  
  Browser =>  user [label="Allow notifications?"];
  user       =>   Browser [label="Allow"];
  Browser => Browser [label="Subscribed; Register Service Worker"];
  
  Browser =>   AppServer    [label="Send Subscription"];
  AppServer => AppServer [label="Store Sub"];

---;

  AppServer    =>   PushServer[label="sub, Notification data"];
  PushServer => Browser [label="Notification data to service worker"];
  
---;
  Browser => Browser [label="Service worker shows notification"] ;
}

</pre>

## Voluntary Application Server Identification for Web Push (VAPID)

Since the subscription can be used to send asynchronous notifications to anyone who has subscribed for notifications from a website, it is critical to have a way to establish a secure identity. VAPID is only helpful between the application servers and the push server. In the code below, you can see the VAPID Public Key being passed to `registration.pushManager.subscribe()`. The full VAPID spec is available [**here**](https://datatracker.ietf.org/doc/html/draft-ietf-webpush-vapid-00). Key points and excerpts are given below:

-	There is no basis for an application server to be known to a push service before requesting a push message. Enforcing this places an unwanted constraint on the interactions between user agents and application servers.
-	VAPID  provides a system whereby an application server can volunteer information about itself to a push service. At a minimum an identity.
-	Application servers SHOULD generate and maintain a signing key pair usable with elliptic curve digital signature (ECDSA) over the P-256 curve [`FIPS186`].  Use of this key when sending push messages establishes a continuous identity for the application server.

    ```bash
    openssl ecparam -name prime256v1 -genkey -noout -out vapid_private.pem
    openssl ec -in vapid_private.pem -pubout -out vapid_public.pem
    ```

-	When requesting delivery of to a push server, the application includes a JSON Web Token (JWT) [`RFC7519`], signed using its signing key. This is as defined in the VAPID spec as a VAPID claim

    > ***Note***: To know more about JWT, you can refer to my previous article on Java Web Tokens [**here**](articles/tutorial/understanding-JSON-web-tokens/). 

    - The VPAID claim can contain multiple items in the body. The 3 main items are given below. But, you can add additional items that are indicative of the application server instance that is triggering the push for additional audit trails and debug:
        - ***sub***: The “Subscriber” a mailto link for the administrative contact for this feed. Mainly used by the push server in case there is an issue. E.g: `"sub": "mailto:admin@example.com"`,
        - ***aud***: The “Audience” is that indicates the recipient.  Eg. `“https://updates.push.services.mozilla.com”`
        - ***exp***: “Expires” this is an integer indicating the date and time that this VAPID header should remain valid until. It is not a validity for the keys. Typically this is the current UTC time + 24 hours. 

## Time to get your hands dirty

The full project and setup instructions are available in [https://github.com/vppillai/simpleWebPushServer](https://github.com/vppillai/simpleWebPushServer){:target="_blank"}.

### _codeFlow_: Service worker registration

We register the file sw.js as a service worker in [index.html Line 12](https://github.com/vppillai/simpleWebPushServer/blob/0c3c10a2150550f9e0a8f40eca85aca5f89dacd0/index.html#L12){:target="_blank"}. This file will run in the background and will be invoked when the application server sends a push. In our case, it simply shows a notification using the content of the push. 


### _codeFlow_: Creating a subscription

Creating a subscription is straight forward. Take a look at the window.subscribe function  starting at [index.html line 34](https://github.com/vppillai/simpleWebPushServer/blob/0c3c10a2150550f9e0a8f40eca85aca5f89dacd0/index.html#L34){:target="_blank"} . In [line 42](https://github.com/vppillai/simpleWebPushServer/blob/0c3c10a2150550f9e0a8f40eca85aca5f89dacd0/index.html#L42){:target="_blank"}, you can see that the publicVapidKey defined in [Line 10](https://github.com/vppillai/simpleWebPushServer/blob/0c3c10a2150550f9e0a8f40eca85aca5f89dacd0/index.html#L10){:target="_blank"} is passed on to `registration.pushManager.subscribe()`. This is the public key is used to validate the VAPID Claim by the push server. Only the application server has access to the private key corresponding to this key. 

### _codeFlow_: Passing the subscription to the application server

In [index.html Line 45](https://github.com/vppillai/simpleWebPushServer/blob/0c3c10a2150550f9e0a8f40eca85aca5f89dacd0/index.html#L45){:target="_blank"}, we pass this subscription to the CGI post handler in the system. The subscription looks like this:

```json
{
    "endpoint": "https://updates.push.services.mozilla.com/wpush/v2/gAAAAABguiX6BAmaIsMsrVpE0qmz19jppZKaYvVIG8I6KVc8zyHHQbncEVgCstSFUMY-cHybm5EJRbdvTvfk1DNjg2vRlD_SqssiUbcLoCbnXG_w0iV4pO1ZlTYo50tT6x7jWttqJ4pIKz90QJq2qQAuJTZZbOQlJJMwFaGeavOvU4Mc8l-OUgM",
    "keys": {
        "auth": "uTqIX-UBOIznB8SNUbIiPQ",
        "p256dh": "BKWinLri1rAONVNOKCkQVH0aJAALKTQpQtFkFFAFtdyPWN9z5TwUfzljJpSpnjPsJB7OQi00cQry3ZgIRZKeizc"
    }
}
```

The endpoint is unique to this subscription and an authenticated post to the endpoint will result in the data being sent to the service worker.

The test keys were generated with [https://vapidkeys.com/](https://vapidkeys.com/){:target="_blank"}


### _codeFlow_: the “application server”

Typical application servers handling webpush are large infrastructures. However, we are using 9 lines of python code to create a local https webserver in this case. An additional 9 lines of code are used to store the subscription and send the 1st notification. We also have an 8 loc helper that can be used to send notifications asynchronously. The code is pretty straightforward. Take a look at [server.py](https://github.com/vppillai/simpleWebPushServer/blob/main/server.py){:target="_blank"} , [subscription.py](https://github.com/vppillai/simpleWebPushServer/blob/main/subscription.py){:target="_blank"} & [sendNotification.py](https://github.com/vppillai/simpleWebPushServer/blob/main/sendNotification.py){:target="_blank"}

Since this is a barebones system, we are not going to setup user identification or even multi user support. We just use the latest subscription in a text file and use it to trigger notifications. 









