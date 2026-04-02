using Microsoft.AspNetCore.Mvc;
using PlataformaEnsino.API.Interfaces;
using PlataformaEnsino.API.Models;
using System;
using System.Threading.Tasks;

namespace PlataformaEnsino.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsuariosController : ControllerBase
    {
        private readonly IUsuarioService _usuarioService;

        public UsuariosController(IUsuarioService usuarioService)
        {
            _usuarioService = usuarioService;
        }

        [HttpPost]
        public async Task<IActionResult> CriarUsuario([FromBody] Usuario usuario)
        {
            try
            {
                var novoUsuario = await _usuarioService.CriarUsuarioAsync(usuario);
                return CreatedAtAction(nameof(ObterUsuarioPorId), new { id = novoUsuario.Id }, novoUsuario);
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
                var usuarios = await _usuarioService.ListarTodosUsuariosAsync();
                return Ok(usuarios);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObterUsuarioPorId(int id)
        {
            try
            {
                var usuario = await _usuarioService.ObterUsuarioPorIdAsync(id);
                return Ok(usuario);
            }
            catch (Exception ex)
            {
                return NotFound(new { erro = ex.Message });
            }
        }
    }
}