import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';

const app = express();
const port = 8080;

app.use(bodyParser.json());
app.use(express.static(path.resolve())); 

// Define the POST endpoint
app.post('/execute', (req, res) => {
    // Access the data sent in the request body
    const data = req.body;
    
    // Process the data (for example, generate a visualization)
    console.log("Received data:", data);

    // Send a response back to the client
    res.json({ message: 'Data received', data: data });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(path.resolve(), 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running at http://127.0.0.1:${port}`);
});