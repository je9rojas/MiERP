# backend/app/core/secrets_manager.py
import boto3
from botocore.exceptions import ClientError

def get_secret(secret_name):
    try:
        client = boto3.client('secretsmanager')
        response = client.get_secret_value(SecretId=secret_name)
        return response['SecretString']
    except ClientError as e:
        raise RuntimeError(f"Error retrieving secret: {str(e)}")