namespace programmier_bar.dbClassLibrary
{
	public class FiledataInfo : Filedata
	{
		// Constant string definitions for: view name, extra columns VIEW_COLUMN for base table and SELECT clause
		protected const string VIEW = "assortment.filedata_info";
		protected const string VIEW_COLUMNS = "person_name_full";
		protected const string VIEW_SELECT = "select " + COLUMNS + ", " + VIEW_COLUMNS + " from " + VIEW;


		//******************************************************************************************************************
		#region static
		// Retrieve all FiledataInfo rows using SELECT and retrieve FiledataInfo rows for a given product
		public static new List<FiledataInfo> GetList() =>
			DbSqlConnection.ExecuteQuery<FiledataInfo>(SELECT);
		public static new List<FiledataInfo> GetList(Product product) =>
			DbSqlConnection.ExecuteQuery<FiledataInfo>($"{VIEW_SELECT} where product_id = :p0", product.ProductId);
		#endregion


		//******************************************************************************************************************
		#region constructors
		// Default constructor for manual property assignment
		public FiledataInfo()
		{
		}

		// Cast & assign 7th element for filedata object
		public FiledataInfo(object[] data) : base(data)
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
		// Return file name as string
		public override string ToString() => base.ToString();
		#endregion
	}
}