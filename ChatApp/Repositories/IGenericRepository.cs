using System.Linq.Expressions;

namespace ChatApp.Repositories
{
	public interface IGenericRepository<T> where T : class
	{
		Task<T?> GetByIdAsync(object id);
		Task<IEnumerable<T>> GetAllAsync();
		Task<T?> FindOneAsync(Expression<Func<T, bool>> predicate);
		Task<T?> FindOneWithIncludesAsync(Expression<Func<T, bool>> predicate, params Expression<Func<T, object>>[] includeProperties);
		Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
		Task<IEnumerable<T>> FindListWithIncludesAsync(Expression<Func<T, bool>> predicate, params Expression<Func<T, object>>[] includeProperties);
		Task<T?> FindOneWithOrderByAsync(Expression<Func<T, bool>> predicate, Expression<Func<T, object>> orderBy, bool descending = false);
		Task InsertOneAsync(T entity);
		Task InsertListAsync(IEnumerable<T> entities);
		void UpdateOneAsync(T entity);
		void UpdateListAsync(IEnumerable<T> entities);
		void DeleteOneAsync(T entity);
		void DeleteListAsync(IEnumerable<T> entities);
		Task SaveChangesAsync();
	}
}
