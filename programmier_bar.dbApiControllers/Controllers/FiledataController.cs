using Microsoft.AspNetCore.Mvc;
using programmier_bar.dbClassLibrary;

namespace programmier_bar.DataApiControllers.Controllers
{
	// Controller responsible for serving file content for download by filedata ID
	[Route("[controller]")]
	[ApiController]
	public class FiledataController : ControllerBase
	{
		// GET /Filedata/{id}/download – FETCH FILEDATA CONTENT with correct MIME type and filename
		[HttpGet("{id}/download")]
		public IActionResult Download(long id)
		{
			IActionResult result;
			try
			{
				Filedata filedata = Filedata.Get(id);
				if (filedata != null)
				{
					// MemoryStream?
					MemoryStream stream = new MemoryStream(filedata.Content);
					result = new FileStreamResult(stream, filedata.MediaType) { FileDownloadName = filedata.Name };
				}
				else result = NotFound();
			}
			catch (Exception ex)
			{
#if DEBUG
				result = StatusCode(500, new { message = ex.Message });
#else
				result = StatusCode(500);
#endif
			}
			return result;
		}
	}
}