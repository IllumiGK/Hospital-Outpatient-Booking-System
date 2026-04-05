INSERT INTO dbo.Users (Name, Email, Password, DOB, Gender, Address)
VALUES
('Ali Khan', 'ali@gmail.com', '123456', '2000-05-12', 'Male', 'London, UK'),
('Sarah Ahmed', 'sarah@gmail.com', '123456', '1998-11-03', 'Female', 'Manchester, UK'),
('John Smith', 'john@gmail.com', '123456', '1985-07-22', 'Male', 'Birmingham, UK'),
('Emily Clark', 'emily@gmail.com', '123456', '1992-02-14', 'Female', 'Leeds, UK'),
('David Wilson', 'david@gmail.com', '123456', '1979-09-30', 'Male', 'Liverpool, UK');

-- Fully booked day (RED)

INSERT INTO dbo.Appointments (Email, Date, Time, Reason, Hospital, FullName, DOB, NHUKNumber)
VALUES
('ali@gmail.com','10/04/2026','09:00','Checkup','Chelsea and Westminster Hospital','Ali Khan','2000-05-12','NHUK001'),
('sarah@gmail.com','10/04/2026','10:00','Flu','Chelsea and Westminster Hospital','Sarah Ahmed','1998-11-03','NHUK002'),
('john@gmail.com','10/04/2026','11:00','Injury','Chelsea and Westminster Hospital','John Smith','1985-07-22','NHUK003'),
('emily@gmail.com','10/04/2026','12:00','Consultation','Chelsea and Westminster Hospital','Emily Clark','1992-02-14','NHUK004'),
('david@gmail.com','10/04/2026','13:00','Checkup','Chelsea and Westminster Hospital','David Wilson','1979-09-30','NHUK005'),
('ali@gmail.com','10/04/2026','14:00','Follow-up','Chelsea and Westminster Hospital','Ali Khan','2000-05-12','NHUK006'),
('sarah@gmail.com','10/04/2026','15:00','Consultation','Chelsea and Westminster Hospital','Sarah Ahmed','1998-11-03','NHUK007'),
('john@gmail.com','10/04/2026','16:00','Review','Chelsea and Westminster Hospital','John Smith','1985-07-22','NHUK008'),
('emily@gmail.com','10/04/2026','17:00','Checkup','Chelsea and Westminster Hospital','Emily Clark','1992-02-14','NHUK009');

-- Limited slots day (AMBER)

INSERT INTO dbo.Appointments (Email, Date, Time, Reason, Hospital, FullName, DOB, NHUKNumber)
VALUES
('ali@gmail.com','12/04/2026','09:00','Checkup','St Mary''s Hospital','Ali Khan','2000-05-12',NULL),
('sarah@gmail.com','12/04/2026','10:00','Flu','St Mary''s Hospital','Sarah Ahmed','1998-11-03',NULL),
('john@gmail.com','12/04/2026','11:00','Consultation','St Mary''s Hospital','John Smith','1985-07-22',NULL),
('emily@gmail.com','12/04/2026','13:00','Review','St Mary''s Hospital','Emily Clark','1992-02-14',NULL),
('david@gmail.com','12/04/2026','15:00','Checkup','St Mary''s Hospital','David Wilson','1979-09-30',NULL);

-- Available day (GREEN)

INSERT INTO dbo.Appointments (Email, Date, Time, Reason, Hospital, FullName, DOB, NHUKNumber)
VALUES
('ali@gmail.com','14/04/2026','09:00','Checkup','Royal London Hospital','Ali Khan','2000-05-12',NULL),
('sarah@gmail.com','14/04/2026','11:00','Consultation','Royal London Hospital','Sarah Ahmed','1998-11-03',NULL);

-- Another hospital (for variety)

INSERT INTO dbo.Appointments (Email, Date, Time, Reason, Hospital, FullName, DOB, NHUKNumber)
VALUES
('ali@gmail.com','14/04/2026','09:00','Checkup','Royal London Hospital','Ali Khan','2000-05-12',NULL),
('sarah@gmail.com','14/04/2026','11:00','Consultation','Royal London Hospital','Sarah Ahmed','1998-11-03',NULL);