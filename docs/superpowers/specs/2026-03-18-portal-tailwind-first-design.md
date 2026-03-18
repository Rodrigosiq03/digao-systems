# Portal Tailwind-First Styling Design

## Goal
Reduzir o acoplamento entre CSS global e componentes no Digao OAuth Portal, mantendo exatamente a aparência atual, mas migrando o shell administrativo e os padrões de UI para uma abordagem `Tailwind-first`.

## Context
O portal já está com a linguagem visual aprovada, incluindo:
- landing pública
- shell administrativo com sidebar colapsável
- editor sheets
- quick actions
- cards de usuários, systems, profiles, capabilities e assignments

O problema atual não é visual. É estrutural.

`src/index.css` passou a concentrar responsabilidades demais:
- tokens globais de tema
- animações da landing
- layout do shell
- classes de componentes administrativos
- padrões de listagem e cards

Isso dificulta manutenção, reduz legibilidade e mistura responsabilidades que deveriam estar nos componentes React ou em camadas do Tailwind.

## Approach Options

### 1. Refactor incremental para Tailwind-first
Migrar classes estruturais do shell/admin para Tailwind nos componentes, mantendo `index.css` apenas para fundação global.

Vantagens:
- menor risco visual
- melhora a organização sem reescrever a app
- preserva o layout atual
- prepara adoção gradual de componentes mais consistentes depois

Desvantagens:
- ainda mantém algumas variáveis CSS globais
- não substitui toda a camada visual por primitives externas nesta rodada

### 2. Reescrever o shell usando shadcn/ui já nesta rodada
Aproveitar a refatoração para trocar sheets, menus e cards por primitives do shadcn/ui.

Vantagens:
- base de componentes mais moderna
- padronização maior

Desvantagens:
- escopo muito maior
- risco desnecessário de regressão visual
- mistura refactor estrutural com troca de biblioteca

### 3. Apenas podar o CSS mais gritante
Remover uma parte do `index.css`, mas sem mover a responsabilidade real para os componentes.

Vantagens:
- rápido

Desvantagens:
- resolve pouco
- mantém o problema arquitetural

## Recommendation
Seguir com a opção 1.

A rodada deve preservar 100% da aparência e focar em responsabilidade de estilo:
- `index.css` fica com infraestrutura global
- componentes React e utilitários Tailwind assumem o shell/admin
- não introduzir biblioteca nova sem necessidade direta

## Styling Boundary

### Fica em `index.css`
- `@tailwind base/components/utilities`
- variáveis CSS globais de tema (`:root`, `.dark`)
- reset mínimo (`*`, `body`, `a`, `#root`)
- background global da aplicação
- animações realmente globais da landing
- estilos globais inevitáveis para pseudo-elementos ou efeitos não ergonomicamente expressos com Tailwind puro

### Sai de `index.css`
- layout do shell administrativo
- sidebar colapsável
- topbar estrutural
- sheets administrativos
- quick action menus
- grids e stacks de páginas admin
- cards de resources
- padrões de listagem que pertencem aos componentes

## Component Strategy
Criar ou consolidar pequenos blocos reutilizáveis para reduzir repetição de classes longas:
- `AdminPageSection`
- `ResourceCard`
- `QuickActionsMenu`
- `AdminEditorSheet`

Esses componentes devem usar Tailwind diretamente e concentrar o padrão visual comum. O objetivo não é criar uma biblioteca nova, mas parar de depender de CSS global para layout e composição.

## Tailwind Strategy
- usar utilitários Tailwind como caminho padrão
- quando houver repetição real, extrair para componentes React ou, se ainda fizer sentido, classes em `@layer components`
- evitar adicionar novas classes globais soltas fora de `@layer`
- não esconder estrutura de tela em seletores globais como `.app-root-collapsed`, `.admin-page-grid` ou `.quick-actions-menu`

## Layout Behavior
O comportamento atual precisa ser preservado:
- sidebar continua colapsável
- editor sheets continuam iguais
- quick actions continuam iguais
- landing pública continua com a mesma estética
- dark mode continua funcional

A mudança é de implementação, não de produto.

## Testing Strategy
Como isso é refactor com preservação de comportamento, o teste precisa focar em contratos estruturais:
- testes de contrato garantindo que `index.css` não contenha mais classes de shell/admin que devem migrar
- testes de contrato garantindo que os componentes chave ainda exponham os ganchos esperados de layout e ação
- `yarn typecheck`
- `yarn build`

## Out of Scope
Fica fora desta rodada:
- redesign visual
- troca ampla para `shadcn/ui`
- mudança de fluxos administrativos
- alteração de comportamento das telas
- reestruturação do domínio admin/auth

## Success Criteria
A rodada estará correta quando:
- o portal mantiver a aparência atual
- `index.css` ficar reduzido a responsabilidade global
- shell/admin passarem a ser estilizados prioritariamente com Tailwind nos componentes
- build e typecheck continuarem verdes
- os contratos de layout/admin continuarem passando
