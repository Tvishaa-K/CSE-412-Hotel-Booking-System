CREATE TABLE Guest (
    guestID INT PRIMARY KEY,
    fullName VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL
);

CREATE TABLE RoomType (
    roomTypeID INT PRIMARY KEY,
    typeName VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    basePrice DECIMAL(10,2) NOT NULL
);

CREATE TABLE Room (
    roomID INT PRIMARY KEY,
    floor INT NOT NULL,
    status VARCHAR(30) NOT NULL,
    roomTypeID INT NOT NULL,
    FOREIGN KEY (roomTypeID) REFERENCES RoomType(roomTypeID)
);

CREATE TABLE Space (
    spaceID INT PRIMARY KEY,
    spaceName VARCHAR(100) NOT NULL,
    capacity INT NOT NULL,
    hourlyRate DECIMAL(10,2) NOT NULL,
    status VARCHAR(30) NOT NULL
);

CREATE TABLE Upgrade (
    upgradeID INT PRIMARY KEY,
    upgradeName VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    price DECIMAL(10,2) NOT NULL
);

CREATE TABLE RoomReservation (
    roomReservationID INT PRIMARY KEY,
    guestID INT NOT NULL,
    roomID INT NOT NULL,
    checkInDate DATE NOT NULL,
    checkOutDate DATE NOT NULL,
    numGuests INT NOT NULL,
    status VARCHAR(30) NOT NULL,
    createdAt TIMESTAMP NOT NULL,
    FOREIGN KEY (guestID) REFERENCES Guest(guestID),
    FOREIGN KEY (roomID) REFERENCES Room(roomID)
);

CREATE TABLE SpaceReservation (
    spaceReservationID INT PRIMARY KEY,
    guestID INT NOT NULL,
    spaceID INT NOT NULL,
    startDateTime TIMESTAMP NOT NULL,
    endDateTime TIMESTAMP NOT NULL,
    numAttendees INT NOT NULL,
    status VARCHAR(30) NOT NULL,
    createdAt TIMESTAMP NOT NULL,
    FOREIGN KEY (guestID) REFERENCES Guest(guestID),
    FOREIGN KEY (spaceID) REFERENCES Space(spaceID)
);

CREATE TABLE RoomReservationUpgrade (
    roomReservationID INT NOT NULL,
    upgradeID INT NOT NULL,
    quantity INT NOT NULL,
    PRIMARY KEY (roomReservationID, upgradeID),
    FOREIGN KEY (roomReservationID) REFERENCES RoomReservation(roomReservationID),
    FOREIGN KEY (upgradeID) REFERENCES Upgrade(upgradeID)
);