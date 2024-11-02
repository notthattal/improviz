// Use the provided WebSocket URL
const websocketURL = "wss://zzmsaapwre.execute-api.us-east-1.amazonaws.com/prod";
const socket = new WebSocket(websocketURL);



// Event handler for when the connection is opened
socket.onopen = () => {
    console.log("WebSocket connection established");

    // Define the message to send
    const message = {
        action: "sendQuery",  // This should match your API Gateway route
        data: {
            query: "Get latest data",
            userId: "12345"
        }
    };

    // Send the message as a JSON string
    socket.send(JSON.stringify(message));
    console.log("Message sent:", message);
};

// Event handler for receiving messages from the server
socket.onmessage = (event) => {
    console.log("Message received from server:", event.data);
    // Process or display the received data as needed
};

// Event handler for when the connection is closed
socket.onclose = () => {
    console.log("WebSocket connection closed");
};

// Event handler for any WebSocket errors
socket.onerror = (error) => {
    console.error("WebSocket error:", error);
};
