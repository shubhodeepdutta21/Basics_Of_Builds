export const MOCK_COMPONENTS = [
  { id: '1', name: 'Arduino Uno R3', category: 'Microcontrollers', description: 'Classic 8-bit MCU board', imageUrl: '/arduino.png' },
  { id: '2', name: 'ESP32 Wi-Fi Module', category: 'Microcontrollers', description: 'Dual-core MCU with Wi-Fi & BT', imageUrl: '/esp32.png' },
  { id: '3', name: 'DHT11 Temp & Humidity Sensor', category: 'Sensors', description: 'Basic digital temp sensor', imageUrl: '/dht11.png' },
  { id: '4', name: 'HC-SR04 Ultrasonic Sensor', category: 'Sensors', description: 'Distance measurement sensor', imageUrl: '/hcsr04.png' },
  { id: '5', name: '0.96 OLED Display (I2C)', category: 'Displays', description: 'Small monochrome display', imageUrl: '/oled.png' },
  { id: '6', name: 'L298N Motor Driver', category: 'Actuators', description: 'Dual H-Bridge driver', imageUrl: '/l298n.png' },
  { id: '7', name: 'DC Gear Motor', category: 'Actuators', description: 'Generic 3-6V toy motor', imageUrl: '/motor.png' },
  { id: '8', name: 'Breadboard (Half-size)', category: 'Basics', description: 'Prototyping board', imageUrl: '/breadboard.png' },
  { id: '9', name: 'Jumper Wires (M-M)', category: 'Basics', description: 'Wiring', imageUrl: '/wires.png' },
];

export const MOCK_PROJECTS = [
  {
    id: 'p1',
    title: 'Smart Weather Station',
    description: 'Build a weather station that connects to Wi-Fi and displays current temp & humidity.',
    difficultyLevel: 'Intermediate',
    estimatedTime: '2 Hours',
    requirements: [
      { componentId: '2', requiredQuantity: 1, isOptional: false }, // ESP32
      { componentId: '3', requiredQuantity: 1, isOptional: false }, // DHT11
      { componentId: '5', requiredQuantity: 1, isOptional: true },  // OLED
      { componentId: '8', requiredQuantity: 1, isOptional: false }, // Breadboard
      { componentId: '9', requiredQuantity: 5, isOptional: false }, // Wires
    ],
    steps: [
      "Plug the ESP32 onto the breadboard and connect VCC/GND lines to power rails.",
      "Connect the DHT11 sensor data pin to ESP32 GPIO 4 with a pull-up resistor.",
      "Connect the 0.96 OLED display via I2C (SDA to GPIO 21, SCL to GPIO 22).",
      "Flash the ESP32 firmware with your Wi-Fi credentials and OpenWeatherMap sketch.",
      "Power up via USB and verify temperature and humidity readings on the OLED display."
    ],
    matchPercentage: 0, // dynamic
  },
  {
    id: 'p2',
    title: 'Obstacle Avoiding Robot',
    description: 'A basic two-wheel robot that uses an ultrasonic sensor to avoid crashing into walls.',
    difficultyLevel: 'Beginner',
    estimatedTime: '3 Hours',
    requirements: [
      { componentId: '1', requiredQuantity: 1, isOptional: false }, // Arduino
      { componentId: '4', requiredQuantity: 1, isOptional: false }, // HC-SR04
      { componentId: '6', requiredQuantity: 1, isOptional: false }, // L298N
      { componentId: '7', requiredQuantity: 2, isOptional: false }, // Gear Motors
      { componentId: '8', requiredQuantity: 1, isOptional: false }, // Breadboard
      { componentId: '9', requiredQuantity: 10, isOptional: false }, // Wires
    ],
    steps: [
      "Mount the DC gear motors onto the chassis frame and wire them to L298N motor outputs.",
      "Connect Arduino Uno digital control pins (5, 6, 9, 10) to L298N inputs.",
      "Attach the HC-SR04 ultrasonic sensor to the front chassis, connecting Trig to pin 12 and Echo to pin 11.",
      "Upload the Arduino obstacle-avoidance code that reads sensor distance and steers motors.",
      "Connect the external battery pack, place robot on the floor, and verify obstacle avoidance."
    ],
    matchPercentage: 0,
  }
];
