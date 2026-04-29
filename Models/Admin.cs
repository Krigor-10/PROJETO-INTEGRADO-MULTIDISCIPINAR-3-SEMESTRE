namespace PlataformaEnsino.API.Models
{
    public class Admin : Usuario
    {
        public override string ExibirDados()
        {
            return base.ExibirDados() + $"\n- Perfil: ADMINISTRADOR DO SISTEMA (Acesso Total)\n";
        }
    }
}
