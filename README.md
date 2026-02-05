# 🥑 Manuelita Delivery App - Frontend

Frontend moderno e responsivo para um Micro SaaS de delivery de alimentos, construído com **React 19**, **TypeScript** e **Tailwind CSS**. Este projeto oferece uma experiência completa de pedido, desde a navegação no cardápio até o rastreamento em tempo real do pagamento e entrega.

## 🚀 Funcionalidades Principais

### 📱 Experiência do Usuário (UI/UX)
- **Design Responsivo:** Layout fluido que se adapta perfeitamente a desktops (menu superior) e dispositivos móveis (barra de navegação inferior estilo app nativo).
- **Interface Moderna:** Utiliza uma paleta de cores consistente (Verde e Laranja) com componentes visuais atraentes, como modais, cards de produtos e feedback visual de carregamento (skeletons e spinners).

### 🍔 Cardápio e Pedidos
- **Carrossel de Banners:** Destaque para promoções e novidades na tela inicial.
- **Filtragem Avançada:**
  - Busca por nome ou descrição do produto.
  - Navegação por categorias (scroll horizontal).
  - Ordenação por preço (crescente/decrescente).
- **Modal de Produto:** Detalhes expandidos, foto em alta resolução, seletor de quantidade e campo para observações (ex: "sem cebola").
- **Carrinho de Compras:** Persistência local (LocalStorage), edição de itens, remoção e cálculo automático de totais.

### 💳 Checkout e Pagamento
- **Gestão de Endereços:**
  - **Busca automática de CEP** via integração com BrasilAPI.
  - **Histórico de Endereços:** Reutilização rápida de endereços utilizados em pedidos anteriores.
- **Cupons de Desconto:**
  - Aplicação e validação de cupons em tempo real.
  - Suporte a descontos fixos ou percentuais.
  - Página dedicada para listar cupons disponíveis.
- **Métodos de Pagamento:**
  - **PIX e Cartão:** Integração preparada para **AbacatePay** com link de pagamento externo.
  - **Dinheiro:** Opção de pagamento na entrega.

### 📦 Gestão de Pedidos
- **Histórico de Pedidos:** Lista completa de pedidos anteriores com badges de status (Pendente, Confirmado, Entregue, Cancelado).
- **Detalhes do Pedido:** Visualização expandida mostrando itens, valores, descontos aplicados e endereço de entrega.
- **Rastreamento de Pagamento:** Polling automático (atualização a cada 5s) para verificar a confirmação do pagamento em tempo real após o checkout.
- **Repetir Pedido:** Funcionalidade de um clique para refazer um pedido antigo, verificando automaticamente a disponibilidade dos itens no cardápio atual.

### 🔐 Autenticação e Segurança
- **Login e Cadastro:** Formulários validados para Nome, Email, Telefone, CPF e Senha.
- **Proteção de Rotas:** Redirecionamento automático para login ao tentar acessar checkout ou histórico sem autenticação.
- **Gestão de Sessão:** Token JWT armazenado com interceptors no Axios para requisições autenticadas.

---

## 🛠️ Stack Tecnológica

- **Core:** React 19, TypeScript
- **Build Tool:** Vite
- **Estilização:** Tailwind CSS
- **Roteamento:** React Router DOM v7
- **Requisições HTTP:** Axios
- **Integrações Externas:** BrasilAPI (CEP)

---

## ⚙️ Instalação e Execução

### Pré-requisitos
- Node.js (v18+)
- NPM ou Yarn

### Passos

1. **Clone o repositório**
   ```bash
   git clone https://github.com/wellarj/delivery-app.git
   cd delivery-app-frontend
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure a API**
   O projeto aponta para uma API PHP base. Verifique o arquivo `services/api.ts` e ajuste a constante `API_URL` se necessário:
   ```typescript
   const API_URL = 'https://www.yourdomain.com.br/api-delivery/';
   ```

4. **Execute em desenvolvimento**
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:3000`

5. **Build para Produção**
   ```bash
   npm run build
   ```

---

## 🚀 Deploy (Vercel)

Este projeto já está configurado para deploy na Vercel.

1. Instale a Vercel CLI ou conecte seu repositório Git no dashboard da Vercel.
2. O arquivo `vercel.json` já está configurado para lidar com rotas de SPA (Single Page Application).
3. O script de build (`tsc -b && vite build`) garantirá a compilação correta do TypeScript e assets.

---

## 📂 Estrutura de Pastas

```
/src
  /components    # Componentes reutilizáveis (Layout, ProductCard, Modal, etc)
  /context       # Gerenciamento de estado global (Auth, Cart)
  /pages         # Páginas da aplicação (Home, Checkout, Orders, Auth, etc)
  /services      # Configuração do Axios e chamadas de API
  types.ts       # Definições de tipos TypeScript (Interfaces globais)
  App.tsx        # Configuração de Rotas
  main.tsx       # Ponto de entrada
```