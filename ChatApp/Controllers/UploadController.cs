using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class UploadController : ControllerBase
{
	[HttpPost("image")]
	public async Task<IActionResult> UploadImage([FromForm] IFormFile file)
	{
		if (file == null || file.Length == 0)
			return BadRequest("No file uploaded.");

		var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
		if (!Directory.Exists(uploadsDir))
			Directory.CreateDirectory(uploadsDir);

		var fileName = Guid.NewGuid() + Path.GetExtension(file.FileName);
		var filePath = Path.Combine(uploadsDir, fileName);

		using var stream = new FileStream(filePath, FileMode.Create);
		await file.CopyToAsync(stream);

		var imageUrl = $"{Request.Scheme}://{Request.Host}/uploads/{fileName}";
		return Ok(new { imageUrl });
	}
}
