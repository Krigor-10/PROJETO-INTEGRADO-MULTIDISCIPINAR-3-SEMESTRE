using PlataformaEnsino.API.DTOs;

namespace PlataformaEnsino.API.Interfaces;

public interface IProgressoAlunoService
{
    Task<ProgressoAlunoSnapshotDto> ObterSnapshotAsync(int alunoId);
    Task<ProgressoAlunoSnapshotDto> MarcarConteudoConcluidoAsync(int alunoId, int conteudoId);
}
