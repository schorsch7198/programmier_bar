using System.Text;
using System.Xml.Serialization;

namespace programmier_bar.dbClassLibrary
{
	public sealed class DbSettings
	{
		// Serializer for persisting settings as XML
		private static readonly XmlSerializer _serializer = new XmlSerializer(typeof(DbSettings));

		// Full path to AppData settings file
		private static readonly string _filePath = Path.Combine(
				Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
				"programmier_bar.settings"
		);

		// Required database connection properties
		public string UserName	{ get; set; }
		public string Password	{ get; set; }
		public string Db				{ get; set; }
		public string Host			{ get; set; }

		// Load settings from AppData XML file
		public static DbSettings Load()
		{
			if (!File.Exists(_filePath))
				throw new InvalidOperationException(
						$"Database Settings file not found: '{_filePath}'");

			using var stream = new FileStream(
					_filePath,
					FileMode.Open,
					FileAccess.Read,
					FileShare.Read
			);
			var settings = (DbSettings)_serializer.Deserialize(stream);
			// Validate
			if (string.IsNullOrWhiteSpace(settings.UserName)	||
					string.IsNullOrWhiteSpace(settings.Password)	||
					string.IsNullOrWhiteSpace(settings.Db)				||
					string.IsNullOrWhiteSpace(settings.Host))
			{
				throw new InvalidOperationException(
						"One or more Database Settings are missing or empty.");
			}
			return settings;
		}

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
