var builder = WebApplication.CreateBuilder(args);

//Add support for the controllers (API endpoints)
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(); //Enables Swagger for API testing

//Configure CORS to allow frontend applications to access the API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin()  //Allow requests from any domain
              .AllowAnyMethod()  // Allow GET , POST, PUT, DELETE
              .AllowAnyHeader());  //Allow all headers
});

//Register DatabaseService for dependecy injection
builder.Services.AddSingleton<DatabaseService>();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowAll");

app.UseHttpsRedirection();
app.UseAuthorization();

app.MapControllers();

app.Run();
