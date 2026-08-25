# FFF-Spartan

Centro comunitário não oficial da aliança FFF-Spartan em **Dark War: Survival**.

## Funcionalidades

- Classificação de membros R1-R5 por Poder de Combate, Abates e Contribuição Semanal
- Votações internas da aliança
- Formulário de candidatura a R4
- Código operacional da liderança
- Interface responsiva com suporte RTL
- Seletor com os 17 idiomas disponibilizados no site oficial do jogo
- Área de administração demonstrativa

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

## Estado do projeto

Este repositório contém um protótipo frontend. Os membros, métricas e votações são dados de demonstração guardados no código. A autenticação, administração segura, persistência de votos, candidaturas e dados reais exigem um backend e uma base de dados.

Português e inglês têm tradução integral. Os restantes idiomas usam tradução parcial com fallback para inglês enquanto a revisão por falantes nativos não estiver concluída.

## Publicação

Cada push para `main` publica automaticamente o site através do GitHub Pages.

## Aviso

Projeto comunitário de fãs sem afiliação ou aprovação de **Dark War: Survival**. As marcas e os recursos visuais do jogo pertencem aos respetivos titulares.
