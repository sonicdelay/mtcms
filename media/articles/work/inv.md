# Inventory

## Option 1: Update Lambda manually via AWS web console

- Navigate to the directory of the respective lambda's main.go file.

- Build the lambda by running the following command:

  ```
  GOOS=linux GOARCH=arm64 go build -o bootstrap
  ```

- Zip the built by running the following command:

  ```
  zip lambda.zip bootstrap
  ```

- Go to the AWS Management Console via
  [AWS credentials - https://aws.example.cloud](https://aws.example.cloud/#/)
  and navigate to AWS Lambda.

Click on the function that you want to update.

In the "Code" tab, select "Upload from" and choose the zipped file.

Click on "Save".

Since the API Gateway always points to the lambda version tagged with an alias
"released", you need to publish a new version in the "Versions" tab.

Go back to the function and under "Aliases", edit the alias.

Update the version of the alias to the newly published version.

Now, the current API Gateway will point to your updated lambda function, and you
can test your endpoint.

You can perform this update process as many times as needed. If your changes are
satisfactory, push them to your branch, and the pipeline will automatically
update everything.

## Option 2: Update Lambda via script using AWS CLI

### Prerequisites:

AWS CLI installed and configured with the necessary permissions from AWS TVM.
Golang installed

Run the following command to update a single lambda function:

```
.helper/update_lambda.sh <lambda_function_path> <lambda_function_name> <alias>
```

# example:

```
.helper/update_lambda.sh ./cmd/inventoryupdates feat-ddtrace-ote-inventory-updates released
```
