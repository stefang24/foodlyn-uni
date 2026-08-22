namespace Foodlyn.Shared.Application
{
    public class AppException : Exception
    {
        public int StatusCode { get; }
        public string UserMessage { get; }

        public AppException(string userMessage, int statusCode = 400)
            : base(userMessage)
        {
            UserMessage = userMessage;
            StatusCode = statusCode;
        }

        public AppException(string userMessage, Exception inner, int statusCode = 400)
            : base(userMessage, inner)
        {
            UserMessage = userMessage;
            StatusCode = statusCode;
        }
    }
}
