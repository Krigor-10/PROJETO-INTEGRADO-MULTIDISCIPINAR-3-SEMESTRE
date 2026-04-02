using Microsoft.AspNetCore.Mvc;
using PlataformaEnsino.API.Interfaces;
using PlataformaEnsino.API.Models;
using System;
using System.Threading.Tasks;

namespace PlataformaEnsino.API.Controllers
{
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
        public async Task<IActionResult> CriarCurso([FromBody] Curso curso)
        {
            try
            {
                var novoCurso = await _cursoService.CriarCursoAsync(curso);
                return CreatedAtAction(nameof(ObterCursoPorId), new { id = novoCurso.Id }, novoCurso);
            }
            catch (Exception ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> ListarTodos()
        {
            try
            {
                var cursos = await _cursoService.ListarTodosCursosAsync();
                return Ok(cursos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObterCursoPorId(int id)
        {
            try
            {
                var curso = await _cursoService.ObterCursoPorIdAsync(id);
                return Ok(curso);
            }
            catch (Exception ex)
            {
                return NotFound(new { erro = ex.Message });
            }
        }
    }
}