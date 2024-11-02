let mediaRecorder;
let recordingInterval;
let audioChunks = [];
const apiKey = "2910a1db0e8845f79923ecbdfdb5fa72";

document.getElementById('start-button').addEventListener('click', startRecording);
document.getElementById('stop-button').addEventListener('click', stopRecording);

async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        transcribeAudio(audioBlob);

        if (recordingInterval) {
            audioChunks = [];
            mediaRecorder.start();
        }
    };

    mediaRecorder.start();
    document.getElementById('start-button').disabled = true;
    document.getElementById('stop-button').disabled = false;
    document.getElementById('status').innerText = "Recording...";

    recordingInterval = setInterval(() => {
        mediaRecorder.stop();
        audioChunks = [];
    }, 5000);
}

function stopRecording() {
    mediaRecorder.stop(); // Stop the recording
    clearInterval(recordingInterval);
    recordingInterval = null;
    mediaRecorder.stream.getTracks().forEach(track => track.stop()); // Stop the microphone

    document.getElementById('start-button').disabled = false;
    document.getElementById('stop-button').disabled = true;
    document.getElementById('status').innerText = "Processing...";
}

async function transcribeAudio(blob) {
    // Step 1: Upload the audio file to AssemblyAI
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
            authorization: apiKey
        },
        body: blob
    });
    const { upload_url } = await uploadResponse.json();

    // Step 2: Request transcription with the uploaded audio URL
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
            authorization: apiKey,
            'content-type': 'application/json'
        },
        body: JSON.stringify({ audio_url: upload_url })
    });
    const { id } = await transcriptResponse.json();

    // Step 3: Poll for transcription completion
    let transcript;
    while (true) {
        const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
            headers: { authorization: apiKey }
        });
        transcript = await statusResponse.json();
        if (transcript.status == 'completed') break;
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    document.getElementById('status').innerText = "";
    document.getElementById('transcript').innerText += `\nTranscript: ${transcript.text}`;
}