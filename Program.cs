using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using PlataformaEnsino.API.Data;
using PlataformaEnsino.API.Interfaces;
using PlataformaEnsino.API.Repositories;
using PlataformaEnsino.API.Services;
using Sistema_Academico_Integrado.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// 1. CONFIGURAÇÃO DE BANCO E INFRAESTRUTURA
builder.Services.AddDbContext<PlataformaContext>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 2. CONFIGURAÇÃO DO CORS (ESSENCIAL PARA O JAVASCRIPT)
// Isso permite que o seu Front-end acesse a API sem ser bloqueado pelo navegador
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirTudo", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 3. REGISTRO DE REPOSITÓRIOS (Injeção de Dependência)
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IMatriculaRepository, MatriculaRepository>();

// 4. REGISTRO DE SERVIÇOS
builder.Services.AddScoped<IUsuarioService, UsuarioService>();
builder.Services.AddScoped<ICursoService, CursoService>();
builder.Services.AddScoped<IMatriculaService, MatriculaService>();
builder.Services.AddScoped<ITurmaService, TurmaService>();

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();
// 5. CONFIGURAÇÃO DO PIPELINE (ORDEM IMPORTA)

// Ativa o Swagger em qualquer ambiente para facilitar seus testes
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "API V1");
});

// ATIVA O CORS (Deve vir antes de MapControllers)
app.UseCors("PermitirTudo");

// Ativa o suporte para arquivos estáticos (HTML, CSS, JS na pasta wwwroot)


app.UseAuthorization();

// 6. MAPEAMENTO DE ROTAS
app.MapControllers();

Console.WriteLine("====================================================");
Console.WriteLine("SISTEMA ACADÊMICO INICIADO");
Console.WriteLine("API: https://localhost: (verifique a porta no console)");
Console.WriteLine("FRONT-END: Disponível na página inicial");
Console.WriteLine("====================================================");

app.Run();