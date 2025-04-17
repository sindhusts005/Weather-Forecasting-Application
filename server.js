const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const brain = require('brain.js');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/weatherApp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Define a schema and model for weather data
const weatherSchema = new mongoose.Schema({
    city: { type: String, required: true },
    temperature: { type: Number, required: true },
    weatherDescription: { type: String, required: true },
    date: { type: Date, default: Date.now },
});

const Weather = mongoose.model('Weather', weatherSchema);

// Initialize Neural Network
const net = new brain.NeuralNetwork();

// Function to train the model using historical data
async function trainModel() {
    try {
        const data = await Weather.find({});
        if (data.length === 0) {
            console.error('No historical data available for training.');
            return;
        }

        const trainingData = data.map(entry => ({
            input: { temperature: entry.temperature / 100 },
            output: { temperature: entry.temperature / 100 },
        }));

        if (trainingData.length === 0) {
            console.error('No valid training data available.');
            return;
        }

        net.train(trainingData, {
            log: true,
            logPeriod: 100,
            iterations: 2000,
        });

        console.log('Model trained successfully');
    } catch (err) {
        console.error('Error training model:', err);
    }
}

// Endpoint to save weather data
app.post('/saveWeather', async (req, res) => {
    const { city, temperature, weatherDescription } = req.body;

    const newWeather = new Weather({
        city,
        temperature,
        weatherDescription,
    });

    try {
        await newWeather.save();
        res.status(200).send({ message: 'Weather data saved successfully' });
    } catch (err) {
        res.status(500).send({ message: 'Error saving weather data', error: err.message });
    }
});

// Endpoint to get all weather data
app.get('/weather', async (req, res) => {
    try {
        const data = await Weather.find({});
        res.status(200).json(data);
    } catch (err) {
        res.status(500).send({ message: 'Error fetching weather data', error: err.message });
    }
});

// Endpoint to predict the weather
app.post('/predict', (req, res) => {
    const { historicalData } = req.body;

    if (!historicalData || historicalData.length === 0) {
        return res.status(400).send({ message: 'Invalid historical data provided' });
    }

    try {
        const inputs = historicalData.map(temp => ({ temperature: temp / 100 }));

        const predictions = inputs.map(input => {
            const output = net.run(input);
            return Math.round(output.temperature * 100);
        });

        res.status(200).json({ predictions });
    } catch (err) {
        res.status(500).send({ message: 'Error generating predictions', error: err.message });
    }
});

// Start the server and train the model
app.listen(port, async () => {
    console.log(`Server running at http://localhost:${port}`);
    await trainModel(); // Train the model when the server starts
});
