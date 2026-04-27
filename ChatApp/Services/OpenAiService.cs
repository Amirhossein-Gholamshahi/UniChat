using System.Net.Http.Headers;
using System.Text.Json;
using System.Text;
using Microsoft.AspNetCore.SignalR;
using ChatApp.Hubs;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Services
{
	public class OpenAiService
	{
		private readonly HttpClient _httpClient;
		private readonly string _apiKey;
		private readonly IHubContext<ChatHub> _hubContext;

		public OpenAiService(string apiKey, IHubContext<ChatHub> hubContext)
		{
			_apiKey = apiKey;
			_httpClient = new HttpClient();
			_httpClient.DefaultRequestHeaders.Authorization =
				new AuthenticationHeaderValue("Bearer", _apiKey);
			_hubContext = hubContext;
		}

		public async Task<string> AnswerQuestionAsync(string question)
		{
			var requestBody = new
			{
				model = "gpt-5-nano",
				messages = new[]
							{
								new { role = "system", content = "You are a helpful assistant. Answer questions clearly and concisely." },
								new { role = "user", content = question }
							},

			};


			var content = new StringContent(
				JsonSerializer.Serialize(requestBody),
				Encoding.UTF8,
				"application/json"
			);

			var response = await _httpClient.PostAsync("https://api.openai.com/v1/chat/completions", content);
			response.EnsureSuccessStatusCode();

			var responseString = await response.Content.ReadAsStringAsync();
			using var doc = JsonDocument.Parse(responseString);

			return doc.RootElement
					  .GetProperty("choices")[0]
					  .GetProperty("message")
					  .GetProperty("content")
					  .GetString()
					  .Trim();
		}
		public async Task<string> StreamAnswerAsync(string question, string connectionId, List<ApiMessage> recentMessages)
		{
			var messageHistory = new List<object>
			{
				new { role = "system", content = "You are a helpful assistant. Keep answers short and clear." }
			};

			messageHistory.AddRange(recentMessages);

			messageHistory.Add(new { role = "user", content = question });

			var requestBody = new
			{
				model = "gpt-5-nano",
				stream = true, // enable streaming
				messages = messageHistory
			};

			var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions")
			{
				Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json")
			};

			request.Headers.Add("Authorization", $"Bearer {_apiKey}");

			using var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);
			response.EnsureSuccessStatusCode();

			using var stream = await response.Content.ReadAsStreamAsync();
			using var reader = new StreamReader(stream);
			var fullResponse = new StringBuilder();
			await _hubContext.Clients.Client(connectionId).SendAsync("ShowTyping", "ai-1");
			try
			{
				while (!reader.EndOfStream)
				{
					var line = await reader.ReadLineAsync();
					if (string.IsNullOrWhiteSpace(line) || !line.StartsWith("data: ")) continue;
					var json = line.Substring("data: ".Length);

					if (json.Contains("[DONE]")) break;

					using var doc = JsonDocument.Parse(json);
					var choice = doc.RootElement.GetProperty("choices")[0];

					if (choice.TryGetProperty("finish_reason", out var reason) && reason.GetString() == "stop")
					{
						// end of stream
						break;
					}

					var delta = doc.RootElement
								   .GetProperty("choices")[0]
								   .GetProperty("delta")
								   .GetProperty("content")
								   .GetString();

					if (!string.IsNullOrEmpty(delta))
					{
						await Task.Delay(100);
						// send partial content to client via SignalR
						fullResponse.Append(delta);
						await _hubContext.Clients.Client(connectionId).SendAsync("ReceiveMessage", "ai-1", delta);

					}
				}
				reader.Dispose();
				await stream.DisposeAsync();

			}
			catch (Exception e)
			{
				Console.WriteLine(e);
				throw;
			}
			finally
			{
				// Always hide typing no matter what
				await _hubContext.Clients.Client(connectionId).SendAsync("HideTyping", "ai-1");
			}
			return fullResponse.ToString();
		}

	}
}
