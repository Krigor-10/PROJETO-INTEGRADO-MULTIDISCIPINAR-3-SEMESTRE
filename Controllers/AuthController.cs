using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PlataformaEnsino.API.Data;
using PlataformaEnsino.API.DTOs;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;

namespace PlataformaEnsino.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly PlataformaContext _context;
    private readonly IConfiguration _configuration;


    public AuthController(PlataformaContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }
    [HttpPost("login")]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Login) || string.IsNullOrWhiteSpace(dto.Senha))
        {
            return BadRequest(new { mensagem = "Login e senha são obrigatórios." });
        }

        var loginNormalizado = dto.Login.Trim();
        var cpfNumerico = new string(loginNormalizado.Where(char.IsDigit).ToArray());

        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u =>
            u.Email == loginNormalizado ||
            u.Cpf == cpfNumerico);

        if (usuario == null || string.IsNullOrWhiteSpace(usuario.SenhaHash) || !BCrypt.Net.BCrypt.Verify(dto.Senha, usuario.SenhaHash))
        {
            return Unauthorized(new { mensagem = "Login ou senha inválidos." });
        }

        if (!usuario.Ativo)
        {
            return Unauthorized(new { mensagem = "Seu cadastro ainda está pendente de liberação." });
        }

        var claims = new List<Claim>
    {
        new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
        new Claim(JwtRegisteredClaimNames.Email, usuario.Email ?? string.Empty),
        new Claim(ClaimTypes.Name, usuario.Nome ?? string.Empty),
        new Claim(ClaimTypes.Role, usuario.TipoUsuario ?? string.Empty),
        new Claim("usuarioId", usuario.Id.ToString())
    };

        var key = _configuration["Jwt:Key"]!;
        var issuer = _configuration["Jwt:Issuer"]!;
        var audience = _configuration["Jwt:Audience"]!;

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(120),
            signingCredentials: credentials
        );

        var jwt = new JwtSecurityTokenHandler().WriteToken(token);

        return Ok(new
        {
            token = jwt,
            usuario = new
            {
                usuario.Id,
                usuario.Nome,
                usuario.Email,
                usuario.Cpf,
                usuario.TipoUsuario
            }
        });
    }
}
