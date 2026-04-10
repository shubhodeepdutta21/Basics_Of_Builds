const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://Murli0810:Murli0810@grey.udftxd3.mongodb.net/BOB?retryWrites=true&w=majority";

const components = [
    { name: "Arduino Uno", category: "Microcontrollers", description: "Classic starter board" },
    { name: "DHT11", category: "Sensors", description: "Temperature and humidity sensor" },
    { name: "10k Resistor", category: "Other", description: "Standard pull-up/down resistor" }
    
];

async function seed() {
    await mongoose.connect(MONGODB_URI);
    console.log("Database Seeded!");
    process.exit();
}

seed();