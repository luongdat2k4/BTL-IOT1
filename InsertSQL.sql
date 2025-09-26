CREATE TABLE `datarequest` (
   `RequestID` varchar(50) NOT NULL,
   `Humidity` float DEFAULT NULL,
   `Light` float DEFAULT NULL,
   `Temperature` float DEFAULT NULL,
   `Time` datetime DEFAULT CURRENT_TIMESTAMP,
   `HumidityLed` varchar(10) DEFAULT NULL,
   `LightLed` varchar(10) DEFAULT NULL,
   `TemperatureLed` varchar(10) DEFAULT NULL,
   PRIMARY KEY (`RequestID`)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
 
CREATE TABLE `user` (
   `UserID` varchar(50) NOT NULL,
   `name` varchar(100) NOT NULL,
   `phoneNumber` varchar(15) NOT NULL,
   PRIMARY KEY (`UserID`)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
 
CREATE TABLE `history` (
   `HistoryID` varchar(50) NOT NULL,
   `Subject` varchar(255) DEFAULT NULL,
   `Status` varchar(50) DEFAULT NULL,
   `UserID` varchar(50) DEFAULT NULL,
   `RequestID` varchar(50) DEFAULT NULL,
   `Time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (`HistoryID`),
   KEY `UserID` (`UserID`),
   KEY `RequestID` (`RequestID`),
   CONSTRAINT `history_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `user` (`UserID`) ON DELETE CASCADE ON UPDATE CASCADE,
   CONSTRAINT `history_ibfk_2` FOREIGN KEY (`RequestID`) REFERENCES `datarequest` (`RequestID`) ON DELETE CASCADE ON UPDATE CASCADE
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
 