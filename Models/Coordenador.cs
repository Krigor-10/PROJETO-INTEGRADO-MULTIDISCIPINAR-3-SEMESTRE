namespace PlataformaEnsino.API.Models
{
    public class Coordenador : Usuario
    {
        public string? CursoResponsavel { get; set; }

        public override string ExibirDados()
        {
            string dadosBase = base.ExibirDados();
            return dadosBase + $"\n- Perfil: COORDENADOR\n- Curso Responsável: {CursoResponsavel}\n";
        }
    }
}
