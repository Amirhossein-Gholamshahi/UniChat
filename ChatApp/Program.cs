using ChatApp.Hubs;
using ChatApp.Data;
using Microsoft.EntityFrameworkCore;
using ChatApp.Models.Auth;
using Microsoft.AspNetCore.Identity;
using ChatApp.Repositories;
using ChatApp.Services;
using Microsoft.AspNetCore.SignalR;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ChatDbContext>(options =>
	options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddDbContext<AuthDbContext>(options =>
	options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(
	(options =>
	{
		options.User.RequireUniqueEmail = true;
	})
	)
	.AddEntityFrameworkStores<AuthDbContext>()
	.AddDefaultTokenProviders();

builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));

// Add services to the container.
builder.Services.AddControllersWithViews();

builder.Services.AddSignalR();


builder.Services.ConfigureApplicationCookie(options =>
{
	options.LoginPath = "/Account/Login";
	options.AccessDeniedPath = "/Account/AccessDenied";
});

//builder.Services.AddSingleton<OpenAiService>(sp =>
//	new OpenAiService(builder.Configuration["OpenAI:ApiKey"]));

builder.Services.AddSingleton<OpenAiService>(sp =>
{
	var hubContext = sp.GetRequiredService<IHubContext<ChatHub>>();
	var apiKey = builder.Configuration["OpenAI:ApiKey"];
	return new OpenAiService(apiKey, hubContext);
});


var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();
app.UseCors();


app.MapHub<ChatHub>("/chathub");

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseDefaultFiles(); 

app.UseRouting();

app.UseAuthorization();


app.MapControllerRoute(
	name: "default",
	pattern: "{controller=Account}/{action=Login}/{id?}");


app.MapGet("/", context =>
{
	context.Response.Redirect("/Account/Login");
	return Task.CompletedTask;
});


app.Run();
