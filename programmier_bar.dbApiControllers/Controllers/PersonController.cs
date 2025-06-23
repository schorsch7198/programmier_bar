using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using programmier_bar.dbClassLibrary;

namespace programmier_bar.DataApiControllers.Controllers
{
	[Route("person")]
	[ApiController]
	public class PersonController : ControllerBase
	{
		// GET PersonList (if role admin)
		[HttpGet()]
		public IActionResult GetList()
		{
			IActionResult result = null;

			try
			{
				Person user = Person.Get(this);
				if (user == null || (user != null && user.RoleNumber != PersonRole.Administration))
					result = Unauthorized();
				else
				{
					List<Person> personList = Person.GetList();
					result = Ok(personList);
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

		// GET Person (can be seen by current user and admin)
		[HttpGet("{id}")]
		public IActionResult Get(string id)
		{
			IActionResult result = null;
			try
			{
				Person user = Person.Get(this);
				if (user == null) result = Unauthorized();
				else
				{
					Person person = Person.Get(id, PersonField.PersonId);
					if (person == null) result = NotFound();
					else
					{
						if (user.RoleNumber == PersonRole.Administration ||
								(user.RoleNumber != PersonRole.Administration &&
								 user.PersonId == person.PersonId))
							result = Ok(person);
						else result = Unauthorized();
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

		// POST (get) Login Credentials
		[HttpPost("login")]
		public IActionResult Login()
		{
			IActionResult result = null;
			try
			{
				if (!String.IsNullOrEmpty(this.Request.Form["username"]) &&
						!String.IsNullOrEmpty(this.Request.Form["password"]))
				{
					Person person = Person.Get(this.Request.Form["username"], PersonField.LoginName);
					if (person == null) result =
						Unauthorized(new { success = false, message = "Username NOT found" });
					else
					{
						if (person.CheckPassword(this.Request.Form["password"]))
						{
							person.LoginLast = DateTime.Now;
							person.LoginUntil = DateTime.Now.AddDays(1);
							SHA512 sha = SHA512.Create();
							person.LoginToken = Convert.ToBase64String(
								sha.ComputeHash(Encoding.UTF8.GetBytes
									($"{person.LoginName} {DateTime.Now:yyyyMMddHHmmssfff}")));
							person.Save();
							this.Response.Cookies.Append("logintoken", person.LoginToken, new CookieOptions()
							{
								Expires = person.LoginUntil.Value,
								SameSite = SameSiteMode.Unspecified,
								Secure = true
							});
							result = Ok(
								new { success = true, message = "Login successful!", person = person });
						}
						else result = Unauthorized(
							new { success = false, message = "Username/Password NOT found" });
					}
				}
				else throw new Exception("Username/Passwort was not specified!");
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

		// POST (insert new) Person 
		[HttpPost()]
		//[AllowAnonymous]
		[RequestSizeLimit(10485760)]
		public IActionResult Insert([FromBody] Person person)
		{
			IActionResult result = null;
			try
			{
				Person user = Person.Get(this);
				if (user != null)
				{
					if (person.Save() == 1) result =
							Ok(new { success = true, message = "Person data successfully saved!", person });
					else result =
							Ok(new { success = false, message = "Person data could NOT be saved!" });
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

		// PUT (update) Person
		[HttpPut("{id}")]
		[RequestSizeLimit(10485760)]
		public IActionResult Update(string id, [FromBody] Person person)
		{
			IActionResult result = null;
			try
			{
				Person user = Person.Get(this);
				if (user != null)
				{
					Person dbPerson = Person.Get(id, PersonField.PersonId);
					if (dbPerson == null) result = NotFound();
					else
					{
						if (String.IsNullOrEmpty(person.Password)) person.PasswordIntern = dbPerson.PasswordIntern;
						// ✅ Preserve profile picture if none submitted
						if (person.Pic == null || person.Pic.Length == 0)
						{
							person.Pic = dbPerson.Pic;
							person.PicType = dbPerson.PicType;
						}
						////
						if (person.Save() == 1) result =
								Ok(new { success = true, message = "Person data successfully saved!", person });
						else result =
								Ok(new { success = false, message = "Person data could NOT be saved!" });
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

		// DELETE Person ID
		[HttpDelete("{id}")]
		public IActionResult Delete(string id)
		{
			IActionResult result = null;
			try
			{
				Person user = Person.Get(this);
				if (user != null)
				{
					Person dbPerson = Person.Get(id, PersonField.PersonId);
					if (dbPerson == null) result = NotFound();
					else
					{
						if (dbPerson.Delete() == 1) result =
								Ok(new { success = true, message = "Person data successfully deleted!" });
						else result =
								Ok(new { success = false, message = "Person data could NOT be deleted!" });
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