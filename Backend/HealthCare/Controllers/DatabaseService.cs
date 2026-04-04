using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;

//handles all database operations including users and appointments
public class DatabaseService
{
    private readonly string _connectionString;

    private static readonly string[] AllAppointmentTimes =
    {
        "09:00",
        "10:00",
        "11:00",
        "12:00",
        "13:00",
        "14:00",
        "15:00",
        "16:00",
        "17:00"
    };

    public DatabaseService(IConfiguration config)
    {
        _connectionString = config.GetConnectionString("DefaultConnection")!;
    }

    //Checks if a user already exists by email
    public bool UserExists(string email)
    {
        using SqlConnection conn = new SqlConnection(_connectionString);
        string query = "SELECT COUNT(*) FROM dbo.Users WHERE Email = @Email";

        using SqlCommand cmd = new SqlCommand(query, conn);
        cmd.Parameters.AddWithValue("@Email", email);

        conn.Open();
        int count = Convert.ToInt32(cmd.ExecuteScalar());
        return count > 0;
    }

    //Inserts a new user inot the Users table
    public void RegisterUser(string name, string email, string password)
    {
        using SqlConnection conn = new SqlConnection(_connectionString);
        string query = "INSERT INTO dbo.Users (Name, Email, Password) VALUES (@Name, @Email, @Password)";

        using SqlCommand cmd = new SqlCommand(query, conn);
        cmd.Parameters.AddWithValue("@Name", name);
        cmd.Parameters.AddWithValue("@Email", email);
        cmd.Parameters.AddWithValue("@Password", password);

        conn.Open();
        cmd.ExecuteNonQuery();
    }

    //Retrives a user by email and password for login
    public UserRecord? GetUserByCredentials(string email, string password)
    {
        using SqlConnection conn = new SqlConnection(_connectionString);
        string query = "SELECT TOP 1 UserID, Name, Email FROM dbo.Users WHERE Email = @Email AND Password = @Password";

        using SqlCommand cmd = new SqlCommand(query, conn);
        cmd.Parameters.AddWithValue("@Email", email);
        cmd.Parameters.AddWithValue("@Password", password);

        conn.Open();
        using SqlDataReader reader = cmd.ExecuteReader();

        if (!reader.Read())
        {
            return null;
        }

        return new UserRecord
        {
            UserID = Convert.ToInt32(reader["UserID"]),
            Name = reader["Name"].ToString() ?? "",
            Email = reader["Email"].ToString() ?? ""
        };
    }

<<<<<<< HEAD
    public bool CreateAppointment(
    string email,
    string date,
    string time,
    string reason,
    string hospital,
    string fullName,
    string dob,
    string nhukNumber)
=======
    //Creates a new appointment in the database
    public void CreateAppointment(string email, string date, string time, string reason, string hospital)
>>>>>>> 860baa49d4ba2b0760799e95f7b6260d04f2cdc9
    {
        using SqlConnection conn = new SqlConnection(_connectionString);
        conn.Open();

        string checkQuery = @"
        SELECT COUNT(*)
        FROM dbo.Appointments
        WHERE [Date] = @Date
          AND [Time] = @Time
          AND Hospital = @Hospital";

        using SqlCommand checkCmd = new SqlCommand(checkQuery, conn);
        checkCmd.Parameters.AddWithValue("@Date", date);
        checkCmd.Parameters.AddWithValue("@Time", time);
        checkCmd.Parameters.AddWithValue("@Hospital", hospital);

        int count = Convert.ToInt32(checkCmd.ExecuteScalar());

        if (count > 0)
        {
            return false;
        }

        string insertQuery = @"
        INSERT INTO dbo.Appointments
        (Email, [Date], [Time], Reason, Hospital, FullName, DOB, NHUKNumber)
        VALUES
        (@Email, @Date, @Time, @Reason, @Hospital, @FullName, @DOB, @NHUKNumber)";

        using SqlCommand insertCmd = new SqlCommand(insertQuery, conn);
        insertCmd.Parameters.AddWithValue("@Email", email);
        insertCmd.Parameters.AddWithValue("@Date", date);
        insertCmd.Parameters.AddWithValue("@Time", time);
        insertCmd.Parameters.AddWithValue("@Reason", reason);
        insertCmd.Parameters.AddWithValue("@Hospital", hospital);
        insertCmd.Parameters.AddWithValue("@FullName", fullName);
        insertCmd.Parameters.AddWithValue("@DOB", dob);
        insertCmd.Parameters.AddWithValue("@NHUKNumber",
            string.IsNullOrWhiteSpace(nhukNumber) ? DBNull.Value : nhukNumber);

        insertCmd.ExecuteNonQuery();
        return true;
    }

    
    public bool AppointmentSlotExists(string date, string time, string hospital, int? excludeAppointmentId = null)
    {
        using SqlConnection conn = new SqlConnection(_connectionString);

        string query = @"
            SELECT COUNT(*)
            FROM dbo.Appointments
            WHERE [Date] = @Date
              AND [Time] = @Time
              AND Hospital = @Hospital";

        if (excludeAppointmentId.HasValue)
        {
            query += " AND AppointmentID <> @AppointmentID";
        }

        using SqlCommand cmd = new SqlCommand(query, conn);
        cmd.Parameters.AddWithValue("@Date", date);
        cmd.Parameters.AddWithValue("@Time", time);
        cmd.Parameters.AddWithValue("@Hospital", hospital);

        if (excludeAppointmentId.HasValue)
        {
            cmd.Parameters.AddWithValue("@AppointmentID", excludeAppointmentId.Value);
        }

        conn.Open();
        int count = Convert.ToInt32(cmd.ExecuteScalar());
        return count > 0;
    }

    public List<string> GetBookedTimes(string date, string hospital)
    {
        List<string> bookedTimes = new List<string>();

        using SqlConnection conn = new SqlConnection(_connectionString);
        string query = @"
            SELECT [Time]
            FROM dbo.Appointments
            WHERE [Date] = @Date AND Hospital = @Hospital
            ORDER BY [Time]";

        using SqlCommand cmd = new SqlCommand(query, conn);
        cmd.Parameters.AddWithValue("@Date", date);
        cmd.Parameters.AddWithValue("@Hospital", hospital);

        conn.Open();
        using SqlDataReader reader = cmd.ExecuteReader();

        while (reader.Read())
        {
            bookedTimes.Add(reader["Time"].ToString() ?? "");
        }

        return bookedTimes;
    }

    public Dictionary<string, string> GetDayStatuses(int year, int month, string hospital)
    {
        Dictionary<string, string> statuses = new Dictionary<string, string>();

        using SqlConnection conn = new SqlConnection(_connectionString);
        string monthPart = month.ToString("D2");
        string yearPart = year.ToString();

        string query = @"
        SELECT [Date], COUNT(DISTINCT [Time]) AS BookedCount
        FROM dbo.Appointments
        WHERE Hospital = @Hospital
          AND [Date] LIKE @DatePattern
        GROUP BY [Date]
        ORDER BY [Date]";

        using SqlCommand cmd = new SqlCommand(query, conn);
        cmd.Parameters.AddWithValue("@Hospital", hospital);
        cmd.Parameters.AddWithValue("@DatePattern", "__/" + monthPart + "/" + yearPart);

        conn.Open();
        using SqlDataReader reader = cmd.ExecuteReader();

        while (reader.Read())
        {
            string date = reader["Date"].ToString() ?? "";
            int bookedCount = Convert.ToInt32(reader["BookedCount"]);
            int availableCount = AllAppointmentTimes.Length - bookedCount;

            if (availableCount == 0)
            {
                statuses[date] = "none";
            }
            else if (availableCount <= 5)
            {
                statuses[date] = "limited";
            }
            else
            {
                statuses[date] = "available";
            }
        }

        return statuses;
    }

    public AppointmentRecord? GetAppointmentById(int appointmentId)
    {
        using SqlConnection conn = new SqlConnection(_connectionString);
        string query = @"
            SELECT TOP 1 AppointmentID, Email, [Date], [Time], Reason, ISNULL(Hospital, '') AS Hospital
            FROM dbo.Appointments
            WHERE AppointmentID = @AppointmentID";

        using SqlCommand cmd = new SqlCommand(query, conn);
        cmd.Parameters.AddWithValue("@AppointmentID", appointmentId);

        conn.Open();
        using SqlDataReader reader = cmd.ExecuteReader();

        if (!reader.Read())
        {
            return null;
        }

        return new AppointmentRecord
        {
            AppointmentID = Convert.ToInt32(reader["AppointmentID"]),
            Email = reader["Email"].ToString() ?? "",
            Date = reader["Date"].ToString() ?? "",
            Time = reader["Time"].ToString() ?? "",
            Reason = reader["Reason"].ToString() ?? "",
            Hospital = reader["Hospital"].ToString() ?? ""
        };
    }

    public List<AppointmentRecord> GetAppointmentsByEmail(string email)
    {
        List<AppointmentRecord> appointments = new List<AppointmentRecord>();

        using SqlConnection conn = new SqlConnection(_connectionString);
        string query = @"
            SELECT AppointmentID, Email, [Date], [Time], Reason, ISNULL(Hospital, '') AS Hospital
            FROM dbo.Appointments
            WHERE Email = @Email
            ORDER BY AppointmentID DESC";

        using SqlCommand cmd = new SqlCommand(query, conn);
        cmd.Parameters.AddWithValue("@Email", email);

        conn.Open();
        using SqlDataReader reader = cmd.ExecuteReader();

        while (reader.Read())
        {
            appointments.Add(new AppointmentRecord
            {
                AppointmentID = Convert.ToInt32(reader["AppointmentID"]),
                Email = reader["Email"].ToString() ?? "",
                Date = reader["Date"].ToString() ?? "",
                Time = reader["Time"].ToString() ?? "",
                Reason = reader["Reason"].ToString() ?? "",
                Hospital = reader["Hospital"].ToString() ?? ""
            });
        }

        return appointments;
    }

    // Updates an existing appointment
    public bool UpdateAppointment(int appointmentId, string date, string time, string hospital)
    {
        using SqlConnection conn = new SqlConnection(_connectionString);
        string query = @"
            UPDATE dbo.Appointments
            SET [Date] = @Date, [Time] = @Time, Hospital = @Hospital
            WHERE AppointmentID = @AppointmentID";

        using SqlCommand cmd = new SqlCommand(query, conn);
        cmd.Parameters.AddWithValue("@Date", date);
        cmd.Parameters.AddWithValue("@Time", time);
        cmd.Parameters.AddWithValue("@Hospital", hospital);
        cmd.Parameters.AddWithValue("@AppointmentID", appointmentId);

        conn.Open();
        int rowsAffected = cmd.ExecuteNonQuery();

        return rowsAffected > 0;
    }

    //Deletes an appointment from the database
    public bool DeleteAppointment(int appointmentId)
    {
        using SqlConnection conn = new SqlConnection(_connectionString);
        string query = "DELETE FROM dbo.Appointments WHERE AppointmentID = @AppointmentID";

        using SqlCommand cmd = new SqlCommand(query, conn);
        cmd.Parameters.AddWithValue("@AppointmentID", appointmentId);

        conn.Open();
        int rowsAffected = cmd.ExecuteNonQuery();

        return rowsAffected > 0;
    }
}

public class AppointmentRecord
{
    public int AppointmentID { get; set; }
    public string Email { get; set; } = "";
    public string Date { get; set; } = "";
    public string Time { get; set; } = "";
    public string Reason { get; set; } = "";
    public string Hospital { get; set; } = "";
}

public class UserRecord
{
    public int UserID { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
}