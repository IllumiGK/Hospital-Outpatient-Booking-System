using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;

public class DatabaseService
{
    private readonly string _connectionString;

    private static readonly string[] AllAppointmentTimes =
    {
        "09:00",
        "10:00",
        "10:30",
        "11:00",
        "13:00",
        "13:30",
        "15:00",
        "15:30",
        "16:00",
        "16:30",
        "17:00"
    };

    public DatabaseService(IConfiguration config)
    {
        _connectionString = config.GetConnectionString("DefaultConnection")!;
    }

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

    public void CreateAppointment(string email, string date, string time, string reason, string hospital)
    {
        using SqlConnection conn = new SqlConnection(_connectionString);
        string query = "INSERT INTO dbo.Appointments (Email, Date, Time, Reason, Hospital) VALUES (@Email, @Date, @Time, @Reason, @Hospital)";

        using SqlCommand cmd = new SqlCommand(query, conn);
        cmd.Parameters.AddWithValue("@Email", email);
        cmd.Parameters.AddWithValue("@Date", date);
        cmd.Parameters.AddWithValue("@Time", time);
        cmd.Parameters.AddWithValue("@Reason", reason);
        cmd.Parameters.AddWithValue("@Hospital", hospital);

        conn.Open();
        cmd.ExecuteNonQuery();
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
        cmd.Parameters.AddWithValue("@DatePattern", "__." + monthPart + "." + yearPart);

        conn.Open();
        using SqlDataReader reader = cmd.ExecuteReader();

        while (reader.Read())
        {
            string date = reader["Date"].ToString() ?? "";
            int bookedCount = Convert.ToInt32(reader["BookedCount"]);

            if (bookedCount <= 0)
            {
                statuses[date] = "available";
            }
            else if (bookedCount >= AllAppointmentTimes.Length)
            {
                statuses[date] = "none";
            }
            else
            {
                statuses[date] = "limited";
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
