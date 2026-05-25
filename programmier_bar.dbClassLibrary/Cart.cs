using Npgsql;

namespace programmier_bar.dbClassLibrary
{
	public class Cart
	{
		// String constant definitions for; TABLE name, comma-seperated COLUMN list and SELECT statement
		protected const string TABLE = "assortment.cart";
		protected const string COLUMNS =	"cart_id, " +
																			"person_id, " +
																			"insuser, " +
																			"insdate, " +
																			"upduser, " +
																			"upddate, " +
																			"deluser, " +
																			"deldate";
		protected const string SELECT = "select " + COLUMNS + " from " + TABLE;


		//******************************************************************************************************************
		#region static
		// Get all active carts
		public static List<Cart> GetList() =>
			DbSqlConnection.ExecuteQuery<Cart>($"{SELECT} where deldate is null");

		// Get single cart by id; populates ItemList
		public static Cart Get(long id)
		{
			var list = DbSqlConnection.ExecuteQuery<Cart>(
				$"{SELECT} where cart_id = :p0 and deldate is null", id);
			if (list.Count == 1)
			{
				list[0].ItemList = CartItem.GetList(list[0]);
				return list[0];
			}
			return null;
		}

		// Get current cart for a person; populates ItemList. Returns null if person has no cart yet.
		public static Cart GetByPerson(long personId)
		{
			var list = DbSqlConnection.ExecuteQuery<Cart>(
				$"{SELECT} where person_id = :p0 and deldate is null", personId);
			if (list.Count == 1)
			{
				list[0].ItemList = CartItem.GetList(list[0]);
				return list[0];
			}
			return null;
		}

		// Get existing cart for person, or create an empty one if missing
		public static Cart GetOrCreate(long personId, string userInfo)
		{
			Cart cart = GetByPerson(personId);
			if (cart == null)
			{
				cart = new Cart { PersonId = personId };
				cart.Save(userInfo);
			}
			return cart;
		}

		// Single-query checkout: soft-delete every active item in the person's cart.
		// Returns the affected row count — 0 means "no cart yet or empty cart".
		public static int CheckoutByPerson(long personId, string userInfo) =>
			DbSqlConnection.ExecuteCommand(
				"update assortment.cart_item set " +
				"deluser = :p1, " +
				"deldate = :p2, " +
				"upduser = :p1, " +
				"upddate = :p2 " +
				"where cart_id = (select cart_id from assortment.cart " +
								"where person_id = :p0 and deldate is null) " +
				"and deldate is null",
				personId, userInfo, DateTime.Now);
		#endregion


		//******************************************************************************************************************
		#region constructors
		public Cart()
		{
		}

		public Cart(object[] data)
		{
			this.CartId		= Convert.ToInt64(data[0]);
			this.PersonId	= Convert.ToInt64(data[1]);
			this.InsUser	= data[2] == DBNull.Value ? string.Empty : (string)data[2];
			this.InsDate	= data[3] == DBNull.Value ? null : (DateTime)data[3];
			this.UpdUser	= data[4] == DBNull.Value ? string.Empty : (string)data[4];
			this.UpdDate	= data[5] == DBNull.Value ? null : (DateTime)data[5];
			this.DelUser	= data[6] == DBNull.Value ? string.Empty : (string)data[6];
			this.DelDate	= data[7] == DBNull.Value ? null : (DateTime)data[7];
		}
		#endregion


		//******************************************************************************************************************
		#region properties
		public long?			CartId { get; set; }
		public long				PersonId { get; set; }
		public string?		InsUser { get; set; }
		public DateTime?	InsDate { get; set; }
		public string?		UpdUser { get; set; }
		public DateTime?	UpdDate { get; set; }
		public string?		DelUser { get; set; }
		public DateTime?	DelDate { get; set; }

		// Collection of line items — populated by Get/GetByPerson
		public List<CartItem> ItemList { get; set; } = new List<CartItem>();
		#endregion


		//******************************************************************************************************************
		#region public methods
		// Save cart and (optionally) all items in a single transaction
		public int Save(string userInfo = null)
		{
			NpgsqlConnection conn = DbSqlConnection.GetConnection();
			NpgsqlTransaction trans = null;
			try
			{
				conn.Open();
				trans = conn.BeginTransaction();
				NpgsqlCommand command = conn.CreateCommand();
				command.Transaction = trans;

				if (this.CartId.HasValue)
				{
					this.UpdUser = userInfo;
					this.UpdDate = DateTime.Now;
					command.CommandText =
						$"update {TABLE} set " +
						"person_id = :persid, " +
						"insuser = :insuser, " +
						"insdate = :insdate, " +
						"upduser = :upduser, " +
						"upddate = :upddate, " +
						"deluser = :deluser, " +
						"deldate = :deldate " +
						"where cart_id = :cid";
				}
				else
				{
					command.CommandText = $"select nextval('{TABLE}_seq')";
					this.CartId		= (long)command.ExecuteScalar();
					this.InsUser	= userInfo;
					this.InsDate	= DateTime.Now;
					this.UpdUser	= userInfo;
					this.UpdDate	= this.InsDate;
					command.CommandText =
						$"insert into {TABLE} ({COLUMNS}) values (" +
						":cid, " +
						":persid, " +
						":insuser, " +
						":insdate, " +
						":upduser, " +
						":upddate, " +
						":deluser, " +
						":deldate)";
				}

				command.Parameters.AddWithValue("cid",			this.CartId.Value);
				command.Parameters.AddWithValue("persid",		this.PersonId);
				command.Parameters.AddWithValue("insuser",	String.IsNullOrEmpty(this.InsUser) ? DBNull.Value : this.InsUser);
				command.Parameters.AddWithValue("insdate",	this.InsDate.HasValue ? this.InsDate.Value : DBNull.Value);
				command.Parameters.AddWithValue("upduser",	String.IsNullOrEmpty(this.UpdUser) ? DBNull.Value : this.UpdUser);
				command.Parameters.AddWithValue("upddate",	this.UpdDate.HasValue ? this.UpdDate.Value : DBNull.Value);
				command.Parameters.AddWithValue("deluser",	String.IsNullOrEmpty(this.DelUser) ? DBNull.Value : this.DelUser);
				command.Parameters.AddWithValue("deldate",	this.DelDate.HasValue ? this.DelDate.Value : DBNull.Value);

				int r = command.ExecuteNonQuery();
				if (r == 1)
				{
					// Persist any provided line items in the same transaction
					foreach (CartItem item in this.ItemList)
					{
						item.CartId = this.CartId.Value;
						item.Save(userInfo, conn, trans);
					}
					trans.Commit();
					return 1;
				}
				else throw new Exception("Cart could not be saved for unknown reasons!");
			}
			catch (Exception)
			{
				throw;
			}
			finally
			{
				conn.Close();
			}
		}

		// Soft-delete all active items belonging to this cart (checkout)
		public int Checkout(string userInfo) =>
			DbSqlConnection.ExecuteCommand(
				"update assortment.cart_item set " +
				"deluser = :p1, " +
				"deldate = :p2, " +
				"upduser = :p1, " +
				"upddate = :p2 " +
				"where cart_id = :p0 and deldate is null",
				this.CartId, userInfo, DateTime.Now);

		// Refresh the line items collection from the database
		public void Refresh()
		{
			this.ItemList = CartItem.GetList(this);
		}
		#endregion
	}
}
