#include <Arduino.h>
#include <ArduinoJson.h>
#include <DHT.h>

// --- Configuration ---
#ifdef ESP32
#define DHTPIN 4     // Connect DHT Data to GPIO 4 on ESP32
#define VIB_PIN 34   // Analog ADC1 Input (GPI 34)
#define PRESS_PIN 35 // Analog ADC1 Input (GPI 35)
#define WATER_PIN 32 // Analog ADC1 Input (GPI 32)
#define MQ_DO 27     // MQ Sensor Digital Output
#define BUZZER_PIN 13 // Active Buzzer Pin
#else
// Arduino Uno / Nano Defaults
#define DHTPIN 2
#define VIB_PIN A0
#define PRESS_PIN A1
#define WATER_PIN A2
#define MQ_DO 7 // Digital Pin 7 for MQ on Uno
#define BUZZER_PIN 8
#endif

#define DHTTYPE DHT11

// --- Globals ---
DHT dht(DHTPIN, DHTTYPE);

bool use_simulation = true; // Default to simulation if sensors fail

void setup() {
  Serial.begin(115200); // 115200 for ESP32
  dht.begin();

  pinMode(MQ_DO, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW); // Off initially

  // Wait a bit for serial connection
  delay(1000);
}

void loop() {
  // 1. Read Real Sensors
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  // Check if DHT is connected
  if (isnan(h) || isnan(t)) {
    // Use Simulation Mode for Temp/Hum if real sensor missing
    t = 25.0 + ((float)random(-10, 10) / 10.0);
    h = 60.0 + ((float)random(-20, 20) / 10.0);
  }

// Read Analog Sensors (Vibration, Pressure, Water/Soil)
#ifdef ESP32
  int rawVib = analogRead(VIB_PIN);
  int rawPress = analogRead(PRESS_PIN);
  int rawWater = analogRead(WATER_PIN);
#else
  int rawVib = analogRead(VIB_PIN);
  int rawPress = analogRead(PRESS_PIN);
  int rawWater = analogRead(WATER_PIN);
#endif

  // Map Real World Values
  float vibration = map(rawVib, 0, 4095, 0, 100) / 10.0;
  float pressure = map(rawPress, 0, 4095, 900, 1100);
  float soil_moist = map(rawWater, 0, 4095, 0, 100) / 100.0; // 0.0 to 1.0

  if (vibration == 0)
    vibration = 0.5 + ((float)random(0, 5) / 10.0); // Sim slight vibe

  // --- MQ GAS SENSOR ---
  // Read Digital Output (0 = Gas Detected, 1 = No Gas)
  int gasState = digitalRead(MQ_DO);
  float pm25 = (gasState == 0) ? 150.0 : 15.0; // High PM2.5 if gas detected

  // 2. Alert Logic (Buzzer + LED)
  // Trigger if Gas Detected (Low) OR Temp > 50C OR Vibration > 8.0
  bool alert = (gasState == 0) || (t > 50.0) || (vibration > 8.0);
  
  if (alert) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(100);
    digitalWrite(BUZZER_PIN, LOW);
    delay(100);
  } else {
    digitalWrite(BUZZER_PIN, LOW);
  }

  // 3. Format as JSON
  Serial.print("{");
  Serial.print("\"temperature\":");
  Serial.print(t);
  Serial.print(",");
  Serial.print("\"humidity\":");
  Serial.print(h);
  Serial.print(",");
  Serial.print("\"pressure\":");
  Serial.print(pressure);
  Serial.print(",");
  Serial.print("\"vibration\":");
  Serial.print(vibration);
  Serial.print(",");
  Serial.print("\"soil_moisture\":");
  Serial.print(soil_moist);
  Serial.print(",");
  Serial.print("\"pm2_5\":");
  Serial.print(pm25); // Send Gas as PM2.5
  Serial.println("}");

  // 4. Wait before next read
  delay(1000); // Faster loop for responsive buzzer
}
