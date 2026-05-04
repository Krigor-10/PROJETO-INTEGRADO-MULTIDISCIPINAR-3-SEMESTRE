using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlataformaEnsino.API.Common;
using PlataformaEnsino.API.DTOs;
using PlataformaEnsino.API.Models;
using PlataformaEnsino.API.Data;

namespace PlataformaEnsino.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
    public class CoordenadoresController : ControllerBase
    {
        private readonly PlataformaContext _context;

        public CoordenadoresController(PlataformaContext context)
        {
            _context = context;
        }

        // GET: api/Coordenadores
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CoordenadorResponseDto>>> GetCoordenadores()
        {
            var coordenadores = await _context.Coordenadores
                .AsNoTracking()
                .OrderBy(coordenador => coordenador.Nome)
                .ToListAsync();

            return Ok(coordenadores.Select(MapResponse));
        }

        // POST: api/Coordenadores
        [HttpPost]
        public async Task<ActionResult<CoordenadorResponseDto>> PostCoordenador([FromBody] CriarCoordenadorDto dto)
        {
            var emailNormalizado = dto.Email.Trim().ToLower();
            var cpfNormalizado = new string(dto.Cpf.Where(char.IsDigit).ToArray());

            if (await _context.Usuarios.AnyAsync(usuario => usuario.Email.ToLower() == emailNormalizado))
            {
                return BadRequest(new { erro = "Ja existe um usuario com este e-mail." });
            }

            if (await _context.Usuarios.AnyAsync(usuario => usuario.Cpf == cpfNormalizado))
            {
                return BadRequest(new { erro = "Ja existe um usuario com este CPF." });
            }

            var coordenador = new Coordenador
            {
                CodigoRegistro = await GerarCodigoCoordenadorAsync(),
                Nome = dto.Nome.Trim(),
                Email = emailNormalizado,
                Cpf = cpfNormalizado,
                Telefone = dto.Telefone.Trim(),
                Cep = dto.Cep.Trim(),
                Rua = dto.Rua.Trim(),
                Numero = dto.Numero.Trim(),
                Bairro = dto.Bairro.Trim(),
                Cidade = dto.Cidade.Trim(),
                Estado = dto.Estado.Trim().ToUpper(),
                CursoResponsavel = dto.CursoResponsavel?.Trim()
            };
            coordenador.ConfigurarAcesso("Coordenador", BCrypt.Net.BCrypt.HashPassword(dto.Senha), dto.Ativo);

            _context.Coordenadores.Add(coordenador);
            await _context.SaveChangesAsync();

            return Ok(MapResponse(coordenador));
        }

        private async Task<string> GerarCodigoCoordenadorAsync()
        {
            for (var tentativa = 0; tentativa < 10; tentativa++)
            {
                var codigo = CodigoRegistroGenerator.GerarCoordenador();

                if (!await _context.Coordenadores.AnyAsync(coordenador => coordenador.CodigoRegistro == codigo))
                {
                    return codigo;
                }
            }

            throw new InvalidOperationException("Nao foi possivel gerar um codigo de registro unico para o coordenador.");
        }

        private static CoordenadorResponseDto MapResponse(Coordenador coordenador)
        {
            return new CoordenadorResponseDto
            {
                Id = coordenador.Id,
                CodigoRegistro = coordenador.CodigoRegistro,
                Nome = coordenador.Nome,
                Email = coordenador.Email,
                Cpf = coordenador.Cpf,
                Telefone = coordenador.Telefone,
                Cep = coordenador.Cep,
                Rua = coordenador.Rua,
                Numero = coordenador.Numero,
                Bairro = coordenador.Bairro,
                Cidade = coordenador.Cidade,
                Estado = coordenador.Estado,
                TipoUsuario = coordenador.TipoUsuario,
                DataCadastro = coordenador.DataCadastro,
                Ativo = coordenador.Ativo,
                CursoResponsavel = coordenador.CursoResponsavel
            };
        }
    }
}
