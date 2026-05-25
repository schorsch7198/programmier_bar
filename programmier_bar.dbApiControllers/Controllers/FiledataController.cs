using Microsoft.AspNetCore.Mvc;
using programmier_bar.dbClassLibrary;

namespace programmier_bar.DataApiControllers.Controllers
{
	[Route("filedata")]
	[ApiController]
	public class FiledataController : ControllerBase
	{
		#region Filedata endpoints
		// GET Filedata content (with correct MIME type)
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

		// DELETE Filedata (by ID)
		[HttpDelete("{id}")]
		public IActionResult Delete(long id)
		{
			IActionResult result = null;
			try
			{
				Person user = Person.Get(this);
				if (user != null)
				{
					Filedata filedata = Filedata.Get(id);
					if (filedata == null) result = NotFound();
					else
					{
						if (filedata.Delete() == 1) result =
								Ok(new { success = true, message = "File successfully deleted!" });
						else result =
								Ok(new { success = false, message = "File could NOT be deleted!" });
					}
				}
				else result = Unauthorized();
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
		#endregion
	}
}