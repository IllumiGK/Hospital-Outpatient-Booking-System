using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

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
        if (string.IsNullOrWhiteSpace(req.Email) ||
            string.IsNullOrWhiteSpace(req.Date) ||
            string.IsNullOrWhiteSpace(req.Time) ||
            string.IsNullOrWhiteSpace(req.Reason) ||
            string.IsNullOrWhiteSpace(req.Hospital))
        {
            return BadRequest("All appointment fields are required.");
        }

        if (_db.AppointmentSlotExists(req.Date, req.Time, req.Hospital))
        {
            return Conflict("This appointment slot has already been booked.");
        }

        _db.CreateAppointment(req.Email, req.Date, req.Time, req.Reason, req.Hospital);
        return Ok("Appointment booked");
    }

    [HttpGet("user/{email}")]
    public IActionResult GetByUser(string email)
    {
        var appointments = _db.GetAppointmentsByEmail(email);
        return Ok(appointments);
    }

    [HttpGet("status-by-month")]
    public IActionResult GetStatusByMonth([FromQuery] int year, [FromQuery] int month, [FromQuery] string hospital)
    {
        if (year <= 0 || month < 1 || month > 12 || string.IsNullOrWhiteSpace(hospital))
        {
            return BadRequest("Year, month, and hospital are required.");
        }

        var statuses = _db.GetDayStatuses(year, month, hospital);
        return Ok(statuses);
    }

    [HttpGet("times/{date}")]
    public IActionResult GetBookedTimes(string date, [FromQuery] string hospital)
    {
        if (string.IsNullOrWhiteSpace(date) || string.IsNullOrWhiteSpace(hospital))
        {
            return BadRequest("Date and hospital are required.");
        }

        List<string> bookedTimes = _db.GetBookedTimes(date, hospital);
        return Ok(bookedTimes);
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] UpdateAppointmentRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Date) ||
            string.IsNullOrWhiteSpace(req.Time) ||
            string.IsNullOrWhiteSpace(req.Hospital))
        {
            return BadRequest("Date, time, and hospital are required.");
        }

        var existingAppointment = _db.GetAppointmentById(id);
        if (existingAppointment == null)
        {
            return NotFound("Appointment not found");
        }

        if (_db.AppointmentSlotExists(req.Date, req.Time, req.Hospital, id))
        {
            return Conflict("This appointment slot has already been booked.");
        }

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
