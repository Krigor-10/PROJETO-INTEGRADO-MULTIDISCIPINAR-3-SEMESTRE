using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PlataformaEnsino.API.DTOs;
using PlataformaEnsino.API.Interfaces;

namespace PlataformaEnsino.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class MatriculasController : ControllerBase
{
    private readonly IMatriculaService _matriculaService;

    public MatriculasController(IMatriculaService matriculaService)
    {
        _matriculaService = matriculaService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Coordenador")]
    public async Task<IActionResult> GetMatriculas()
    {
        var matriculas = await _matriculaService.ListarMatriculasAsync();
        return Ok(matriculas);
    }

    [HttpGet("pendentes")]
    [Authorize(Roles = "Admin,Coordenador")]
    public async Task<IActionResult> ListarPendentes()
    {
        var result = await _matriculaService.ListarMatriculasPendentesAsync();
        return Ok(result);
    }

    [HttpGet("aluno/{alunoId:int}")]
    public async Task<IActionResult> GetMatriculasPorAluno(int alunoId)
    {
        if (!UsuarioAtualPodeAcessarAluno(alunoId))
        {
            return Forbid();
        }

        var matriculas = await _matriculaService.ListarMatriculasPorAlunoAsync(alunoId);
        return Ok(matriculas);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetMatriculaPorId(int id)
    {
        var matricula = await _matriculaService.ObterMatriculaPorIdAsync(id);

        if (!UsuarioAtualPodeAcessarAluno(matricula.AlunoId))
        {
            return Forbid();
        }

        return Ok(matricula);
    }

    [HttpPost]
    public async Task<IActionResult> PostMatricula([FromBody] MatriculaCriacaoDto request)
    {
        if (!UsuarioAtualPodeAcessarAluno(request.AlunoId))
        {
            return Forbid();
        }

        var matricula = await _matriculaService.MatricularAlunoAsync(request.AlunoId, request.TurmaId);
        return CreatedAtAction(nameof(GetMatriculaPorId), new { id = matricula.Id }, matricula);
    }

    [HttpPut("{id:int}/aprovar")]
    [Authorize(Roles = "Admin,Coordenador")]
    public async Task<IActionResult> Aprovar(int id, [FromBody] int turmaId)
    {
        await _matriculaService.AprovarMatriculaAsync(id, turmaId);
        return Ok(new { mensagem = "Matrícula aprovada com sucesso." });
    }

    [HttpPut("aprovar-lote")]
    [Authorize(Roles = "Admin,Coordenador")]
    public async Task<IActionResult> AprovarLote([FromBody] AprovarMatriculasLoteRequestDto request)
    {
        var resultado = await _matriculaService.AprovarMatriculasAutomaticamenteAsync(request?.MatriculaIds ?? []);
        return Ok(resultado);
    }

    [HttpPut("{id:int}/rejeitar")]
    [Authorize(Roles = "Admin,Coordenador")]
    public async Task<IActionResult> Rejeitar(int id)
    {
        await _matriculaService.RejeitarMatriculaAsync(id);
        return Ok(new { mensagem = "Matrícula rejeitada com sucesso." });
    }

    private bool UsuarioAtualPodeAcessarAluno(int alunoId)
    {
        if (User.IsInRole("Admin") || User.IsInRole("Coordenador"))
        {
            return true;
        }

        var usuarioId = User.FindFirst("usuarioId")?.Value;
        return int.TryParse(usuarioId, out var id) && id == alunoId;
    }
}
