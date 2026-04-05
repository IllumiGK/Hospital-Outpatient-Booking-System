using Microsoft.VisualStudio.TestTools.UnitTesting;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;

namespace Backend_Test
{
    [TestClass]
    public class DatabaseServiceTests
    {
        private DatabaseService CreateDatabaseService()
        {
            var settings = new Dictionary<string, string>
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

        [TestMethod]
        public void UserExists_WithKnownEmail_ReturnsTrue()
        {
            var db = CreateDatabaseService();

            bool exists = db.UserExists("adam@gmail.com");

            Assert.IsTrue(exists);
        }

        [TestMethod]
        public void AppointmentSlotExists_WithBookedSlot_ReturnsTrue()
        {
            var db = CreateDatabaseService();

            bool exists = db.AppointmentSlotExists(
                "15/04/2026",
                "09:00",
                "Royal London Hospital"
            );

            Assert.IsTrue(exists);
        }

        [TestMethod]
        public void GetBookedTimes_WithKnownDate_ReturnsBookedTimes()
        {
            var db = CreateDatabaseService();

            var bookedTimes = db.GetBookedTimes(
                "14/04/2026",
                "Royal London Hospital"
            );

            Assert.IsNotNull(bookedTimes);
            Assert.IsTrue(bookedTimes.Count > 0);
        }
    }
}