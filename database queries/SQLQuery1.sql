CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100),
    Email NVARCHAR(100),
    Password NVARCHAR(100)
);

CREATE TABLE Appointments (
    AppointmentID INT PRIMARY KEY IDENTITY(1,1),
    Email NVARCHAR(100),
    Date NVARCHAR(50),
    Time NVARCHAR(50),
    Reason NVARCHAR(255)
);