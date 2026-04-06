IF COL_LENGTH('dbo.Appointments', 'Hospital') IS NULL
BEGIN
    ALTER TABLE dbo.Appointments
    ADD Hospital NVARCHAR(200) NULL;
END