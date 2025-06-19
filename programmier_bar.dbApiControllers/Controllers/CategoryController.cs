using Microsoft.AspNetCore.Mvc;
using programmier_bar.dbClassLibrary;

namespace programmier_bar.DataApiControllers.Controllers
{
	// Controller for retrieving and managing categories (list, create, update, delete)
	[Route("[controller]")]
	[ApiController]
	public class CategoryController : ControllerBase
	{
		// GET /Category – FETCH CATEGORY LIST
		[HttpGet()]
		public IActionResult GetList()
		{
			IActionResult result = null;
			try
			{
				List<CategoryInfo> list = CategoryInfo.GetList();
				result = Ok(list);
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


		// POST /Category – INSERT NEW CATEGRY (requires Disponent role or higher)
		[HttpPost()]
		public IActionResult Insert([FromBody] Category category)
		{
			IActionResult result = null;
			try
			{
				Person user = Person.Get(this);
				if (user == null || (user != null && user.RoleNumber < PersonRole.Disponent)) result = Unauthorized();
				else
				{
					if (category.Save() == 1) result =
							Ok(new { success = true, message = "Category data successfully saved!" });
					else result =
							Ok(new { success = false, message = "Category data could NOT be saved!" });
				}
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


		// PUT /Category/{id} – UPDATE EXISTING CATEGORY by ID (requires Disponent role or higher)
		[HttpPut("{id}")]
		public IActionResult Update(long id, [FromBody] Category category)
		{
			IActionResult result = null;
			try
			{
				Person user = Person.Get(this);
				if (user == null || (user != null && user.RoleNumber < PersonRole.Disponent))
					result = Unauthorized();
				else
				{
					Category dbCategory = Category.Get(id);
					if (dbCategory == null) result = NotFound();
					else
					{
						if (category.Save() == 1) result =
								Ok(new { success = true, message = "Category data successfully saved!" });
						else result =
								Ok(new { success = false, message = "Category data could NOT be saved!" });
					}
				}
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


		// DELETE /Category/{id} – DELETE CATEGORY by ID (requires Disponent role or higher)
		[HttpDelete("{id}")]
		public IActionResult Delete(long id)
		{
			IActionResult result = null;
			try
			{
				Person user = Person.Get(this);
				if (user == null || (user != null && user.RoleNumber < PersonRole.Disponent)) result = Unauthorized();
				else
				{
					Category dbCategory = Category.Get(id);
					if (dbCategory == null) result = NotFound();
					else
					{
						if (dbCategory.Delete() == 1) result =
								Ok(new { success = true, message = "Category data successfully deleted!" });
						else result =
								Ok(new { success = false, message = "Category data could NOT be deleted!" });
					}
				}
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