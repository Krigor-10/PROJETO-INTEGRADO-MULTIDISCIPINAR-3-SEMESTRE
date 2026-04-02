using System;

namespace PlataformaEnsino.API.Models
{
    public class Modulo
    {
        public int Id { get; set; }
        public string Titulo { get; set; }
        public DateTime DataCriacao { get; set; } = DateTime.Now;

        // Chaves Estrangeiras e Navegação
        public int CursoId { get; set; }
        public Curso Curso { get; set; }

        // --- MÉTODOS ---
        public void AlterarTitulo(string novoTitulo)
        {
            if (!string.IsNullOrWhiteSpace(novoTitulo))
            {
                Console.WriteLine($"[Sistema] Título do módulo alterado de '{Titulo}' para '{novoTitulo}'.");
                Titulo = novoTitulo;
            }
        }
    }
}