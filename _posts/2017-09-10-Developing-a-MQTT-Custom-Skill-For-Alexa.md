---
title: Developing a MQTT Custom Skill for Alexa 
date: 2017-09-10 19:55:19.000000000 +05:30
published: false 
categories:
- Articles
- Tutorial
tags:
- AWS
- Alexa
- IoT
- Smart Home
- MQTT

excerpt: "Steps to setup a custom Alexa skill that would trigger a MQTT message to the users e-mail address topic"

---
<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
</style>


{% include base_path %}

## Introduction

Last time, I wrote about developing a smart home skill for Alexa. (It is available [here](https://embeddedinn.github.io/articles/tutorial/Developing-an-Alexa-Smart-Home-Skill/){:target="\_blank"}.in case you missed it). 

In the last tutorial, we did not go into the depths of actually setting up a lambda function beyond the scope of Amazon's template. Also, we did not talk about developing custom skills that goes beyond the scope and restrictions of a smart home skill. So, here we go...

Most of the steps explained here will assume that you have tried out the previous example and hence will not be as elaborate as before. You will easily be able to get around the consoles and portals with the verbal explanation here. 

A custom skill is different from a smart home skill in the fact that it allows you to build your own interaction models and you are not restricted by the standard commands like "lights on" or "dim lights". Instead you can build all sorts of voice commands and interaction models. However, the skill will have to be invoked by name and can be a mouth full if not carefully designed. 

In this case, here is the use-case we are going to build

- The skill will announces the last traded value of the share price of a fixed symbol over the audio interface
- While announcing , the skill will also trigger a MQTT message to the test broker at test.mosquitto.org
- Topic to which the message is triggered will be the email id of the user who installed the skill. We will be using account linking for this.

This will teach us the important concepts associated with developing custom skills, user identification using account liking, Alexa cards, third party API integration etc.

## Setting up the Alexa skill

As in the smart home skill. Log-in to [Alexa developer console](https://developer.amazon.com/home.html){:target="\_blank"} and navigate to `Alexa skill kit > Add new skill`. But this time, select ` Custom Interaction Model ` and enter a name and invocation name. The name will be shown to the users trying to install your skill while invocation name will be used to call up on the skill from your echo device. Leave the otehr fields as-is and navigate to `interaction model` in the left pane. 

Interaction model defines an intent schema, custom slot types if any and sample utterances. An intent schema defines the different distinct commands that can be issued to the skill. Sample utterances links spoken sentences with one of the intents in teh intent schema and a slot is a position in the sample utterance where a user variable can come in. For instance, if there is a `getWeather` intent, one of the corresponding sample utterance can be `get me the weather in {PlaceName}`. Now, for instance if the user ask the skill - `get me the weather in  Kerala`, the sample utterance would be used to match the request to the intent and the only parameter that needs to be passed on to the back-end while calling the function that would handle `getWeather` is the place name (Kerala) from the slot. Amazon provides a lot of pre-defined slot types. The optional custom slots field lets you define new slot types and add enumerators into it.

In the case of our skill, we are not going to deal with slots and slot types since we are always fetching the share price of a fixed symbol. So, the intent schema will look like :

```json
{
  "intents": [
  {
    "intent": "HelloIntent"
  }
  ]
}
```

Sample utterances that we can add will include :

```
HelloIntent get me share price
HelloIntent get me the share price
HelloIntent share price
HelloIntent for share price
HelloIntent the share price
HelloIntent what is the share price
HelloIntent how much is the share
```

Save and navigate to Configuration in the left pane.

Lambda creation and account linking steps will be the same as the previous tutorial and I will not be repeating it here. Just make sure that a new security profile is created. For now , create a lambda function with template code and we will modify this in the next section.

## Custom skill lambda function

The lambda function for a custom skill will be a bit different from that of a smart home skill. The functionality that we need to handle in this includes:

- User identification
- Fetching share price
- Sending a MQTT message
- Forming and sending a response

Since the default lambda ecosystem does not include a MQTT library for use with node js, we will not be able to live with just the code written in web console. So we will use the below steps to create a zip file with all dependencies and upload it to the lambda. For this first setup the command line upload interface as below:

- install AWS CLI (`sudo apt-get install awscli`)
- If you do not have the access keys created for your AWS user, do so in IAM console and make a note of the access key ID and secret
- run `aws configure` and enter the details prompted for. (I selected region `us-east-1` and format `json`)
- once the account is setup, you can start uploading zip files with code and dependencies using the below command 

```
aws lambda update-function-code --function-name <lambdaARN> --zip-file fileb://index.zip
```

Now create a new directory and enter the following command to install all our required decencies into a `node_modules` folder.

```
npm install mqtt
```

Create a new file (`index.js`) and copy the code from [here](https://raw.githubusercontent.com/vppillai/AVSLambdas/master/MCHPStockSkill/MicrochipStockSkill.js){:target="\_blank"} into it. We will look at the code flow in a bit. 

Now zip and upload the code into lambda using the following commands. The zip should directly contain the `index.js` file and `node_modules` folder without a top level directory.

```
 zip -r  ../lambdaFunction.zip *
 aws lambda update-function-code --function-name <lambdaARN> --zip-file fileb://../lambdaFunction.zip
```

Once upload is complete, the index file can still be edited in the web console. 

## Execution 

Now that the lambda is setup, you can go to the Alexa web-app, enable your test skill and try to use it. In case you skip account linking, the echo device will prompt you to do so and an account link card will be shown in the webapp. To monitor the MQTT messages, run the following command:

```
mosquitto_sub -h test.mosquitto.org -p 1883 -t <email address>
```

## code flow

As soon as any intent from our skill is invoked, the handler function of our lambda gets called. 

`event.session.user.accessToken` provides the OAuth2 access token of the user invoking this skill and since we are using login with Amazon with `profile` scope, we can get the user profile using their API:

```
https://api.amazon.com/user/profile?access_token=<accessToken>
```

The profile info response comes as a json and it contains a unique user ID, the users name and email address. Though we are using the e-mail address to publish messages here, the best item to use is the user ID. This can be used to uniquely identify a user from say... an internal database . This will be useful in setting up device clouds without having an authentication service. 

In case the user has not done account linking yet, the token field will be empty and our skill will prompt to setup linking and send a card iof type `LinkAccount` in response. 

`event.request.request.type` will tell that it is an `IntentRequest` and `event.request.request.intent.name` will tell the exact intent that is being called. To handle this request, we will first fetch the share price using the following yahoo finance API.

```
"https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22MCHP%22)&format=json&diagnostics=false&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys"
```

Once we have the price, we will send a MQTT message to the email address topic and form our response speech text. Since we are not setting up a conversational skill, we will also end the session.

The skill I built can be seen in action here:

<iframe width="400" height="300" src="https://www.youtube.com/embed/6dMyTTsihLw" frameborder="0" allowfullscreen></iframe>


