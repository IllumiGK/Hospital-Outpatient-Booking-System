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
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            string query = "INSERT INTO Users (Name, Email, Password) VALUES (@Name, @Email, @Password)";

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
        using (SqlConnection conn = new SqlConnection(_connectionString))
        {
            conn.Open();

            string query = "SELECT COUNT(*) FROM Users WHERE Email=@Email AND Password=@Password";

            SqlCommand cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@Email", email);
            cmd.Parameters.AddWithValue("@Password", password);

            int count = (int)cmd.ExecuteScalar();

            return count > 0;
        }
    }
}
