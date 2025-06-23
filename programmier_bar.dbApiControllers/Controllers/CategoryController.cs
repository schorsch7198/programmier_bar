using Microsoft.AspNetCore.Mvc;
using programmier_bar.dbClassLibrary;

namespace programmier_bar.DataApiControllers.Controllers
{
	[Route("category")]
	[ApiController]
	public class CategoryController : ControllerBase
	{
		// GET Category List
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

		// POST new Category
		[HttpPost()]
		public IActionResult Insert([FromBody] Category category)
		{
			IActionResult result = null;
			try
			{
				Person user = Person.Get(this);
				if (user == null || (user != null && user.RoleNumber < PersonRole.Disponent))
					result = Unauthorized();
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

		// PUT (update) Category
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

		// DELETE Category (by ID)
		[HttpDelete("{id}")]
		public IActionResult Delete(long id)
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