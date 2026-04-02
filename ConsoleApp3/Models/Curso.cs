using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PlataformaEnsino.API.Models
{
    public class Curso
    {
        public int Id { get; set; }
        public string Titulo { get; set; }
        public string Descricao { get; set; }
        public decimal Preco { get; set; }

        public int CoordenadorId { get; set; }
        public int CriadoPor { get; set; }

        [JsonIgnore]
        [ValidateNever]
        public Coordenador? Coordenador { get; set; }

        [JsonIgnore]
        [ValidateNever]
        public Admin? Criador { get; set; }

        [JsonIgnore]
        [ValidateNever]
        public List<Modulo>? Modulos { get; set; } = new List<Modulo>();

        [JsonIgnore]
        [ValidateNever]
        public List<Turma>? Turmas { get; set; } = new List<Turma>();

        // Método corrigido para aceitar o objeto inteiro
        public void AtribuirCoordenador(Coordenador coordenador)
        {
            if (coordenador != null)
            {
                CoordenadorId = coordenador.Id;
                Coordenador = coordenador;
            }
        }

        public void AdicionarModulo(Modulo modulo)
        {
            if (modulo != null)
            {
                Modulos?.Add(modulo);
            }
        }
    }
}