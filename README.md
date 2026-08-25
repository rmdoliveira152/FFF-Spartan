# FFF-Spartan

Centro comunitário não oficial da aliança FFF-Spartan em **Dark War: Survival**.

## Funcionalidades

- Classificação de membros R1-R5 por Poder de Combate, Abates e Contribuição Semanal
- Votações internas da aliança
- Formulário de candidatura a R4
- Código operacional da liderança
- Interface responsiva com suporte RTL
- Seletor com os 17 idiomas disponibilizados no site oficial do jogo
- Autenticação de membros com Supabase
- Voto único por membro verificado e resultados persistentes
- Portal administrativo para criar e encerrar votações, consultar resultados, validar membros e analisar candidaturas R4

## Executar localmente

```bash
npm install
npm run dev
```

Validação de produção:

```bash
npm run build
npm run lint
```

## Configuração do Supabase

1. Aplique as migrações em `supabase/migrations` ao projeto Supabase.
2. Copie `.env.example` para `.env.local` e preencha o URL e a chave publicável.
3. No GitHub, crie as Repository Variables `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Crie os utilizadores em Authentication e ative os perfis pela administração.

A chave `service_role` e a palavra-passe da base de dados nunca devem ser colocadas no frontend ou no GitHub.

## Estado do projeto

O frontend usa dados de demonstração apenas quando as variáveis Supabase não estão configuradas. Com o backend configurado, as votações, votos, candidaturas e permissões são lidos da base de dados com Row Level Security.

Português e inglês têm tradução integral. Os restantes idiomas usam tradução parcial com fallback para inglês enquanto a revisão por falantes nativos não estiver concluída.

## Publicação

Cada push para `main` publica automaticamente o site através do GitHub Pages.

## Aviso

Projeto comunitário de fãs sem afiliação ou aprovação de **Dark War: Survival**. As marcas e os recursos visuais do jogo pertencem aos respetivos titulares.
