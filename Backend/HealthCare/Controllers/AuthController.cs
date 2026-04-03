using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly DatabaseService _db;

    public AuthController(DatabaseService db)
    {
        _db = db;
    }

    [HttpPost("register")]
    public IActionResult Register([FromBody] RegisterRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name) ||
            string.IsNullOrWhiteSpace(req.Email) ||
            string.IsNullOrWhiteSpace(req.Password))
        {
            return BadRequest("Name, email, and password are required.");
        }

        if (_db.UserExists(req.Email))
        {
            return Conflict("An account with this email already exists.");
        }

        _db.RegisterUser(req.Name, req.Email, req.Password);
        return Ok("User registered");
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
        {
            return BadRequest("Email and password are required.");
        }

        var user = _db.GetUserByCredentials(req.Email, req.Password);

        if (user == null)
        {
            return Unauthorized("Invalid credentials");
        }

        return Ok(new LoginResponse
        {
            Message = "Login successful",
            Name = user.Name,
            Email = user.Email
        });
    }
}

public class RegisterRequest
{
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}

public class LoginRequest
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}

public class LoginResponse
{
    public string Message { get; set; } = "";
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
}
