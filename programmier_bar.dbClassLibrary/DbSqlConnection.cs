//using Npgsql;

//namespace programmier_bar.dbClassLibrary
//{
//	public static class DbSqlConnection
//	{
//		// holding shared database connection if dbSettings are retrieved
//		private static NpgsqlConnection connection = null;
//		static DbSqlConnection()
//		{
//			DbSettings set = DbSettings.Get();
//			//if (set == null)
//			//{
//			//	connection = new NpgsqlConnection($"user id=barAdmin;password=barAdmin;database=programmier_bar;host=localhost;port=5432");


//			//	connection = new NpgsqlConnection(
//			//			$"user id={set.UserName};"	+
//			//			$"password={set.Password};" +
//			//			$"database={set.Db};"				+
//			//			$"host={set.Host};"					+
//			//			$"port=5432"
//			//	);
//			//}


//			//if (set == null)
//			//{
//			//	// first‐run default
//			//	set = new DbSettings
//			//	{
//			//		UserName = "postres",
//			//		Password = "wifi",
//			//		Db = "programmier_bar",
//			//		Host = "localhost"
//			//	};
//			//	set.Save(); // writes the XML file
//			//}

//			// now set is non‐null → build connection
//			connection = new NpgsqlConnection(
//				"user id=" + set.UserName + ";" +
//				"password=" + set.Password + ";" +
//				"database=" + set.Db + ";" +
//				"host=" + set.Host + ";" +
//				"port=5432"
//			);
//		}
//		// Return !single shared! instance
//		public static NpgsqlConnection GetConnection() => connection;


//		// Execute SQL query (SELECT) and map each result row to an instance of T
//		public static List<T> ExecuteQuery<T>(string sql, params object[] args)
//		{
//			List<T> list = new List<T>();
//			NpgsqlConnection conn = DbSqlConnection.GetConnection();
//			try
//			{
//				conn.Open();
//				NpgsqlCommand comm = conn.CreateCommand();
//				comm.CommandText = sql;
//				// Add parameters (p0, p1, ...) if provided
//				if (args != null && args.Length > 0)
//				{
//					for (int i = 0; i < args.Length; i++)
//						comm.Parameters.AddWithValue($"p{i}", args[i]);
//				}
//				NpgsqlDataReader read = comm.ExecuteReader();
//				while (read.Read())
//				{
//					object[] row = new object[read.FieldCount];
//					read.GetValues(row);

//					// Create new instance of T by passing the row-values array to T's constructor
//					//list.Add((T)Activator.CreateInstance(typeof(T), [row]));
//					T item = (T)Activator.CreateInstance(typeof(T), new object[] { row });
//					list.Add(item);
//				}
//				read.Close();
//			}
//			// Catch and rethrow exceptions for caller (admin) to handle
//			catch (Exception)
//			{
//				throw;
//			}
//			finally
//			{
//				conn.Close();
//			}
//			return list;
//		}


//		// Ececute SQL command (INSERT, UPDATE, DELETE, etc.) and return number of affected rows
//		public static int ExecuteCommand(string sql, params object[] args)
//		{
//			int result = 0;
//			NpgsqlConnection conn = DbSqlConnection.GetConnection();
//			try
//			{
//				conn.Open();
//				NpgsqlCommand comm = conn.CreateCommand();
//				comm.CommandText = sql;
//				if (args != null && args.Length > 0)
//				{
//					for (int i = 0; i < args.Length; i++)
//						comm.Parameters.AddWithValue($"p{i}", args[i]);
//				}
//				result = comm.ExecuteNonQuery();
//			}
//			catch (Exception)
//			{
//				throw;
//			}
//			finally
//			{
//				conn.Close();
//			}
//			return result;
//		}
//	}
//}


using System;
using Npgsql;

namespace programmier_bar.dbClassLibrary
{
	public static class DbSqlConnection
	{
		// Immutable connection string built once from settings
		private static readonly string ConnectionString;

		static DbSqlConnection()
		{
			// Load DB settings (throws if missing/invalid)
			var set = DbSettings.Load();

			// Build the connection string safely
			var builder = new NpgsqlConnectionStringBuilder
			{
				Host = set.Host,
				Port = 5432,
				Database = set.Db,
				Username = set.UserName,
				Password = set.Password,
				SslMode = SslMode.Disable,
				Pooling = true
			};
			ConnectionString = builder.ConnectionString;
		}

		// Returns a fresh NpgsqlConnection using the configured connection string.
		// Caller is responsible for opening and disposing the connection.
		public static NpgsqlConnection GetConnection()
		{
			return new NpgsqlConnection(ConnectionString);
		}

		// Executes a SELECT query and maps each row to an instance of T via a constructor T(object[]).
		public static List<T> ExecuteQuery<T>(string sql, params object[] args)
		{
			var list = new List<T>();
			using var conn = GetConnection();
			conn.Open();
			using var comm = conn.CreateCommand();
			comm.CommandText = sql;

			if (args != null)
			{
				for (int i = 0; i < args.Length; i++)
					comm.Parameters.AddWithValue($"p{i}", args[i] ?? DBNull.Value);
			}

			using var reader = comm.ExecuteReader();
			while (reader.Read())
			{
				var row = new object[reader.FieldCount];
				reader.GetValues(row);
				var item = (T)Activator.CreateInstance(typeof(T), new object[] { row });
				list.Add(item);
			}
			return list;
		}

		// Executes a non-query SQL command (INSERT, UPDATE, DELETE) and returns affected row count.
		public static int ExecuteCommand(string sql, params object[] args)
		{
			using var conn = GetConnection();
			conn.Open();
			using var comm = conn.CreateCommand();
			comm.CommandText = sql;

			if (args != null)
			{
				for (int i = 0; i < args.Length; i++)
					comm.Parameters.AddWithValue($"p{i}", args[i] ?? DBNull.Value);
			}

			return comm.ExecuteNonQuery();
		}
	}
}
