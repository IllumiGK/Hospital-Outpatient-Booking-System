INSERT INTO dbo.Users (Name, Email, Password)
VALUES
('Ali Khan', 'ali@gmail.com', '123456'),
('Sara Ahmed', 'sara@gmail.com', '123456'),
('John Smith', 'john@gmail.com', '123456'),
('Ayesha Malik', 'ayesha@gmail.com', '123456'),
('David Brown', 'david@gmail.com', '123456'),
('Mariam Noor', 'mariam@gmail.com', '123456'),
('Adam Lewis', 'adam@gmail.com', '123456'),
('Zain Hussain', 'zain@gmail.com', '123456'),
('Emma Clarke', 'emma@gmail.com', '123456');
INSERT INTO dbo.Appointments
(Email, [Date], [Time], Reason, Hospital, FullName, DOB, NHUKNumber)
VALUES

-- GREEN DAY (only 2 bookings)
('ali@gmail.com', '10/04/2026', '09:00', 'Checkup', 'Imperial College Healthcare NHS Trust', 'Ali Khan', '12/08/2003', NULL),
('sara@gmail.com', '10/04/2026', '10:00', 'Follow-up', 'Imperial College Healthcare NHS Trust', 'Sara Ahmed', '03/05/2002', 'NHUK12345'),

-- AMBER DAY (4 bookings → limited)
('john@gmail.com', '11/04/2026', '09:00', 'Consultation', 'St Mary''s Hospital', 'John Smith', '10/01/2000', NULL),
('ayesha@gmail.com', '11/04/2026', '10:00', 'Blood Test', 'St Mary''s Hospital', 'Ayesha Malik', '14/06/2001', 'NHUK56789'),
('david@gmail.com', '11/04/2026', '11:00', 'Checkup', 'St Mary''s Hospital', 'David Brown', '21/02/1999', NULL),
('mariam@gmail.com', '11/04/2026', '12:00', 'Review', 'St Mary''s Hospital', 'Mariam Noor', '18/09/2003', NULL),

-- RED DAY (ALL 9 slots booked)
('adam@gmail.com', '14/04/2026', '09:00', 'Checkup', 'Chelsea and Westminster Hospital', 'Adam Lewis', '05/03/2002', NULL),
('zain@gmail.com', '14/04/2026', '10:00', 'Consultation', 'Chelsea and Westminster Hospital', 'Zain Hussain', '07/07/2001', NULL),
('emma@gmail.com', '14/04/2026', '11:00', 'Review', 'Chelsea and Westminster Hospital', 'Emma Clarke', '09/11/2000', NULL),
('ali@gmail.com', '14/04/2026', '12:00', 'Checkup', 'Chelsea and Westminster Hospital', 'Ali Khan', '12/08/2003', NULL),
('sara@gmail.com', '14/04/2026', '13:00', 'Follow-up', 'Chelsea and Westminster Hospital', 'Sara Ahmed', '03/05/2002', NULL),
('john@gmail.com', '14/04/2026', '14:00', 'Consultation', 'Chelsea and Westminster Hospital', 'John Smith', '10/01/2000', NULL),
('ayesha@gmail.com', '14/04/2026', '15:00', 'Blood Test', 'Chelsea and Westminster Hospital', 'Ayesha Malik', '14/06/2001', NULL),
('david@gmail.com', '14/04/2026', '16:00', 'Review', 'Chelsea and Westminster Hospital', 'David Brown', '21/02/1999', NULL),
('mariam@gmail.com', '14/04/2026', '17:00', 'Checkup', 'Chelsea and Westminster Hospital', 'Mariam Noor', '18/09/2003', NULL),

-- EXTRA GREEN DAY
('adam@gmail.com', '15/04/2026', '09:00', 'Checkup', 'Royal London Hospital', 'Adam Lewis', '05/03/2002', NULL),

-- EXTRA AMBER DAY (5 bookings)
('zain@gmail.com', '16/04/2026', '09:00', 'Consultation', 'Guy''s and St Thomas'' Hospital', 'Zain Hussain', '07/07/2001', NULL),
('emma@gmail.com', '16/04/2026', '10:00', 'Review', 'Guy''s and St Thomas'' Hospital', 'Emma Clarke', '09/11/2000', NULL),
('ali@gmail.com', '16/04/2026', '11:00', 'Checkup', 'Guy''s and St Thomas'' Hospital', 'Ali Khan', '12/08/2003', NULL),
('sara@gmail.com', '16/04/2026', '12:00', 'Follow-up', 'Guy''s and St Thomas'' Hospital', 'Sara Ahmed', '03/05/2002', NULL),
('john@gmail.com', '16/04/2026', '13:00', 'Consultation', 'Guy''s and St Thomas'' Hospital', 'John Smith', '10/01/2000', NULL);