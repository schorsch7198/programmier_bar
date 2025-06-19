//using System.Text;
//using System.Xml.Serialization;

//namespace programmier_bar.dbClassLibrary
//{
//	public class DbSettings
//	{
//		// XML serializer instance and creates a file in user's/admin's AppData folder 
//		private static XmlSerializer serializer = new(typeof(DbSettings));
//		private static string filePath =
//			$"{Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData)}\\programmier_bar.settings";


//		// Load and deserialize settings from disk (returns null if none exist)
//		public static DbSettings Get()
//		{
//			if (!File.Exists(filePath)) return null;
//			else
//			{
//				StreamReader read = new StreamReader(filePath);
//				DbSettings set = (DbSettings)serializer.Deserialize(read);
//				read.Close();
//				return set;
//			}
//		}


//		// !Required! database connection properties
//		public required string UserName { get; set; }
//		public required string Password { get; set; }
//		public required string Db				{ get; set; }
//		public required string Host			{ get; set; }


//		// Serialize and save settings back to the file
//		public void Save()
//		{
//			StreamWriter write = new(filePath, false, Encoding.UTF8);
//			serializer.Serialize(write, this);
//			write.Close();
//		}
//	}
//}


using System;
using System.IO;
using System.Text;
using System.Xml.Serialization;

namespace programmier_bar.dbClassLibrary
{
	public sealed class DbSettings
	{
		// Serializer for persisting settings as XML
		private static readonly XmlSerializer _serializer = new XmlSerializer(typeof(DbSettings));

		// Full path to the AppData settings file
		private static readonly string _filePath = Path.Combine(
				Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
				"programmier_bar.settings"
		);

		// Required database connection properties
		public string UserName	{ get; set; }
		public string Password	{ get; set; }
		public string Db				{ get; set; }
		public string Host			{ get; set; }

		/// <summary>
		/// Loads the settings from the AppData XML file. Throws if missing or invalid.
		/// </summary>
		public static DbSettings Load()
		{
			if (!File.Exists(_filePath))
				throw new InvalidOperationException(
						$"Database settings file not found: '{_filePath}'");

			using var stream = new FileStream(
					_filePath,
					FileMode.Open,
					FileAccess.Read,
					FileShare.Read
			);
			var settings = (DbSettings)_serializer.Deserialize(stream);
			// Validate
			if (string.IsNullOrWhiteSpace(settings.UserName) ||
					string.IsNullOrWhiteSpace(settings.Password) ||
					string.IsNullOrWhiteSpace(settings.Db) ||
					string.IsNullOrWhiteSpace(settings.Host))
			{
				throw new InvalidOperationException(
						"One or more database settings are missing or empty.");
			}
			return settings;
		}

		/// Attempts to load settings; returns false if file is missing or invalid.
		public static bool TryLoad(out DbSettings settings)
		{
			try
			{
				settings = Load();
				return true;
			}
			catch
			{
				settings = null;
				return false;
			}
		}

		/// Saves the current settings back to the AppData XML file (creating directory as needed).
		public void Save()
		{
			var directory = Path.GetDirectoryName(_filePath);
			if (!Directory.Exists(directory))
				Directory.CreateDirectory(directory);

			using var writer = new StreamWriter(_filePath, false, Encoding.UTF8);
			_serializer.Serialize(writer, this);
		}
	}
}
