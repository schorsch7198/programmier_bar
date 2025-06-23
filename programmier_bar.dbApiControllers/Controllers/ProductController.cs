using Microsoft.AspNetCore.Mvc;
using programmier_bar.dbClassLibrary;

namespace programmier_bar.DataApiControllers.Controllers
{
	[Route("product")]
	[ApiController]
	public class ProductController : ControllerBase
	{
		// GET Products
		[HttpGet()]
		public IActionResult GetList(long? cid)
		{
			IActionResult result = null;
			try
			{
				//Person user = Person.Get(this);
				//if (user != null)
				//{

				if (cid.HasValue)
				{
					Category category = Category.Get(cid.Value);
					result = Ok(ProductInfo.GetList(category));
				}
				else result = Ok(Product.GetList());
				//}
				//else result = Unauthorized();
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

		// GET (single) Product
		[HttpGet("{id}")]
		public IActionResult Get(string id)
		{
			IActionResult result = null;
			try
			{
				Person user = Person.Get(this);
				if (user != null)
				{
					Product product = Product.Get(id);
					product.ProductCategoryList = ProductCategory.GetList(product);
					if (product == null) result = NotFound();
					else result = Ok(product);
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

		// POST (insert new) Product
		[HttpPost()]
		public IActionResult Insert([FromBody] Product product)
		{
			IActionResult result = null;
			try
			{
				Person user = Person.Get(this);
				if (user != null)
				{
					if (product.Save(user.ToString()) == 1) result =
							Ok(new { success = true, message = "Product data successfully saved!", product });
					else result =
							Ok(new { success = false, message = "Product data could NOT be saved!" });
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

		// PUT (update) Product
		[HttpPut("{id}")]
		public IActionResult Update(string id, [FromBody] Product product)
		{

			IActionResult result = null;
			try
			{
				Person user = Person.Get(this);
				if (user != null)
				{
					Product dbProduct = Product.Get(id);
					if (dbProduct == null) result = NotFound();
					else
					{
						if (product.Save(user.ToString()) == 1) result =
								Ok(new { success = true, message = "Product data successfully saved!", product });
						else result =
								Ok(new { success = false, message = "Product data could NOT be saved!" });
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

		// DELETE Product
		[HttpDelete("{id}")]
		public IActionResult Delete(string id)
		{
			IActionResult result = null;
			try
			{
				Person user = Person.Get(this);
				if (user != null)
				{
					Product product = Product.Get(id);
					if (product == null) result = NotFound();
					else
					{
						if (product.Delete(user.ToString()) == 1) result =
								Ok(new { success = true, message = "Product data successfully deleted!" });
						else result =
								Ok(new { success = false, message = "Product data NOT deleted!" });
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

		// GET Stock for Product
		[HttpGet("{id}/stock")]
		public IActionResult GetStockList(string id)
		{
			IActionResult result = null;
			try
			{
				Person user = Person.Get(this);
				long? personId = user.PersonId;
				if (user != null)
				{
					Product product = Product.Get(id);
					if (product == null) result = NotFound();
					else
					{
						List<StockInfo> list = StockInfo.GetList(product);
						result = Ok(list);
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

		// POST (insert new) Stock for Product
		[HttpPost("{id}/stock")]
		public IActionResult PostStock(string id, [FromBody] Stock stock)
		{
			IActionResult result = null;
			try
			{
				Person user = Person.Get(this);
				if (user != null)
				{
					Product product = Product.Get(id);
					if (product == null) result = NotFound();
					else
					{
						stock.ProductId = product.ProductId;
						stock.PersonId = user.PersonId.Value;
						if (stock.Save() == 1) result = Ok(new { success = true });
						else result = StatusCode(500, 
							new { success = false, message = "Could not save stock" });
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

		// GET Filedata for Product
		[HttpGet("{id}/filedata")]
		public IActionResult GetListFiledata(string id)
		{
			IActionResult result = null;
			try
			{
				Person user = Person.Get(this);
				if (user != null)
				{
					Product product = Product.Get(id);
					if (product == null) result = NotFound();
					else
					{
						List<Filedata> list = Filedata.GetList(product);
						result = Ok(list);
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

		// POST (insert new) Filedata for Product
		[HttpPost("{id}/filedata")]
		[RequestFormLimits(MultipartBodyLengthLimit = 52428800)]
		public IActionResult SaveFiledataList(string id)
		{
			IActionResult result = null;
			try
			{
				Person user = Person.Get(this);
				if (user != null)
				{
					Product dbProduct = Product.Get(id);
					if (dbProduct == null) result = NotFound(
						new { success = false, message = $"Product '{id}' not found." });
					else
					{
						if (this.Request.Form.Files.Count > 0)
						{
							int saveCnt = 0;
							MemoryStream stream = null;
							Filedata filedata = null;
							foreach (IFormFile file in this.Request.Form.Files)
							{
								stream = new MemoryStream();
								file.CopyTo(stream);
								filedata = new Filedata()
								{
									ProductId = dbProduct.ProductId,
									MediaType = file.ContentType,
									Name = file.FileName,
									Content = stream.ToArray()
								};
								saveCnt += filedata.Save();
							}
							if (saveCnt == this.Request.Form.Files.Count) result =
									Ok(new { success = true, 
										message = $"All {saveCnt} File(s) saved!" });
							else result =
									Ok(new { success = false, 
										message = $"{saveCnt} / {this.Request.Form.Files.Count} File(s) saved!" });
						}
						else result = Ok(new { success = false, 
							message = "No file data showed off / specified!" });
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
	}
}