using System;
using System.ComponentModel.DataAnnotations;

namespace PlataformaEnsino.API.Models
{
    public abstract class Usuario
    {
        public int Id { get; set; }
        public string Nome { get; set; }

        [EmailAddress(ErrorMessage = "O e-mail fornecido não é válido.")]
        public string Email { get; set; }

        [Required(ErrorMessage = "O CPF é obrigatório.")]
        [StringLength(11, MinimumLength = 11, ErrorMessage = "O CPF deve conter exatamente 11 caracteres.")]
        public string Cpf { get; set; }
        public string Telefone { get; set; }

        public string Cep { get; set; }
        public string Rua { get; set; }
        public string Numero { get; set; }
        public string Bairro { get; set; }
        public string Cidade { get; set; }
        public string Estado { get; set; }
        public string TipoUsuario { get; set; }
        public DateTime DataCadastro { get; set; } = DateTime.Now;

        // Controle de acesso ao sistema
        public bool Ativo { get; set; } = true;

        // --------------------------------------------------------
        // Método para atualizar as informações do usuário
        // Nota: CPF e DataCadastro foram deixados de fora de propósito, 
        // pois normalmente não devem ser alterados após o cadastro.
        // --------------------------------------------------------
        public void AlterarDados(string nome, string email, string telefone, string cep, string rua, string numero, string bairro, string cidade, string estado)
        {
            Nome = nome;
            Email = email;
            Telefone = telefone;

            // Atualizando o endereço
            Cep = cep;
            Rua = rua;
            Numero = numero;
            Bairro = bairro;
            Cidade = cidade;
            Estado = estado;
        }

        // --------------------------------------------------------
        // Método para exibir os dados do usuário.
        // O uso de 'virtual' permite que Aluno ou Professor modifiquem 
        // esse texto para incluir a Matrícula ou o Salário, por exemplo.
        // --------------------------------------------------------
        public virtual string ExibirDados()
        {
            return $"Dados do Usuário:\n" +
                   $"- Nome: {Nome}\n" +
                   $"- E-mail: {Email}\n" +
                   $"- CPF: {Cpf}\n" +
                   $"- Telefone: {Telefone}\n" +
                   $"- Endereço: {Rua}, {Numero} - {Bairro}, {Cidade}/{Estado} (CEP: {Cep})\n" +
                   $"- Cliente desde: {DataCadastro.ToShortDateString()}";
        }
    }
}