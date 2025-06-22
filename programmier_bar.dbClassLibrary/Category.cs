using Npgsql;

namespace programmier_bar.dbClassLibrary
{
	public class Category
	{
		// Constant string definitions for: table name, its columns (comma-seperated) and SELECT clause
		protected const string TABLE = "assortment.category";
		protected const string COLUMNS =
			"category_id, " +
			"category_ref_id, " +
			"name, " +
			"ranking";
		protected const string SELECT = "select " + COLUMNS + " from " + TABLE;


		//******************************************************************************************************************
		#region static
		// Retrieve all categories (ordered by 'ranking' column) 
		public static List<Category> GetList() =>
			DbSqlConnection.ExecuteQuery<Category>($"{SELECT} ORDER BY ranking");
		// Retrieve single Category by its numeric ID
		public static Category Get(long id) =>
			DbSqlConnection.ExecuteQuery<Category>($"{SELECT} WHERE category_id = :p0", id).First();
		#endregion


		//******************************************************************************************************************
		#region constructors
		// Default constructor for manual instantiation
		public Category()
		{
		}

		// Hydrate a Category object from an object[] returned by the data reader
		public Category(object[] data)
		{
			this.CategoryId = data[0] == DBNull.Value ? (long?)null : Convert.ToInt64(data[0]);
			this.CategoryRefId = data[1] == DBNull.Value ? (long?)null : Convert.ToInt64(data[1]);
			this.Name = data[2] == DBNull.Value ? string.Empty : (string)data[2];
			this.Ranking = data[3] == DBNull.Value ? (short?)null : Convert.ToInt16(data[3]);
		}
		#endregion


		//******************************************************************************************************************
		#region private
		#endregion


		//******************************************************************************************************************
		#region properties
		public long? CategoryId { get; set; }
		public long? CategoryRefId { get; set; }
		public string Name { get; set; }
		public short? Ranking { get; set; }
		#endregion


		//******************************************************************************************************************
		#region public
		public int Save()
		{
			// Open shared connection
			NpgsqlConnection conn = DbSqlConnection.GetConnection();
			try
			{
				// Create new command tied to this connection
				conn.Open();
				NpgsqlCommand comm = conn.CreateCommand();
				if (this.CategoryId.HasValue)
				{
					// UPDATE
					comm.CommandText =
									$"update {TABLE} set " +
									"category_ref_id = :crefid, " +
									"name = :n, " +
									"ranking = :r " +
									"where category_id = :cid";
				}
				else
				{
					// SELECT (fetch next seq value for category_id)
					comm.CommandText = $"select nextval('{TABLE}_seq')";
					this.CategoryId = (long)comm.ExecuteScalar();
					// INSERT
					comm.CommandText =
						$"insert into {TABLE} ({COLUMNS}) values (" +
						":cid, " +
						":crefid, " +
						":n, " +
						":r)";
				}

				// Bind parameters to new category object
				comm.Parameters.AddWithValue("cid", this.CategoryId.Value);
				comm.Parameters.AddWithValue("crefid", this.CategoryRefId.HasValue ? this.CategoryRefId.Value : DBNull.Value);
				comm.Parameters.AddWithValue("n", String.IsNullOrEmpty(this.Name) ? DBNull.Value : this.Name);
				comm.Parameters.AddWithValue("r", this.Ranking.HasValue ? this.Ranking.Value : DBNull.Value);
				return comm.ExecuteNonQuery();
			}
			catch (Exception ex)
			{
				throw;
			}
			finally
			{
				conn.Close();
			}
		}

		public int Delete()
		{
			// Get connection to database
			NpgsqlConnection conn = DbSqlConnection.GetConnection();
			try
			{
				// Open connection and execute command
				conn.Open();
				NpgsqlCommand comm = conn.CreateCommand();
				// DELETE
				comm.CommandText = $"delete from {TABLE}  where category_id = :cid";
				comm.Parameters.AddWithValue("cid", this.CategoryId.Value);
				return comm.ExecuteNonQuery();
			}
			catch (Exception ex)
			{
				throw;
			}
			finally
			{
				conn.Close();
			}
		}

		// Return category name as string
		public override string ToString() => this.Name;
		#endregion
	}
}