---
title: XML parser Pitfalls
date: 2013-05-20 12:31:48.000000000 +05:30
published: true 
categories: 
- Articles
- Tutorial
tags: 
- XML
- IoT

excerpt: "Things to keep in mind while parsing XML"
---
<style>
div {
	text-align: justify;
	text-justify: inter-word;
}
</style>


{% include base_path %}

This article has been migrated from my [original post](https://embeddedinn.wordpress.com/tutorials/xml-parser-pitfalls/){:target="_blank"}  at [embeddedinn.wordpress.com](http://embeddedinn.wordpress.com){:target="_blank"}.   
{: .notice--info}

In the wake of technology revolutions like Internet of Things (IoT), XML is gaining more importance than ever as the language of inter-platform communication. Most embedded system developers who use XML in their system write their own parser to limit the footprint. However, XML can very easily become the point of vulnerability in your system if you are not careful to include some sanity checks.

In this article, I will introduce some of the well-known XML based attacks and will discuss some of the tips to avoid the pitfalls

## Billion Laughs

Consider the following xml document injected into your system by a malicious user

```xml
<?xml version="1.0"?>
<!DOCTYPE lolz [
	<!ENTITY lol "lol">
	<!ENTITY lol1 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
	<!ENTITY lol2 "&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;">
	<!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">
	<!ENTITY lol4 "&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;">
	<!ENTITY lol5 "&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;">
	<!ENTITY lol6 "&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;">
	<!ENTITY lol7 "&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;">
	<!ENTITY lol8 "&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;">
	<!ENTITY lol9 "&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;">
]>
<lolz>&lol9;</lolz>
```

When the parser expands this, `lol9` will be expanded to ten `lol8`. Now, `lol8` expands to ten `lol7`. This goes on to expand into a huge XML containing 10<sup>9</sup> `lols` and will eat up all your systems memory.

This attack is also known as XML bomb or exponential entity expansion and many standard XML parsers consider entities expanding to entities as an entity loop and terminates parsing.

## Quadratic blowup entity expansion

A parser is hardened against exponential entity expansion, allowing only one level of entity expansion, will not be able to catch an extremely long entity being referred multiple times. Though not as bad as an XML bomb, this type of attack still pose a serious threat if entity size limit restrictions are not imposed.
External entity expansion

Consider the following xml entity.

```xml
<!ENTITY myVal SYSTEM    "http://www.example.com/myVal">
```

This seemingly harmless entity requests the parser to pull the value of `myVal` from an external resource. However, at the point of parsing, we do not know what the resource is going to return (or whether it will ever return at all. A user with malicious intent can point this external resource to something that never returns. In that case, the parser will be stuck until the resource is available (or a timeout if your code is smart enough). Even worse is when the resource returns a huge amount of data. The resource need not even be engineered to generate infinite data but can rather point to some huge file – say, a movie download. If the attacker has knowledge of your system internals, he can even point to some resource in localhost.

Solutions to this problem are:

-	Enable entity expansion in your parser only if it is necessary
-	Engineer your download time-outs wisely
-	Restrict to downloads from known hosts if possible
-	Disable entity resolution to localhost if they are not necessary

#	DTD retrieval

This is a specific case of external entity retrieval where the entity is the seemingly harmless document type definition. DTD basically defines the data that you can expect in an XML document and is often used as a resource linked to the original XML.

Along with other protection mechanisms, it is preferable to download a DTD only if it is absolutely necessary.

## Decompression bomb

This is also known as zip bomb or zip of death and is applicable to XML parsers that are capable of handling compressed stream of data like gzipped HTTP streams. A malicious attacker can engineer a compressed file to be such that it takes considerable amount of resources to un-compress it.

One of the well-known zip bombs is `45.1.zip`, a `45.1 KB` file that expands to around **1.3 exa Bytes** of uncompressed data. It is created by compressing a 1.3GB file full of zeros into a zip file and compressing ten copies of it into another zip file and repeating the process for 9 times.

If it is necessary for your system to deal with compressed data, ensure that proper buffer size limits are imposed so that your system will not hangup trying to uncompress exabytes of data.
