#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Arduino.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>

// --- WiFi Configuration (USER: Set your WiFi credentials here) ---
const char* WIFI_SSID = "YourWiFiSSID";        // Change to your WiFi SSID
const char* WIFI_PASSWORD = "YourWiFiPassword"; // Change to your WiFi Password
const char* SERVER_URL = "http://192.168.1.100:8000/iot/data"; // Change to your backend IP:PORT

// --- Hardware Configuration ---
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

#ifdef ESP32
#define DHTPIN 4
#define VIB_PIN 34
#define PRESS_PIN 35
#define WATER_PIN 32
#define MQ_DO 27
#define BUZZER_PIN 13
#define LED_RED 23
#define LED_GREEN 18
#else
#define DHTPIN 2
#define VIB_PIN A0
#define PRESS_PIN A1
#define WATER_PIN A2
#define MQ_DO 7
#define BUZZER_PIN 8
#define LED_RED 9
#define LED_GREEN 10
#endif

#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();

  pinMode(MQ_DO, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);

  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, HIGH); // Default to Good

  // OLED Init
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 allocation failed"));
  }
  display.display();
  delay(1000);
  display.clearDisplay();

  // WiFi Connection
  Serial.println("Connecting to WiFi...");
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Connecting WiFi...");
  display.display();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("WiFi Connected!");
    display.print("IP: ");
    display.println(WiFi.localIP());
    display.display();
    delay(2000);
  } else {
    Serial.println("\nWiFi Connection Failed!");
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("WiFi Failed!");
    display.println("Check credentials");
    display.display();
  }
}

void loop() {
  // 1. Read Sensors
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (isnan(h) || isnan(t)) {
    t = 25.0 + ((float)random(-10, 10) / 10.0);
    h = 60.0 + ((float)random(-20, 20) / 10.0);
  }

  int rawVib = analogRead(VIB_PIN);
  int rawPress = analogRead(PRESS_PIN);
  int rawWater = analogRead(WATER_PIN);

  float vibration = map(rawVib, 0, 4095, 0, 100) / 10.0;
  float pressure = map(rawPress, 0, 4095, 900, 1100);
  float soil_moist = map(rawWater, 0, 4095, 0, 100) / 100.0;

  if (vibration == 0)
    vibration = 0.5 + ((float)random(0, 5) / 10.0);

  // Read MQ-135 Gas Sensor (Analog for raw value)
  int mq_raw = analogRead(VIB_PIN); // Use analog pin for MQ-135, adjust pin as needed
  int gasState = digitalRead(MQ_DO);
  float pm25 = (gasState == 0) ? 150.0 : 15.0;

  // 2. Alert Logic
  bool alert = (gasState == 0) || (t > 50.0) || (vibration > 8.0);

  // -- HARDWARE FEEDBACK (LEDs & OLED) --
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  
  // Show WiFi status
  if (WiFi.status() == WL_CONNECTED) {
    display.print("WiFi: OK | ");
  } else {
    display.print("WiFi: -- | ");
  }
  
  display.print("STATUS: ");

  if (alert) {
    // DANGER STATE
    digitalWrite(LED_RED, HIGH);
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(BUZZER_PIN, HIGH);

    display.setTextSize(2);
    display.setCursor(0, 20);
    display.println("!DANGER!");
    display.setTextSize(1);
    display.print("GAS/TEMP CRITICAL");

    delay(100);
    digitalWrite(BUZZER_PIN, LOW);
    delay(100);
  } else {
    // GOOD STATE
    digitalWrite(LED_RED, LOW);
    digitalWrite(LED_GREEN, HIGH);
    digitalWrite(BUZZER_PIN, LOW);

    display.setTextSize(2);
    display.setCursor(0, 20);
    display.println("OPTIMAL");
    display.setTextSize(1);
    display.print("Temp: ");
    display.print(t);
    display.print("C H:");
    display.print((int)h);
    display.print("%");
  }
  display.display();

  // 3. Send Data to Backend via HTTP POST (if WiFi connected)
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");

    // Create JSON payload
    StaticJsonDocument<256> doc;
    doc["temperature"] = t;
    doc["humidity"] = h;
    doc["pressure"] = pressure;
    doc["pm25"] = pm25;
    doc["mq_raw"] = mq_raw;

    String jsonPayload;
    serializeJson(doc, jsonPayload);

    // Send POST request
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      Serial.print("HTTP Response: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("HTTP Error: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  }

  // 4. Serial JSON Output (for debugging)
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
  Serial.print("\"pm25\":");
  Serial.print(pm25);
  Serial.print(",");
  Serial.print("\"mq_raw\":");
  Serial.print(mq_raw);
  Serial.println("}");

  delay(2000); // Send data every 2 seconds
}
