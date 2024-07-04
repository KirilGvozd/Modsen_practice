require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;
app.get('/weather', async (req, res) => {
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/3.0/onecall?lat=33.44&lon=-94.04&exclude=hourly,daily&appid=${process.env.API_KEY}`);
        res.status(response.status).json({
            status: response.status,
            data: response.data,
        });

    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json({
                status: error.response.status,
                message: error.response.data.message,
            });
        } else {
            res.status(500).json({
                status: 500,
                message: error.message,
            });
        }
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
})