# Guia de Deploy no Vercel

## Problemas Resolvidos

✅ Configuração do `next.config.js` atualizada (usando `remotePatterns` em vez de `domains`)
✅ Arquivo `vercel.json` simplificado (Vercel detecta Next.js automaticamente)
✅ Verificações de APIs do navegador adicionadas (`AudioContext`, `MediaRecorder`)
✅ Arquivo `.vercelignore` criado para otimizar o deploy

## Como fazer o deploy

### Opção 1: Deploy via Dashboard do Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta
3. Clique em "Add New Project"
4. Importe seu repositório do GitHub/GitLab/Bitbucket
5. O Vercel detectará automaticamente que é um projeto Next.js
6. Clique em "Deploy"

### Opção 2: Deploy via CLI do Vercel

```bash
# Instalar Vercel CLI (se ainda não tiver)
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel

# Deploy para produção
vercel --prod
```

## Configurações Importantes

### Variáveis de Ambiente (se necessário)

Se você adicionar funcionalidades que precisam de chaves de API, configure no Vercel:

1. Vá em "Settings" > "Environment Variables"
2. Adicione suas variáveis
3. Faça redeploy do projeto

### Limites do Vercel (Plano Free)

- Tempo máximo de execução: 10 segundos
- Tamanho máximo de resposta: 4.5 MB
- Largura de banda: 100 GB/mês

## Verificações Pós-Deploy

Após o deploy, teste:

1. ✅ Upload de arquivo de áudio
2. ✅ Gravação via microfone
3. ✅ Interface de análise de acordes
4. ⚠️ YouTube URL (requer implementação backend adicional)

## Problemas Comuns

### Erro: "AudioContext is not defined"
**Solução:** Já corrigido! Adicionamos verificações `typeof window !== 'undefined'`

### Erro: "Module not found"
**Solução:** Execute `npm install` antes do deploy

### Erro de CORS ao carregar URL externa
**Solução:** Use um proxy ou configure CORS no servidor de origem

## Otimizações Aplicadas

- ✅ SWC Minification habilitado
- ✅ Compressão habilitada
- ✅ Header "X-Powered-By" removido
- ✅ Imagens otimizadas com `remotePatterns`

## Suporte

Se encontrar problemas, verifique os logs no Vercel Dashboard:
- Vá em "Deployments"
- Clique no deploy com erro
- Veja a aba "Build Logs" ou "Function Logs"
