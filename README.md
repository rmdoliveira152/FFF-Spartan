# FFF-Spartan

Centro comunitário não oficial da aliança FFF-Spartan em **Dark War: Survival**.

## Funcionalidades

- Classificação de membros R1-R5 por Poder de Combate, Abates e Contribuição Semanal
- Votações internas da aliança
- Board News em destaque, com prioridade, validade configurável e histórico permanente
- Tradução automática dos anúncios, sob pedido, para o idioma selecionado no portal
- Formulário de candidatura a R4
- Código operacional da liderança
- Interface responsiva com suporte RTL
- Seletor com os 17 idiomas disponibilizados no site oficial do jogo
- Catálogo persistente dos 96 membros, com patente, nível, PC, abates e contribuição
- Cadastro com seleção obrigatória do nome disponível na aliança, aprovação administrativa e email automático de confirmação
- Recuperação segura de palavra-passe por email através do Supabase Auth
- Voto único por membro verificado e resultados persistentes
- Portal administrativo para gerir todas as estatísticas, aprovar cadastros, criar votações e analisar candidaturas R4
- Gestão administrativa de anúncios: rascunho, publicação, edição, arquivo e restauro

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
4. Em Authentication → URL Configuration, defina o Site URL e autorize os URLs de redirecionamento do portal.
5. Os jogadores criam a conta no portal, selecionam a identidade da aliança e aguardam aprovação administrativa. Quando o cadastro é aprovado, a função `notify-registration-approved` envia um email transacional ao endereço da conta. O envio é idempotente e não depende das preferências opcionais de novas votações ou Board News.

### Tradução do Board News

O administrador escreve cada anúncio num único idioma. A função `translate-board-news` deteta o idioma original, traduz através do Azure AI Translator e guarda o resultado numa cache privada.

1. Crie um recurso Azure AI Translator no plano F0.
2. Configure os segredos apenas no Supabase:

```bash
supabase secrets set AZURE_TRANSLATOR_KEY=... AZURE_TRANSLATOR_REGION=...
```

3. Aplique a migração `20260826200000_dynamic_board_news_translation.sql`.
4. Publique a função:

```bash
supabase functions deploy translate-board-news --no-verify-jwt
```

A chave `service_role` e a palavra-passe da base de dados nunca devem ser colocadas no frontend ou no GitHub.

## Estado do projeto

O frontend usa dados de demonstração apenas quando as variáveis Supabase não estão configuradas. Com o backend configurado, membros, estatísticas, votações, votos, candidaturas, anúncios e permissões são lidos da base de dados com Row Level Security.

O idioma padrão é inglês. Português e inglês têm tradução integral. Os restantes idiomas usam tradução parcial com fallback para inglês enquanto a revisão por falantes nativos não estiver concluída; os controlos do Board News estão traduzidos nos 17 idiomas.

## Publicação

Cada push para `main` publica automaticamente o site através do GitHub Pages.

## Aviso

Projeto comunitário de fãs sem afiliação ou aprovação de **Dark War: Survival**. As marcas e os recursos visuais do jogo pertencem aos respetivos titulares.
