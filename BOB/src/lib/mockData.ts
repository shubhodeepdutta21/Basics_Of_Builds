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
    matchPercentage: 0,
  }
];
