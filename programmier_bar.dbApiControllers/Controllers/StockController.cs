using Microsoft.AspNetCore.Mvc;
using programmier_bar.dbClassLibrary;

namespace programmier_bar.DataApiControllers.Controllers
{
	[Route("stock")]
	[ApiController]
	public class StockController : ControllerBase
	{
		// POST (insert new) Stock entry
		[HttpPost()]
		public IActionResult Insert([FromBody] Stock stock)
		{
			IActionResult result = null;
			try
			{
				Person user = Person.Get(this);
				if (user != null)
				{
					stock.DateTime = DateTime.Now;
					stock.PersonId = user.PersonId;
					if (stock.Save() == 1) result =
							Ok(new { success = true, message = "Stock data successfully saved!", stock });
					else result =
							Ok(new { success = false, message = "Stock data could NOT be saved!" });
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

		// PUT (update) Stock
		[HttpPut("{id}")]
		public IActionResult Update(long id, [FromBody] Stock stock)
		{
			IActionResult result = null;
			try
			{
				Person user = Person.Get(this);
				if (user != null)
				{
					Stock dbStock = Stock.Get(id);
					if (dbStock == null) result = NotFound();
					else
					{
						stock.PersonId = user.PersonId;
						if (stock.Save() == 1) result =
								Ok(new { success = true, message = "Stock data successfully saved!", stock });
						else result =
								Ok(new { success = false, message = "Stock data could NOT be saved!" });
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

//		//DELETE ACTION
//		[HttpDelete("{id}")]
//		public IActionResult Delete(string id)
//		{
//			IActionResult result = null;
//			try
//			{
//				Person user = Person.Get(this);
//				if (user != null)
//				{
//					Stock stock = Stock.Get(id);
//					if (stock == null) result = NotFound();
//					else
//					{
//						if (stock.Delete(user.ToString()) == 1) result =
//							Ok(new { success = true, message	= "Stock data successfully saved!" });
//						else result =
//							Ok(new { success = false, message = "Stock data could NOT be saved!" });
//					}
//				}
//				else result = Unauthorized();
//			}
//			catch (Exception ex)
//			{
//#if DEBUG
//				result = StatusCode(500, new { message = ex.Message });
//#else
//						result = StatusCode(500);
//#endif
//			}
//			return result;
//		}
	}
}