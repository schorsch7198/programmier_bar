using Microsoft.AspNetCore.Mvc;
using programmier_bar.dbClassLibrary;

namespace programmier_bar.DataApiControllers.Controllers
{
	[Route("page")]
	[ApiController]
	public class PageController : ControllerBase
	{
		// GET Page (by current user)
		[HttpGet("init")]
		public IActionResult PageInit()
		{
			IActionResult result = null;
			try
			{
				Person user = Person.Get(this);
				if (user == null) result = Unauthorized();
				else result = Ok(user);
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

		// GET /page/productlist
		[HttpGet("productlist")]
		public IActionResult PageProductList()
		{
			IActionResult result = null;
			try
			{
				List<ProductInfo> productList = ProductInfo.GetList();
				List<Category> categoryList = Category.GetList();
				result = Ok(new
				{
					productList,
					categoryList
				});
			}
			catch (Exception ex)
			{
			#if DEBUG
				result = StatusCode(500, new { message = ex.InnerException != null ? ex.InnerException.Message : ex.Message });
			#else
				result = StatusCode(500, new { message = ex.ToString() });
			#endif
			}
			return result;
		}

		// GET /page/logout – DELETE logintoken & cookie
		[HttpGet("logout")]
		public IActionResult PageLogout()
		{
			IActionResult result = null;
			try
			{
				Person user = Person.Get(this);
				user.LoginUntil = null;
				user.LoginToken = null;
				user.Save();
				Response.Cookies.Delete("logintoken");
				result = Ok(new { success = true, message = "Logout successfull!" });
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