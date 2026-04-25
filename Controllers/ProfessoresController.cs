using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlataformaEnsino.API.Data;
using PlataformaEnsino.API.DTOs;
using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin,Coordenador")]
    public class ProfessoresController : ControllerBase
    {
        private readonly PlataformaContext _context;

        public ProfessoresController(PlataformaContext context)
        {
            _context = context;
        }

        // GET: api/Professores
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProfessorResponseDto>>> GetProfessores()
        {
            var professores = await _context.Professores
                .AsNoTracking()
                .OrderBy(professor => professor.Nome)
                .ToListAsync();

            return Ok(professores.Select(MapResponse));
        }

        // POST: api/Professores
        [HttpPost]
        public async Task<ActionResult<ProfessorResponseDto>> PostProfessor([FromBody] CriarProfessorDto dto)
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

            var professor = new Professor
            {
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
                Especialidade = dto.Especialidade.Trim()
            };
            professor.ConfigurarAcesso("Professor", BCrypt.Net.BCrypt.HashPassword(dto.Senha), dto.Ativo);

            _context.Professores.Add(professor);
            await _context.SaveChangesAsync();

            return Ok(MapResponse(professor));
        }

        private static ProfessorResponseDto MapResponse(Professor professor)
        {
            return new ProfessorResponseDto
            {
                Id = professor.Id,
                Nome = professor.Nome,
                Email = professor.Email,
                Cpf = professor.Cpf,
                Telefone = professor.Telefone,
                Cep = professor.Cep,
                Rua = professor.Rua,
                Numero = professor.Numero,
                Bairro = professor.Bairro,
                Cidade = professor.Cidade,
                Estado = professor.Estado,
                TipoUsuario = professor.TipoUsuario,
                DataCadastro = professor.DataCadastro,
                Ativo = professor.Ativo,
                Especialidade = professor.Especialidade
            };
        }
    }
}
