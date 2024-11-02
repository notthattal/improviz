class MessageQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
    }

    add(message) {
        this.queue.push(message);
        if (!this.processing) {
            this.processQueue();
        }
    }

    async processQueue() {
        if (this.queue.length === 0) {
            this.processing = false;
            return;
        }

        this.processing = true;
        const message = this.queue.shift();

        try {
            await wsClient.sendMessage(message);
        } catch (error) {
            console.error('Error sending message:', error);
        }

        setTimeout(() => this.processQueue(), 100);
    }
}

class WebSocketClient {
    constructor(url) {
        this.url = url;
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect() {
        this.socket = new WebSocket(this.url);
        this.socket.onopen = this.onOpen.bind(this);
        this.socket.onmessage = this.onMessage.bind(this);
        this.socket.onclose = this.onClose.bind(this);
        this.socket.onerror = this.onError.bind(this);
    }

    async sendMessage(data) {
        if (this.socket.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }

        const message = {
            action: "sendQuery",
            data: data
        };

        return new Promise((resolve, reject) => {
            try {
                this.socket.send(JSON.stringify(message));
                console.log("Message sent:", message);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    onOpen() {
        console.log("WebSocket connection established");
        this.reconnectAttempts = 0;
    }

    onMessage(event) {
        console.log("Message received from server:", event.data);
        try {
            const response = JSON.parse(event.data);
            if (response && response.originalText) {
                const transcriptElement = document.getElementById('transcript');
                transcriptElement.innerText += `\nProcessed Text: ${response.originalText}`;
            }
        } catch (error) {
            console.log("Received status message:", event.data);
        }
    }

    onClose() {
        console.log("WebSocket connection closed");
        this.attemptReconnect();
    }

    onError(error) {
        console.error("WebSocket error:", error);
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
        }
    }
}

const apiKey = "2910a1db0e8845f79923ecbdfdb5fa72";
const websocketURL = "wss://zzmsaapwre.execute-api.us-east-1.amazonaws.com/prod";
const wsClient = new WebSocketClient(websocketURL);
const messageQueue = new MessageQueue();
wsClient.connect();

let mediaRecorder;
let recordingInterval;
let audioChunks = [];
let isRecording = false;

// Initialize record button functionality
document.addEventListener('DOMContentLoaded', () => {
    const recordButton = document.getElementById('record-button');

    recordButton.addEventListener('click', () => {
        if (!isRecording) {
            startRecording();
            recordButton.classList.add('recording');
        } else {
            stopRecording();
            recordButton.classList.remove('recording');
        }
    });
});

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        isRecording = true;

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const currentChunks = [...audioChunks];
            audioChunks = [];

            if (isRecording) {
                mediaRecorder.start();
            }

            const audioBlob = new Blob(currentChunks, { type: 'audio/wav' });
            transcribeAudio(audioBlob).catch(console.error);
        };

        mediaRecorder.start();
        document.getElementById('status').innerText = "Recording...";

        recordingInterval = setInterval(() => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }
        }, 1500);

    } catch (error) {
        console.error("Error starting recording:", error);
        document.getElementById('status').innerText = "Error starting recording.";
        isRecording = false;
        document.getElementById('record-button').classList.remove('recording');
    }
}

function stopRecording() {
    isRecording = false;

    if (recordingInterval) {
        clearInterval(recordingInterval);
        recordingInterval = null;
    }

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }

    if (mediaRecorder && mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }

    document.getElementById('status').innerText = "Recording stopped.";
}

async function transcribeAudio(blob) {
    try {
        document.getElementById('status').innerText = "Transcribing...";

        const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
            method: 'POST',
            headers: {
                authorization: apiKey
            },
            body: blob
        });

        if (!uploadResponse.ok) {
            throw new Error(`Upload failed with status: ${uploadResponse.status}`);
        }

        const { upload_url } = await uploadResponse.json();

        const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST',
            headers: {
                authorization: apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify({ audio_url: upload_url })
        });

        if (!transcriptResponse.ok) {
            throw new Error(`Transcription request failed with status: ${transcriptResponse.status}`);
        }

        const { id } = await transcriptResponse.json();

        let transcript;
        while (true) {
            const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
                headers: { authorization: apiKey }
            });

            if (!statusResponse.ok) {
                throw new Error(`Status check failed with status: ${statusResponse.status}`);
            }

            transcript = await statusResponse.json();

            if (transcript.status === 'completed') break;
            if (transcript.status === 'error') {
                throw new Error('Transcription failed: ' + transcript.error);
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (transcript.text && transcript.text.trim()) {
            document.getElementById('transcript').innerText += `\nTranscript: ${transcript.text}`;
            messageQueue.add(transcript.text);
        }

        document.getElementById('status').innerText = isRecording ? "Recording..." : "Recording stopped.";
    } catch (error) {
        console.error("Transcription error:", error);
        document.getElementById('status').innerText = isRecording ?
            "Transcription error, but still recording..." :
            "Transcription error. Recording stopped.";
    }
}
