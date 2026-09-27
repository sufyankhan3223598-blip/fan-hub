using System.Reflection;
using AutoMapper;
using FanHubPlus.Api.Common;
using FanHubPlus.Api.Data;
using FanHubPlus.Api.DTOs;
using FanHubPlus.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FanHubPlus.Api.Controllers.Admin;

[ApiController]
[Authorize(Roles = Roles.Admin)]
public abstract class AdminCrudController<TEntity, TDto> : ControllerBase
    where TEntity : class, IEntity
    where TDto : class
{
    protected readonly AppDbContext Db;
    protected readonly IMapper Mapper;

    protected AdminCrudController(AppDbContext db, IMapper mapper)
    {
        Db = db; Mapper = mapper;
    }


    protected virtual IQueryable<TEntity> BaseQuery() => Db.Set<TEntity>();


    protected abstract IQueryable<TEntity> ApplySearch(IQueryable<TEntity> query, string search);


    protected virtual IQueryable<TEntity> ApplyFilters(IQueryable<TEntity> query, AdminListQuery q) => query;


    protected virtual Task BeforeSaveAsync(TEntity entity, TDto dto, bool isNew) => Task.CompletedTask;

    [HttpGet]
    public async Task<ActionResult<PagedResult<TDto>>> List([FromQuery] AdminListQuery q)
    {
        var query = BaseQuery().AsNoTracking();
        if (!string.IsNullOrWhiteSpace(q.Search)) query = ApplySearch(query, q.Search.Trim());
        query = ApplyFilters(query, q);


        var prop = typeof(TEntity).GetProperty(q.Sort ?? "Id", BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
        var sortable = prop != null && (prop.PropertyType.IsValueType || prop.PropertyType == typeof(string));
        var name = sortable ? prop!.Name : "Id";
        query = q.Dir == "asc"
            ? query.OrderBy(e => EF.Property<object>(e, name))
            : query.OrderByDescending(e => EF.Property<object>(e, name));

        var page = Math.Max(1, q.Page);
        var size = Math.Clamp(q.PageSize, 1, 100);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * size).Take(size).ToListAsync();
        return new PagedResult<TDto>(Mapper.Map<List<TDto>>(items), total, page, size);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TDto>> Get(int id)
    {
        var entity = await BaseQuery().AsNoTracking().FirstOrDefaultAsync(e => EF.Property<int>(e, "Id") == id);
        return entity == null ? NotFound() : Mapper.Map<TDto>(entity);
    }

    [HttpPost]
    public async Task<ActionResult<TDto>> Create([FromBody] TDto dto)
    {
        var entity = Mapper.Map<TEntity>(dto);
        await BeforeSaveAsync(entity, dto, true);
        Db.Set<TEntity>().Add(entity);
        await Db.SaveChangesAsync();
        return await Get(entity.Id);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TDto>> Update(int id, [FromBody] TDto dto)
    {
        var entity = await BaseQuery().FirstOrDefaultAsync(e => EF.Property<int>(e, "Id") == id);
        if (entity == null) return NotFound();
        Mapper.Map(dto, entity);
        await BeforeSaveAsync(entity, dto, false);
        await Db.SaveChangesAsync();
        return await Get(id);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await Db.Set<TEntity>().FindAsync(id);
        if (entity == null) return NotFound();
        Db.Set<TEntity>().Remove(entity);
        await SaveDeleteAsync();
        return NoContent();
    }

    [HttpPost("bulk-delete")]
    public async Task<IActionResult> BulkDelete([FromBody] BulkIdsRequest req)
    {
        var entities = await Db.Set<TEntity>().Where(e => req.Ids.Contains(EF.Property<int>(e, "Id"))).ToListAsync();
        Db.Set<TEntity>().RemoveRange(entities);
        await SaveDeleteAsync();
        return Ok(new { deleted = entities.Count });
    }

    private async Task SaveDeleteAsync()
    {
        try { await Db.SaveChangesAsync(); }
        catch (DbUpdateException)
        {
            throw new AppException("This record is still used by other items (for example a category that still has content). Remove or reassign those first.", 409);
        }
    }


    protected async Task<string> UniqueSlugAsync(string desired, string fallback, int currentId)
    {
        var baseSlug = Slug.Create(string.IsNullOrWhiteSpace(desired) ? fallback : desired);
        var slug = baseSlug;
        var i = 2;
        while (await Db.Set<TEntity>().AnyAsync(e => EF.Property<string>(e, "Slug") == slug && EF.Property<int>(e, "Id") != currentId))
            slug = $"{baseSlug}-{i++}";
        return slug;
    }
}
