using System.ComponentModel.DataAnnotations;

namespace PlataformaEnsino.API.Models;

public abstract class Usuario
{
    public int Id { get; set; }

    [Required]
    [StringLength(150)]
    public string Nome { get; set; } = string.Empty;

    [Required]
    [EmailAddress(ErrorMessage = "O e-mail fornecido não é válido.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "O CPF é obrigatório.")]
    [StringLength(11, MinimumLength = 11, ErrorMessage = "O CPF deve conter exatamente 11 caracteres.")]
    public string Cpf { get; set; } = string.Empty;

    [Required]
    [StringLength(20)]
    public string Telefone { get; set; } = string.Empty;

    [Required]
    [StringLength(9)]
    public string Cep { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string Rua { get; set; } = string.Empty;

    [Required]
    [StringLength(20)]
    public string Numero { get; set; } = string.Empty;

    [Required]
    [StringLength(120)]
    public string Bairro { get; set; } = string.Empty;

    [Required]
    [StringLength(120)]
    public string Cidade { get; set; } = string.Empty;

    [Required]
    [StringLength(2)]
    public string Estado { get; set; } = string.Empty;

    public string TipoUsuario { get; set; } = string.Empty;
    public DateTime DataCadastro { get; set; } = DateTime.UtcNow;

    public string SenhaHash { get; set; } = string.Empty;

    public bool Ativo { get; set; } = true;

    public void AlterarDados(string nome, string email, string telefone, string cep, string rua, string numero, string bairro, string cidade, string estado)
    {
        Nome = nome;
        Email = email;
        Telefone = telefone;
        Cep = cep;
        Rua = rua;
        Numero = numero;
        Bairro = bairro;
        Cidade = cidade;
        Estado = estado;
    }

    public virtual string ExibirDados()
    {
        return $"Dados do Usuário:\n" +
               $"- Nome: {Nome}\n" +
               $"- E-mail: {Email}\n" +
               $"- CPF: {Cpf}\n" +
               $"- Telefone: {Telefone}\n" +
               $"- Endereço: {Rua}, {Numero} - {Bairro}, {Cidade}/{Estado} (CEP: {Cep})\n" +
               $"- Cliente desde: {DataCadastro:dd/MM/yyyy}";
    }
}
