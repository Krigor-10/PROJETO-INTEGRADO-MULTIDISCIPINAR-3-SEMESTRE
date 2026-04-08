using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlataformaEnsino.API.Data;
using PlataformaEnsino.API.DTOs;
using PlataformaEnsino.API.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PlataformaEnsino.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AlunosController : ControllerBase
    {
        private readonly PlataformaContext _context;

        public AlunosController(PlataformaContext context)
        {
            _context = context;
        }

        // GET: api/Alunos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Aluno>>> GetAlunos()
        {
            return await _context.Alunos.ToListAsync();
        }

        // POST: api/Alunos
        [HttpPost]
        public async Task<ActionResult<Aluno>> PostAluno(Aluno aluno)
        {
            _context.Alunos.Add(aluno);
            await _context.SaveChangesAsync();

            return Ok(aluno);
        }

        // POST: api/Alunos/cadastro-completo
        [HttpPost("cadastro-completo")]
        public async Task<IActionResult> CadastroCompleto([FromBody] CadastroAlunoDto dto)
        {
            try
            {
                var aluno = new Aluno
                {
                    Nome = dto.Nome,
                    Email = dto.Email,
                    Cpf = dto.Cpf,
                    Telefone = dto.Telefone,
                    Cep = dto.Cep,
                    Rua = dto.Rua,
                    Numero = dto.Numero,
                    Bairro = dto.Bairro,
                    Cidade = dto.Cidade,
                    Estado = dto.Estado,
                    Ativo = true,
                    TipoUsuario = "Aluno", 
                    SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha), 
                    Matricula = $"MAT-{new Random().Next(1000, 9999)}"
                };

                _context.Alunos.Add(aluno);
                await _context.SaveChangesAsync();

                var matricula = new Matricula
                {
                    AlunoId = aluno.Id,
                    CursoId = dto.CursoId,
                    TurmaId = null,
                    DataSolicitacao = DateTime.UtcNow,
                    Status = StatusMatricula.Pendente,
                    NotaFinal = 0
                };

                _context.Matriculas.Add(matricula);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    mensagem = "Cadastro realizado com sucesso. Solicitação pendente de aprovação."
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    erro = ex.Message
                });
            }
        }
        [Authorize]
        [HttpGet("teste-jwt")]
        public IActionResult TesteJwt()
        {
            return Ok(new
            {
                mensagem = "Token válido. Usuário autenticado com sucesso."
            });
        }
    }
}