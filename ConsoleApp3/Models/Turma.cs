using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PlataformaEnsino.API.Models
{
    public class Turma
    {
        public int Id { get; set; }
        public string NomeTurma { get; set; }
        public DateTime DataCriacao { get; set; } = DateTime.Now;

        // Chaves Estrangeiras
        public int CursoId { get; set; }
        public int ProfessorId { get; set; }

        // Propriedades de Navegação (Protegidas para a API)
        [JsonIgnore]
        [ValidateNever]
        public Curso? Curso { get; set; }

        [JsonIgnore]
        [ValidateNever]
        public Professor? ProfessorResponsavel { get; set; }

        [JsonIgnore]
        [ValidateNever]
        public List<Matricula>? Matriculas { get; set; } = new List<Matricula>();

        // --- MÉTODOS ---
        public void DefinirProfessor(Professor professor)
        {
            if (professor != null)
            {
                ProfessorResponsavel = professor;
                ProfessorId = professor.Id;
                Console.WriteLine($"[Sistema] Professor {professor.Nome} definido como responsável pela turma '{NomeTurma}'.");
            }
        }

        public void AdicionarMaterial(string tituloMaterial)
        {
            Console.WriteLine($"[Sistema] Material '{tituloMaterial}' disponibilizado para a turma '{NomeTurma}'.");
        }
    }
}