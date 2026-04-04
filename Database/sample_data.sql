INSERT INTO dbo.Users (Name, Email, Password)
VALUES
('Ali Khan', 'ali@gmail.com', 'Ali123'),
('Sara Ahmed', 'sara@gmail.com', 'Sara123'),
('John Smith', 'john@gmail.com', 'John123'),
('Ayesha Malik', 'ayesha@gmail.com', 'Ayesha123'),
('David Brown', 'david@gmail.com', 'David123');

INSERT INTO dbo.Appointments (Email, [Date], [Time], Reason, Hospital)
VALUES
('ali@gmail.com', '2026-04-10', '09:00 AM', 'General Checkup', 'North Middlesex Hospital'),
('sara@gmail.com', '2026-04-10', '10:00 AM', 'Skin Consultation', 'Royal Free Hospital'),
('john@gmail.com', '2026-04-11', '11:00 AM', 'Neurology Review', 'Barnet Hospital'),
('ayesha@gmail.com', '2026-04-12', '01:00 PM', 'Follow-up Appointment', 'Whittington Hospital'),
('david@gmail.com', '2026-04-12', '02:00 PM', 'Blood Test Review', 'University College Hospital');