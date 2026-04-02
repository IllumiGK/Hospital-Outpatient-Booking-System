using System.Data.SqlClient;

public class DatabaseService
{
    private readonly string _connectionString;

    public DatabaseService(IConfiguration config)
    {
        _connectionString = config.GetConnectionString("DefaultConnection");
    }

    public void RegisterUser(string name, string email, string password)
    {
        using (SqlConnection conn = new SqlConnection(_connectionString))
        {
            string query = "INSERT INTO dbo.Users (Name, Email, Password) VALUES (@Name, @Email, @Password)";
    
            SqlCommand cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@Name", name);
            cmd.Parameters.AddWithValue("@Email", email);
            cmd.Parameters.AddWithValue("@Password", password);
    
            conn.Open();
            cmd.ExecuteNonQuery();
        }
    }

    public bool CheckUser(string email, string password)
    {
        using (SqlConnection conn = new SqlConnection(_connectionString));
        {
            string query = "SELECT COUNT(*) FROM dbo.Users WHERE Email=@Email AND Password=@Password";
    
            SqlCommand cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@Email", email);
            cmd.Parameters.AddWithValue("@Password", password);
            
            conn.Open();
            int count = (int)cmd.ExecuteScalar();
            return count > 0;
        }
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

    public List<AppointmentRecord> GetAppointmentsByEmail(string email)
    {
        List<AppointmentRecord> appointments = new List<AppointmentRecord>();

        using SqlConnection conn = new SqlConnection(_connectionString);
        string query = "SELECT AppointmentID, Email, Date, Time, Reason, ISNULL(Hospital, '') AS Hospital FROM dbo.Appointments WHERE Email = @Email ORDER BY AppointmentID DESC";

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
        string query = "UPDATE dbo.Appointments SET Date = @Date, Time = @Time, Hospital = @Hospital WHERE AppointmentID = @AppointmentID";

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


