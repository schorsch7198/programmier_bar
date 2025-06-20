using System.Text.Json.Serialization;
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
					.WithOrigins("http://localhost:5500")   // or whatever your front-end URL is
					.AllowAnyHeader()
					.AllowAnyMethod()
					.AllowCredentials()));
			builder.Services.AddRouting(options =>
			{
				options.LowercaseUrls = true;        // generate lowercase URL paths
				options.LowercaseQueryStrings = true;
			});
			builder.Services.AddControllers()
			.AddJsonOptions(opts =>
			{
				// Ignore cycles (if you have navigation properties)
				opts.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
				// Optionally, skip nulls (so PicType=null isn’t emitted)
				opts.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
			});
			;

			var app = builder.Build();
			if (app.Environment.IsDevelopment())
			{
				app.UseDeveloperExceptionPage();
			}

			// 2) Pipeline order matters!
			app.UseRouting();
			app.UseCors();           // <- applies the policy you registered
			app.UseAuthorization();
			app.MapControllers();
			app.Run();
		}
	}
}