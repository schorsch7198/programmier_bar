using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace programmier_bar.dbClassLibrary
{
	// Permission definition
	public enum PersonRole
	{
		Standard = 0,
		Disponent = 1,
		Administration = 2
	}
	// Searchable fields when retrieving person by a given key
	public enum PersonField
	{
		LoginName,
		LoginToken,
		PersonId
	}

	public class LoginRequest
	{
		public string Username { get; set; }
		public string Password { get; set; }
	}

	public class Person
	{
		// Database table name, its columns (comma-seperated list) and SELECT clause
		protected const string TABLE = "assortment.person";
		protected const string COLUMNS =
			"person_id, " +
			"digit, " +
			"surname, " +
			"forename, " +
			"title_pre, " +
			"title_post, " +
			"role_number, " +
			"role_text, " +
			"login_name, " +
			"password, " +
			"login_token, " +
			"login_until, " +
			"login_last, " +
			"pic, " +
			"pic_type";
		protected const string SELECT = "select " + COLUMNS + " from " + TABLE;


		//******************************************************************************************************************
		#region static
		// Retrieve list of all person records from database
		public static List<Person> GetList() =>
			DbSqlConnection.ExecuteQuery<Person>(SELECT);
		// Retrieve currently logged-in person based on login_token-cookie
		public static Person Get(ControllerBase control)
		{
			Person person = null;
			string loginToken = control.Request.Cookies["logintoken"];
			if (!String.IsNullOrEmpty(loginToken))
			{
				//string loginTokenDecoded = WebUtility.UrlDecode(loginToken);
				person = Person.Get(loginToken, PersonField.LoginToken);
				// If login token expired -> 'not found'
				if (person != null && person.LoginUntil.HasValue && person.LoginUntil.Value < DateTime.Now)
					person = null;
			}
			return person;
		}

		// Retrieve person by specified field
		public static Person Get(string subject, PersonField field)
		{
			NpgsqlConnection conn = DbSqlConnection.GetConnection();
			Person person = null;
			try
			{
				conn.Open();
				NpgsqlCommand comm = conn.CreateCommand();
				switch (field)
				{
					case PersonField.LoginName:
						comm.CommandText = $"{SELECT} where lower(login_name) = :ln";
						comm.Parameters.AddWithValue("ln", subject.ToLower());
						break;
					case PersonField.LoginToken:
						comm.CommandText = $"{SELECT} where login_token = :ln";
						comm.Parameters.AddWithValue("ln", subject);
						break;
					case PersonField.PersonId:
						comm.CommandText = $"{SELECT} where person_id = :persid";
						comm.Parameters.AddWithValue("persid", long.Parse(subject));
						break;
				}
				// Execute query & read first matching row
				NpgsqlDataReader read = comm.ExecuteReader();
				if (read.Read())
				{
					object[] row = new object[read.FieldCount];
					read.GetValues(row);
					person = new Person(row);
				}
				read.Close();
			}
			catch (Exception)
			{
				throw;
			}
			finally
			{
				conn.Close();
			}
			DateTime d = DateTime.Now;
			d = d.AddHours(3);
			person.LoginUntil = d;
			return person;
		}
		#endregion


		//******************************************************************************************************************
		#region constructors
		// Default constructor for manual instantiation
		public Person()
		{
		}

		// Initialize Person objec from object[] (returned by data reader)
		public Person(object[] data)
		{
			this.PersonId = data[0] == DBNull.Value ? (long?)null : Convert.ToInt64(data[0]);
			this.Digit = data[1] == DBNull.Value ? (int?)null : Convert.ToInt32(data[1]);
			this.Surname = data[2] == DBNull.Value ? string.Empty : (string)data[2];
			this.Forename = data[3] == DBNull.Value ? string.Empty : (string)data[3];
			this.TitlePre = data[4] == DBNull.Value ? string.Empty : (string)data[4];
			this.TitlePost = data[5] == DBNull.Value ? string.Empty : (string)data[5];
			this.RoleNumber = data[6] == DBNull.Value ? (PersonRole?)null : (PersonRole)Convert.ToInt32(data[6]);
			this.RoleText = data[7] == DBNull.Value ? string.Empty : (string)data[7];
			this.LoginName = data[8] == DBNull.Value ? string.Empty : (string)data[8];
			this.pwd = data[9] == DBNull.Value ? string.Empty : (string)data[9];
			this.LoginToken = data[10] == DBNull.Value ? string.Empty : (string)data[10];
			this.LoginUntil = data[11] == DBNull.Value ? (DateTime?)null : (DateTime?)data[11];
			this.LoginLast = data[12] == DBNull.Value ? (DateTime?)null : (DateTime?)data[12];
			//this.Pic = data[13] == DBNull.Value ? null : (byte[])data[13];
			this.PicType = data[14] == DBNull.Value ? string.Empty : (string)data[14];
		}
		#endregion


		//******************************************************************************************************************
		#region private
		private string pwd = string.Empty;
		#endregion


		//******************************************************************************************************************
		#region properties
		public long? PersonId { get; set; }
		public int? Digit { get; set; }
		public string? Surname { get; set; }
		public string? Forename { get; set; }
		public string? TitlePre { get; set; }
		public string? TitlePost { get; set; }
		public PersonRole? RoleNumber { get; set; }
		public string? RoleText { get; set; }
		public string? LoginName { get; set; }

		// Plain-text password for setting or updating (hashed when saed)
		public string? Password { get; set; }

		// Hashed password stored in database (not exposed to JSON)
		[JsonIgnore()]
		public string? PasswordIntern { get; set; } = string.Empty;

		// Whether password has been set (based on internal hash)
		public bool PasswordSet
		{
			get
			{
				return !String.IsNullOrEmpty(this.PasswordIntern);
			}
			set
			{
			}
		}

		public string? LoginToken { get; set; }
		public DateTime? LoginUntil { get; set; }
		public DateTime? LoginLast { get; set; }

		// Profile pic binary data
		[JsonIgnore()]
		public byte[]? Pic { get; set; }
		public string? PicType { get; set; }

		public string PicString
		{

			get
			{
				if (this.Pic != null && this.Pic.Length > 0)
					return $"data:{this.PicType};base64,{Convert.ToBase64String(this.Pic)}";
				else
					return string.Empty;
			}
			set
			{
				if (String.IsNullOrEmpty(value)) this.Pic = null;
				if (String.IsNullOrEmpty(value))
				{
					this.Pic = null;
					this.PicType = null; // 🛠 Fix required here!
				}
				else
				{
					// Extract MIME type and Base64 payload from "data:<type>;base64,<data>"
					int pos1 = value.IndexOf(':');
					int pos2 = value.IndexOf(';');
					this.PicType = value[(pos1 + 1)..pos2];
					this.Pic = Convert.FromBase64String(value[(pos2 + 8)..]);
				}
			}
		}
		#endregion


		//******************************************************************************************************************
		#region public
		public int Save()
		{
			// Get connection string
			NpgsqlConnection conn = DbSqlConnection.GetConnection();
			try
			{
				// Open connection and execute command
				conn.Open();
				NpgsqlCommand comm = conn.CreateCommand();
				if (this.PersonId.HasValue)
				{
					// UPDATE
					comm.CommandText =
						$"update {TABLE} set " +
						"digit = :d, " +
						"surname = :sn, " +
						"forename	= :fn, " +
						"title_pre = :tpre, " +
						"title_post = :tpost, " +
						"role_number = :rn, " +
						"role_text = :rt, " +
						"login_name = :ln, " +
						"password = :pwd, " +
						"login_token = :lt, " +
						"login_until = :lu, " +
						"login_last = :ll, " +
						"pic = :pic, " +
						"pic_type = :pict " +
						"where person_id = :persid";
				}
				else
				{
					// SELECT (fetch next seq value for new person_id
					comm.CommandText = $"select nextval('{TABLE}_seq')";
					this.PersonId = (long)comm.ExecuteScalar();
					// INSERT
					comm.CommandText = $"insert into {TABLE} ({COLUMNS}) values (" +
						":persid, " +
						":d, " +
						":sn, " +
						":fn, " +
						":tpre, " +
						":tpost, " +
						":rn, " +
						":rt, " +
						":ln, " +
						":pwd, " +
						":lt, " +
						":lu, " +
						":ll, " +
						":pic, " +
						":pict)";
					comm.CommandText = comm.CommandText.Replace(":", "@");
				}

				// Bind parameters (for either INSERT or UPDATE)
				comm.Parameters.AddWithValue("persid", this.PersonId.Value);
				comm.Parameters.AddWithValue("d", this.Digit.HasValue ? this.Digit.Value : DBNull.Value);
				comm.Parameters.AddWithValue("sn", String.IsNullOrEmpty(this.Surname) ? DBNull.Value : this.Surname);
				comm.Parameters.AddWithValue("fn", String.IsNullOrEmpty(this.Forename) ? DBNull.Value : this.Forename);
				comm.Parameters.AddWithValue("tpre", String.IsNullOrEmpty(this.TitlePre) ? DBNull.Value : this.TitlePre);
				comm.Parameters.AddWithValue("tpost", String.IsNullOrEmpty(this.TitlePost) ? DBNull.Value : this.TitlePost);
				comm.Parameters.AddWithValue("rn", this.RoleNumber.HasValue ? (int)this.RoleNumber.Value : DBNull.Value);
				comm.Parameters.AddWithValue("rt", this.RoleNumber.HasValue ? this.RoleNumber.Value.ToString() : DBNull.Value);
				comm.Parameters.AddWithValue("ln", String.IsNullOrEmpty(this.LoginName) ? DBNull.Value : this.LoginName);

				//If a new plain- text password was provided, hash it
				//if (!String.IsNullOrEmpty(this.Password)) this.PasswordIntern = GetPwdHash(this.Password);
				//comm.Parameters.AddWithValue("pwd", String.IsNullOrEmpty(this.PasswordIntern) ? DBNull.Value : this.PasswordIntern);


				if (!String.IsNullOrEmpty(this.Password))
				{
					SHA512 sha = SHA512.Create();
					this.pwd = Convert.ToBase64String(sha.ComputeHash(Encoding.UTF8.GetBytes(this.Password)));
				}
				// 🔐 Ensure loginToken exists for new users
				if (string.IsNullOrEmpty(this.LoginToken))
					this.LoginToken = Guid.NewGuid().ToString();

				comm.Parameters.AddWithValue("pwd", String.IsNullOrEmpty(this.pwd) ? DBNull.Value : this.pwd);


				comm.Parameters.AddWithValue("lt", String.IsNullOrEmpty(this.LoginToken) ? DBNull.Value : this.LoginToken);
				comm.Parameters.AddWithValue("lu", this.LoginUntil.HasValue ? this.LoginUntil.Value : (object)DBNull.Value);
				comm.Parameters.AddWithValue("ll", this.LoginLast.HasValue ? this.LoginLast.Value : DBNull.Value);
				comm.Parameters.AddWithValue("pic", this.Pic == null ? DBNull.Value : this.Pic);

				//if (string.IsNullOrEmpty(this.PicType) && this.Pic != null)
				//	this.PicType = "image/png"; // or detect from binary header
				comm.Parameters.AddWithValue("pict", String.IsNullOrEmpty(this.PicType) ? DBNull.Value : this.PicType);

				return comm.ExecuteNonQuery();

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


		public bool CheckPassword(string password)
		{
			SHA512 sha = SHA512.Create();
			return Convert.ToBase64String(sha.ComputeHash(Encoding.UTF8.GetBytes(password))) == this.pwd.Trim();
		}

		// Delete person if it has a valid person_id
		public int Delete()
		{
			NpgsqlConnection connection = DbSqlConnection.GetConnection();
			try
			{
				connection.Open();
				NpgsqlCommand command = connection.CreateCommand();
				if (this.PersonId.HasValue)
				{
					// DELETE
					command.CommandText = $"delete from {TABLE} where person_id = :persid";
					command.Parameters.AddWithValue("persid", this.PersonId.Value);
					return command.ExecuteNonQuery();
				}
				else return 0;
			}
			catch (Exception ex)
			{
				throw;
			}
			finally
			{
				connection.Close();
			}
		}

		// Return person's full name (trim any extra spaces)
		public override string ToString()
		{
			return $"{this.TitlePre} {this.Forename} {this.Surname} {this.TitlePost}".Trim();
		}
		#endregion
	}
}