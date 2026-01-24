# Migração de Supabase para Firebase

## Guia Completo de Configuração

### 1. Criar Projeto no Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto" ou "Create a project"
3. Nomeie seu projeto (ex: "bolao-brasileirao-2026")
4. Aceite os termos e continue
5. (Opcional) Ative o Google Analytics
6. Clique em "Criar projeto"

### 2. Configurar Firebase Authentication

1. No menu lateral, clique em "Authentication" (Autenticação)
2. Clique em "Get started" ou "Começar"
3. Ative o provedor **Email/Password**:
   - Clique em "Email/Password"
   - Ative a primeira opção (Email/senha)
   - Salve

### 3. Configurar Cloud Firestore

1. No menu lateral, clique em "Firestore Database"
2. Clique em "Create database" (Criar banco de dados)
3. Escolha o modo:
   - **Modo de produção** (recomendado) - com regras de segurança
   - ou **Modo de teste** (apenas para desenvolvimento - dados públicos por 30 dias)
4. Escolha a localização (ex: `southamerica-east1` - São Paulo)
5. Clique em "Ativar"

### 4. Obter Credenciais do Projeto

1. Clique no ícone de engrenagem ⚙️ ao lado de "Visão geral do projeto"
2. Selecione "Configurações do projeto"
3. Role até "Seus apps" e clique no ícone **Web** `</>`
4. Registre seu app:
   - Apelido do app: "bolao-web"
   - (Opcional) Marque "Também configurar o Firebase Hosting"
   - Clique em "Registrar app"
5. **Copie as credenciais** que aparecem - você vai precisar delas!

Exemplo das credenciais:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};
```

### 5. Configurar Variáveis de Ambiente

#### No desenvolvimento local:

Crie/atualize o arquivo `.env` na raiz do projeto:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef
```

#### No Vercel:

1. Acesse o painel do Vercel
2. Vá em seu projeto → Settings → Environment Variables
3. Adicione cada variável:
   - Key: `VITE_FIREBASE_API_KEY` → Value: (cole o valor)
   - Key: `VITE_FIREBASE_AUTH_DOMAIN` → Value: (cole o valor)
   - Key: `VITE_FIREBASE_PROJECT_ID` → Value: (cole o valor)
   - Key: `VITE_FIREBASE_STORAGE_BUCKET` → Value: (cole o valor)
   - Key: `VITE_FIREBASE_MESSAGING_SENDER_ID` → Value: (cole o valor)
   - Key: `VITE_FIREBASE_APP_ID` → Value: (cole o valor)
4. Selecione os ambientes: Production, Preview, Development (conforme necessário)
5. Salve

### 6. Instalar Dependências do Firebase

Execute no terminal:

```powershell
npm install firebase
```

### 7. Atualizar Imports no Código

Você precisa atualizar os imports nos arquivos:

#### `src/main.tsx`

Troque:
```typescript
import { AuthProvider } from '@/contexts/AuthContext';
```

Por:
```typescript
import { AuthProvider } from '@/contexts/AuthContextFirebase';
```

#### Arquivos que usam hooks (Dashboard.tsx, Palpites.tsx, Ranking.tsx, etc.)

Troque:
```typescript
import { useRodadaAtual, useProximosJogos } from "@/hooks/useJogos";
import { useTopRanking } from "@/hooks/useRanking";
import { useMeusPalpites } from "@/hooks/usePalpites";
```

Por:
```typescript
import { useRodadaAtual, useProximosJogos } from "@/hooks/useJogosFirebase";
import { useTopRanking } from "@/hooks/useRankingFirebase";
import { useMeusPalpites } from "@/hooks/usePalpitesFirebase";
```

### 8. Estrutura do Banco de Dados Firestore

Crie as seguintes coleções no Firestore:

#### Coleção: `profiles`
```
profiles/{userId}
  - id: string
  - nome: string
  - nickname: string
  - email: string
  - created_at: timestamp
  - updated_at: timestamp
```

#### Coleção: `user_roles`
```
user_roles/{userId}
  - id: string
  - user_id: string
  - role: string ("user" | "admin")
  - created_at: timestamp
```

#### Coleção: `rodadas`
```
rodadas/{rodadaId}
  - id: string
  - numero: number
  - status: string ("em_andamento" | "finalizada" | "aguardando")
  - data_inicio: timestamp
  - data_fechamento: timestamp
  - created_at: timestamp
  - updated_at: timestamp
```

#### Coleção: `jogos`
```
jogos/{jogoId}
  - id: string
  - rodada_id: string
  - time_casa: string
  - time_visitante: string
  - data_jogo: timestamp
  - placar_casa: number | null
  - placar_visitante: number | null
  - status: string ("agendado" | "ao_vivo" | "finalizado" | "cancelado")
  - logo_casa: string | null
  - logo_visitante: string | null
  - api_fixture_id: number | null
  - created_at: timestamp
  - updated_at: timestamp
```

#### Coleção: `palpites`
```
palpites/{palpiteId}
  - id: string
  - usuario_id: string
  - jogo_id: string
  - palpite_casa: number
  - palpite_visitante: number
  - pontos_obtidos: number | null
  - created_at: timestamp
  - updated_at: timestamp
```

### 9. Regras de Segurança do Firestore

#### Arquivo de Referência

As regras completas e melhoradas do Firestore estão disponíveis no arquivo `firestore.rules` na raiz do projeto. Este arquivo contém:

- Funções helper para verificação de admin e autenticação
- Tratamento seguro de documentos ausentes usando `exists()`
- Permissões explícitas para todas as coleções
- Proteção contra erros com fallbacks adequados

#### Como Aplicar as Regras no Firebase Console

Siga estes passos para aplicar as regras de segurança no Firebase:

1. **Acesse o Firebase Console**
   - Vá para [Firebase Console](https://console.firebase.google.com/)
   - Selecione seu projeto

2. **Navegue até as Regras do Firestore**
   - No menu lateral esquerdo, clique em **"Firestore Database"**
   - Clique na aba **"Regras"** (Rules) no topo da página

3. **Copie as Regras**
   - Abra o arquivo `firestore.rules` do projeto
   - Selecione todo o conteúdo (Ctrl+A / Cmd+A)
   - Copie o conteúdo (Ctrl+C / Cmd+C)

4. **Cole no Editor de Regras**
   - No Firebase Console, você verá um editor de texto
   - Selecione todo o conteúdo existente e substitua pelo conteúdo copiado
   - Ou simplesmente cole o novo conteúdo sobre o antigo

5. **Publicar as Regras**
   - Clique no botão **"Publicar"** (Publish) no topo direito do editor
   - Aguarde alguns segundos para as regras serem aplicadas
   - Você verá uma mensagem de confirmação quando a publicação for concluída

6. **Verificar a Aplicação**
   - As regras são aplicadas imediatamente após a publicação
   - Teste a aplicação para garantir que tudo está funcionando corretamente
   - Verifique o console do navegador para possíveis erros de permissão

#### Melhorias Implementadas nas Regras

As regras melhoradas incluem:

- **Função `isAdmin()`**: Centraliza a lógica de verificação de admin com tratamento seguro usando `exists()`
- **Função `isAuthenticated()`**: Helper para verificar autenticação
- **Permissões explícitas**: `read` cobre tanto `get` quanto `list`, garantindo que queries funcionem
- **Separação de operações**: `create`, `update` e `delete` separados para maior clareza
- **Proteção contra erros**: `exists()` verifica se o documento existe antes de acessar dados

#### Verificação Adicional de Índices

Após aplicar as regras, certifique-se de que os seguintes índices compostos existem no Firestore:

1. **Coleção `jogos`**:
   - Campo 1: `rodada_id` (Ascending)
   - Campo 2: `data_jogo` (Ascending)

2. **Coleção `jogos`**:
   - Campo 1: `status` (Ascending)
   - Campo 2: `data_jogo` (Ascending)

3. **Coleção `rodadas`**:
   - Campo 1: `status` (Array-contains-any)
   - Campo 2: `numero` (Descending)

**Como criar índices**:
- Se você receber um erro de índice faltando, o Firebase mostrará um link para criar o índice automaticamente
- Clique no link e aguarde a criação do índice (pode levar alguns minutos)
- Ou vá em Firestore Database → Índices → Criar índice

#### Teste das Regras

Após aplicar as regras, teste:

1. **Leitura pública**: Acesse a aplicação sem login e verifique se consegue ver jogos e rodadas
2. **Autenticação**: Faça login e verifique se consegue criar/editar seu próprio perfil
3. **Palpites**: Crie um palpite e verifique se aparece corretamente
4. **Admin**: Como admin, teste se consegue criar/editar jogos e rodadas
5. **Console do navegador**: Verifique se há erros de permissão ou índice

### 10. Deploy no Vercel

Após configurar as variáveis de ambiente:

```powershell
# Commit das mudanças
git add .
git commit -m "Migração de Supabase para Firebase"
git push origin main
```

O Vercel fará deploy automaticamente.

### 11. Criar Primeiro Admin (Opcional)

Para criar um usuário admin manualmente:

1. Cadastre-se normalmente no app
2. No Firestore Console, vá em `user_roles/{seuUserId}`
3. Edite o documento e mude `role: "user"` para `role: "admin"`
4. Faça logout e login novamente

### 12. Testar a Aplicação

1. Acesse a URL do Vercel
2. Crie uma conta
3. Faça login
4. Navegue pelas páginas
5. (Como admin) Cadastre rodadas e jogos

## Diferenças Principais: Supabase vs Firebase

| Recurso | Supabase | Firebase |
|---------|----------|----------|
| Banco de Dados | PostgreSQL (SQL) | Firestore (NoSQL) |
| Autenticação | Supabase Auth | Firebase Auth |
| Queries | SQL direto | SDK com queries |
| Real-time | Subscriptions | onSnapshot |
| Regras | RLS (Row Level Security) | Security Rules |

## Troubleshooting

### Erro: "Firebase: Error (auth/...)"
- Verifique se as credenciais estão corretas
- Confirme que Email/Password está ativado no Firebase Console

### Erro: "Missing or insufficient permissions"
- Revise as regras de segurança do Firestore
- Certifique-se de que o usuário está autenticado

### Dados não aparecem
- Verifique se as coleções existem no Firestore
- Confirme que as variáveis de ambiente estão configuradas
- Abra o console do navegador para ver erros

## Recursos Úteis

- [Documentação Firebase](https://firebase.google.com/docs)
- [Firestore Queries](https://firebase.google.com/docs/firestore/query-data/queries)
- [Firebase Auth](https://firebase.google.com/docs/auth)
- [Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

**Importante**: Após a migração, você pode remover as dependências do Supabase e os arquivos antigos para limpar o projeto.
