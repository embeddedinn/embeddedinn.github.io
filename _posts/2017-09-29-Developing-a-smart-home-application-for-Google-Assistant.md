---
title: Developing a smart home application for Google Assistant 
date: 2017-09-29 22:36:19.000000000 +05:30
published: true 
categories:
- Articles
- Tutorial
tags:
- AWS
- Google Home
- IoT
- Smart Home
- MQTT

excerpt: "Steps to create a smart home agent for Google Home / Google Assistant to control smart home devices in AWS IoT"

---
<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
</style>


{% include base_path %}

## Introduction

Last time, I wrote about developing a smart home skill for Alexa. (It is available [here](https://embeddedinn.github.io/articles/tutorial/Developing-an-Alexa-Smart-Home-Skill/){:target="\_blank"} in case you missed it). Now let us look at how Google smart home controls can be integrated into this ecosystem.

Google Assistant is the Alexa equivalent from Google. While Alexa is available through a variety of Echo devices and AVS apps, Google Assistant is available in almost all new Android devices as well as through Google Home - a voice activated speaker from Google. In this tutorial, we will look at how to build a back end to control smart home devices using Google Assistant. Since I have already build up a "Device cloud" using AWS IoT as the back end for my previous Alexa experiments, I will e trying to integrate Google Assistant control into that as an additional control plane instead of building a totally new device back end. 

At this stage the code written for this is a proof of concept and many of the parameters are hardcoded. However, there will be incremental improvements made to this code. 

Current state of this integration can be seen in the demo video below: 

<iframe width="400" height="300" src="https://www.youtube.com/embed/8-dpjcHPMdk" frameborder="0" allowfullscreen></iframe>


## Terminology

First, let us get used to some of the standard terminology that will be used in this article. These are terms that you will be seeing frequently in official Google documentation as well.

- Actions are Google equivalents of Alexa skills. Actions lets developers build additional capabilities that add on to existing capabilities of Google Assistant. Currently there are two ways to build actions - api.ai and Actions SDK. Currently, smart home development iis not supported in api.ai
- api.ai is a web based application that can be used to develop basic actions without writing code. Using UI based development flow, an action can be built, linked to a Google account and activated in all Google Assistant enabled devices linked to that account. 
- An Action Package is a JSON file that describes the characteristics, capabilities and fulfilment mechanisms of an action. In case of api.ai based flow, a developer need not generate this file whereas it needs to be hand coded for SDK based flow. Though this flow is a bit more complex, it gives more flexibility to the developer and is the only flow currently supported for smart home actions development. 
- A Fulfillment is an HTTP based back end that will be invoked by Google Assistant when a request is placed to an action. Request details are passed on in JSON format as part of a POST request to the HTTP endpoint (webhook) and response is expected in JSON format. 

There are some more minor terms and they will be covered as part of the rest of this article. 

## Google Assistant smart home flow

Unlike general actions that can be invoked from Assistant without any setup stage, smart home actions requires the user to perform account linking to specific device vendor actions so that the user specific devices can be reported to Google Assistant by the corresponding actions. For this, the user needs to select the device provider's action from a list of published smart home actions and login to it and it is very much similar to Alexa account linking.

Once account linked, devices from all vendors will be visible in Google Home app under the smart home tab and each device can be assigned to rooms in the house. This is because once devices are reported by different actions, google stores the information in an internal "Home Graph" and is frequently refreshed. Devices will be presented using a real name and nickname that can be used to "talk" to the device via assistant. 

When a device is to be controlled talk to Google Assistant asking for the action to be performed and the device to perform it on. E.g. OK Google, switch on the kitchen-light

## Smart home actions development

We will first create a webhook API to handle our smart home requests and then use it in an action package that will be uploaded into actions console. I decided to use a combination of AWS Lambda and AWS API to build this since this would integrate well with my existing AWS IoT based device back end. 

### Building a device control API

First step in this process is to build an AWS Lambda function. I chose to build a lambda in `eu-west-1` region as a user with the following permissions:

- AWSLambdaFullAccess 
- IAMFullAccess 
- AmazonAPIGatewayAdministrator 
- AWSIoTFullAccess 

My lambda has a role with the following permissions:

-  CloudWatchLogsFullAccess 
-  AWSIoTFullAccess 

The code for this function can be accessed [here](https://raw.githubusercontent.com/vppillai/VoiceServiceLambdas/master/GoogleAssistant-Smarthome/AlexaIntegration-onOff/lambdaFunction.js){:target="\_blank"}. However, it has many parameters hard coded and is currently just a reference proof of concept. As with the Alexa skill, I have two of the below environment variables set to communicate with AwsIoT and discover my devices. 

- thingTypeName : HouseholdDevices
- region : eu-west-1

While creating the lambda, I did not setup any triggers since we will be doing this from the API console later. 

To make sure that my lambda is working as expected, I use the following test trigger. (However, I did not test this when there are no devices populated in AWS IoT)

Execution Trigger: 

```json
{
  "inputs": [{
    "intent": "action.devices.EXECUTE",
      "payload": {
        "commands": [{
          "devices": [{
            "id": "KitchenLight1"
          },
          {
            "id": "PorchLight1"
          }
          ],
          "execution": [{
            "command": "action.devices.commands.OnOff",
            "params": {
              "on": true
            }
          }]
        }]
      }
  }],
    "requestId": "13973399895754995660"
}
```

Now that this lambda has been built and tested, we can build an API around it. For this, head to the Amazon API console and click create API. Give an API name and select "New API" before clicking "Create API".

Under `Actions`, click Create resource and name it `DeviceControl` and click create resource. Now click `create method` under `actions` and select `post` from the drop down menu. Once you click the tick mark next to the selected method, we can now choose the lambda to be linked to this resource method. Select `eu-west-1` region and select the lambda function that we just created. (You will be presented a list once you start typing the lambda name). Click save and accept the permissions prompt. 

Now to make this API useable, we need to deploy it under a stage. To do this, click `Actions` and select `Deploy API`. Enter a deployment stage name (e.g. beta) and click `Deploy`. Now, Navigate to the `POST` method in this deployed API and copy the `Invoke URL`. This is what we will be entering into our action package in the next stage. 

> Some header mappings needs to be performed to pass on information like authorization token to handle user identification. However, we are skipping it here since we are implementing a test app that will be linked to only one account. 

### Understanding the lambda code

Google actions for smart home has just three intents that needs to be handled by the webhook. These are:

- action.devices.SYNC
- action.devices.EXECUTE
- action.devices.QUERY 

`SYNC` is used to discover devices, `EXECUTE` for controlling device states and `QUERY` for fetching device states. 

When a `SYNC` is received, the lambda function queries for all devices of type `householdDevices` to AWSIoT back end and populates the returned information into the JSON response. This will be stored in google home graph by actions. 

The `EXECUTE` intent can be quiet elaborate with a set of packed instructions for a combination of devices. This is to support controlling multiple devices with a single command like "OK google, turn off all lights". This is the sample used in our lambda test trigger. 

Though `QUERY` is mandatory, the current implementation above does not implement it yet. 

### Linking the back-end to Actions 

Now that we have a back-end API to control our smart home devices using JSON based POSTs in formats prescribed bu Google Actions, we can go ahead with writing an actions package. Unlike generic actions, smart home action packages are rather simple and is indented for two main purposes 

1. To indicate to the actions project that this is a smart home action
1. Provide the fulfillment webhook endpoint address 

An action package for this purpose would look lihe :

```json

{
  "actions": [{
    "name": "actions.devices",
      "deviceControl": {
      },
      "fulfillment": {
        "conversationName": "automation"
      }
  }],
    "conversations": {
      "automation" :
      {
        "name": "automation",
        "url": "<webhookEndpoint>"
      }
    }
}

```

`actions.devices` indicates that this is a smart home skill and `WebhookEndpoint` is the fulfillment endpoint that needs to be replaced with the API Invocation URL that we just created. 

To get this into actions console, first navigate to [actions console](https://console.actions.google.com/){:target="\_blank"} and click `Add/Import Project`. After giving a project name and selecting the country a blank project can be created. This is a common starting point for all actions project and here select actions SDK from the first section. The `update app` section in the pop-up will give the required command to upload our action package into actions console. 

Before this can be done, you need to download [gactions CLI](https://developers.google.com/actions/tools/gactions-cli){:target="\_blank"} for your platform of choice. This is a single file that does not need any installation and can be used form command line. 

Store the above JSON in a file (e.g. action.json) in the same folder as that of the downloaded CLI and run the command that was copied from actions console pop-up. In my case it was 

```
./gactions update --action_package action.json --project blogtestproject-e815f
```

During this step, you will be prompted to visit an oauth2 page and present the authorization code after providing required permissions. You should use the same account to which your Assistant enabled devices are linked to. Once this is done, the action package will uploaded to your project and we can continue with a test deployment. 


Go back to actions console web page and add some of the app informations like name and pronunciation, description etc. these are not too crucial at this stage since this app is going to be for personal test use. However, they need to comply with google standards if it is to be published. 


### Account Linking

Account linking is mandatory for home control apps since it is the only way for the app backend to identify a user trying to access and control devices. For this, we will be using `login with amazon` as we did for the Alexa smart home skill. 

Log on to [Amazon developer console](https://developer.amazon.com/){:target="\_blank"} and click on `Login with Amazon` under `Apps & services` and create a new security profile. Make a note of the client ID and secret. Now, go to the web settings of this profile and add the following URL under `Allowed Return URLs`. (replace<ActionsProjectName> with your project name from actions console.)

```
https://oauth-redirect.googleusercontent.com/r/<ActionsProjectName>
```

Go back to Actions Console and click `Add` under account linking. Select `Implicit` as grand type and click `Next`. Enter `ClientId` from the security profile in previous step (from Amazon) and enter the Authorization URL as https://www.amazon.com/ap/oa. Add `profile` as scope and complete this step. Since this app is not going to be published, enter some dummy test instructions.

Now the actions app is ready for testing. So, click `Test Draft`

## Testing the smart home app

Once the actions draft has been deployed for testing, go to the Google Home app in your smart phone and navigate to Home Control. Click the `+` sign and click on the app that we just deployed for testing. (It will have a [test] prefix to its name). Once clicked, you will be re-directed to the Amazon login page and once account linking is complete, the smart home devices in our AWSIoT console with type 'householdDevices' will be listed in the app. Now, we are ready for testing as seen in the introductory video. 
