#!/bin/bash
awslocal s3 mb s3://ecoroute-proofs
awslocal sqs create-queue --queue-name ecoroute-notifications
echo "LocalStack initialized (S3 bucket and SQS queue created)"
