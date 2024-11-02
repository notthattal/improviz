import json
import boto3

def lambda_handler(event, context):
    print("Event received:", event)

    api_gateway_endpoint = "https://zzmsaapwre.execute-api.us-east-1.amazonaws.com/prod"
    api_gateway = boto3.client("apigatewaymanagementapi", endpoint_url=api_gateway_endpoint)

    # Attempt to parse connection ID and message body
    try:
        connection_id = event["requestContext"]["connectionId"]
        body = json.loads(event["body"])
        print("Parsed body:", body)
    except Exception as e:
        print("Error parsing event:", e)
        return {"statusCode": 500, "body": "Failed to parse event data"}

    # Check action and process data
    if body.get("action") == "sendQuery":
        # Add "Hello" after each word in the text
        original_text = body.get("data", "")
        modified_text = ' '.join([word + " Hello" for word in original_text.split()])

        response_message = {
            "message": "Processed text",
            "originalText": modified_text
        }

        try:
            api_gateway.post_to_connection(
                ConnectionId=connection_id,
                Data=json.dumps(response_message)
            )
            return {"statusCode": 200, "body": "Response sent back to client"}

        except api_gateway.exceptions.GoneException:
            print("Connection is no longer active:", connection_id)
            return {"statusCode": 410, "body": "Connection closed"}

        except Exception as e:
            print("Error sending message back to client:", e)
            return {"statusCode": 500, "body": f"Failed to send response: {str(e)}"}

    return {"statusCode": 400, "body": "Unrecognized action"}
