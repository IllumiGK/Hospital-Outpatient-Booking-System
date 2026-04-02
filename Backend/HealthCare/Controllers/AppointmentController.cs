using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/appointments")]
public class AppointmentController : ControllerBase
{
    private readonly DatabaseService _db;

    public AppointmentController(DatabaseService db)
    {
        _db = db;
    }

    [HttpPost]
    public IActionResult Create([FromBody] AppointmentRequest req)
    {
        _db.CreateAppointment(req.Email, req.Date, req.Time, req.Reason, req.Hospital);
        return Ok("Appointment booked");
    }

    [HttpGet("user/{email}")]
    public IActionResult GetByUser(string email)
    {
        var appointments = _db.GetAppointmentsByEmail(email);
        return Ok(appointments);
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] UpdateAppointmentRequest req)
    {
        bool updated = _db.UpdateAppointment(id, req.Date, req.Time, req.Hospital);

        if (!updated)
        {
            return NotFound("Appointment not found");
        }

        return Ok("Appointment updated");
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        bool deleted = _db.DeleteAppointment(id);

        if (!deleted)
        {
            return NotFound("Appointment not found");
        }

        return Ok("Appointment cancelled");
    }
}

public class AppointmentRequest
{
    public string Email { get; set; } = "";
    public string Date { get; set; } = "";
    public string Time { get; set; } = "";
    public string Reason { get; set; } = "";
    public string Hospital { get; set; } = "";
}

public class UpdateAppointmentRequest
{
    public string Date { get; set; } = "";
    public string Time { get; set; } = "";
    public string Hospital { get; set; } = "";
}
