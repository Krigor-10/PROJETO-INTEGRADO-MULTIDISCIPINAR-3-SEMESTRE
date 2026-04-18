using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Data;

public static class DevelopmentDataSeeder
{
    private const string AdminEmail = "admin@edtech.local";
    private const string CoordinatorEmail = "coordenacao@edtech.local";
    private const string ProfessorEmail = "professor@edtech.local";
    private const string StudentEmail = "aluno@edtech.local";
    private const string DefaultPassword = "Edtech@123";

    public static async Task SeedAsync(PlataformaContext context)
    {
        var admin = await EnsureAdminAsync(context);
        var coordinator = await EnsureCoordinatorAsync(context);
        var professor = await EnsureProfessorAsync(context);
        var student = await EnsureStudentAsync(context);

        await context.SaveChangesAsync();

        var fullStackCourse = await EnsureCourseAsync(
            context,
            title: "Desenvolvimento Web Full Stack",
            description: "Formacao com foco em front-end, back-end, APIs e deploy de aplicacoes.",
            price: 1299.90m,
            createdBy: admin.Id,
            coordinatorId: coordinator.Id);

        var dataCourse = await EnsureCourseAsync(
            context,
            title: "Ciencia de Dados Aplicada",
            description: "Trilha de analise, modelagem de dados e visualizacao para decisoes de negocio.",
            price: 1490.00m,
            createdBy: admin.Id,
            coordinatorId: coordinator.Id);

        await EnsureCourseAsync(
            context,
            title: "UX para Produtos Digitais",
            description: "Curso voltado para pesquisa, prototipacao e desenho de experiencias educacionais.",
            price: 890.00m,
            createdBy: admin.Id,
            coordinatorId: coordinator.Id);

        await EnsureCourseAsync(
            context,
            title: "Arquitetura de Software Moderna",
            description: "Fundamentos de arquitetura, integracao entre servicos e organizacao de sistemas escalaveis.",
            price: 1590.00m,
            createdBy: admin.Id,
            coordinatorId: coordinator.Id);

        await EnsureCourseAsync(
            context,
            title: "Python para Automacao e Dados",
            description: "Aplicacoes praticas com scripts, automacao de processos e leitura de dados para produtos digitais.",
            price: 1190.00m,
            createdBy: admin.Id,
            coordinatorId: coordinator.Id);

        await EnsureCourseAsync(
            context,
            title: "DevOps e Cloud Foundations",
            description: "Bases de infraestrutura, pipelines e publicacao de aplicacoes em ambientes de nuvem.",
            price: 1390.00m,
            createdBy: admin.Id,
            coordinatorId: coordinator.Id);

        await context.SaveChangesAsync();

        var fundamentosWebModule = await EnsureModuloAsync(context, "Fundamentos da Web Moderna", fullStackCourse.Id);
        await EnsureModuloAsync(context, "APIs e Integracao", fullStackCourse.Id);
        await EnsureModuloAsync(context, "Analise Explorataria de Dados", dataCourse.Id);

        await context.SaveChangesAsync();

        var fullStackClass = await EnsureTurmaAsync(context, "FS-2026-A", fullStackCourse.Id, professor.Id);
        await EnsureTurmaAsync(context, "DATA-2026-A", dataCourse.Id, professor.Id);

        await context.SaveChangesAsync();

        await EnsureApprovedEnrollmentAsync(context, student, fullStackCourse, fullStackClass);
        await EnsurePendingEnrollmentAsync(context, student, dataCourse);

        await context.SaveChangesAsync();

        await EnsureConteudoAsync(
            context,
            professor,
            fullStackClass,
            fundamentosWebModule,
            title: "Boas-vindas ao modulo",
            description: "Visao geral da jornada, combinados da turma e pontos de partida para a trilha.",
            bodyText: "Neste modulo vamos alinhar o ritmo da turma, revisar os fundamentos da web e preparar a base para os proximos projetos.",
            displayOrder: 1);

        await context.SaveChangesAsync();
    }

    private static async Task<Admin> EnsureAdminAsync(PlataformaContext context)
    {
        var admin = await context.Admins.FirstOrDefaultAsync(user => user.Email == AdminEmail);

        if (admin is null)
        {
            admin = new Admin();
            context.Admins.Add(admin);
        }

        admin.Nome = "Administrador EdTech";
        admin.Email = AdminEmail;
        admin.Cpf = "11111111111";
        admin.Telefone = "11999990001";
        admin.Cep = "01001-000";
        admin.Rua = "Rua da Plataforma";
        admin.Numero = "100";
        admin.Bairro = "Centro";
        admin.Cidade = "Sao Paulo";
        admin.Estado = "SP";
        admin.ConfigurarAcesso("Admin", BCrypt.Net.BCrypt.HashPassword(DefaultPassword));

        return admin;
    }

    private static async Task<Coordenador> EnsureCoordinatorAsync(PlataformaContext context)
    {
        var coordinator = await context.Coordenadores.FirstOrDefaultAsync(user => user.Email == CoordinatorEmail);

        if (coordinator is null)
        {
            coordinator = new Coordenador();
            context.Coordenadores.Add(coordinator);
        }

        coordinator.Nome = "Coordenacao Academica";
        coordinator.Email = CoordinatorEmail;
        coordinator.Cpf = "22222222222";
        coordinator.Telefone = "11999990002";
        coordinator.Cep = "01001-000";
        coordinator.Rua = "Rua da Plataforma";
        coordinator.Numero = "120";
        coordinator.Bairro = "Centro";
        coordinator.Cidade = "Sao Paulo";
        coordinator.Estado = "SP";
        coordinator.ConfigurarAcesso("Coordenador", BCrypt.Net.BCrypt.HashPassword(DefaultPassword));
        coordinator.CursoResponsavel = "Trilhas EdTech";

        return coordinator;
    }

    private static async Task<Professor> EnsureProfessorAsync(PlataformaContext context)
    {
        var professor = await context.Professores.FirstOrDefaultAsync(user => user.Email == ProfessorEmail);

        if (professor is null)
        {
            professor = new Professor();
            context.Professores.Add(professor);
        }

        professor.Nome = "Professor Demo";
        professor.Email = ProfessorEmail;
        professor.Cpf = "33333333333";
        professor.Telefone = "11999990003";
        professor.Cep = "01001-000";
        professor.Rua = "Rua da Plataforma";
        professor.Numero = "140";
        professor.Bairro = "Centro";
        professor.Cidade = "Sao Paulo";
        professor.Estado = "SP";
        professor.ConfigurarAcesso("Professor", BCrypt.Net.BCrypt.HashPassword(DefaultPassword));
        professor.Especialidade = "Full Stack e Dados";

        return professor;
    }

    private static async Task<Aluno> EnsureStudentAsync(PlataformaContext context)
    {
        var student = await context.Alunos.FirstOrDefaultAsync(user => user.Email == StudentEmail);

        if (student is null)
        {
            student = new Aluno();
            context.Alunos.Add(student);
        }

        student.Nome = "Aluno Demo";
        student.Email = StudentEmail;
        student.Cpf = "44444444444";
        student.Telefone = "11999990004";
        student.Cep = "01001-000";
        student.Rua = "Rua da Plataforma";
        student.Numero = "160";
        student.Bairro = "Centro";
        student.Cidade = "Sao Paulo";
        student.Estado = "SP";
        student.ConfigurarAcesso("Aluno", BCrypt.Net.BCrypt.HashPassword(DefaultPassword));
        student.Matricula = "MAT-DEMO-2026";
        student.TurmaAtual = "Nao atribuida";

        return student;
    }

    private static async Task<Curso> EnsureCourseAsync(
        PlataformaContext context,
        string title,
        string description,
        decimal price,
        int createdBy,
        int? coordinatorId)
    {
        var course = await context.Cursos.FirstOrDefaultAsync(item => item.Titulo == title);

        if (course is not null)
        {
            return course;
        }

        course = new Curso
        {
            Titulo = title,
            Descricao = description,
            Preco = price,
            CriadoPor = createdBy,
            CoordenadorId = coordinatorId
        };

        context.Cursos.Add(course);
        return course;
    }

    private static async Task<Turma> EnsureTurmaAsync(PlataformaContext context, string name, int courseId, int professorId)
    {
        var turma = await context.Turmas.FirstOrDefaultAsync(item => item.NomeTurma == name && item.CursoId == courseId);

        if (turma is not null)
        {
            return turma;
        }

        turma = new Turma
        {
            NomeTurma = name,
            CursoId = courseId,
            ProfessorId = professorId
        };

        context.Turmas.Add(turma);
        return turma;
    }

    private static async Task<Modulo> EnsureModuloAsync(PlataformaContext context, string title, int courseId)
    {
        var modulo = await context.Modulos.FirstOrDefaultAsync(item => item.Titulo == title && item.CursoId == courseId);

        if (modulo is not null)
        {
            return modulo;
        }

        modulo = new Modulo
        {
            Titulo = title,
            CursoId = courseId
        };

        context.Modulos.Add(modulo);
        return modulo;
    }

    private static async Task EnsureConteudoAsync(
        PlataformaContext context,
        Professor professor,
        Turma turma,
        Modulo modulo,
        string title,
        string description,
        string bodyText,
        int displayOrder)
    {
        var conteudo = await context.ConteudosDidaticos.FirstOrDefaultAsync(item =>
            item.ProfessorAutorId == professor.Id &&
            item.TurmaId == turma.Id &&
            item.ModuloId == modulo.Id &&
            item.Titulo == title);

        if (conteudo is null)
        {
            conteudo = new ConteudoDidatico
            {
                TurmaId = turma.Id,
                ModuloId = modulo.Id
            };
            conteudo.DefinirProfessorAutor(professor.Id);
            conteudo.RegistrarCriacao(DateTime.UtcNow.AddDays(-2));

            context.ConteudosDidaticos.Add(conteudo);
        }

        conteudo.Titulo = title;
        conteudo.Descricao = description;
        conteudo.TipoConteudo = TipoConteudoDidatico.Texto;
        conteudo.CorpoTexto = bodyText;
        conteudo.ArquivoUrl = string.Empty;
        conteudo.LinkUrl = string.Empty;
        conteudo.OrdemExibicao = displayOrder;
        conteudo.PesoProgresso = 1;
        conteudo.DefinirStatusPublicacao(StatusPublicacao.Publicado, DateTime.UtcNow.AddDays(-1));
        conteudo.MarcarAtualizacao(DateTime.UtcNow.AddDays(-1));
    }

    private static async Task EnsureApprovedEnrollmentAsync(
        PlataformaContext context,
        Aluno student,
        Curso course,
        Turma turma)
    {
        var enrollment = await context.Matriculas.FirstOrDefaultAsync(item =>
            item.AlunoId == student.Id &&
            item.CursoId == course.Id &&
            item.TurmaId == turma.Id);

        if (enrollment is null)
        {
            enrollment = new Matricula
            {
                AlunoId = student.Id,
                CursoId = course.Id
            };
            enrollment.VincularTurma(turma.Id);
            enrollment.Aprovar();
            enrollment.RegistrarSolicitacao(DateTime.UtcNow.AddDays(-5));
            enrollment.LancarNotaFinal(8.75m);

            context.Matriculas.Add(enrollment);
        }
        else
        {
            enrollment.AprovarComTurma(turma.Id, course.Id);
            if (enrollment.NotaFinal == 0)
            {
                enrollment.LancarNotaFinal(8.75m);
            }
        }

        student.TurmaAtual = turma.NomeTurma;
    }

    private static async Task EnsurePendingEnrollmentAsync(PlataformaContext context, Aluno student, Curso course)
    {
        var enrollment = await context.Matriculas.FirstOrDefaultAsync(item =>
            item.AlunoId == student.Id &&
            item.CursoId == course.Id &&
            item.Status == StatusMatricula.Pendente);

        if (enrollment is not null)
        {
            return;
        }

        var pendingEnrollment = new Matricula
        {
            AlunoId = student.Id,
            CursoId = course.Id
        };
        pendingEnrollment.RegistrarSolicitacao(DateTime.UtcNow.AddDays(-1));

        context.Matriculas.Add(pendingEnrollment);
    }
}
