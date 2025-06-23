namespace programmier_bar.dbClassLibrary
{
	public class CategoryInfo : Category
	{
		// Constant string definitions for: view name, its added columns and SELECT clause
		protected const string VIEW					= "assortment.category_info";
		protected const string VIEW_COLUMNS = "id_path, name_path";
		protected const string VIEW_SELECT	= "select " + COLUMNS + ", " + VIEW_COLUMNS + " from " + VIEW;


		//******************************************************************************************************************
		#region static
		// Retrieve Categories
		public static new List<CategoryInfo> GetList() =>
			DbSqlConnection.ExecuteQuery<CategoryInfo>($"{VIEW_SELECT} ORDER BY ranking");
		// Retrieve CategoryInfo
		public static new CategoryInfo Get(long id) =>
			DbSqlConnection.ExecuteQuery<CategoryInfo>($"{VIEW_SELECT} WHERE category_id = :p0", id).First();
		#endregion


		//******************************************************************************************************************
		#region constructors
		// Default constructor for manual instantiation
		public CategoryInfo() : base()
		{
		}

		// Cast & assign (add elements to base table)
		public CategoryInfo(object[] data) : base(data)
		{
			this.IdPath		= data[4] == DBNull.Value ? string.Empty : (string)data[4];
			this.NamePath = data[5] == DBNull.Value ? string.Empty : (string)data[5];
		}
		#endregion


		//******************************************************************************************************************
		#region private
		#endregion


		//******************************************************************************************************************
		#region properties
		public string IdPath { get; set; }
		public string NamePath { get; set; }
		#endregion


		//******************************************************************************************************************
		#region public
		// Return category name as string
		public override string ToString() => this.Name;
		#endregion
	}
}