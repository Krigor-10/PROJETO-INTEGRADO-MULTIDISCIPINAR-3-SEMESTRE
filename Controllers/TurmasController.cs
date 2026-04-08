using Microsoft.AspNetCore.Mvc;
using PlataformaEnsino.API.DTOs;
using PlataformaEnsino.API.Interfaces;
using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TurmasController : ControllerBase
{
    private readonly ITurmaService _turmaService;

    public TurmasController(ITurmaService turmaService)
    {
        _turmaService = turmaService;
    }

    [HttpPost]
    public async Task<IActionResult> CriarTurma([FromBody] CriarTurmaDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {

            var turma = new Turma
            {
                NomeTurma = dto.NomeTurma,
                CursoId = dto.CursoId,
                ProfessorId = dto.ProfessorId
            };

            var turmaCriada = await _turmaService.CriarTurmaAsync(turma);

            var response = new TurmaResponseDto
            {
                Id = turmaCriada.Id,
                NomeTurma = turmaCriada.NomeTurma,
                DataCriacao = turmaCriada.DataCriacao,
                CursoId = turmaCriada.CursoId,
                ProfessorId = turmaCriada.ProfessorId
            };

            return CreatedAtAction(
                nameof(ObterTurmaPorId),
                new { id = response.Id },
                response);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { mensagem = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensagem = ex.Message });
        }

    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterTurmaPorId(int id)
    {
        try
        {
            var turma = await _turmaService.ObterTurmaPorIdAsync(id);

            var response = new TurmaResponseDto
            {
                Id = turma.Id,
                NomeTurma = turma.NomeTurma,
                DataCriacao = turma.DataCriacao,
                CursoId = turma.CursoId,
                ProfessorId = turma.ProfessorId
            };

            return Ok(response);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { mensagem = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> ListarTurmas()
    {
        var turmas = await _turmaService.ListarTurmasAsync();

        var response = turmas.Select(t => new TurmaResponseDto
        {
            Id = t.Id,
            NomeTurma = t.NomeTurma,
            DataCriacao = t.DataCriacao,
            CursoId = t.CursoId,
            ProfessorId = t.ProfessorId
        });

        return Ok(response);
    }
}