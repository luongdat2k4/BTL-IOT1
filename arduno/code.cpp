#include <Wire.h>
#include <BH1750.h>
#include "DHT.h"
#include <WiFi.h>
#include <WiFiManager.h>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>

// ====== Cảm biến DHT11 ======
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// ====== Relay ======
#define RELAY_TEMP 33
#define RELAY_HUMI 32
#define RELAY_LIGHT 25

BH1750 lightMeter;

// ====== MQTT Config ======
const char* mqtt_server = "2bc93b5857b249d3988054d99e413b9a.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "esp32";
const char* mqtt_pass = "Ltdat2004@";
const char* mqtt_topic = "sensor";
const char* mqtt_status_led_light = "status/light";
const char* mqtt_status_led_temperature = "status/temp";
const char* mqtt_status_led_humidity = "status/humi";
const char* mqtt_control_light_topic = "control/light";      // Bật/tắt ánh sáng
const char* mqtt_control_temperature_topic = "control/temp"; // Bật/tắt nhiệt độ
const char* mqtt_control_humidity_topic = "control/humi";    // Bật/tắt độ ẩm

WiFiClientSecure espClient;
PubSubClient client(espClient);

bool tempLed = false;
bool humiLed = false;
bool lightLed = false;

// ====== Hàm xử lý tin nhắn từ MQTT ======
void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.print("Nhận lệnh từ topic: ");
  Serial.print(topic);
  Serial.print(" | Message: ");
  Serial.println(message);

  // Điều khiển ánh sáng
  if (String(topic) == mqtt_control_light_topic) {
    if (message == "OFF") {
      digitalWrite(RELAY_LIGHT, LOW);
      lightLed = false;
      String payload = "{";
      payload += "\"status\": \"" + String(lightLed ? "ON" : "OFF") + "\"";
      payload += "}";
      client.publish(mqtt_status_led_light, payload.c_str());
      Serial.println("TẮT ĐÈN ÁNH SÁNG");
    } else if (message == "ON") {
      digitalWrite(RELAY_LIGHT, HIGH);
      lightLed = true;
      String payload = "{";
      payload += "\"status\": \"" + String(lightLed ? "ON" : "OFF") + "\"";
      payload += "}";
      client.publish(mqtt_status_led_light, payload.c_str());
      Serial.println("BẬT ĐÈN ÁNH SÁNG");
    }
  }

  // Điều khiển nhiệt độ
  if (String(topic) == mqtt_control_temperature_topic) {
    if (message == "OFF") {
      digitalWrite(RELAY_TEMP, LOW);
      tempLed = false;
      String payload = "{";
      payload += "\"status\": \"" + String(tempLed ? "ON" : "OFF") + "\"";
      payload += "}";
      client.publish(mqtt_status_led_temperature, payload.c_str());
      Serial.println("TẮT ĐÈN NHIỆT ĐỘ");
    } else if (message == "ON") {
      digitalWrite(RELAY_TEMP, HIGH);
      tempLed = true;
      String payload = "{";
      payload += "\"status\": \"" + String(tempLed ? "ON" : "OFF") + "\"";
      payload += "}";
      client.publish(mqtt_status_led_temperature, payload.c_str());
      Serial.println("BẬT ĐÈN NHIỆT ĐỘ");
    }
  }

  // Điều khiển độ ẩm
  if (String(topic) == mqtt_control_humidity_topic) {
    if (message == "OFF") {
      digitalWrite(RELAY_HUMI, LOW);
      humiLed = false;
      String payload = "{";
      payload += "\"status\": \"" + String(humiLed ? "ON" : "OFF") + "\"";
      payload += "}";
      client.publish(mqtt_status_led_humidity, payload.c_str());
      Serial.println("TẮT ĐÈN ĐỘ ẨM");
    } else if (message == "ON") {
      digitalWrite(RELAY_HUMI, HIGH);
      humiLed = true;
      String payload = "{";
      payload += "\"status\": \"" + String(humiLed ? "ON" : "OFF") + "\"";
      payload += "}";
      client.publish(mqtt_status_led_humidity, payload.c_str());
      Serial.println("BẬT ĐÈN ĐỘ ẨM");
    }
  }
}

// ====== Hàm reconnect MQTT ======
void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Đang kết nối MQTT...");
    if (client.connect("ESP32_Client", mqtt_user, mqtt_pass)) {
      Serial.println("Kết nối thành công!");
      client.subscribe(mqtt_control_light_topic);
      client.subscribe(mqtt_control_temperature_topic);
      client.subscribe(mqtt_control_humidity_topic);
    } else {
      Serial.print("Thất bại, mã lỗi = ");
      Serial.print(client.state());
      Serial.println(" -> thử lại sau 5s");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);

  // ===== WiFiManager =====
  WiFiManager wifiManager;
  if (!wifiManager.autoConnect("Dat")) {
    Serial.println("Không kết nối được Wi-Fi, reset ESP32...");
    delay(3000);
    ESP.restart();
  }
  Serial.println("Wi-Fi kết nối thành công!");
  Serial.print("IP ESP32: ");
  Serial.println(WiFi.localIP());

  // ===== Khởi động cảm biến =====
  Wire.begin(21, 22);
  if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
    Serial.println("BH1750 OK!");
  } else {
    Serial.println("Không tìm thấy BH1750!");
  }
  dht.begin();

  // ===== Cấu hình relay =====
  pinMode(RELAY_TEMP, OUTPUT);
  pinMode(RELAY_HUMI, OUTPUT);
  pinMode(RELAY_LIGHT, OUTPUT);
  digitalWrite(RELAY_TEMP, LOW);
  digitalWrite(RELAY_HUMI, LOW);
  digitalWrite(RELAY_LIGHT, LOW);

  // ===== MQTT Setup =====
  espClient.setInsecure();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  // Đọc dữ liệu cảm biến
  float lux = lightMeter.readLightLevel();
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  // Điều khiển relay tự động
  // bool tempLed = (!isnan(t) && t < 35);
  // bool humiLed = (!isnan(h) && h < 100);
  // bool lightLed = (lux > 0 && lux < 20);

  // Gửi dữ liệu qua MQTT
  String payload = "{";
  payload += "\"temperature\": " + String(t) + ",";
  payload += "\"humidity\": " + String(h) + ",";
  payload += "\"light\": " + String(lux) + ",";
  payload += "\"TemperatureLed\": \"" + String(tempLed ? "ON" : "OFF") + "\",";
  payload += "\"HumidityLed\": \"" + String(humiLed ? "ON" : "OFF") + "\",";
  payload += "\"LightLed\": \"" + String(lightLed ? "ON" : "OFF") + "\"";
  payload += "}";
  
  client.publish(mqtt_topic, payload.c_str());

  Serial.println("===== Gửi dữ liệu MQTT =====");
  Serial.println(payload);

  delay(3000);
}
