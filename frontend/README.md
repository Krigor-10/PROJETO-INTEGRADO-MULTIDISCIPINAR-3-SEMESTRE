# EdTech React

Frontend React que assume a home publica, o login, o cadastro e o painel principal da API ASP.NET Core.

## Rotas principais

- `/` Home publica
- `/login` Tela de acesso
- `/cadastro` Solicitacao de matricula
- `/app` Painel autenticado

## Desenvolvimento

```powershell
cd C:\Projetos\Edtech\ConsoleApp3\frontend
npm install
npm run dev
```

O Vite usa proxy para a API em `http://localhost:5000`, entao o frontend pode consumir `/api/...` no desenvolvimento.

## Modo apresentacao

- A tela de login oferece perfis demo prontos para entrar sem backend.
- O modo demo simula home, login, cadastro, painel, modulos e conteudos usando dados locais no navegador.
- Contas demo:
  - `coordenacao@demo.edtech`
  - `professor@demo.edtech`
  - `aluno@demo.edtech`
- Senha unica: `demo123`
- Tambem e possivel forcar o modo demo com `VITE_DEMO_MODE=true` no ambiente do Vite.

## Publicacao local

```powershell
cd C:\Projetos\Edtech\ConsoleApp3\frontend
npm run build
```

O build e publicado diretamente em `C:\Projetos\Edtech\ConsoleApp3\wwwroot`, e o ASP.NET Core passa a servir a SPA compilada.
