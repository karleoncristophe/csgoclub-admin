# Admin Security Checklist

O painel administrativo não tem hoje a mesma complexidade de upload e conteúdo rico do `cs2club-web`, então a principal superfície crítica aqui é autenticação e persistência de sessão. Este checklist resume o padrão atual para evitar regressões.

## 1. Sessão e reauth

- O token usado nas chamadas autenticadas é sempre o `accessToken`.
- O `refreshToken` deve ser usado apenas para o endpoint de refresh.
- A renovação central da sessão acontece em `/src/redux/store/api/global.api.ts`.
- O bootstrap inicial da sessão acontece em `/src/auth/sessionBootstrap.ts`.
- Se o refresh falhar, o painel deve limpar a sessão e o estado do admin logado.

## 2. Limpeza de estado ao expirar

- Ao invalidar a sessão, limpar:
  - tokens do slice `security`
  - dados do slice `me`
- Isso evita tela autenticada com identidade residual depois de `401` ou refresh inválido.

## 3. Cookies

- Os tokens persistem em cookie com:
  - `sameSite: strict`
  - `path: /`
  - `secure: true` em produção
- Se houver mudança de estratégia de sessão, revisar esse arquivo:
  - `/src/redux/store/slices/securitySlice.ts`

## 4. Conteúdo rico e uploads

- Hoje o admin não usa renderização HTML rica nem fluxo relevante de upload próprio.
- Se isso mudar:
  - não usar `dangerouslySetInnerHTML` direto
  - criar sanitização central antes de exibir HTML
  - validar arquivo no frontend antes de enviar

## 5. Checklist antes de merge

- Existe fluxo novo que usa `refreshToken` fora do refresh?
- Alguma tela permanece autenticada após `401` seguido de refresh inválido?
- O estado do admin é limpo junto com os tokens?
- Algum cookie sensível deixou de ser `secure` em produção?
- Foi introduzido HTML no DOM sem sanitização?
