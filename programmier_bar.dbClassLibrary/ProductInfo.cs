namespace programmier_bar.dbClassLibrary
{
	public class ProductInfo : Product
	{
		// Constant string definitions for: view name, added properties VIEW_COLUMNS for base table, full SELECT for base table
		protected const string VIEW = TABLE + "_info";
		protected const string VIEW_COLUMNS = "stock, " +
																					"category_id, " +
																					"category_name";
		protected const string VIEW_SELECT = "select " + COLUMNS + ", " + VIEW_COLUMNS + " from " + VIEW;


		//******************************************************************************************************************
		#region static
		// Retrieve all products with stock & category details and retrieve all product in a given category (incl. stock & category)
		public static new List<ProductInfo> GetList() =>
			DbSqlConnection.ExecuteQuery<ProductInfo>(VIEW_SELECT + " ORDER BY category_name");
		public static List<ProductInfo> GetList(Category category) =>
			DbSqlConnection.ExecuteQuery<ProductInfo>($"{VIEW_SELECT} WHERE category_id = :p0", category.CategoryId);
		#endregion


		//******************************************************************************************************************
		#region constructors
		// Default constructor for manual property assignment
		public ProductInfo()
		{
		}

		// Cast & assign (add elements to base table)
		public ProductInfo(object[] data) : base(data)
		{
			this.Stock				= data[10] == DBNull.Value ? 0L : Convert.ToInt64(data[10]);
			this.CategoryId		= data[11] == DBNull.Value ? (long?)null  : Convert.ToInt64(data[11]);
			this.CategoryName = data[12] == DBNull.Value ? string.Empty : (string)data[12];
		}
		#endregion


		//******************************************************************************************************************
		#region private
		#endregion


		//******************************************************************************************************************
		#region properties
		public long?	Stock { get; set; }
		public long?	CategoryId { get; set; }
		public string CategoryName { get; set; }
		#endregion


		//******************************************************************************************************************
		#region public
		// Return product name (and its stock quantity)
		public override string ToString()
		{
			return $"{this.Name} ({this.Stock})";
		}
		#endregion
	}
}