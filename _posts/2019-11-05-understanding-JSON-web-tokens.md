---
title: Understanding JSON Web Tokens 
date: 2019-11-05 16:30:19.000000000 +05:30
published: true
classes: wide
categories:
- Articles
- Tutorial
tags:
- Networking
- Security

excerpt: "JSON Web Tokens (JWT) are becoming popular even outside the traditional web authentication use-cases with the advent of IoT and connected devices. This article gives you a concise overview of JWT and and all that is need to get started with using them"

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

JSON Web Token, or JWT (“jot”) for short, is a standard for safely passing claims securely in memory constrained environment. It is part of the JSON Object Signing and Encryption group (JOSE) set of standards. 

**Usecase**: For instance upon logging into a server initially using a user name and password, the server can provide a JWT to be used for subsequent requests for a defined period of time. The users authorizations and claims can be encoded into the JWT itself. This is especially useful for stateless systems like HTTPS requests. In this case, JWT will use JSON web signature (JWS) and optionally JSON web encryption (JWE) from JOSE along with JWT itself. 

## Intro to basic JWT

Basic structure of a JWT is HEADER.PAYLOAD.SIG/ENC where: 
-	`HEADER` and `PAYLOAD` are the `base64url` encoded form of the flattened JSON header and payload.

	`{"alg":"HS256","typ":"JWT"}`
-	Header defines the basic type and algorithm used in the token. Payload is application defined. 

	`{"sub":"1234567890","name":"John Doe","admin":true}`
-	`SIG/ENC` is the optional signature and/or encryption info. We will investigate this in detail below. 

A typical JWT in the encoded and decoded form is given below. In this case, the `SIG/ENC` part is omitted.

{% include image.html
	img="/images/posts/JWT-Intro/basicDecode.png"
	width="480"
	caption="basic JWT decoded"
%}

The `JOSE` header in the JWT contains claims about itself. It provides indicators on how rest of the token is encoded and signed. In the case above, the header mentions that the token uses HS256 for signature. Spec provides provisions for a type (`typ`) and content type (`cty`) headers. But these are rarely used. An unsecure JWT will look like the one below. Note that the trailing `.` represents an empty signature part. Though the trailing `=` is present in the PAYLOAD in this case, it is typically removed. 

{% include image.html
	img="/images/posts/JWT-Intro/unsecure.png"
	width="480"
	caption="unsecure JWT example"
%}

PAYLOAD typically contains user `claims`. But this is not defined by the spec beyond the fact that it should be valid JSON. However, following items are registered claims as per the spec and they have special meaning

-	`iss` : a case sensitive URI or string that uniquely identifies the JWT issuer.
-	`sub` : a  case sensitive URI or string that uniquely identifies the party about which the JWT carries info.
-	`aud` : an array of intended audience for the JWT
-	`exp`: expiration epoch time 
-	`nbf`: epoch time “not before” which the JWT is valid
-	`iat`: “ issued at “ time. 
-	`jti`: a unique JWT ID

Beyond these, users can use either public or private claims. Public claims are registered with IANA JSON Web Token `Claimsregistry` to avoid collisions. Private claims are specific to the use-case. 

## JSON web Signatures (JWS)

A signature is required to cryptographically establish the authenticity of a JWT. Algorithms used for signature are designated identifiers in the JSON Web Algorithms (JWA) spec (`RFC 7518`). For instance HMAC using `SHA-256`, called `HS256` in the JWA spec. 

For beginners HMAC is an algorithm that accepts a hash algorithm, an octet input and a secret and generate an octet output using the HMAC algorithm. Typically HMAC in the JWT context uses a shared secret. 

The process of attaching a signature to an unsecure JWT is given below: 

{% include image.html
	img="/images/posts/JWT-Intro/sigAdd.png"
	width="480"
	caption="Signing Process of JWT"
%}

JWS would require the HEADER to carry more claims to assist the signature validation. Major ones  include:

-	`jku` : URI pointing to a set of JSON encoded public keys that can be used to verify the signature. 
-	`jwk` : JSON web key used to sign the JWT. More on JWK in the next section
-	`kid`: a unique , user defined identifier representing the key
-	`x5u`: URL pointing to the X.509 cert chain used to sign the JWT
-	`x5c`: JSON array of Base64 encoded DER format cert chain used to sign the JWT
-	`x5t`: SHA-1 thumbprint of the X.509 cert used to sign the JWT
-	`x5t#S256`: like x5t, but uses SHA256

JWS spec defines an alternate way to represent secure tokens. While the `HEADER.PAYLOAD` format is called the compact form, the following is a non-compact form called JWS JSON Serialization form.

In JWS JSON Serialization form, a signed JWT is represented in a printable JSON format. This allows multiple signatures to be present for the same payload. Consequently, the structure is defined as:

-	The top most JSON object will include the following key value pairs
    - payload: Base64 encoded string of the actual JWT payload object.
    - signatures: an array of JSON objects carrying the signatures. These objects are defined below.
-	Signature array contains:
    - protected: a Base64 encoded string of the JWS header. Claims contained in this header are protected by the signature. This header is required only if there are no unprotected headers. If unprotected headers are present, then this header may or may not be present.
    - header: a JSON object containing header claims. This header is unprotected by the signature. If no protected header is present, then this element is mandatory. If a protected header is present, then this element is optional.
	- signature: A Base64 encoded string of the JWS signature

A sample is given below:
```json
{
  "payload": "eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ",
  "signatures": [
    {
      "protected": "eyJhbGciOiJSUzI1NiJ9",
      "header": {
        "kid": "2010-12-29"
      },
      "signature": "cC4hiUPoj9Eetdgtv3hF80EGrhuB__dzERat0XF9g2VtQgr9PJbu3XOiZj5RZmh7AAuHIm4Bh"
    },
    {
      "protected": "eyJhbGciOiJFUzI1NiJ9",
      "header": {
        "kid": "e9bc097a-ce51-4036-9562-d2ade882db0d"
      },
      "signature": "DtEhU3ljbEg8L38VWAfUAqOyKAM6-Xx-F4GawxaepmXFCgfTjDxw5djxLa8ISlSApmWQxfKTUJqPP3-Kg6NU1Q"
    }
  ]
}
```

In a visual representation, this looks like:

{% include image.html
	img="/images/posts/JWT-Intro/noncompactTree.png"
	width="480"
	caption="JWS JSON Serialization form"
%}

JWS JSON serialization defines a simplified form for JWTs with only a single signature. This form is known as flattened JWS JSON serialization. Flattened serialization removes the signatures array and puts the elements of a single signature at the same level as the payload element.

## JSON Web Encryption (JWE)

While JWS provides only data integrity and authenticity checks, JWE adds confidentiality to the equation. However, unless special algorithms are used, JWE guarantees only confidentiality. Therefore, in an asymmetric scheme, JWE and JWS are complementary to each other. 

Encrypted JWE has a different compact representation when compared to a regular (signed) JWT. JWE Compact Serialization has five elements. As in the case of JWS, these base64 encoded elements are separated by dots. These elements are:

1.	protected header: a header analogous to the JWS header. Contains info required to process the JWT. 
2.	Encrypted key: Key used to encrypt data in the token . This key is encrypted with a key specified by the user. 
3.	Initialization vector: IV sued by the crypto algorithm
4.	Encrypted data: actual data being encrypted
5.	Auth tag: algorithm generated data for validation

In addition to compact serialization, JWE also defines a non-compact and flattened JSON representation. 

## JSON Web Keys (JWK) 

Even though there are existing specifications talking about how keys can be represented, JOSE includes a unified representation for all keys supported in JWA spec. 

A sample JWK:

```json
{
    "kty": "EC",
    "crv": "P-256",
    "x": "MKBCTNIcKUSDii11ySs3526iDZ8AiTo7Tu6KPAqv7D4",
    "y": "4Etl6SRW2YiLUrN5vfvVHuhp7x8PxltmWWlbbM4IFyM",
    "d": "870MB6gfuTJ4HtUnUvYMyJpr5eUZNP4Bk43bVdj3eAE",
    "use": "enc",
    "kid": "1"
}
```

### Reference

- [RFC7515 - JSON Web Signature](https://tools.ietf.org/html/rfc7515)
- [RFC7516 - JSON Web Encryption](https://tools.ietf.org/html/rfc7516)
- [Registered JOSE Headers](https://www.iana.org/assignments/jose/jose.xhtml)
- [jwt.io](https://jwt.io/)
- The JWT Handbook by Sebastián E. Peyrott, Auth0 Inc.
