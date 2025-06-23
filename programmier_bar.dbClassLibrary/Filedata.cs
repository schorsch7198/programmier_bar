using System.Text.Json.Serialization;
using Npgsql;

namespace programmier_bar.dbClassLibrary
{
	public class Filedata
	{
		// String constant definitions for; TABLE name, comma-seperated COLUMN list and SELECT statement
		protected const string TABLE = "assortment.filedata";
		protected const string COLUMNS =	"filedata_id, " +
																			"product_id, " +
																			"person_id, " +
																			"name, " +
																			"media_type, " +
																			"content";
		protected const string SELECT = "select " + COLUMNS + " from " + TABLE;


		//******************************************************************************************************************
		#region static
		// Retrieve every filedata row in database and all this rows given to a product
		public static List<Filedata> GetList() =>
			DbSqlConnection.ExecuteQuery<Filedata>(SELECT);
		public static List<Filedata> GetList(Product product) =>
			DbSqlConnection.ExecuteQuery<Filedata>($"{SELECT} where product_id = :p0", product.ProductId);

		// Retrieve single filedata by its numeric ID
		public static Filedata Get(long id)
		{
			List<Filedata> list = DbSqlConnection.ExecuteQuery<Filedata>($"{SELECT} where filedata_id = :p0", id);
			if (list.Count == 1) return list[0];
			else return null;
		}
		#endregion


		//******************************************************************************************************************
		#region constructors
		// Parameterless constructor for empty filedata object, set properties manually
		public Filedata()
		{
		}

		// Cast & assign each element
		public Filedata(object[] data)
		{
			this.FiledataId = data[0] == DBNull.Value ? (long?)null : Convert.ToInt64(data[0]);
			this.ProductId	= data[1] == DBNull.Value ? (long?)null : Convert.ToInt64(data[1]);
			this.PersonId		= data[2] == DBNull.Value ? (long?)null : Convert.ToInt64(data[2]);
			this.Name				= data[3] == DBNull.Value ? string.Empty : (string)data[3];
			this.MediaType	= data[4] == DBNull.Value ? string.Empty : (string)data[4];
			this.Content		= data[5] == DBNull.Value ? null : (byte[])data[5];
		}
		#endregion


		//******************************************************************************************************************
		#region private
		#endregion


		//******************************************************************************************************************
		#region properties
		public long?		FiledataId { get; set; }
		public long?		ProductId { get; set; }
		public long?		PersonId { get; set; }
		public string?	Name { get; set; }
		public string?	MediaType { get; set; }

		// ignore byte (binary) array for serialization
		[JsonIgnore()]
		public byte[]		Content { get; set; }

		// Expose data Url instead
		public string?	ContentUrl
		{
			get
			{
				return $"data:{this.MediaType};base64,{Convert.ToBase64String(this.Content)}";
			}
			set
			{
			}
		}
		#endregion


		//******************************************************************************************************************
		#region public
		public int Save(NpgsqlConnection connection = null, NpgsqlTransaction trans = null)
		{
			// If no existing connection provided, open new one. Otherwise reuse supplied one.
			NpgsqlConnection conn = connection;
			if (connection == null)
			{
				conn = DbSqlConnection.GetConnection();
				conn.Open();
			}

			// Create new command on either the provided transaction or a standalone command.
			try
			{
				NpgsqlCommand comm = conn.CreateCommand();
				comm.Transaction = trans;
				if (this.FiledataId.HasValue)
				{
					// UPDATE
					comm.CommandText =
						$"update {TABLE} set " +
						"product_id = :prodid, " +
						"person_id	= :persid, " +
						"name				= :name, " +
						"media_type = :mt, " +
						"content		= :con " +
						"where filedata_id = :fid";
				}
				else
				{
					// SELECT
					comm.CommandText	= $"select nextval('{TABLE}_seq')";
					this.FiledataId		= (long)comm.ExecuteScalar();
					// INSERT
					comm.CommandText	=
						$"insert into {TABLE} ({COLUMNS}) values (" +
						":fid, " +
						":prodid, " +
						":persid, " +
						":name, " +
						":mt, " +
						":con)";
				}

				// Bind parameters (use DBNull.Nalue for any null property)
				comm.Parameters.AddWithValue("fid",			this.FiledataId.Value);
				comm.Parameters.AddWithValue("prodid",	this.ProductId.HasValue ? this.ProductId.Value	: DBNull.Value);
				comm.Parameters.AddWithValue("persid",	this.PersonId.HasValue	? this.PersonId.Value		: DBNull.Value);
				comm.Parameters.AddWithValue("name",		String.IsNullOrEmpty(this.Name) ? DBNull.Value	: this.Name);
				comm.Parameters.AddWithValue("mt",			String.IsNullOrEmpty(this.MediaType)	? DBNull.Value : this.MediaType);
				comm.Parameters.AddWithValue("con",			this.Content == null ? DBNull.Value		: this.Content);
				return comm.ExecuteNonQuery();
			}
			catch (Exception)
			{
				throw;
			}
			finally
			{
				if (connection == null) conn.Close();
			}
		}

		// Render filedata as its name
		public override string ToString()
		{
			return $"{this.Name}";
		}
		#endregion
	}
}