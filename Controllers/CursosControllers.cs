using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PlataformaEnsino.API.Interfaces;
using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CursosController : ControllerBase
{
    private readonly ICursoService _cursoService;

    public CursosController(ICursoService cursoService)
    {
        _cursoService = cursoService;
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Coordenador")]
    public async Task<IActionResult> CriarCurso([FromBody] Curso curso)
    {
        var novoCurso = await _cursoService.CriarCursoAsync(curso);
        return CreatedAtAction(nameof(ObterCursoPorId), new { id = novoCurso.Id }, novoCurso);
    }

    [HttpGet]
    public async Task<IActionResult> ListarTodos()
    {
        var cursos = await _cursoService.ListarTodosCursosAsync();
        return Ok(cursos);
    }

    [HttpGet("meus")]
    [Authorize(Roles = "Professor")]
    public async Task<IActionResult> ListarMeusCursos()
    {
        var professorId = ObterProfessorId();
        if (!professorId.HasValue)
        {
            return Unauthorized(new { mensagem = "Nao foi possivel identificar o professor autenticado." });
        }

        var cursos = await _cursoService.ListarCursosPorProfessorAsync(professorId.Value);
        return Ok(cursos);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> ObterCursoPorId(int id)
    {
        var curso = await _cursoService.ObterCursoPorIdAsync(id);
        return Ok(curso);
    }

    private int? ObterProfessorId()
    {
        var rawId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("usuarioId");
        return int.TryParse(rawId, out var professorId) ? professorId : null;
    }
}
