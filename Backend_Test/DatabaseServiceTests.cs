using Microsoft.VisualStudio.TestTools.UnitTesting;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Backend_Test
{
    [TestClass]
    public class DatabaseServiceTests
    {
        private DatabaseService _db = null!;
        private readonly List<string> _createdEmails = new();

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

        [TestInitialize]
        public void TestInitialize()
        {
            _db = CreateDatabaseService();
        }

        [TestCleanup]
        public void TestCleanup()
        {
            // Remove any appointments created during the test run.
            // We are not changing backend code, so cleanup uses existing service methods.
            foreach (string email in _createdEmails.Distinct())
            {
                var appointments = _db.GetAppointmentsByEmail(email);

                foreach (var appointment in appointments)
                {
                    _db.DeleteAppointment(appointment.AppointmentID);
                }
            }
        }

        private DatabaseService CreateDatabaseService()
        {
            var settings = new Dictionary<string, string?>()
            {
                {
                    "ConnectionStrings:DefaultConnection",
                    "Server=(localdb)\\MSSQLLocalDB;Database=HealthcareDB;Trusted_Connection=True;TrustServerCertificate=True;"
                }
            };

            IConfiguration config = new ConfigurationBuilder()
                .AddInMemoryCollection(settings)
                .Build();

            return new DatabaseService(config);
        }

        private string NewEmail()
        {
            return $"test_{Guid.NewGuid():N}@example.com";
        }

        private string NewHospital(string prefix)
        {
            return $"{prefix}_{Guid.NewGuid():N}";
        }

        private void RegisterTempUser(
            string email,
            string name = "Test User",
            string password = "123456",
            string dob = "2000-01-01",
            string gender = "Male",
            string address = "London, UK")
        {
            _db.RegisterUser(name, email, password, dob, gender, address);
            _createdEmails.Add(email);
        }

        private int CreateTempAppointment(
            string email,
            string date,
            string time,
            string hospital,
            string reason = "Test Reason",
            string fullName = "Test User",
            string dob = "2000-01-01",
            string nhukNumber = "")
        {
            bool created = _db.CreateAppointment(
                email,
                date,
                time,
                reason,
                hospital,
                fullName,
                dob,
                nhukNumber);

            Assert.IsTrue(created, "Expected appointment creation to succeed.");

            var appointment = _db
                .GetAppointmentsByEmail(email)
                .FirstOrDefault(a => a.Date == date && a.Time == time && a.Hospital == hospital);

            Assert.IsNotNull(appointment, "Created appointment could not be found afterwards.");

            return appointment!.AppointmentID;
        }

        [TestMethod]
        public void RegisterUser_ThenUserExists_ReturnsTrue()
        {
            string email = NewEmail();

            RegisterTempUser(email);

            bool exists = _db.UserExists(email);

            Assert.IsTrue(exists);
        }

        [TestMethod]
        public void GetUserByCredentials_WithCorrectPassword_ReturnsUser()
        {
            string email = NewEmail();
            string password = "abc123";

            RegisterTempUser(email, "Login User", password);

            var user = _db.GetUserByCredentials(email, password);

            Assert.IsNotNull(user);
            Assert.AreEqual(email, user!.Email);
            Assert.AreEqual("Login User", user.Name);
        }

        [TestMethod]
        public void GetUserByCredentials_WithWrongPassword_ReturnsNull()
        {
            string email = NewEmail();

            RegisterTempUser(email, "Wrong Password User", "correct123");

            var user = _db.GetUserByCredentials(email, "wrong123");

            Assert.IsNull(user);
        }

        [TestMethod]
        public void GetUserDetailsByEmail_AfterRegister_ReturnsExpectedDetails()
        {
            string email = NewEmail();

            RegisterTempUser(
                email,
                "Details User",
                "123456",
                "1999-12-31",
                "Female",
                "Hendon, London");

            var userDetails = _db.GetUserDetailsByEmail(email);

            Assert.IsNotNull(userDetails);
            Assert.AreEqual("Details User", userDetails!.Name);
            Assert.AreEqual(email, userDetails.Email);
            Assert.AreEqual("1999-12-31", userDetails.DOB);
            Assert.AreEqual("Female", userDetails.Gender);
            Assert.AreEqual("Hendon, London", userDetails.Address);
        }

        [TestMethod]
        public void CreateAppointment_WithFreeSlot_ReturnsTrue()
        {
            string email = NewEmail();
            string hospital = NewHospital("CreateFree");
            string date = "20/12/2030";
            string time = "09:00";

            RegisterTempUser(email);

            bool created = _db.CreateAppointment(
                email,
                date,
                time,
                "Checkup",
                hospital,
                "Test User",
                "2000-01-01",
                "NHUK100");

            Assert.IsTrue(created);
        }

        [TestMethod]
        public void CreateAppointment_WithDuplicateSlot_ReturnsFalse()
        {
            string email1 = NewEmail();
            string email2 = NewEmail();
            string hospital = NewHospital("Duplicate");
            string date = "21/12/2030";
            string time = "10:00";

            RegisterTempUser(email1, "User One");
            RegisterTempUser(email2, "User Two");

            bool firstCreated = _db.CreateAppointment(
                email1,
                date,
                time,
                "Checkup",
                hospital,
                "User One",
                "2000-01-01",
                "NHUK101");

            bool secondCreated = _db.CreateAppointment(
                email2,
                date,
                time,
                "Follow-up",
                hospital,
                "User Two",
                "2001-02-02",
                "NHUK102");

            Assert.IsTrue(firstCreated);
            Assert.IsFalse(secondCreated);
        }

        [TestMethod]
        public void AppointmentSlotExists_AfterCreate_ReturnsTrue()
        {
            string email = NewEmail();
            string hospital = NewHospital("SlotExists");
            string date = "22/12/2030";
            string time = "11:00";

            RegisterTempUser(email);

            CreateTempAppointment(email, date, time, hospital);

            bool exists = _db.AppointmentSlotExists(date, time, hospital);

            Assert.IsTrue(exists);
        }

        [TestMethod]
        public void GetBookedTimes_AfterCreate_ContainsBookedTime()
        {
            string email = NewEmail();
            string hospital = NewHospital("BookedTimes");
            string date = "23/12/2030";
            string time = "12:00";

            RegisterTempUser(email);

            CreateTempAppointment(email, date, time, hospital);

            var bookedTimes = _db.GetBookedTimes(date, hospital);

            Assert.IsNotNull(bookedTimes);
            CollectionAssert.Contains(bookedTimes, time);
        }

        [TestMethod]
        public void UpdateAppointment_ChangesAppointmentDetails()
        {
            string email = NewEmail();
            string hospital = NewHospital("UpdateOriginal");
            string newHospital = NewHospital("UpdateNew");
            string originalDate = "24/12/2030";
            string originalTime = "13:00";
            string newDate = "25/12/2030";
            string newTime = "14:00";

            RegisterTempUser(email);

            int appointmentId = CreateTempAppointment(email, originalDate, originalTime, hospital);

            bool updated = _db.UpdateAppointment(appointmentId, newDate, newTime, newHospital);

            Assert.IsTrue(updated);

            var updatedAppointment = _db.GetAppointmentById(appointmentId);

            Assert.IsNotNull(updatedAppointment);
            Assert.AreEqual(newDate, updatedAppointment!.Date);
            Assert.AreEqual(newTime, updatedAppointment.Time);
            Assert.AreEqual(newHospital, updatedAppointment.Hospital);
        }

        [TestMethod]
        public void DeleteAppointment_RemovesAppointment()
        {
            string email = NewEmail();
            string hospital = NewHospital("Delete");
            string date = "26/12/2030";
            string time = "15:00";

            RegisterTempUser(email);

            int appointmentId = CreateTempAppointment(email, date, time, hospital);

            bool deleted = _db.DeleteAppointment(appointmentId);

            Assert.IsTrue(deleted);

            var deletedAppointment = _db.GetAppointmentById(appointmentId);

            Assert.IsNull(deletedAppointment);
        }

        [TestMethod]
        public void GetDayStatuses_WhenAllSlotsBooked_ReturnsNone()
        {
            string email = NewEmail();
            string hospital = NewHospital("StatusNone");
            string date = "10/12/2030";

            RegisterTempUser(email);

            foreach (string time in AllAppointmentTimes)
            {
                bool created = _db.CreateAppointment(
                    email,
                    date,
                    time,
                    "Status Test",
                    hospital,
                    "Test User",
                    "2000-01-01",
                    "");
                Assert.IsTrue(created);
            }

            var statuses = _db.GetDayStatuses(2030, 12, hospital);

            Assert.IsTrue(statuses.ContainsKey(date));
            Assert.AreEqual("none", statuses[date]);
        }

        [TestMethod]
        public void GetDayStatuses_WhenFiveSlotsBooked_ReturnsLimited()
        {
            string email = NewEmail();
            string hospital = NewHospital("StatusLimited");
            string date = "11/12/2030";

            RegisterTempUser(email);

            for (int i = 0; i < 5; i++)
            {
                bool created = _db.CreateAppointment(
                    email,
                    date,
                    AllAppointmentTimes[i],
                    "Status Test",
                    hospital,
                    "Test User",
                    "2000-01-01",
                    "");
                Assert.IsTrue(created);
            }

            var statuses = _db.GetDayStatuses(2030, 12, hospital);

            Assert.IsTrue(statuses.ContainsKey(date));
            Assert.AreEqual("limited", statuses[date]);
        }

        [TestMethod]
        public void GetDayStatuses_WhenTwoSlotsBooked_ReturnsAvailable()
        {
            string email = NewEmail();
            string hospital = NewHospital("StatusAvailable");
            string date = "12/12/2030";

            RegisterTempUser(email);

            for (int i = 0; i < 2; i++)
            {
                bool created = _db.CreateAppointment(
                    email,
                    date,
                    AllAppointmentTimes[i],
                    "Status Test",
                    hospital,
                    "Test User",
                    "2000-01-01",
                    "");
                Assert.IsTrue(created);
            }

            var statuses = _db.GetDayStatuses(2030, 12, hospital);

            Assert.IsTrue(statuses.ContainsKey(date));
            Assert.AreEqual("available", statuses[date]);
        }
    }
}