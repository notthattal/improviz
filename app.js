const apiKey = "5c1d6279cd29445e85d219fd7626b7d7";
let mediaRecorder;
let recordingInterval;
let audioChunks = [];
let isRecording = false;
let wordCount = 0;
let transcriptHistory = [];
let waveformInterval;

class TranscriptManager {
    constructor(wordThreshold = 40) {
        this.wordThreshold = wordThreshold;
        this.transcripts = [];
        this.totalWords = 0;
        this.visualizationCount = 0;
    }

    addTranscript(text) {
        this.transcripts.push(text);
        const words = text.trim().split(/\s+/).length;
        this.totalWords += words;

        console.log(`Added transcript. Total words: ${this.totalWords}`);

        if (this.totalWords >= this.wordThreshold) {
            this.generateVisualization();
        }
    }
    
    insertNewSection(vizContainer, newSection, visualizationCount) {
        // Add divider if there are multiple visualizations
        if (visualizationCount > 1) {
            const divider = document.createElement('hr');
            divider.className = 'my-8 border-t border-gray-200';
            vizContainer.insertBefore(divider, vizContainer.firstChild);
        }
    
        // Insert the new section at the top
        vizContainer.insertBefore(newSection, vizContainer.firstChild);
    }

    async generateVisualization() {
        try {
            // Get all transcripts as one array
            const allTranscripts = this.transcripts;

            // Reset for next batch
            this.transcripts = [];
            this.totalWords = 0;

            // Update status
            document.getElementById('status').innerText = "Generating visualization...";

            // Send request to Flask server
            const response = await fetch('http://127.0.0.1:5000/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(allTranscripts)
            });
            console.log(allTranscripts)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Visualization data:', data);

            // Create a new visualization section
            this.visualizationCount++;
            const vizContainer = document.getElementById("visualization");
            const newSection = document.createElement('div');
            newSection.className = 'visualization-section mb-8 p-4 bg-white rounded-lg shadow';

            // Add section header with timestamp
            const header = document.createElement('div');
            header.className = 'text-lg font-semibold text-primary mb-4';
            const timestamp = new Date().toLocaleTimeString();
            header.textContent = `Visualization ${this.visualizationCount} (${timestamp})`;
            newSection.appendChild(header);

            // Add transcript for this section
            const transcriptSection = document.createElement('div');
            transcriptSection.className = 'mb-4 p-3 bg-gray-50 rounded';
            transcriptSection.innerHTML = `<div class="font-medium mb-2">Transcript:</div>
                                         <div class="text-sm text-gray-600">${allTranscripts.join(' ')}</div>`;
            newSection.appendChild(transcriptSection);

            // Render new visualizations in this section
            data.forEach((viz, index) => {
                if (viz.type === "image") {
                    const img = document.createElement("img");
                    img.src = viz.data;
                    img.className = "w-full max-w-2xl mx-auto my-4";
                    newSection.appendChild(img);
                    this.insertNewSection(vizContainer, newSection, this.visualizationCount);
                } else if (viz.type === "plotly") {
                    const plotDiv = document.createElement("div");
                    plotDiv.id = `plotlyChart-${this.visualizationCount}-${index}`;
                    plotDiv.className = "w-full max-w-2xl mx-auto my-4";
                    newSection.appendChild(plotDiv);
                    this.insertNewSection(vizContainer, newSection, this.visualizationCount);
                    Plotly.newPlot(plotDiv.id, viz.data, viz.layout);
                } else if (viz.type === "text") {
                    const textDiv = document.createElement("div");
                    textDiv.className = "p-4 bg-gray-50 rounded my-4";
                    textDiv.innerText = viz.data;
                    newSection.appendChild(textDiv);
                    this.insertNewSection(vizContainer, newSection, this.visualizationCount);
                }
            });

            // Update status
            document.getElementById('status').innerText = isRecording ?
                "Recording..." : "Recording stopped. Visualization generated.";

            // Scroll to the new visualization smoothly
            newSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (error) {
            console.error('Error generating visualization:', error);
            document.getElementById('status').innerText = "Error generating visualization.";
        }
    }

    getWordCount() {
        return this.totalWords;
    }

    getProgress() {
        return (this.totalWords / this.wordThreshold) * 100;
    }
}

// Create transcript manager instance
const transcriptManager = new TranscriptManager(10);

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

    // Remove the visualize button since it's now automatic
    const executeButton = document.getElementById('execute-button');
    if (executeButton) {
        executeButton.remove();
    }
});

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        isRecording = true;

        // Update UI for recording state
        const recordButton = document.getElementById('record-button');
        const micIcon = recordButton.querySelector('.mic-icon');
        const waveform = recordButton.querySelector('.waveform');

        recordButton.classList.add('recording');
        micIcon.style.display = 'none';
        waveform.style.display = 'flex';

        // Animate waveform
        waveformInterval = setInterval(() => {
            const bars = waveform.querySelectorAll('.waveform-bar');
            bars.forEach(bar => {
                const height = Math.random() * 30 + 10;
                bar.style.height = `${height}px`;
            });
        }, 150);

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
            await transcribeAudio(audioBlob);
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
        resetRecordButton();
    }
}

function stopRecording() {
    isRecording = false;
    resetRecordButton();

    if (recordingInterval) {
        clearInterval(recordingInterval);
        recordingInterval = null;
    }

    if (waveformInterval) {
        clearInterval(waveformInterval);
        waveformInterval = null;
    }

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }

    if (mediaRecorder && mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }

    document.getElementById('status').innerText = "Recording stopped.";
}

// Add this new helper function
function resetRecordButton() {
    const recordButton = document.getElementById('record-button');
    const micIcon = recordButton.querySelector('.mic-icon');
    const waveform = recordButton.querySelector('.waveform');

    recordButton.classList.remove('recording');
    micIcon.style.display = 'block';
    waveform.style.display = 'none';
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
            const transcriptDiv = document.getElementById('transcript');
            transcriptDiv.innerText += `\nTranscript: ${transcript.text}`;

            // Add to transcript manager
            transcriptManager.addTranscript(transcript.text);

            // Update progress status
            const progress = transcriptManager.getProgress();
            document.getElementById('status').innerText = `Recording... (${Math.round(progress)}% to next visualization)`;
        }

    } catch (error) {
        console.error("Transcription error:", error);
        document.getElementById('status').innerText = isRecording ?
            "Transcription error, but still recording..." :
            "Transcription error. Recording stopped.";
    }
}
