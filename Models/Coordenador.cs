namespace PlataformaEnsino.API.Models
{
    public class Coordenador : Usuario
    {
        [System.ComponentModel.DataAnnotations.StringLength(16)]
        public string CodigoRegistro { get; set; } = string.Empty;

        public string? CursoResponsavel { get; set; }

        public override string ExibirDados()
        {
            string dadosBase = base.ExibirDados();
            return dadosBase + $"\n- Perfil: COORDENADOR\n- Curso Responsável: {CursoResponsavel}\n";
        }
    }
}
