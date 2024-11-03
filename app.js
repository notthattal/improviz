const apiKey = "5c1d6279cd29445e85d219fd7626b7d7";
let mediaRecorder;
let recordingInterval;
let audioChunks = [];
let isRecording = false;
let wordCount = 0;
let waveformInterval;
let currentVisualizationIndex = 0;

class TranscriptManager {
    constructor(wordThreshold = 30) {
        this.wordThreshold = wordThreshold;
        this.transcripts = [];
        this.totalWords = 0;
        this.visualizationCount = 0;
    }

    addTranscript(text) {
        this.transcripts.push(text);
        const words = text.trim().split(/\s+/).length;
        this.totalWords += words;

        // Add to live transcript panel with appropriate styling
        window.addTranscriptChunk(text);

        console.log(`Added transcript. Total words: ${this.totalWords}`);

        if (this.totalWords >= this.wordThreshold) {
            this.generateVisualization();
        }
    }

    async generateVisualization() {
        try {
            const allTranscripts = this.transcripts;
            this.transcripts = [];
            this.totalWords = 0;

            document.getElementById('status').innerText = "Generating visualization...";

            const response = await fetch('http://127.0.0.1:5000/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(allTranscripts)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Visualization data:', data);

            // Create new visualization card
            this.visualizationCount++;
            const vizContainer = document.getElementById("visualization");
            const newCard = this.createVisualizationCard(allTranscripts, data, this.visualizationCount);

            // Insert the new card at the beginning of the stack
            if (vizContainer.firstChild) {
                vizContainer.insertBefore(newCard, vizContainer.firstChild);
            } else {
                vizContainer.appendChild(newCard);
            }

            data.forEach((viz, vizIndex) => {
                if (viz.type === "plotly") {
                    const plotDiv = document.getElementById(`plotlyChart-${this.visualizationCount}-${vizIndex}`);
                    Plotly.newPlot(plotDiv.id, viz.data, viz.layout, { responsive: true }).then(() => {
                        Plotly.Plots.resize(plotDiv.id);
                    });
                }
            });

            // Update card positions
            currentVisualizationIndex = 0;
            window.updateCardPositions();

            // Update status
            document.getElementById('status').innerText = isRecording ?
                "Recording..." : "Recording stopped. Visualization generated.";

        } catch (error) {
            console.error('Error generating visualization:', error);
            document.getElementById('status').innerText = "Error generating visualization.";
        }
    }

    createVisualizationCard(transcripts, visualizations, index) {
        const card = document.createElement('div');
        card.className = 'visualization-card';
        card.setAttribute('data-index', index);

        const content = document.createElement('div');
        content.className = 'card-content flex-col'; // Changed to column layout

        let visualization_summaries = [];
        visualizations.forEach((viz, vizIndex) => {
            visualization_summaries.push(viz.summary);
        });

        // Create summary section at the top
        const summarySection = document.createElement('div');
        summarySection.className = 'card-summary mb-4';
        summarySection.innerHTML = `
        <div class="text-lg font-semibold mb-2">Summary</div>
        <div class="text-gray-700">${visualization_summaries.join(' ')}</div>
    `;

        // Add visualization section (now larger)
        const vizSection = document.createElement('div');
        vizSection.className = 'card-visualization flex-grow';

        visualizations.forEach((viz, vizIndex) => {
            if (viz.type === "image") {
                const img = document.createElement("img");
                img.src = viz.data;
                img.className = "w-full rounded-lg shadow-sm";
                vizSection.appendChild(img);
            } else if (viz.type === "plotly") {
                const plotDiv = document.createElement("div");
                plotDiv.id = `plotlyChart-${index}-${vizIndex}`;
                plotDiv.className = "w-full h-[500px]"; // Increased height
                vizSection.appendChild(plotDiv);
            } else if (viz.type === "text") {
                const textDiv = document.createElement("div");
                textDiv.className = "p-4 bg-gray-50 rounded-lg";
                textDiv.innerText = viz.data;
                vizSection.appendChild(textDiv);
            }
        });

        content.appendChild(summarySection);
        content.appendChild(vizSection);
        card.appendChild(content);

        return card;
    }

    getWordCount() {
        return this.totalWords;
    }

    getProgress() {
        return (this.totalWords / this.wordThreshold) * 100;
    }
}

// Create transcript manager instance
const transcriptManager = new TranscriptManager(30);

document.addEventListener('DOMContentLoaded', () => {
    const recordButton = document.getElementById('record-button');

    initializeRecordButton(recordButton);
});

function initializeRecordButton(recordButton) {
    recordButton.addEventListener('click', () => {
        if (!isRecording) {
            startRecording();
            recordButton.classList.add('recording');
            showWaveform(true);
        } else {
            stopRecording();
            recordButton.classList.remove('recording');
            showWaveform(false);
        }
    });
}

function showWaveform(show) {
    const recordButton = document.getElementById('record-button');
    const micIcon = recordButton.querySelector('.mic-icon');
    const waveform = recordButton.querySelector('.waveform');

    micIcon.style.display = show ? 'none' : 'block';
    waveform.style.display = show ? 'flex' : 'none';

    if (show) {
        startWaveformAnimation();
    } else {
        stopWaveformAnimation();
    }
}

function startWaveformAnimation() {
    const waveform = document.querySelector('.waveform');
    waveformInterval = setInterval(() => {
        const bars = waveform.querySelectorAll('.waveform-bar');
        bars.forEach(bar => {
            const height = Math.random() * 30 + 10;
            bar.style.height = `${height}px`;
        });
    }, 150);
}

function stopWaveformAnimation() {
    if (waveformInterval) {
        clearInterval(waveformInterval);
        waveformInterval = null;
    }
}

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
    resetRecordButton();
}

function resetRecordButton() {
    const recordButton = document.getElementById('record-button');
    recordButton.classList.remove('recording');
    showWaveform(false);
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
            // Add to transcript manager
            transcriptManager.addTranscript(transcript.text);

            // Update progress status
            const progress = transcriptManager.getProgress();
            document.getElementById('status').innerText = isRecording ?
                `Recording... (${Math.round(progress)}% to next visualization)` :
                "Recording stopped.";
        }

    } catch (error) {
        console.error("Transcription error:", error);
        document.getElementById('status').innerText = isRecording ?
            "Transcription error, but still recording..." :
            "Transcription error. Recording stopped.";
    }
}