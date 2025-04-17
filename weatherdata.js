const mongoose = require('mongoose');

// Define a schema for weather data
const weatherSchema = new mongoose.Schema({
    city: { type: String, required: true },
    temperature: { type: Number, required: true },
    weatherDescription: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

// Create the model
const WeatherData = mongoose.model('WeatherData', weatherSchema);

module.exports = WeatherData;
