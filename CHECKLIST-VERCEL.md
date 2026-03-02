# ✅ Checklist de Deploy no Vercel

## Correções Aplicadas

### 1. Configuração do Next.js
- ✅ `next.config.js` atualizado com `remotePatterns` (substitui `domains` deprecado)
- ✅ SWC minification habilitado
- ✅ Compressão habilitada
- ✅ Header `X-Powered-By` removido

### 2. Configuração do Vercel
- ✅ `vercel.json` simplificado (framework auto-detectado)
- ✅ `.vercelignore` criado para otimizar upload

### 3. Correções de Código
- ✅ Verificações de `typeof window !== 'undefined'` adicionadas
- ✅ Verificações de `AudioContext` antes de uso
- ✅ Verificações de `MediaRecorder` antes de uso
- ✅ Verificações de `navigator.mediaDevices` antes de uso

### 4. Testes Realizados
- ✅ Build local bem-sucedido (`npm run build`)
- ✅ TypeScript sem erros (`npx tsc --noEmit`)
- ✅ Linting passou
- ✅ Páginas estáticas geradas corretamente

## Próximos Passos

### Para fazer o deploy:

1. **Commit das alterações:**
   ```bash
   git add .
   git commit -m "fix: Correções para deploy no Vercel"
   git push
   ```

2. **Deploy no Vercel:**
   - Opção A: Conecte seu repositório no [vercel.com](https://vercel.com)
   - Opção B: Use `npx vercel` na linha de comando

3. **Após o deploy:**
   - Teste o upload de arquivo
   - Teste a gravação de microfone
   - Verifique a análise de acordes

## Arquivos Modificados

- ✅ `next.config.js` - Configuração otimizada
- ✅ `vercel.json` - Simplificado
- ✅ `components/AudioInput.tsx` - Verificações de browser APIs
- ✅ `app/page.tsx` - Verificação de AudioContext

## Arquivos Criados

- ✅ `.vercelignore` - Otimização de deploy
- ✅ `.npmrc` - Configurações de npm
- ✅ `DEPLOY.md` - Guia completo de deploy
- ✅ `CHECKLIST-VERCEL.md` - Este arquivo

## Possíveis Avisos (Normais)

Durante o deploy, você pode ver:
- ⚠️ "Using legacy image optimization" - Normal para Next.js 14
- ⚠️ "API route /api/youtube returns 501" - Esperado (YouTube requer backend)

## Problemas Conhecidos

### YouTube URL
A funcionalidade de YouTube retorna erro 501 (Not Implemented) porque requer:
- Backend com `ytdl-core` ou `yt-dlp`
- Ou serviço externo de extração de áudio

**Solução temporária:** Usuários podem baixar o áudio manualmente e fazer upload.

## Suporte

Se o deploy falhar:
1. Verifique os logs no Vercel Dashboard
2. Procure por erros específicos
3. Verifique se todas as dependências estão no `package.json`
4. Confirme que o Node.js version é compatível (14.x ou superior)

---

**Status:** ✅ Pronto para deploy!
