using FanHubPlus.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace FanHubPlus.Api.Repositories;

public interface IRepository<T> where T : class
{
    IQueryable<T> Query();
    IQueryable<T> QueryNoTracking();
    Task<T?> FindAsync(params object[] keys);
    Task AddAsync(T entity);
    Task AddRangeAsync(IEnumerable<T> entities);
    void Remove(T entity);
    void RemoveRange(IEnumerable<T> entities);
    Task<int> SaveChangesAsync();
}

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly AppDbContext Db;
    protected readonly DbSet<T> Set;

    public Repository(AppDbContext db)
    {
        Db = db;
        Set = db.Set<T>();
    }

    public IQueryable<T> Query() => Set;
    public IQueryable<T> QueryNoTracking() => Set.AsNoTracking();
    public async Task<T?> FindAsync(params object[] keys) => await Set.FindAsync(keys);
    public async Task AddAsync(T entity) => await Set.AddAsync(entity);
    public async Task AddRangeAsync(IEnumerable<T> entities) => await Set.AddRangeAsync(entities);
    public void Remove(T entity) => Set.Remove(entity);
    public void RemoveRange(IEnumerable<T> entities) => Set.RemoveRange(entities);
    public Task<int> SaveChangesAsync() => Db.SaveChangesAsync();
}

public interface IUnitOfWork
{
    AppDbContext Db { get; }
    Task<int> SaveChangesAsync();
}

public class UnitOfWork : IUnitOfWork
{
    public AppDbContext Db { get; }
    public UnitOfWork(AppDbContext db) => Db = db;
    public Task<int> SaveChangesAsync() => Db.SaveChangesAsync();
}
