---
title: Deploying AWS Lambdas with GitHub Actions
date: 2022-07-05 00:58:06.000000000 -07:00
classes: wide
published: true
categories:
- Articles
- Tutorial
tags:
- devops
- AWS
- GitHub
- Actions
header:
  teaser: "images/posts/jenkinsWebhooks/webhookTeaser.png"
  og_image: "images/posts/jenkinsWebhooks/webhookTeaser.png"
excerpt: "In this article, we look at how to create a custom Github action that can deploy AWS Lambda Code and upload it to the marketplace."

---


<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
</style>

{% include base_path %}

{% include toc title="Table of contents" icon="file-text" %}


The action built in this article is published in [Marketplace/Actions/Deploy AWS Lambda](https://github.com/marketplace/actions/deploy-aws-lambda)
{: .notice--info}

[GitHub actions](https://docs.github.com/en/actions){:target="_blank"} let us execute development and deployment workflows within the repo. [Github Actions marketplace](https://github.com/marketplace?type=actions){:target="_blank"} contains a lot of pre-defined actions that can be used as building blocks for our custom actions. In this article, we look at how to create a custom action that we can upload to the marketplace. 
Understanding how an action is built not only helps us build custom, reusable building blocks for workflows, but also help us better utilize the capabilities of actions available in the marketplace. 


## The objective

We’ll build a GitHub action that deploys packaged code in a repo into an AWS lambda function every time we commit code to the `main` branch of the repo. There are a few actions in the marketplace that already does this. However, we are interested in building one on our own to understand how to build custom actions. This is also practical since we would want to build it ourselves instead of using one from an unknown third party – especially since we are passing AWS access keys into the action. 

Since we want to share the action we build with others, we will keep the actions code in a separate repo. However, if we’re building it for use within our repo alone, we could have built it within the `.github` folder of our repo. 

GitHub actions can be built as `docker` container, `JavaScript` or `composite`. We will be building a Docker container-based action here. Though they are slower than the JS-based ones, it is easier to understand as well as provide greater flexibility.

## Action Creation

-	We start by creating a GitHub Repo to host the action and clone it into your development machine. I have created [embeddedinn/deploy_lambda](https://github.com/embeddedinn/deploy_lambda)
-	Create a `Dockerfile` that contains the primary OS and the execution `ENTRYPOINT` of the action that we are providing

    ```Dockerfile
    # Container image that runs your code
    FROM alpine:3.10

    # Copies your code file from your action repository to the filesystem path `/` of the container
    COPY entrypoint.sh /entrypoint.sh


    # Install AWS CLI
    RUN apk add --no-cache \
            python3 \
            py3-pip \
        && pip3 install --upgrade pip \
        && pip3 install --no-cache-dir \
            awscli \
        && rm -rf /var/cache/apk/*

    # Just to make sure its installed alright
    RUN aws --version   

    RUN chmod +x entrypoint.sh
    # Code file to execute when the docker container starts up (`entrypoint.sh`)
    ENTRYPOINT ["/entrypoint.sh"]
    ```

-	Next, we create an action metadata file (`action.yml`) that defines parameters like input, output, . Note that the function expects the lambda code to be deployed to be provided as a `Zip file`. This is designed to allow execution of pre-deployment steps in the code repo workflow file. 

    ```yaml
    # action.yml
    name: 'Deploy AWS Lambda'
    description: 'Deploys repo code into AWS Lambda'
    author: 'Vysakh P Pillai'
    branding:
    icon: 'upload-cloud'  
    color: 'green'
    inputs:
    access-key-id:  
        description: 'AWS Access Key ID'
        required: true
    access-key-secret:  
        description: 'AWS Access Key Secret'
        required: true
    region:  
        description: 'AWS region'
        required: true
    lambda-name:  
        description: 'Lambda function name'
        required: true
    zip-file:  
        description: 'Zip File to deploy'
        required: true


    runs:
    using: 'docker'
    image: 'Dockerfile'
    args:
        - $\{{ inputs.access-key-id }}
        - $\{{ inputs.access-key-secret }}
        - $\{{ inputs.region }}
        - $\{{ inputs.lambda-name }}
        - $\{{ inputs.zip-file }}
    ```

-	Now, we add the entry point function that would use the user inputs and perform the actual deployment. Make sure that the file has execute permissions. Note that we are using `update-function-code` that expects the lambda function to be already available. Args are passed to teh script in the order defined in the `action.yml` file. 

    ```bash
    #!/bin/sh -l

    AWS_ACCESS_KEY_ID=$1 AWS_SECRET_ACCESS_KEY=$2 AWS_DEFAULT_REGION=$3 \
    aws lambda update-function-code --function-name $4  --zip-file fileb://$5
    ```

-	Update the readme file and commit, tag and push the changes we made to the repo.

    ```bash
    git add action.yml entrypoint.sh Dockerfile README.md
    git commit -m "deploy_lambda action"
    git tag -a -m "deploy_lambda action V1" v1.0.0
    git push --follow-tags
    ```

## Testing the action 

To test the deployment flow enabled by the action we created now, we will create a lambda function and a repo to host the code to be deployed. 

-	Create a lambda function in your AWS console. 
    - I created a temporary `python 3.9` lambda function with the default code and enabled `function URL` to demonstrate changes being deployed quickly. 

    ```python
    import json

    def lambda_handler(event, context):
        # TODO implement
        return {
            'statusCode': 200,
            'body': json.dumps('Hello from Lambda!')
        }
    ```

-	The function URL will return the `Hello from Lambda!` string 

    {% include image.html
        img="images/posts/GithubActionLambda/Picture1.png"
        width="400"
        caption="Function URL output"
    %}
 
-	Next I created a `deploy_test` repo in my GitHub account. This is where we will test the deployment workflow. 
-	Clone the new repo into your development machine and create a file named `lambda_function.py` with the default code from the lambda function. 
-	Next create a workflow file in the path `.github/workflows/main.yml`
This workflow will checkout main, compress the code into a zip file, and deploy it using the action that we created and deployed

    ```yml
    on: [push]

    jobs:
    lambda_deployment:
        runs-on: ubuntu-latest
        name: deploy code in repo into a lambda function
        steps:
        - name: Code checkout
            id: checkout
            uses: actions/checkout@master
        - name: Package code into zip
            id: Package
            run: zip -r package.zip lambda_function.py
        - name: Deploy Lambda
            id: Deploy
            uses: embeddedinn/deploy_lambda@v1.0.0
            with:
                access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
                access-key-secret: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
                region: ${{ secrets.AWS_REGION }}
                lambda-name: ${{ secrets.LAMBDA_NAME }}
                zip-file: package.zip
    ```
-	Commit and push the code

## Creating Action Secrets

-	Now we need to add the AWS key and secret that will be used by our Action to commit the code. 
-	From the AWS IAM console, create a Key and secret for a user with permissions limited to deploying code into the specific lambda function. 
-	Go to the repo that hosts the lambda code and under settings, go to `secrets > actions`

    {% include image.html
        img="images/posts/GithubActionLambda/Picture2.png"
        width="600"
        caption="Adding Action Secrets"
    %}
-  Create the following secrets with corresponding values from your AWS account. The key names are self-explanatory.
    1. 	`AWS_ACCESS_KEY_ID`
    1.	`AWS_SECRET_ACCESS_KEY`
    1.	`AWS_REGION`
    1.	`LAMBDA_NAME`


        {% include image.html
            img="images/posts/GithubActionLambda/Picture3.png"
            width="600"
            caption="Action Secrets"
        %}

## Deploying Code

-	We will now edit the code in the repo to change the welcome message into something different. For demonstration, we are doing this from the GitHub web editor. 

    {% include image.html
        img="images/posts/GithubActionLambda/Picture4.png"
        width="600"
        caption="Lambda Code Change in Repo"
    %}

-	Once the change is committed, we can now see that the workflow has been picked up under the `actons` tab of the code repo. 

{% include image.html
    img="images/posts/GithubActionLambda/Picture5.png"
    width="600"
    caption="Action workflow picked up"
%}
   

{% include image.html
    img="images/posts/GithubActionLambda/Picture6.png"
    width="600"
    caption="Action workflow execution output"
%}

- Once the workflow is completed, you can see that the code has changed in the lambda console. It will also reflect in the URL base invocation. 

{% include image.html
    img="images/posts/GithubActionLambda/Picture7.png"
    width="600"
    caption="Lambda Code updated in console"
%}


{% include image.html
    img="images/posts/GithubActionLambda/Picture8.png"
    width="600"
    caption="Lambda Code updated in API"
%}

## Notes:

-	The lambda deployment steps can also be integrated into the code repo’s workflow without relying on external action. However, the intention is to show the steps involved in creating an action that can be published on Marketplace. 
-	The process can be sped up using a JavaScript-based action instead of using a docker container. 
-	In case you want to package additional contents like python packages, resources, etc. into the zip file, the steps can be added in the source code action file before the packaging stage. 
-	Lambda deployment versioning is not considered here to keep the flow simple.
