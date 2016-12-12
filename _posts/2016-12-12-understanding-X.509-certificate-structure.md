---
title: Understanding X.509 Certificate Sructure 
date: 2016-12-12 18:36:19.000000000 +05:30
published: false
categories:
- Articles
- Tutorial
tags:
- IoT
- Digital Certificates
- Security
- Networking

excerpt: "An insight into the format and technologies used to pack a X.509 certificate. This tutorial introduces the concepts by parsing through a TLS certificate using easily accessible tools"
---
<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
</style>


{% include base_path %}



<b>NOTE:</b> If you are totally new to digital certificates and the ecosystem, please read my article introducing the basics of Digital certificates [here](/articles/tutorial/introduction-to-digital-certificates/){:target="_blank"} before continuing with this article. 
{: .notice--info}

## Introduction

Digital certificates are now prevalent and its significance is growing in the current market where we need to deploy and manage many embedded devices into a network.

{% include toc title="Table of contents" icon="file-text" %}

Even with the increasing significance of Digital certificates, engineers are largely unaware of the underlying concepts and standards that dictate the certificate formats and contents. This is primarily because of the availability of hardened and stable software like OpenSSL that abstracts many things under friendly top level APIs. However, with the new wave of embedded devices using these technologies, we need to understand and re-visit the underlying technology to optimize them for the new-age requirements.  

When it comes to parsing a X.509 certificate by hand, the required information is scattered all over the place. This article aims at bringing in the basics together without going too much into specification details so that you can use it as a starting point to understand where and what to look for. 

## Basics

First a little bit of glossary and background. Some seemingly disconnected terminology and concepts will be introduced in this section.

### Abstract Syntax Notation One (ASN.1) 

ASN.1 is an abstract syntax that defines a machine encoding independent way of representing ( encoding, transmitting and decoding) data. Being an abstract syntax, it only defines the structure of the data tree and leaves the actual data representation to application specific implementations. In other words, ASN.1 is a schema language (simply put). To give an idea of what this means, ASN.1 can be used to define the schema for formats like JSON, XML etc.

A tip for later: In the schema representation , a `SEQUENCE` models an ordered collection of variables of different type

### Object identifier (OID)

In the context of digital certificates, OID refers to the ITU-T maintained tree based object identifier hierarchy that allows unambiguous representation of information in the form of a dot separated number.

For example 2.5.4.8 is the doted representation of the OID of the tree `{joint-iso-itu-t(`2`) ds(`5`) attributeType(`4`) stateOrProvinceName(`8`)}` . A certificate will use this OID to indicate that the following string is the state or province of the entoty to which the certificate was issued. 

[OID Repository](http://www.oid-info.com){:target="_blank"} is a good place to lookup entities in the OID tree. 

#### OID encoding (for DER)

Special encoding rules have been defined to represent OIDs inside the ASN.1 tree . Note that ASN.1 by itself is agnostic of encoding rules. The rule illustrated below is part of the `DER` specification . (More on DER in the next session) 

For directly encoded OID components, the individual octets should have the first bit as `0`.

Consider a dummy OID `1.2.62329.4`. OID binary encoding for octet representation is done using the following rules.

**Step 1**: The first two components (`A.B`) are encoded as `40*A+B` . In this case, it would be `2A` (Hex of `42`)

**Step 2**: Since the third component (`62329`) has more than 7 bits in it, we need to split it into multiple octets with only the leading octet having MSB =1.

For this, first convert the number into binary and split into groups of 7 bits (Pad 0s to form the leading set to form an octet)
`000_0011 110_0110 111_1001`

Set the MSB of all octets except last to 1. Set MSB of last octet to 0. Now, convert the resulting decimal into hex  
`1000_0011 1110_0110 0111_1001` = `0x83E679`

**Step 3**: since the last component has a value with less than 7 bits, it can be converted to hex directly.

So the final HEX encoded OID of `1.2.62329.4` would be `2A 83 E6 79 04`

### Distinguished Encoding Rules (DER)

DER defines rules for unambiguous encoding of data into ASN.1. This is one of the formats commonly used in cryptographic systems.

A portion an ASN.1 tree within a certificate is given below:

Here the `SET` contains a `SEQUENCE` that contains an `ObjectIdentifier` conforming to the ITU-T OIDs and a "value" for the identified object. In the example here, all the OIDs have been mapped to the corresponding string notation as well. DER defines that for OID 2.3.4.6, the next element in the `SEQUENCE` should be of type `PrintableString` and further goes on into the definition of how a `PrintableString` appears in the ASN.1 tree.

```
SET
  SEQUENCE
    ObjectIdentifier countryName (2 5 4 6)
    PrintableString 'IN'
```                                        
                                              
The HEX notation of this portion of the tree encoded as per DER would be:

`31 0B 30 09 06 03 55 04 06 13 02 49 4E`

This means:

```
31 - Type is SET
0B - length of immediate contents is 11 bytes.
30 - Type is SEQUENCE
09 - Length is 9 bytes
06 - Type is ObjectIdentifier
03 - length is 3 bytes
55 04 06 - OID is 2.5.4.6 (see OID encoding section above for explanation) 
13 - Type is  PrintableString
02 - length is 2
49 4E - ASCII of "IN" 
```

Essentially, DER encoded data follows a Tag,Length,Value (TLV) approach with well defined rules for all the components. 

### Base64 encoding

Base64 is an encoding scheme used to represent binary data as an ASCII string using radix64 (just like binary representation uses radix2). Characters chosen to represent encoding depends on the standard used . For example, MIME uses `A-Z`, `a-z` , `0-9` and `+/`. 

There are well deifined methods to handle corner cases and there are variants (like URL safe Base64) to handle different scenarios. 

### Privacy Enhanced Mail format (PEM)

Though the e-mail securing proposal in PEM was not a success, the certificate and key encoding format described by PEM is one of the most widely used for certificate storage and transmission. PEM files are used for storage of single certificates, complete certificate chain or just keys. 

Essentially PEM is a BASE64 encoded DER file. 

### Public Key Cryptography Standards (PKCS)

PKCS is a set of asymmetric crypto standards initially published by RSA and later enhanced by Microsoft. It describes a series of Public key infrastructure (PKI) assisting standards for items like certificate syntax, token interface, certificate signing request, private key storage etc.

The pkcs12 standard defines a password protected container format for storing private and public keys.

### Key formats

Each cryptographic algorithm requires a set of instance specific parameters to be fed into it for operation. The generalized term used for these set of parameters is called a "Key".

In the case of certificates and keys stored in certificates, there are well defined formats for storing key parameters for every supported cipher suite . 

The generalised ASN.1 Schema for public key storage in a certificate as per TLS 1.2 RFC is :

```
SubjectPublicKeyInfo ::= SEQUENCE {
    algorithm AlgorithmIdentifier,
    publicKey BIT STRING }
```

For example, `ECCDSA` public key is essentially two points in the curve. These points are encoded as an octet string and placed inside the certificate. Section 2.3.4 (OctetString-to-EllipticCurvePoint Conversion) of SEC 1: Elliptic Curve Cryptography V1 spec defines how to decode an octet string representation of the public key (that is generally seen in the certificate) into the curve points (a,b).  

In a sample certificate using this algorithm, the following will appear in the ASN.1 tree: 

```
SEQUENCE
  ObjectIdentifier ecPublicKey (1 2 840 10045 2 1)
  ObjectIdentifier secp256r1 (1 2 840 10045 3 1 7)
  BITSTRING 0004664fca46ef4c681b74760bd89534588794d177252788432e63f8a7d81d287d9e474e5402beb90a75ae4b2759ff35799223e1ff14aa00c7489bb68c21142edccd
```

DER has defined rules for decoding `BIT STRING` which is essentially a padded ASN.1 representation. In this case, it will be decoded into an `octet string` that can further be decoded using the aforementioned SEC 1 spec. 

                
## Parsing a certificate

In the "Server Certificate" stage of TLS handshake, the server presents the "certificate_list" to the client. As per rfc5246 (TLS 1.2), a certificate list is a sequence (chain) of certificates.  The sender's certificate MUST come first in the list.  Each following certificate MUST directly certify the one preceding it. This transmission happens in the ASN.1 schema defined in the rfc and can have up to a maximum of 2^24-1 certificates in the chain.

The root certificate can be omitted as it does not make sense to validate a chain with a root sent in the chain. 



In a pem/crt file, the certificates are generally stored between string tags:

```
-----BEGIN CERTIFICATE-----
<encoded certificate>
-----END CERTIFICATE-----
```

If you look inside a certificate chain file, you can see that there are three distinct certificates 

to decode an ASN1 string, use the following command:

openssl asn1parse -in google.com.pem


