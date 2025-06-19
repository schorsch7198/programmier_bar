using System.Text;


namespace programmier_bar.dbApiControllers
{
    public class Program
    {
		public static void Main(string[] args)
		{
			// Make System.Text.Encoding.GetEncoding("ISO-8859-1") available
			Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

			var builder = WebApplication.CreateBuilder(args);

			// 1) Register CORS *and* controllers
			builder.Services.AddCors(options =>
				options.AddDefaultPolicy(policy => policy
					.WithOrigins("http://localhost:5500", "http://localhost:5501")   // or whatever your front-end URL is
					.AllowAnyHeader()
					.AllowAnyMethod()
					.AllowCredentials()));
			builder.Services.AddControllers();

			var app = builder.Build();

			// 2) Pipeline order matters!
			app.UseRouting();
			app.UseCors();           // <- applies the policy you registered
			app.UseAuthorization();

			app.MapControllers();
			app.Run();

		}
	}
}