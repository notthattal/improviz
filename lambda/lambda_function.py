import boto3
import json
import os

def lambda_handler(event, context):
    # Initialize the ApiGatewayManagementApi client
    api_gateway_endpoint = "https://zzmsaapwre.execute-api.us-east-1.amazonaws.com/prod"
    api_gateway = boto3.client("apigatewaymanagementapi", endpoint_url=api_gateway_endpoint)
    
    # Get the connection ID and received message
    connection_id = event["requestContext"]["connectionId"]
    body = json.loads(event["body"])

    # Check if the action is `sendQuery`
    if body.get("action") == "sendQuery":
        # Process the data and prepare a response
        modified_data = {
            "originalQuery": body["data"]["query"],
            "responseMessage": "Here is your modified data",
            "timestamp": context.aws_request_id  # Including the request ID for tracking
        }

        try:
            # Send the modified response back to the client
            api_gateway.post_to_connection(
                ConnectionId=connection_id,
                Data=json.dumps(modified_data)
            )
            return {"statusCode": 200, "body": "Response sent back to client"}

        except api_gateway.exceptions.GoneException:
            print("Connection is no longer active:", connection_id)
            return {"statusCode": 410, "body": "Connection closed"}

        except Exception as e:
            print(f"Error sending message back to client: {e}")
            return {"statusCode": 500, "body": "Failed to send response"}

    return {"statusCode": 400, "body": "Unrecognized action"}
