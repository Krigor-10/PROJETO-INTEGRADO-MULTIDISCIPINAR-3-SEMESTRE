using Microsoft.AspNetCore.Mvc;
using PlataformaEnsino.API.Dtos;
using PlataformaEnsino.API.Interfaces;

namespace PlataformaEnsino.API.Interfaces;

[Route("api/[controller]")]
[ApiController]
public class MatriculasController : ControllerBase
{
    private readonly IMatriculaService _matriculaService;

    public MatriculasController(IMatriculaService matriculaService)
    {
        _matriculaService = matriculaService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMatriculas()
    {
        var matriculas = await _matriculaService.ListarMatriculasAsync();
        return Ok(matriculas);
    }

    [HttpGet("pendentes")]
    public async Task<IActionResult> ListarPendentes()
    {
        var result = await _matriculaService.ListarMatriculasPendentesAsync();
        return Ok(result);
    }

    [HttpGet("aluno/{alunoId:int}")]
    public async Task<IActionResult> GetMatriculasPorAluno(int alunoId)
    {
        var matriculas = await _matriculaService.ListarMatriculasPorAlunoAsync(alunoId);
        return Ok(matriculas);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetMatriculaPorId(int id)
    {
        var matricula = await _matriculaService.ObterMatriculaPorIdAsync(id);
        return Ok(matricula);
    }

    [HttpPost]
    public async Task<IActionResult> PostMatricula([FromBody] MatriculaCriacaoDto request)
    {
        var matricula = await _matriculaService.MatricularAlunoAsync(request.AlunoId, request.TurmaId);
        return CreatedAtAction(nameof(GetMatriculaPorId), new { id = matricula.Id }, matricula);
    }

    [HttpPut("{id:int}/aprovar")]
    public async Task<IActionResult> Aprovar(int id, [FromBody] int turmaId)
    {
        await _matriculaService.AprovarMatriculaAsync(id, turmaId);
        return Ok(new { mensagem = "Matrícula aprovada com sucesso." });
    }

    [HttpPut("{id:int}/rejeitar")]
    public async Task<IActionResult> Rejeitar(int id)
    {
        await _matriculaService.RejeitarMatriculaAsync(id);
        return Ok(new { mensagem = "Matrícula rejeitada com sucesso." });
    }
}