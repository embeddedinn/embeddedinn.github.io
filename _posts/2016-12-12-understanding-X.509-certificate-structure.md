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

Essentially ASN.1 DER encoding is a tag, length, value encoding system for each element in the certificate. 

### Base64 encoding

Base64 is an encoding scheme used to represent binary data as an ASCII string using radix64 (just like binary representation uses radix2). Characters chosen to represent encoding depends on the standard used . For example, MIME uses `A-Z`, `a-z` , `0-9` and `+/`. 

There are well deifined methods to handle corner cases and there are variants (like URL safe Base64) to handle different scenarios. 

### Privacy Enhanced Mail format (PEM)

Though the e-mail securing proposal in PEM was not a success, the certificate and key encoding format described by PEM is one of the most widely used for certificate storage and transmission. PEM files are used for storage of single certificates, complete certificate chain or just keys. 

Essentially PEM is a BASE64 encoded DER file. 

### Key identifiers

X.509 PKI certificate format defines some methods to generate unique identifiers for a public key. This is especially useful to identify the relevant keys when a CA has multiple active Public keys that can be used to sign certificates. These IDs appear in two forms in a certificate as part of certificate extensions.

- authorityKeyIdentifier - key ID of the CA public key used to sign the certificate.
- subjectKeyIdentifier - key ID of the public key present in the certificate. This is a mandatory field for a certificate marked as `CA`

Two recommended methods for generating unique key IDs from public keys as per the x.509 RFC are:

- compute the 160 bit SHA-1 hash of the BIT STRING value of subjectPublicKey (excluding tag and length)
- type indicator `0100` followed by least significant 60 bits of subjectPublicKey (excluding tag and length)

other methods of generating unique IDs can also be used. 

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

In the "Server Certificate" stage of TLS handshake, the server presents a "certificate_list" to the client. As per rfc5246 (TLS 1.2), a certificate list is a sequence (chain) of certificates.  The sender's certificate MUST come first in the list.  Each following certificate MUST directly certify the one preceding it. This chain transmission happens in  ASN.1 schema defined in the rfc and can have up to a maximum of 2^24-1 certificates in the chain.

The root certificate can be omitted as it does not make sense to validate a chain with a root sent in the chain. 

When exported, certificates are generally stored between string tags:

```
-----BEGIN CERTIFICATE-----
<encoded certificate>
-----END CERTIFICATE-----
```

We will use the certificate of `https://example.com` to understand the basic structure of an X.509 certificate. 

Execute the following command to fetch the certificate chain:

`openssl s_client -showcerts -connect www.example.com:443 </dev/null`

This will show the servers certificate as well as the intermediate CAs certificate . We will focus on the first certificate (server certificate) for this exercise

The certificate contents is :

```
-----BEGIN CERTIFICATE-----
MIIF8jCCBNqgAwIBAgIQDmTF+8I2reFLFyrrQceMsDANBgkqhkiG9w0BAQsFADBw
MQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3
d3cuZGlnaWNlcnQuY29tMS8wLQYDVQQDEyZEaWdpQ2VydCBTSEEyIEhpZ2ggQXNz
dXJhbmNlIFNlcnZlciBDQTAeFw0xNTExMDMwMDAwMDBaFw0xODExMjgxMjAwMDBa
MIGlMQswCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEUMBIGA1UEBxML
TG9zIEFuZ2VsZXMxPDA6BgNVBAoTM0ludGVybmV0IENvcnBvcmF0aW9uIGZvciBB
c3NpZ25lZCBOYW1lcyBhbmQgTnVtYmVyczETMBEGA1UECxMKVGVjaG5vbG9neTEY
MBYGA1UEAxMPd3d3LmV4YW1wbGUub3JnMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A
MIIBCgKCAQEAs0CWL2FjPiXBl61lRfvvE0KzLJmG9LWAC3bcBjgsH6NiVVo2dt6u
Xfzi5bTm7F3K7srfUBYkLO78mraM9qizrHoIeyofrV/n+pZZJauQsPjCPxMEJnRo
D8Z4KpWKX0LyDu1SputoI4nlQ/htEhtiQnuoBfNZxF7WxcxGwEsZuS1KcXIkHl5V
RJOreKFHTaXcB1qcZ/QRaBIv0yhxvK1yBTwWddT4cli6GfHcCe3xGMaSL328Fgs3
jYrvG29PueB6VJi/tbbPu6qTfwp/H1brqdjh29U52Bhb0fJkM9DWxCP/Cattcc7a
z8EXnCO+LK8vkhw/kAiJWPKx4RBvgy73nwIDAQABo4ICUDCCAkwwHwYDVR0jBBgw
FoAUUWj/kK8CB3U8zNllZGKiErhZcjswHQYDVR0OBBYEFKZPYB4fLdHn8SOgKpUW
5Oia6m5IMIGBBgNVHREEejB4gg93d3cuZXhhbXBsZS5vcmeCC2V4YW1wbGUuY29t
ggtleGFtcGxlLmVkdYILZXhhbXBsZS5uZXSCC2V4YW1wbGUub3Jngg93d3cuZXhh
bXBsZS5jb22CD3d3dy5leGFtcGxlLmVkdYIPd3d3LmV4YW1wbGUubmV0MA4GA1Ud
DwEB/wQEAwIFoDAdBgNVHSUEFjAUBggrBgEFBQcDAQYIKwYBBQUHAwIwdQYDVR0f
BG4wbDA0oDKgMIYuaHR0cDovL2NybDMuZGlnaWNlcnQuY29tL3NoYTItaGEtc2Vy
dmVyLWc0LmNybDA0oDKgMIYuaHR0cDovL2NybDQuZGlnaWNlcnQuY29tL3NoYTIt
aGEtc2VydmVyLWc0LmNybDBMBgNVHSAERTBDMDcGCWCGSAGG/WwBATAqMCgGCCsG
AQUFBwIBFhxodHRwczovL3d3dy5kaWdpY2VydC5jb20vQ1BTMAgGBmeBDAECAjCB
gwYIKwYBBQUHAQEEdzB1MCQGCCsGAQUFBzABhhhodHRwOi8vb2NzcC5kaWdpY2Vy
dC5jb20wTQYIKwYBBQUHMAKGQWh0dHA6Ly9jYWNlcnRzLmRpZ2ljZXJ0LmNvbS9E
aWdpQ2VydFNIQTJIaWdoQXNzdXJhbmNlU2VydmVyQ0EuY3J0MAwGA1UdEwEB/wQC
MAAwDQYJKoZIhvcNAQELBQADggEBAISomhGn2L0LJn5SJHuyVZ3qMIlRCIdvqe0Q
6ls+C8ctRwRO3UU3x8q8OH+2ahxlQmpzdC5al4XQzJLiLjiJ2Q1p+hub8MFiMmVP
PZjb2tZm2ipWVuMRM+zgpRVM6nVJ9F3vFfUSHOb4/JsEIUvPY+d8/Krc+kPQwLvy
ieqRbcuFjmqfyPmUv1U9QoI4TQikpw7TZU0zYZANP4C/gj4Ry48/znmUaRvy2kvI
l7gRQ21qJTK5suoiYoYNo3J9T+pXPGU7Lydz/HwW+w0DpArtAaukI8aNX4ohFUKS
wDSiIIWIWJiJGbEeIO0TIFwEVWTOnbNl/faPXpk5IRXicapqiII=
-----END CERTIFICATE-----
```

This is in base64 encoded format. This can be decoded into the follwoing hex string:

```
308205f2308204daa00302010202100e64c5fbc236ade14b172aeb41c78cb0300d06092a864886f70d01010b05003070310b300906035504061302555331153013060355040a130c446967694365727420496e6331193017060355040b13107777772e64696769636572742e636f6d312f302d06035504031326446967694365727420534841322048696768204173737572616e636520536572766572204341301e170d3135313130333030303030305a170d3138313132383132303030305a3081a5310b3009060355040613025553311330110603550408130a43616c69666f726e6961311430120603550407130b4c6f7320416e67656c6573313c303a060355040a1333496e7465726e657420436f72706f726174696f6e20666f722041737369676e6564204e616d657320616e64204e756d6265727331133011060355040b130a546563686e6f6c6f6779311830160603550403130f7777772e6578616d706c652e6f726730820122300d06092a864886f70d01010105000382010f003082010a0282010100b340962f61633e25c197ad6545fbef1342b32c9986f4b5800b76dc06382c1fa362555a3676deae5dfce2e5b4e6ec5dcaeecadf5016242ceefc9ab68cf6a8b3ac7a087b2a1fad5fe7fa965925ab90b0f8c23f13042674680fc6782a958a5f42f20eed52a6eb682389e543f86d121b62427ba805f359c45ed6c5cc46c04b19b92d4a7172241e5e554493ab78a1474da5dc075a9c67f41168122fd32871bcad72053c1675d4f87258ba19f1dc09edf118c6922f7dbc160b378d8aef1b6f4fb9e07a5498bfb5b6cfbbaa937f0a7f1f56eba9d8e1dbd539d8185bd1f26433d0d6c423ff09ab6d71cedacfc1179c23be2caf2f921c3f90088958f2b1e1106f832ef79f0203010001a38202503082024c301f0603551d230418301680145168ff90af0207753cccd9656462a212b859723b301d0603551d0e04160414a64f601e1f2dd1e7f123a02a9516e4e89aea6e483081810603551d11047a3078820f7777772e6578616d706c652e6f7267820b6578616d706c652e636f6d820b6578616d706c652e656475820b6578616d706c652e6e6574820b6578616d706c652e6f7267820f7777772e6578616d706c652e636f6d820f7777772e6578616d706c652e656475820f7777772e6578616d706c652e6e6574300e0603551d0f0101ff0404030205a0301d0603551d250416301406082b0601050507030106082b0601050507030230750603551d1f046e306c3034a032a030862e687474703a2f2f63726c332e64696769636572742e636f6d2f736861322d68612d7365727665722d67342e63726c3034a032a030862e687474703a2f2f63726c342e64696769636572742e636f6d2f736861322d68612d7365727665722d67342e63726c304c0603551d2004453043303706096086480186fd6c0101302a302806082b06010505070201161c68747470733a2f2f7777772e64696769636572742e636f6d2f4350533008060667810c01020230818306082b0601050507010104773075302406082b060105050730018618687474703a2f2f6f6373702e64696769636572742e636f6d304d06082b060105050730028641687474703a2f2f636163657274732e64696769636572742e636f6d2f446967694365727453484132486967684173737572616e636553657276657243412e637274300c0603551d130101ff04023000300d06092a864886f70d01010b0500038201010084a89a11a7d8bd0b267e52247bb2559dea30895108876fa9ed10ea5b3e0bc72d47044edd4537c7cabc387fb66a1c65426a73742e5a9785d0cc92e22e3889d90d69fa1b9bf0c16232654f3d98dbdad666da2a5656e31133ece0a5154cea7549f45def15f5121ce6f8fc9b04214bcf63e77cfcaadcfa43d0c0bbf289ea916dcb858e6a9fc8f994bf553d4282384d08a4a70ed3654d3361900d3f80bf823e11cb8f3fce7994691bf2da4bc897b811436d6a2532b9b2ea2262860da3727d4fea573c653b2f2773fc7c16fb0d03a40aed01aba423c68d5f8a21154292c034a220858858988919b11e20ed13205c045564ce9db365fdf68f5e99392115e271aa6a8882
```

When this is passed through an ASN.1 decoder, we get the following tree:

```
SEQUENCE
  SEQUENCE
	[0]
	  INTEGER 02
	INTEGER 0e64c5fbc236ade14b172aeb41c78cb0
	SEQUENCE
	  ObjectIdentifier SHA256withRSA (1 2 840 113549 1 1 11)
	  NULL
	SEQUENCE
	  SET
		SEQUENCE
		  ObjectIdentifier countryName (2 5 4 6)
		  PrintableString 'US'
	  SET
		SEQUENCE
		  ObjectIdentifier organization (2 5 4 10)
		  PrintableString 'DigiCert Inc'
	  SET
		SEQUENCE
		  ObjectIdentifier organizationalUnit (2 5 4 11)
		  PrintableString 'www.digicert.com'
	  SET
		SEQUENCE
		  ObjectIdentifier commonName (2 5 4 3)
		  PrintableString 'DigiCert SHA2 High Assurance Server CA'
	SEQUENCE
	  UTCTime 151103000000Z
	  UTCTime 181128120000Z
	SEQUENCE
	  SET
		SEQUENCE
		  ObjectIdentifier countryName (2 5 4 6)
		  PrintableString 'US'
	  SET
		SEQUENCE
		  ObjectIdentifier stateOrProvinceName (2 5 4 8)
		  PrintableString 'California'
	  SET
		SEQUENCE
		  ObjectIdentifier locality (2 5 4 7)
		  PrintableString 'Los Angeles'
	  SET
		SEQUENCE
		  ObjectIdentifier organization (2 5 4 10)
		  PrintableString 'Internet Corporation for Assigned Names and Numbers'
	  SET
		SEQUENCE
		  ObjectIdentifier organizationalUnit (2 5 4 11)
		  PrintableString 'Technology'
	  SET
		SEQUENCE
		  ObjectIdentifier commonName (2 5 4 3)
		  PrintableString 'www.example.org'
	SEQUENCE
	  SEQUENCE
		ObjectIdentifier rsaEncryption (1 2 840 113549 1 1 1)
		NULL
	  BITSTRING 003082010a0282010100b340962f61633e25c197ad6545fbef1342b32c9986f4b5800b76dc06382c1fa362555a3676deae5dfce2e5b4e6ec5dcaeecadf5016242ceefc9ab68cf6a8b3ac7a087b2a1fad5fe7fa965925ab90b0f8c23f13042674680fc6782a958a5f42f20eed52a6eb682389e543f86d121b62427ba805f359c45ed6c5cc46c04b19b92d4a7172241e5e554493ab78a1474da5dc075a9c67f41168122fd32871bcad72053c1675d4f87258ba19f1dc09edf118c6922f7dbc160b378d8aef1b6f4fb9e07a5498bfb5b6cfbbaa937f0a7f1f56eba9d8e1dbd539d8185bd1f26433d0d6c423ff09ab6d71cedacfc1179c23be2caf2f921c3f90088958f2b1e1106f832ef79f0203010001
	[3]
	  SEQUENCE
		SEQUENCE
		  ObjectIdentifier authorityKeyIdentifier (2 5 29 35)
		  OCTETSTRING, encapsulates
			SEQUENCE
			  [0] 5168ff90af0207753cccd9656462a212b859723b
		SEQUENCE
		  ObjectIdentifier subjectKeyIdentifier (2 5 29 14)
		  OCTETSTRING, encapsulates
			OCTETSTRING a64f601e1f2dd1e7f123a02a9516e4e89aea6e48
		SEQUENCE
		  ObjectIdentifier subjectAltName (2 5 29 17)
		  OCTETSTRING, encapsulates
			SEQUENCE
			  [2] www.example.org
			  [2] example.com
			  [2] example.edu
			  [2] example.net
			  [2] example.org
			  [2] www.example.com
			  [2] www.example.edu
			  [2] www.example.net
		SEQUENCE
		  ObjectIdentifier keyUsage (2 5 29 15)
		  BOOLEAN TRUE
		  OCTETSTRING, encapsulates
			BITSTRING 05a0
		SEQUENCE
		  ObjectIdentifier extKeyUsage (2 5 29 37)
		  OCTETSTRING, encapsulates
			SEQUENCE
			  ObjectIdentifier serverAuth (1 3 6 1 5 5 7 3 1)
			  ObjectIdentifier clientAuth (1 3 6 1 5 5 7 3 2)
		SEQUENCE
		  ObjectIdentifier cRLDistributionPoints (2 5 29 31)
		  OCTETSTRING, encapsulates
			SEQUENCE
			  SEQUENCE
				[0]
				  [0]
					[6] http://crl3.digicert.com/sha2-ha-server-g4.crl
			  SEQUENCE
				[0]
				  [0]
					[6] http://crl4.digicert.com/sha2-ha-server-g4.crl
		SEQUENCE
		  ObjectIdentifier certificatePolicies (2 5 29 32)
		  OCTETSTRING, encapsulates
			SEQUENCE
			  SEQUENCE
				ObjectIdentifier (2 16 840 1 114412 1 1)
				SEQUENCE
				  SEQUENCE
					ObjectIdentifier (1 3 6 1 5 5 7 2 1)
					IA5String 'https://www.digicert.com/CPS'
			  SEQUENCE
				ObjectIdentifier (2 23 140 1 2 2)
		SEQUENCE
		  ObjectIdentifier authorityInfoAccess (1 3 6 1 5 5 7 1 1)
		  OCTETSTRING, encapsulates
			SEQUENCE
			  SEQUENCE
				ObjectIdentifier (1 3 6 1 5 5 7 48 1)
				[6] http://ocsp.digicert.com
			  SEQUENCE
				ObjectIdentifier (1 3 6 1 5 5 7 48 2)
				[6] http://cacerts.digicert.com/DigiCertSHA2HighAssuranceServerCA.crt
		SEQUENCE
		  ObjectIdentifier basicConstraints (2 5 29 19)
		  BOOLEAN TRUE
		  OCTETSTRING, encapsulates
			SEQUENCE {}
  SEQUENCE
	ObjectIdentifier SHA256withRSA (1 2 840 113549 1 1 11)
	NULL
  BITSTRING 0084a89a11a7d8bd0b267e52247bb2559dea30895108876fa9ed10ea5b3e0bc72d47044edd4537c7cabc387fb66a1c65426a73742e5a9785d0cc92e22e3889d90d69fa1b9bf0c16232654f3d98dbdad666da2a5656e31133ece0a5154cea7549f45def15f5121ce6f8fc9b04214bcf63e77cfcaadcfa43d0c0bbf289ea916dcb858e6a9fc8f994bf553d4282384d08a4a70ed3654d3361900d3f80bf823e11cb8f3fce7994691bf2da4bc897b811436d6a2532b9b2ea2262860da3727d4fea573c653b2f2773fc7c16fb0d03a40aed01aba423c68d5f8a21154292c034a220858858988919b11e20ed13205c045564ce9db365fdf68f5e99392115e271aa6a8882
```

The basic tree structure and relevent information in this tree are:

```
 
TLS version (02 for V03)
Serial Number (0e64c5fbc236ade14b172aeb41c78cb0)
Certificate signature Algorithm (SHA256withRSA)
Issuer
	countryName [CN] - (US)
	organization [O] - (DigiCert Inc)
	organizationalUnit [O] - (www.digicert.com)
	commonName [CN] - (DigiCert SHA2 High Assurance Server CA)
Validity
	notBefore (151103000000Z -Tuesday, November 03, 2015 5:30:00 AM)
	notAfter (181128120000Z -  Wednesday, November 28, 2018 5:30:00 PM)
Subject
	countryName [C] - (US)
	stateOrProvinceName [ST] - (California)
	locality [L] - (Los Angeles)
	organization [O] - (Internet Corporation for Assigned Names and Numbers)
    organizationalUnit [OU] - (Technology)
	commonName [CN] - (www.example.org)
SubjectPublicKeyInfo
	Subject Public Key Algorithm - (rsaEncryption)
	Subject Public Key - (represented as BITSTRING)
Extensions
	AuthorityKeyIdentifier  - (5168ff90af0207753cccd9656462a212b859723b)
	subjectKeyIdentifier  -  (a64f601e1f2dd1e7f123a02a9516e4e89aea6e48)
	
```

to decode an ASN1 string, use the following command:

openssl asn1parse -in google.com.pem


