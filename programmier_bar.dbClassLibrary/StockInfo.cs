namespace programmier_bar.dbClassLibrary
{
	public class StockInfo : Stock
	{
		// String constant definitions for; VIEW name, VIEW column, SELECT statement
		protected const string VIEW = "assortment.stock_info";
		protected const string VIEW_COLUMNS = "person_name_full";
		protected const string VIEW_SELECT = "select " + COLUMNS + ", " + VIEW_COLUMNS + " from " + VIEW;


		//******************************************************************************************************************
		#region static
		// Get all StockInfo (incl. person name) rows and for specific product
		public static new List<StockInfo> GetList() =>
			DbSqlConnection.ExecuteQuery<StockInfo>(VIEW_SELECT);
		public static new List<StockInfo> GetList(Product product) =>
			DbSqlConnection.ExecuteQuery<StockInfo>($"{VIEW_SELECT} where product_id = :p0", product.ProductId);


		#endregion


		//******************************************************************************************************************
		#region constructors
		// Parameterless cosntructor for manual instantiation 
		public StockInfo()
		{
		}

		// Cast & assign new StockInfo instance (incl. base stock data + person_name_full)
		public StockInfo(object[] data) : base(data)
		{
			this.PersonNameFull = data[6] == DBNull.Value ? string.Empty : (string)data[6];
		}
		#endregion


		//******************************************************************************************************************
		#region private
		#endregion


		//******************************************************************************************************************
		#region properties
		public string? PersonNameFull { get; set; }
		#endregion


		//******************************************************************************************************************
		#region public
		// Return formatted string for display purposes
		public override string ToString()
		{
			return $"{this.DateTime:dd.MM.yyyy} ({this.Amount})";
		}
		#endregion
	}
}