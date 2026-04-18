namespace PlataformaEnsino.API.DTOs;

public class UsuarioSessaoDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Cpf { get; set; } = string.Empty;
    public string TipoUsuario { get; set; } = string.Empty;
}
