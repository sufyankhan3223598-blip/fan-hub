using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;

namespace FanHubPlus.Api.Data;

public static class DbSeeder
{
    public static async Task InitializeAsync(IServiceProvider services, ILogger logger)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        if (db.Database.GetMigrations().Any())
        {
            logger.LogInformation("Applying EF Core migrations...");
            await db.Database.MigrateAsync();
        }
        else
        {
            logger.LogInformation("No migrations found - creating schema with EnsureCreated()");
            await db.Database.EnsureCreatedAsync();
        }

        if (await db.Roles.AnyAsync())
        {
            logger.LogInformation("Database already seeded.");
            return;
        }

        var path = Path.Combine(AppContext.BaseDirectory, "Data", "Seed", "seed.sql");
        if (!File.Exists(path))
        {
            logger.LogWarning("Seed script not found at {Path}. Run database/seed.sql manually.", path);
            return;
        }

        logger.LogInformation("Seeding database from {Path}", path);
        var script = await File.ReadAllTextAsync(path);

        var batches = Regex.Split(script, @"^\s*GO\s*$", RegexOptions.Multiline | RegexOptions.IgnoreCase)
            .Where(b => !string.IsNullOrWhiteSpace(b) && !Regex.IsMatch(b.Trim(), @"^(/\*.*?\*/\s*)?USE\s+\w+;?$", RegexOptions.Singleline | RegexOptions.IgnoreCase));

        var connection = db.Database.GetDbConnection();
        await connection.OpenAsync();
        try
        {
            foreach (var batch in batches)
            {
                await using var cmd = connection.CreateCommand();
                cmd.CommandText = batch;
                cmd.CommandTimeout = 120;
                await cmd.ExecuteNonQueryAsync();
            }
        }
        finally
        {
            await connection.CloseAsync();
        }
        logger.LogInformation("Seed completed.");
    }
}
