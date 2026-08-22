using Foodlyn.API.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddFoodlynServices(builder.Configuration);

var app = builder.Build();

await app.UseFoodlynPipelineAsync();

await app.RunAsync();
