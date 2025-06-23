using Npgsql;

namespace programmier_bar.dbClassLibrary
{
	public class ProductCategory
	{
		// String constant definitions for; TABLE name, comma-seperated COLUMN list and SELECT statement
		protected const string TABLE		= "assortment.product_category";
		protected const string COLUMNS	= "product_id, category_id";
		protected const string SELECT		= "select " + COLUMNS + " from " + TABLE;


		//******************************************************************************************************************
		#region static
		// Get all product_category rows and return only to given product
		public static List<ProductCategory> GetList() =>
			DbSqlConnection.ExecuteQuery<ProductCategory>(SELECT);
		public static List<ProductCategory> GetList(Product product) =>
			DbSqlConnection.ExecuteQuery<ProductCategory>($"{SELECT} where product_id = :p0", product.ProductId);
		#endregion


		//******************************************************************************************************************
		#region constructors
		// Parameterless constructor for creating blank object and set its properties manually before saving
		public ProductCategory()
		{
		}

		// cast and assign for newly constructed ProductCategory instance
		public ProductCategory(object[] data)
		{
			this.ProductId	= Convert.ToInt64(data[0]);
			this.CategoryId = Convert.ToInt64(data[1]);
		}
		#endregion


		//******************************************************************************************************************
		#region private
		#endregion


		//******************************************************************************************************************
		#region properties
		public long ProductId { get; set; }
		public long CategoryId { get; set; }
		#endregion


		//******************************************************************************************************************
		#region public
		public int Save(NpgsqlConnection conn, NpgsqlTransaction trans)
		{
			try
			{
				// Create & configure command - check existing row over select clause
				NpgsqlCommand comm = conn.CreateCommand();
				comm.Transaction = trans;
				comm.CommandText = $"select count(*) from {TABLE} where product_id = :prodid and category_id = :cid";
				comm.Parameters.AddWithValue("prodid", this.ProductId);
				comm.Parameters.AddWithValue("cid", this.CategoryId);
				// Insert "new link" if no row exists
				if ((long)comm.ExecuteScalar() == 0m)
				{
					comm.CommandText = $"insert into {TABLE} ({COLUMNS}) values (:prodid, :cid)";
					comm.ExecuteNonQuery();
				}
				return 1;
			}
			catch (Exception ex)
			{
				throw;
			}
		}
		#endregion
	}
}