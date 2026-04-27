using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChatApp.Data;

namespace ChatApp.Repositories
{
	public class GenericRepository<T> : IGenericRepository<T> where T : class
	{
		private readonly ChatDbContext _context;
		private readonly DbSet<T> _dbSet;

		public GenericRepository(ChatDbContext context)
		{
			_context = context;
			_dbSet = _context.Set<T>();
		}
		public async Task<T?> GetByIdAsync(object id)
		{
			return await _dbSet.FindAsync(id);
		}

		public async Task<IEnumerable<T>> GetAllAsync()
		{
			return await _dbSet.AsNoTracking().ToListAsync();
		}
		public async Task<T?> FindOneAsync(Expression<Func<T, bool>> predicate)
		{
			return await _dbSet.FirstOrDefaultAsync(predicate);
		}
		public async Task<T?> FindOneWithIncludesAsync(Expression<Func<T, bool>> predicate,
							params Expression<Func<T, object>>[] includeProperties)
		{
			IQueryable<T> query = _dbSet.AsQueryable();

			foreach (var includeProperty in includeProperties)
			{
				query = query.Include(includeProperty);
			}

			return await query.FirstOrDefaultAsync(predicate);
		}

		public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
		{
			return await _dbSet.Where(predicate).ToListAsync();
		}
		public async Task<IEnumerable<T>> FindListWithIncludesAsync(Expression<Func<T, bool>> predicate,
							params Expression<Func<T, object>>[] includeProperties)
		{
			IQueryable<T> query = _dbSet.AsQueryable();

			foreach (var includeProperty in includeProperties)
			{
				query = query.Include(includeProperty);
			}

			return await query.Where(predicate).ToListAsync();
		}

		public async Task<T?> FindOneWithOrderByAsync(Expression<Func<T, bool>> predicate, Expression<Func<T, object>> orderBy, bool descending = false)
		{
			IQueryable<T> query = _dbSet.AsQueryable().Where(predicate);
			query = descending ? query.OrderByDescending(orderBy) : query.OrderBy(orderBy);
			return await query.FirstOrDefaultAsync();
		}

		public async Task InsertOneAsync(T entity)
		{
			await _dbSet.AddAsync(entity);
		}

		public async Task InsertListAsync(IEnumerable<T> entities)
		{
			await _dbSet.AddRangeAsync(entities);
		}

		public void UpdateOneAsync(T entity)
		{
			_dbSet.Update(entity);
		}

		public void UpdateListAsync(IEnumerable<T> entities)
		{
			_dbSet.UpdateRange(entities);
		}

		public void DeleteOneAsync(T entity)
		{
			_dbSet.Remove(entity);
		}

		public void DeleteListAsync(IEnumerable<T> entities)
		{
			_dbSet.RemoveRange(entities);
		}
		public async Task SaveChangesAsync()
		{
			await _context.SaveChangesAsync();
		}
	}
}
