# Planilha Google — guia completo

## Recados (Mensagem) não salvam?

1. **Atualize o Apps Script** — cole [`apps-script.gs`](apps-script.gs) → **Implantar → Nova versão**
2. Teste: após um POST, a resposta deve incluir `"scriptVersion": 2`
3. Coluna **Mensagem** ou **Recado** na aba Presentes (linha 1)
4. O site também envia o recado em **Origem** como backup (`Pix | Recado: ...`)

---

## Aba **Presentes** — cabeçalho linha 1

Opção A (6 colunas):

`Data | Presente | Valor | Mensagem | Comprovante | Origem`

Opção B (7 colunas):

`Data | Presente | Valor | Presenteado por | Mensagem | Comprovante | Origem`

O script em `apps-script.gs` detecta automaticamente qual layout você usa.

---

## Outras abas

| Aba | Cabeçalho linha 1 |
|-----|-------------------|
| **RSVP** | `Data \| Nome` |
| **Catálogo Presentes** | `ID \| Categoria \| Nome \| Valor \| Ícone` |
| **Convidados** | `Nome` |

---

## Publicar o Apps Script

1. Planilha → **Extensões → Apps Script**
2. Apague o código antigo
3. Cole o conteúdo de **`apps-script.gs`**
4. **Salvar**
5. **Implantar → Gerenciar implantações → Editar → Versão: Nova versão → Implantar**

Só salvar **não basta** — precisa criar **Nova versão** na implantação.

---

## URL no site

No `index.html`:

```javascript
webhookUrl: "https://script.google.com/macros/s/SEU_ID/exec",
```

---

## Testar

1. Abra `.../exec?tipo=config` — deve listar presentes e convidados
2. Dê um presente teste com recado **"teste 123"**
3. Veja a aba **Presentes** — coluna **Mensagem** deve ter o texto

Se o recado aparecer em **Presenteado por**, o script ainda está na versão antiga.
