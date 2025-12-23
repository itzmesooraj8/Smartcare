# app/services/storage.py
import os
import boto3
from botocore.client import Config
from urllib.parse import urljoin
from dotenv import load_dotenv
load_dotenv()

# Support both S3 and MinIO. If MINIO_ENDPOINT set, use it.
S3_ENDPOINT = os.getenv("S3_ENDPOINT")  # e.g. http://minio:9000 or leave blank for AWS
S3_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET = os.getenv("S3_BUCKET", "smartcare-files")
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

s3_client = boto3.client(
    "s3",
    region_name=S3_REGION,
    endpoint_url=S3_ENDPOINT or None,
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    config=Config(signature_version="s3v4"),
)

def create_presigned_put_key(key: str, expires: int = 300):
    """Return presigned PUT URL for frontend to upload directly."""
    return s3_client.generate_presigned_url(
        "put_object",
        Params={"Bucket": S3_BUCKET, "Key": key},
        ExpiresIn=expires,
        HttpMethod="PUT",
    )

def create_presigned_get_key(key: str, expires: int = 300):
    return s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": S3_BUCKET, "Key": key},
        ExpiresIn=expires,
    )
