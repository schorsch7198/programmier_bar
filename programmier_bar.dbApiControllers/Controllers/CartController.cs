using Microsoft.AspNetCore.Mvc;
using programmier_bar.dbClassLibrary;

namespace programmier_bar.DataApiControllers.Controllers
{
	[Route("cart")]
	[ApiController]
	public class CartController : ControllerBase
	{
		#region Cart
		// GET current user's cart (auto-creates if missing) with all active items
		[HttpGet()]
		public IActionResult Get()
		{
			IActionResult result;
			try
			{
				Person user = Person.Get(this);
				if (user == null) return Unauthorized();

				Cart cart = Cart.GetOrCreate(user.PersonId.Value, user.ToString());
				result = Ok(cart);
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

		#region Cart Items
		// POST add a product to the current user's cart; merges with existing line if present
		[HttpPost("items")]
		public IActionResult AddItem([FromBody] CartItem incoming)
		{
			IActionResult result;
			try
			{
				Person user = Person.Get(this);
				if (user == null) return Unauthorized();

				if (incoming == null || incoming.ProductId <= 0 || incoming.Quantity <= 0)
					return BadRequest(new { success = false, message = "productId and positive quantity required." });

				Product product = Product.Get(incoming.ProductId.ToString());
				if (product == null) return NotFound(new { success = false, message = "Product not found." });

				Cart cart = Cart.GetOrCreate(user.PersonId.Value, user.ToString());

				CartItem existing = CartItem.GetByCartProduct(cart.CartId.Value, incoming.ProductId);
				int saved;
				if (existing != null)
				{
					existing.Quantity += incoming.Quantity;
					saved = existing.Save(user.ToString());
				}
				else
				{
					var item = new CartItem
					{
						CartId = cart.CartId.Value,
						ProductId = incoming.ProductId,
						Quantity = incoming.Quantity
					};
					saved = item.Save(user.ToString());
				}

				if (saved == 1) result = Ok(new { success = true, message = "Item added to cart." });
				else result = Ok(new { success = false, message = "Item could NOT be saved." });
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

		// PUT update quantity of an existing cart item
		[HttpPut("items/{id}")]
		public IActionResult UpdateItem(long id, [FromBody] CartItem incoming)
		{
			IActionResult result;
			try
			{
				Person user = Person.Get(this);
				if (user == null) return Unauthorized();

				CartItem item = CartItem.Get(id);
				if (item == null) return NotFound();

				// Ownership check: item must belong to the caller's cart
				Cart cart = Cart.GetByPerson(user.PersonId.Value);
				if (cart == null || cart.CartId != item.CartId) return Unauthorized();

				if (incoming == null || incoming.Quantity <= 0)
					return BadRequest(new { success = false, message = "Positive quantity required." });

				item.Quantity = incoming.Quantity;
				int saved = item.Save(user.ToString());

				if (saved == 1) result = Ok(new { success = true, message = "Item updated." });
				else result = Ok(new { success = false, message = "Item could NOT be updated." });
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

		// DELETE soft-delete an existing cart item
		[HttpDelete("items/{id}")]
		public IActionResult DeleteItem(long id)
		{
			IActionResult result;
			try
			{
				Person user = Person.Get(this);
				if (user == null) return Unauthorized();

				CartItem item = CartItem.Get(id);
				if (item == null) return NotFound();

				Cart cart = Cart.GetByPerson(user.PersonId.Value);
				if (cart == null || cart.CartId != item.CartId) return Unauthorized();

				int deleted = item.Delete(user.ToString());
				if (deleted == 1) result = Ok(new { success = true, message = "Item removed." });
				else result = Ok(new { success = false, message = "Item NOT removed." });
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

		#region Checkout & Sync
		// POST checkout — soft-delete all active items in caller's cart (single SQL statement)
		[HttpPost("checkout")]
		public IActionResult Checkout()
		{
			IActionResult result;
			try
			{
				Person user = Person.Get(this);
				if (user == null) return Unauthorized();

				int affected = Cart.CheckoutByPerson(user.PersonId.Value, user.ToString());
				if (affected == 0)
					result = Ok(new { success = false, message = "Cart is empty." });
				else
					result = Ok(new { success = true, message = $"Checkout complete — {affected} item(s) submitted." });
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

		// POST sync — merge a batch of items (from anonymous localStorage cart) into the user's server cart
		[HttpPost("sync")]
		public IActionResult Sync([FromBody] List<CartItem> incoming)
		{
			IActionResult result;
			try
			{
				Person user = Person.Get(this);
				if (user == null) return Unauthorized();

				if (incoming == null || incoming.Count == 0)
					return Ok(new { success = true, message = "Nothing to sync." });

				Cart cart = Cart.GetOrCreate(user.PersonId.Value, user.ToString());
				int merged = 0;
				foreach (CartItem inc in incoming)
				{
					if (inc.ProductId <= 0 || inc.Quantity <= 0) continue;

					CartItem existing = CartItem.GetByCartProduct(cart.CartId.Value, inc.ProductId);
					if (existing != null)
					{
						existing.Quantity += inc.Quantity;
						if (existing.Save(user.ToString()) == 1) merged++;
					}
					else
					{
						var item = new CartItem
						{
							CartId = cart.CartId.Value,
							ProductId = inc.ProductId,
							Quantity = inc.Quantity
						};
						if (item.Save(user.ToString()) == 1) merged++;
					}
				}
				result = Ok(new { success = true, message = $"{merged} item(s) merged." });
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
