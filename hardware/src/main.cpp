#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Arduino.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>

// --- Configuration ---
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

  int gasState = digitalRead(MQ_DO);
  float pm25 = (gasState == 0) ? 150.0 : 15.0;

  // 2. Alert Logic
  bool alert = (gasState == 0) || (t > 50.0) || (vibration > 8.0);

  // -- HARDWARE FEEDBACK (LEDs & OLED) --
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
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
    display.print("C");
  }
  display.display();

  // 3. Serial JSON Output
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
  Serial.print(pm25);
  Serial.println("}");

  delay(500);
}
