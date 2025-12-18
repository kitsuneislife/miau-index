# Guia de Contribuição - Miau-Index

Obrigado por considerar contribuir com o Miau-Index! Este documento fornece diretrizes para ajudá-lo a contribuir de forma efetiva.

## 📋 Código de Conduta

- Seja respeitoso e inclusivo
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros da comunidade

## 🚀 Como Contribuir

### Reportando Bugs

Antes de criar um issue:
1. Verifique se o bug já não foi reportado
2. Verifique se você está usando a versão mais recente
3. Colete informações sobre o problema

Ao criar um issue, inclua:
- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs atual
- Screenshots (se aplicável)
- Versão do Node.js e do projeto
- Sistema operacional

### Sugerindo Melhorias

Para sugestões de features:
1. Verifique se a feature já não foi sugerida
2. Explique claramente o caso de uso
3. Descreva a solução desejada
4. Considere alternativas

### Pull Requests

1. **Fork o repositório**
2. **Clone seu fork**
   ```bash
   git clone https://github.com/seu-usuario/miaudex.git
   cd miaudex
   ```

3. **Crie uma branch**
   ```bash
   git checkout -b feature/minha-feature
   # ou
   git checkout -b fix/meu-fix
   ```

4. **Instale dependências**
   ```bash
   npm install
   ```

5. **Faça suas alterações**
   - Siga o estilo de código do projeto
   - Adicione testes se necessário
   - Atualize a documentação

6. **Execute os testes**
   ```bash
   npm test
   npm run lint
   npm run format:check
   ```

7. **Commit suas mudanças**
   ```bash
   git add .
   git commit -m "feat: adiciona nova feature"
   ```

   Formato de commit:
   - `feat:` nova feature
   - `fix:` correção de bug
   - `docs:` mudanças na documentação
   - `style:` formatação, ponto e vírgula, etc
   - `refactor:` refatoração de código
   - `test:` adição de testes
   - `chore:` atualização de dependências, etc

8. **Push para seu fork**
   ```bash
   git push origin feature/minha-feature
   ```

9. **Abra um Pull Request**
   - Descreva claramente as mudanças
   - Referencie issues relacionadas
   - Aguarde review

## 🎨 Padrões de Código

### TypeScript

- Use TypeScript estrito
- Evite `any`, prefira tipos específicos
- Use interfaces para objetos complexos
- Documente funções públicas com JSDoc

### Estilo

- Seguimos o ESLint e Prettier configurados
- Use 2 espaços para indentação
- Aspas simples para strings
- Ponto e vírgula obrigatório
- Nomes descritivos para variáveis e funções

### Estrutura

```typescript
/**
 * Descrição da função
 * @param param1 Descrição do parâmetro
 * @returns Descrição do retorno
 */
export async function minhaFuncao(param1: string): Promise<Resultado> {
  // Implementação
}
```

## 🧪 Testes

- Escreva testes para novas features
- Mantenha cobertura de testes alta
- Use nomes descritivos para testes

```typescript
describe('AnimeUnificationService', () => {
  it('should unify anime data from multiple sources', async () => {
    // Arrange
    const service = new AnimeUnificationService(mockRepository);
    
    // Act
    const result = await service.fetchAndUnify(externalIds);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.title).toBeDefined();
  });
});
```

## 📚 Documentação

- Atualize o README.md se necessário
- Adicione comentários para código complexo
- Documente APIs públicas
- Mantenha exemplos atualizados

## 🔍 Review Process

1. Pelo menos um revisor deve aprovar
2. Todos os testes devem passar
3. Não deve haver conflitos
4. Código deve seguir os padrões

## ❓ Dúvidas

Se tiver dúvidas:
- Abra uma issue com a tag `question`
- Descreva claramente sua dúvida
- Forneça contexto se necessário

## 📜 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a Licença MIT.

---

Obrigado por contribuir! 🐱
