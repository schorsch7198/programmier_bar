using Npgsql;

namespace programmier_bar.dbClassLibrary
{
	public class Product
	{
		// String constant definitions for; TABLE name, comma-seperated COLUMN list and SELECT statement
		protected const string TABLE = "assortment.product";
		protected const string COLUMNS =	"product_id, " +
																			"product_uid, " +
																			"charcode, " +
																			"name, " +
																			"insuser, " +
																			"insdate, " +
																			"upduser, " +
																			"upddate, " +
																			"deluser, " +
																			"deldate";
		protected const string SELECT = "select " + COLUMNS + " from " + TABLE;



		//******************************************************************************************************************
		#region static
		// Call product list containing one product object per database row
		public static List<Product> GetList() => 
			DbSqlConnection.ExecuteQuery<Product>($"{SELECT} where deldate is null");

		// Retrieve product by numeric ID or UID (ignoring deleted records)
		public static Product Get(string id)
		{
			long tmpId = 0;
			List<Product> list = null;
			if (long.TryParse(id, out tmpId))
			{
				list = DbSqlConnection.ExecuteQuery<Product>
					($"{SELECT} where product_id = :p0 and deldate is null", tmpId);
			}
			else
			{
				list = DbSqlConnection.ExecuteQuery<Product>
					($"{SELECT} where product_uid = :p0 and deldate is null", id);
			}
			if (list.Count == 1)
			{
				list[0].StockList = StockInfo.GetList(list[0]);
				list[0].FiledataList = FiledataInfo.GetList(list[0]);
				return list[0];
			} 
			else return null;
		}
		#endregion


		//******************************************************************************************************************
		#region constructors
		// Parameterless constructor for creating blank product and set its properties manually before saving
		public Product()
		{

		}

		// Cast and assign new product object
		public Product(object[] data)
		{
			this.ProductId	= (int)data[0];
			this.ProductUid = data[1] == DBNull.Value ? string.Empty : (string)data[1];
			this.Charcode		= data[2] == DBNull.Value ? string.Empty : (string)data[2];
			this.Name				= data[3] == DBNull.Value ? string.Empty : (string)data[3];
			this.InsUser		= data[4] == DBNull.Value ? string.Empty : (string)data[4];
			this.InsDate		= data[5] == DBNull.Value ? null : (DateTime)data[5];
			this.UpdUser		= data[6] == DBNull.Value ? string.Empty : (string)data[6];
			this.UpdDate		= data[7] == DBNull.Value ? null : (DateTime)data[7];
			this.DelUser		= data[8] == DBNull.Value ? string.Empty : (string)data[8];
			this.DelDate		= data[9] == DBNull.Value ? null : (DateTime)data[9];
		}
		#endregion


		//******************************************************************************************************************
		#region private
		#endregion


		//******************************************************************************************************************
		#region properties
		public long?			ProductId { get; set; }
		public string			ProductUid { get; set; }
		public string			Charcode { get; set; }
		public string			Name { get; set; }
		public string?		InsUser { get; set; }
		public DateTime?	InsDate { get; set; }
		public string?		UpdUser { get; set; }
		public DateTime?	UpdDate { get; set; }
		public string?		DelUser { get; set; }
		public DateTime?	DelDate { get; set; }

		// Collection properties i.e. related-entity collections
		public List<ProductCategory>	ProductCategoryList { get; set; } = new List<ProductCategory>();
		public List<StockInfo>				StockList { get; set; } = new List<StockInfo>();
		public List<FiledataInfo>			FiledataList { get; set; } = new List<FiledataInfo>();
		#endregion


		//******************************************************************************************************************
		#region public methods
		public int Save(string userInfo = null)
		{
			NpgsqlConnection conn = DbSqlConnection.GetConnection();
			NpgsqlTransaction trans = null;
			try
			{
				// Open connection & begin transaction
				conn.Open();
				trans = conn.BeginTransaction();
				NpgsqlCommand command = conn.CreateCommand();
				command.Transaction = trans;
				if (this.ProductId.HasValue)
				{
					this.UpdUser = userInfo;
					this.UpdDate = DateTime.Now;
					// UPDATE
					command.CommandText =
						$"update {TABLE} set " +
						"product_uid = :produid, " +
						"charcode = :charc, " +
						"name = :n, " +
						"insuser = :insuser, " +
						"insdate = :insdate, " +
						"upduser = :upduser, " +
						"upddate = :upddate, " +
						"deluser = :deluser, " +
						"deldate = :deldate " +
						"where product_id = :prodid";
				}
				else
				{
					// SELECT
					command.CommandText = $"select nextval('{TABLE}_seq')";
					this.ProductId	= (long)command.ExecuteScalar();
					this.ProductUid = Guid.NewGuid().ToString("N");
					this.InsUser		= userInfo;
					this.InsDate		= DateTime.Now;
					this.UpdUser		= userInfo;
					this.UpdDate		= this.InsDate;
					// INSERT
					command.CommandText =
						$"insert into {TABLE} ({COLUMNS}) values (" +
						":prodid, " +
						":produid, " +
						":charc, " +
						":n, " +
						":insuser, " +
						":insdate, " +
						":upduser, " +
						":upddate, " +
						":deluser, " +
						":deldate)";
				}

				// Bind parameters
				command.Parameters.AddWithValue("prodid",		this.ProductId.Value);
				command.Parameters.AddWithValue("produid",	this.ProductUid);
				command.Parameters.AddWithValue("charc",		String.IsNullOrEmpty(this.Charcode) ? DBNull.Value : this.Charcode);
				command.Parameters.AddWithValue("n",				String.IsNullOrEmpty(this.Name)			? DBNull.Value : this.Name);
				command.Parameters.AddWithValue("insuser",	String.IsNullOrEmpty(this.InsUser) ? DBNull.Value : this.InsUser);
				command.Parameters.AddWithValue("insdate",	this.InsDate.HasValue ? this.InsDate.Value : DBNull.Value);
				command.Parameters.AddWithValue("upduser",	String.IsNullOrEmpty(this.UpdUser) ? DBNull.Value : this.UpdUser);
				command.Parameters.AddWithValue("upddate",	this.UpdDate.HasValue ? this.UpdDate.Value : DBNull.Value);
				command.Parameters.AddWithValue("deluser",	String.IsNullOrEmpty(this.DelUser) ? DBNull.Value : this.DelUser);
				command.Parameters.AddWithValue("deldate",	this.DelDate.HasValue ? this.DelDate.Value : DBNull.Value);
				// Execute & synchronize child tables (product_category, stock & filedata)
				int r = command.ExecuteNonQuery();
				if (r == 1)
				{
					command.Parameters.Clear();
					command.CommandText = "delete from assortment.product_category where product_id = :prodid";
					command.Parameters.AddWithValue("prodid", this.ProductId.Value);
					command.ExecuteNonQuery();
					foreach (ProductCategory productCategory in ProductCategoryList)
					{
						productCategory.ProductId = this.ProductId.Value;
						productCategory.Save(conn, trans);
					}
					foreach (Stock stock in this.StockList)
					{
						stock.ProductId = this.ProductId;
						// Set person_id from current updater string
						if (!stock.PersonId.HasValue && !string.IsNullOrEmpty(this.UpdUser))
						{
							var person = Person.GetList().FirstOrDefault(p => p.ToString() == this.UpdUser);
							if (person?.PersonId != null)
								stock.PersonId = person.PersonId;
						}
						stock.Save(conn, trans);
					}
					foreach (Filedata filedata in this.FiledataList)
					{
						if (filedata == null || filedata.Content == null || filedata.Name == null)
							continue;
						filedata.ProductId = this.ProductId;
						filedata.Save(conn, trans);
					}
					trans.Commit();
					return 1;
				}
				else throw 
					new Exception("Product could not be saved for unknown reasons!");
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

		public int Delete(string userInfo) =>
			DbSqlConnection.ExecuteCommand(
				$"update {TABLE} set " +
				"deluser = :p1, " +
				"deldate = :p2 " +
				"where product_id = :p0",
				this.ProductId, userInfo, DateTime.Now);

		// Return formatted string for display purposes
		public override string ToString() => $"{Name} ({Charcode})";

		// Refresh linked lists
		public void Refresh()
		{
			this.ProductCategoryList	= ProductCategory.GetList(this);
			this.StockList						= StockInfo.GetList(this);
			this.FiledataList					= FiledataInfo.GetList(this);
		}
		#endregion
	}
}