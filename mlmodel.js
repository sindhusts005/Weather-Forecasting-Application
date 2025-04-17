const mongoose = require('mongoose');
const Weather = require('./models/WeatherData'); // Adjust the path according to your project structure
const brain = require('brain.js');

const net = new brain.NeuralNetwork();

// Train the model using historical data
async function trainModel() {
    const data = await Weather.find({}); // Fetch all weather data

    const trainingData = data.map(entry => ({
        input: { temperature: entry.temperature / 100 }, // Normalizing temperature
        output: { temperature: entry.temperature / 100 } // Normalizing output
    }));

    net.train(trainingData, {
        log: true,
        logPeriod: 100,
        iterations: 2000,
    });
}

// Predict temperature for a given city
async function predictTemperature(city) {
    const data = await Weather.find({ city });
    if (data.length === 0) return { error: 'No data found for this city.' };

    const input = { temperature: data[data.length - 1].temperature / 100 }; // Using the latest temperature
    const output = net.run(input);
    return { predictedTemperature: output.temperature * 100 }; // Denormalizing
}

module.exports = { trainModel, predictTemperature };

