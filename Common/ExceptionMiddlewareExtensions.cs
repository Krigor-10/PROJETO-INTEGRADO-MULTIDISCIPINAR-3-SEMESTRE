namespace PlataformaEnsino.API.Common;

public static class ExceptionMiddlewareExtensions
{
    public static IApplicationBuilder UseApiExceptionMiddleware(this IApplicationBuilder app)
    {
        return app.UseMiddleware<ApiExceptionMiddleware>();
    }
}
