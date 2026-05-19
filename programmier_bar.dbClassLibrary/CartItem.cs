using Npgsql;

namespace programmier_bar.dbClassLibrary
{
	public class CartItem
	{
		// String constant definitions for; TABLE name, comma-seperated COLUMN list and SELECT statement
		protected const string TABLE = "assortment.cart_item";
		protected const string COLUMNS =	"cart_item_id, " +
																			"cart_id, " +
																			"product_id, " +
																			"quantity, " +
																			"insuser, " +
																			"insdate, " +
																			"upduser, " +
																			"upddate, " +
																			"deluser, " +
																			"deldate";
		protected const string SELECT = "select " + COLUMNS + " from " + TABLE;


		//******************************************************************************************************************
		#region static
		// Get all active cart items
		public static List<CartItem> GetList() =>
			DbSqlConnection.ExecuteQuery<CartItem>($"{SELECT} where deldate is null");

		// Get active items belonging to a specific cart
		public static List<CartItem> GetList(Cart cart) =>
			DbSqlConnection.ExecuteQuery<CartItem>(
				$"{SELECT} where cart_id = :p0 and deldate is null", cart.CartId);

		// Get single active cart item by id
		public static CartItem Get(long id)
		{
			List<CartItem> list = DbSqlConnection.ExecuteQuery<CartItem>(
				$"{SELECT} where cart_item_id = :p0 and deldate is null", id);
			if (list.Count > 0) return list[0];
			return null;
		}

		// Look up an active item by (cart, product) — used to merge instead of duplicating
		public static CartItem GetByCartProduct(long cartId, long productId)
		{
			List<CartItem> list = DbSqlConnection.ExecuteQuery<CartItem>(
				$"{SELECT} where cart_id = :p0 and product_id = :p1 and deldate is null",
				cartId, productId);
			if (list.Count > 0) return list[0];
			return null;
		}
		#endregion


		//******************************************************************************************************************
		#region constructors
		public CartItem()
		{
		}

		public CartItem(object[] data)
		{
			this.CartItemId	= Convert.ToInt64(data[0]);
			this.CartId			= Convert.ToInt64(data[1]);
			this.ProductId	= Convert.ToInt64(data[2]);
			this.Quantity		= Convert.ToInt32(data[3]);
			this.InsUser		= data[4] == DBNull.Value ? string.Empty : (string)data[4];
			this.InsDate		= data[5] == DBNull.Value ? null : (DateTime)data[5];
			this.UpdUser		= data[6] == DBNull.Value ? string.Empty : (string)data[6];
			this.UpdDate		= data[7] == DBNull.Value ? null : (DateTime)data[7];
			this.DelUser		= data[8] == DBNull.Value ? string.Empty : (string)data[8];
			this.DelDate		= data[9] == DBNull.Value ? null : (DateTime)data[9];
		}
		#endregion


		//******************************************************************************************************************
		#region properties
		public long?			CartItemId { get; set; }
		public long				CartId { get; set; }
		public long				ProductId { get; set; }
		public int				Quantity { get; set; }
		public string?		InsUser { get; set; }
		public DateTime?	InsDate { get; set; }
		public string?		UpdUser { get; set; }
		public DateTime?	UpdDate { get; set; }
		public string?		DelUser { get; set; }
		public DateTime?	DelDate { get; set; }
		#endregion


		//******************************************************************************************************************
		#region public methods
		// Save accepts optional conn/trans so the parent Cart can save items in its transaction
		public int Save(string userInfo = null, NpgsqlConnection connection = null, NpgsqlTransaction trans = null)
		{
			NpgsqlConnection conn = connection;
			try
			{
				if (conn == null)
				{
					conn = DbSqlConnection.GetConnection();
					conn.Open();
				}
				NpgsqlCommand comm = conn.CreateCommand();
				comm.Transaction = trans;

				if (this.CartItemId.HasValue)
				{
					this.UpdUser = userInfo;
					this.UpdDate = DateTime.Now;
					comm.CommandText =
						$"update {TABLE} set " +
						"cart_id = :cid, " +
						"product_id = :prodid, " +
						"quantity = :qty, " +
						"upduser = :upduser, " +
						"upddate = :upddate " +
						"where cart_item_id = :ciid";
				}
				else
				{
					comm.CommandText = $"select nextval('{TABLE}_seq')";
					this.CartItemId	= (long)comm.ExecuteScalar();
					this.InsUser		= userInfo;
					this.InsDate		= DateTime.Now;
					this.UpdUser		= userInfo;
					this.UpdDate		= this.InsDate;
					comm.CommandText =
						$"insert into {TABLE} (cart_item_id, cart_id, product_id, quantity, insuser, insdate, upduser, upddate) values (" +
						":ciid, :cid, :prodid, :qty, :insuser, :insdate, :upduser, :upddate)";
				}

				comm.Parameters.AddWithValue("ciid",		this.CartItemId.Value);
				comm.Parameters.AddWithValue("cid",			this.CartId);
				comm.Parameters.AddWithValue("prodid",	this.ProductId);
				comm.Parameters.AddWithValue("qty",			this.Quantity);
				comm.Parameters.AddWithValue("insuser",	String.IsNullOrEmpty(this.InsUser) ? DBNull.Value : this.InsUser);
				comm.Parameters.AddWithValue("insdate",	this.InsDate.HasValue ? this.InsDate.Value : DBNull.Value);
				comm.Parameters.AddWithValue("upduser",	String.IsNullOrEmpty(this.UpdUser) ? DBNull.Value : this.UpdUser);
				comm.Parameters.AddWithValue("upddate",	this.UpdDate.HasValue ? this.UpdDate.Value : DBNull.Value);

				return comm.ExecuteNonQuery();
			}
			catch (Exception)
			{
				throw;
			}
			finally
			{
				if (connection == null && conn != null) conn.Close();
			}
		}

		// Soft-delete this item
		public int Delete(string userInfo) =>
			DbSqlConnection.ExecuteCommand(
				$"update {TABLE} set " +
				"deluser = :p1, " +
				"deldate = :p2, " +
				"upduser = :p1, " +
				"upddate = :p2 " +
				"where cart_item_id = :p0",
				this.CartItemId, userInfo, DateTime.Now);
		#endregion
	}
}
