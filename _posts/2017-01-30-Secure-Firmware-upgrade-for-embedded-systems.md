---
title: Secure firmware upgrade for embedded systems
date: 2017-01-30 23:31:19.000000000 +05:30
published: true 
classes: wide
categories:
- Articles
- Tutorial
tags:
- Microcontrollers
- Security
- Upgrade

excerpt: "General principles, architecture, guidelines and good practices for secure over the air (OTA) and over the host (OTH) firmware upgrade for an embedded device"

---
<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
</style>


{% include base_path %}

If you want more clarity on digital certificates before reading this article, please go through previous articles on [digital certificates](/articles/tutorial/introduction-to-digital-certificates){:target="\_blank"} and [X.509 certificates](/articles/tutorial/understanding-X.509-certificate-structure/){:target="\_blank"}
{: .notice--info}

## Introduction

One of the features of connected devices that attract businesses to it is the capability to do a remote device firmware update. However, this is a double edged sword that can open up a range of hostile activities targeting your product if this capability is not carefully architected. This can range from IP theft to bringing down half the internet (ref: IoT DDoS attack on Dyn) to threats to life (like the Jeep hack) and personal information leak. The threat of your product line becoming an army of zombie warriors is no joke.

This entry captures general principles, architecture, guidelines and good practices associated with secure over the air (OTA) and over the host (OTH) firmware upgrade for an embedded device. Final implementation could have device specific adaptations.

Secure firmware upgrade refers to the ability to ensure E2E credibility and integrity of update software being downloaded into a device. 

## Terminology:

- Source: 
  - The origin point of firmware to be upgraded (w.r.t the device). Some examples are: 
    - A host software that can serve an image over interfaces like SPI, UART, USB etc in case of OTH 
    - A server from which the device can “pull” an upgrade image over protocols like HTTP file transfer, FTP etc
    - A web interface (hosted on the device) that accepts a file upload 
    - An SD card or a USB flash drive containing an upgrade image.

- Code protection (CP)
  - The ability of a device to prevent readout of any component of its memory by un-intended parties like a debug probe.

- TPM and hardware firewalls
  - Trusted platform modules are essentially crypto co-processor sub-systems with self-contained memories and processing engines that can execute trusted routines without exposing critical information to untrusted parts of the system.
  - Hardware firewalls enables storage of keys and certificates in special (factory) modes into the system. Once out of the assembly line, these locations will be accessible only to crypto engines and TPMs and information cannot be extracted out of these locations.

- Secure Boot
  - While we are concentrating more on secure transmission and authentication of an image, secure boot is worth mentioning.
  - Secure boot is the process by which a bootloader operating out of a TPM or a read only partition validates the signature of an image from which a device is about to boot from. This will be done every time the device reboots and will ensure that the firmware is un-tampered. 

## Architecture primitives

Assuming a code protected device with appropriate TPMs and memory firewalls, the overall requirements for secure firmware upgrade would include (but not limited to):

- Images should be downloaded from authenticated sources.
  - Source can be a host software (OTH) , a server or a web page for firmware upload (OTA).
- Image source should confirm device identity before allowing download.
- Images transmitted from source to device should be encrypted using a session specific key.
- Images stored in the source should be encrypted using a transport key.
- Images stored in external storage should always be encrypted using a device specific key.
- Downloaded image should be authenticated before being applied to the device.
- Upgrade software (that applies the image) should work in principle of least privilege and should monitor addresses being indicated in the image
  - Eg1: Boot  indicator regions (that indicates whether an image is good to boot) should not be addressed in an image
  - Eg2: Ideally, certificates should never be upgraded OTA/OTH.
    - CRLs can be upgraded OTA/OTH based on business logic.
- Depending on business logic, there can be a provision to write to certificate stores. If this is to be implemented, it should be done by a least privilege, read-only, secure firmware.

What this essentially means is: Once firmware leaves source memory it will always be encrypted using a device specific key until it is applied (flashed) into a code protected device. Additionally, an image will be applied to the device only if it can be authenticated to be from a trusted source.

{% include image.html
	img="/images/posts/sota/loadFlow.png"
	width="480"
	caption="Secure upgrade load flow"
%}

## Caveats

Please keep the following caveats in mind before reading further / implementing a device specific design.

- Public key cryptography is notoriously slow (especially without hardware acceleration). Decrypting an image will consume more resources (time, CPU, mem etc). 
  - If image integrity is the only concern, a digital signature will suffice. 
- Image might have to be split into smaller signed chunks in case of resource constrained systems
  - Eg: in case of a dual panel flash without an external image store , chunks of the image will have to be downloaded into device RAM, decrypted, authenticated and written directly into the device flash before continuing. 
- The whole design (as in TLS and other network security measures) revolves around the following system conditions:
  - The device is capable of storing and operating on an uncompromised chain of trust.
  - Device keys can remain un-exposed and ephemeral keys are used whenever possible.
  - Use of un-compromised crypto algorithms and methodologies. 

## Image source mutual authentication

Mutual authentication refers to the process by which a device and server (/source) validates each other’s identity. The corner stone to this process is PKI and is the same as that used in network based financial transactions.

The first step in this process is for a device to fetch and validate the server’s certificate as part of TLS handshake. Next server requests device certificate as part of the client authentication process of TLS (`CertificateRequest` stage of TLS handshake process).  The client response will contain its certificate as well as a `session signature`. A `session signature` is the encrypted (using device private key) hash of all previous hand shake messages which includes session specific random numbers exchanged between server and client. This signature enables a server to validate that the device is in possession of a private key corresponding to the device certificate and thereby authenticate it. Additionally server checks the certificate validity (whether it was issued to a qualified device) and its usage (whether it is authorized to download images) and should entitle the connection to proceed with firmware access. 

For this reason, devices should have dedicated certificates with securely stored private keys that would never leave device’s TPM area. They are generally generated and stored in the device as part of manufacturing process along with trusted CA chains. 

## Device specific encryption

Data stored in the image store of a device should be encrypted using a device specific key. This is to deter storage of master keys into devices.

As part of mutual authentication, the device’s public key is sent to the server. This can be used to encrypt images that will be sent to the device for storage into an external device like an SD card or flash.  Signature (refer section below) can be a part of the encrypted chunk.

In case of a resource constrained device (read: lower RAM) , firmware will have to be broken into smaller chunks and individually signed and encrypted and then packed into a larger structure that can link the encrypted chunks together.

## Host software and web-upload considerations

Web upload should not be encouraged since the uploaded image should be in clear. This is because it is not practical to store copies of images signed for all possible devices out there and we do not want to use master keys.  However, it can be used in cases where only a signature validation is required for the update process (based on business logic)

Host (e.g. a PC) software should mimic server behavior by performing certificate mutual authentication and image encryption using device specific keys as it is sent to the device.

Images stored within the host software should be encrypted using a transport key so that the firmware is not available in clear within the software package. (It will be available in clear within the host memory while transitioning from transport key to device key). However, there is a risk associated with storing private transport keys as part of the host software package. 

This can be worked around by using an external crypto box with the PC like host or using a host with application level TPM based security (e.g: an update box that can act as the host)  
  
## Signing the firmware and Authentication:
  Digital signature refers to a digital equivalent of hand written signature that can verify the authenticity of a document. From a digital signatures perspective, the document by itself will be in clear test and not encrypted.
  
  Digital Signatures revolves around the following cryptographic capabilities:
  - Ability to create a non-reversible (one-way) and unique message digest (Hash)
  - Ability to implement public key cryptography that can ensure authenticity of a signing certificate 
    - Signer certificate will contain info/details including signer`s public key and signature algorithm and hash function to be used.
    - Signer certificate will be signed by a trusted Root CA that authenticates the holder and integrity of the signer certificate
  
  To sign a firmware blob, a hash of the blob is computed and is then encrypted using signer’s signing (private) key. This encrypted hash is called the `signature`. Signature can be decrypted using the signer’s public key available in the signing certificate to get back the expected hash of the blob. 

{% include image.html
	img="/images/posts/sota/sigVer.png"
	width="520"
	caption="Firmware signature verification"
%}

To verify authenticity of firmware, a hash of the received blob is computed and compared to the decrypted signature. They will match only if contents of the firmware blob are intact as signed.   

### Root keys and signing keys

Since signature verification is a resource intensive process, we could use a weaker but faster signing algorithm as long as we can ensure that algorithm used to sign the signing key (signing certificate) is strong. This is an optimization compromise possibility.

This approach also assists in preventing [rollback attacks](#rollback)

## Secure source of time

One of the requirements in case of a trusted system design is availability of a trusted source of time (and date) to compare the certificate validity (dates) against.  This can either be RTCs with in build batteries or a secure time server or maybe even GPS based time modules for systems of extreme criticality.

## Rollback prevention {#rollback}

To prevent attacks based on rolling back to a compromised firmware version, an image key chain approach can be utilised. In this approach, each update image is signed with a different signer key and the associated signing certificate that can be pulled along with an update image will include an incremental firmware version number or index. If a strong certificate signing algorighm is used, the certificates would be intact. 

Once a certificate is recieved, it should be securely commited to the TPM memory (key chain) and any upgrade request would be processed only if certificate validation using the latest signer keys pass.
