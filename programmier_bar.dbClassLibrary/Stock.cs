using Npgsql;

namespace programmier_bar.dbClassLibrary
{
	// Category declarations (to add/distinguish inventory)
	public enum StockCategory
	{
		Positive,
		Negative
	}


	public class Stock
	{
		// String constant definitions for; TABLE name, comma-seperated COLUMN list and SELECT statement
		protected const string TABLE = "assortment.stock";
		protected const string COLUMNS =	"stock_id, " +
																			"product_id, " +
																			"person_id, " +
																			"amount, " +
																			"date_time, " +
																			"note";
		protected const string SELECT = "select " + COLUMNS + " from " + TABLE;


		//******************************************************************************************************************
		#region static
		// Retrieve all stock entries from database and for specific product
		public static List<Stock> GetList() =>
			DbSqlConnection.ExecuteQuery<Stock>(SELECT);
		public static List<Stock> GetList(Product product) =>
			DbSqlConnection.ExecuteQuery<Stock>($"{SELECT} where product_id = :p0", product.ProductId);

		// Get single stock entry by its primary key
		public static Stock Get(long id)
		{
			List<Stock> list = DbSqlConnection.ExecuteQuery<Stock>($"{SELECT} where stock_id = :p0", id);
			if (list.Count > 0) return list[0];
			else return null;
		}
		#endregion


		//******************************************************************************************************************
		#region constructors
		// Parameterless constructor for manual instantiation
		public Stock()
		{
		}

		// Cast & assign for new stock instance
		public Stock(object[] data)
		{
			this.StockId		= data[0] == DBNull.Value ? (long?)null : Convert.ToInt64(data[0]);
			this.ProductId	= data[1] == DBNull.Value ? (long?)null : Convert.ToInt64(data[1]);
			this.PersonId		= data[2] == DBNull.Value ? (long?)null : Convert.ToInt64(data[2]);
			this.Amount			= data[3] == DBNull.Value ? (int?)null	: Convert.ToInt32(data[3]);
			this.DateTime		= data[4] == DBNull.Value ? (DateTime?)null : (DateTime?)data[4];
			this.Note				= data[5] == DBNull.Value ? string.Empty : (string)data[5];
		}
		#endregion


		//******************************************************************************************************************
		#region private
		#endregion


		//******************************************************************************************************************
		#region properties
		public long?			StockId { get; set; }
		public long?			ProductId { get; set; }
		public long?			PersonId { get; set; }
		public int?				Amount { get; set; }
		public DateTime?	DateTime { get; set; }
		public string?		Note { get; set; }
		#endregion

		//******************************************************************************************************************
		#region public
		public int Save(NpgsqlConnection connection = null, NpgsqlTransaction trans = null)
		{
			// Initialize connection (use provided or obtain a new one)
			NpgsqlConnection conn = connection;
			try
			{
				// Open connection if none was provided
				if (conn == null)
				{
					conn = DbSqlConnection.GetConnection();
					conn.Open();
				}
				// Create command and attach the transaction (if any)
				NpgsqlCommand comm = conn.CreateCommand();
				comm.Transaction = trans;
				if (this.StockId.HasValue)
				{
					// UPDATE clause
					comm.CommandText =
						$"update {TABLE} set " +
						"product_id	= :prodid, " +
						"person_id = :persid, " +
						"amount = :am, " +
						"date_time = :dt, " +
						"note = :note " +
						"where stock_id = :sid";
				}
				else
				{
					// Fetch next sequence value for stock_id, then INSERT new record
					comm.CommandText = $"select nextval('{TABLE}_seq')";
					this.StockId = (long)comm.ExecuteScalar();
					comm.CommandText =
						$"insert into {TABLE} ({COLUMNS}) values (" +
						":sid, " +
						":prodid, " +
						":persid, " +
						":am, " +
						":dt, " +
						":note)";
				}

				// Bind SQL parameters before execution
				comm.Parameters.AddWithValue("sid",			this.StockId.Value);
				comm.Parameters.AddWithValue("prodid",	this.ProductId.HasValue ? this.ProductId.Value	: DBNull.Value);
				comm.Parameters.AddWithValue("persid",	this.PersonId.HasValue	? this.PersonId.Value		: DBNull.Value);
				comm.Parameters.AddWithValue("am",			this.Amount.HasValue		? this.Amount.Value			: DBNull.Value);
				comm.Parameters.AddWithValue("dt",			this.DateTime.HasValue	? this.DateTime.Value		: DBNull.Value);
				comm.Parameters.AddWithValue("note",		String.IsNullOrEmpty(this.Note) ? DBNull.Value	: this.Note);
				return comm.ExecuteNonQuery();
			}
			catch (Exception)
			{
				throw;
			}
			finally
			{
				if (trans == null) conn.Close();
			}
		}

		// Return formatted string for display purposes
		public override string ToString()
		{
			return $"{this.DateTime:dd.MM.yyyy} ({this.Amount})";
		}
		#endregion
	}
}