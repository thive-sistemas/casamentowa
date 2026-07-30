# Planilha Google — guia completo

## Aba **Presentes** — cabeçalho linha 1

Pode usar **6 ou 7 colunas** (o script detecta pelo nome do cabeçalho):

`Data | Presente | Valor | Mensagem | Comprovante | Origem`

ou com quem deu o presente:

`Data | Presente | Valor | Presenteado por | Mensagem | Comprovante | Origem`

> A coluna de recado deve se chamar **Mensagem** ou **Recado** (linha 1).

---

## Apps Script (cole e republique)

**Extensões → Apps Script** → apague tudo → cole → **Salvar** → **Implantar → Gerenciar implantações → Editar → Nova versão → Implantar**

```javascript
function normalizeHeader(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function appendRowByHeaders(sheet, fieldMap) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const row = new Array(headers.length).fill("");

  Object.keys(fieldMap).forEach(key => {
    const aliases = key.split("|").map(normalizeHeader);
    const value = fieldMap[key];
    for (let i = 0; i < headers.length; i++) {
      const header = normalizeHeader(headers[i]);
      if (aliases.indexOf(header) !== -1) {
        row[i] = value;
        break;
      }
    }
  });

  sheet.appendRow(row);
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tipo = e && e.parameter ? e.parameter.tipo : "";

  if (tipo === "config") {
    const gifts = [];
    const giftsSheet = ss.getSheetByName("Catálogo Presentes");
    if (giftsSheet) {
      const giftsData = giftsSheet.getDataRange().getValues();
      for (let i = 1; i < giftsData.length; i++) {
        const row = giftsData[i];
        if (!row[0] || !row[2]) continue;
        gifts.push({
          id: String(row[0]).trim(),
          tag: row[1] || "Presente",
          name: row[2],
          price: row[3],
          icon: String(row[4] || "").trim().toLowerCase()
        });
      }
    }

    const guestList = [];
    const guestSheet = ss.getSheetByName("Convidados");
    if (guestSheet) {
      const guestData = guestSheet.getDataRange().getValues();
      for (let i = 1; i < guestData.length; i++) {
        if (guestData[i][0]) guestList.push(String(guestData[i][0]).trim());
      }
    }

    return jsonResponse({ gifts: gifts, guestList: guestList });
  }

  return jsonResponse({ error: "tipo inválido" });
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (data.tipo === "rsvp") {
    const sheet = ss.getSheetByName("RSVP");
    if (!sheet) return jsonResponse({ status: "error", error: "Aba RSVP não encontrada" });
    appendRowByHeaders(sheet, {
      "Data": data.dataEnvio,
      "Nome": data.nome
    });

  } else if (data.tipo === "presente") {
    const sheet = ss.getSheetByName("Presentes");
    if (!sheet) return jsonResponse({ status: "error", error: "Aba Presentes não encontrada" });

    let comprovanteLink = "";
    if (data.comprovanteBase64 && data.comprovanteBase64.indexOf("base64,") > -1) {
      const folderName = "Comprovantes Pix - Casamento Wdmar e Adylla";
      const folders = DriveApp.getFoldersByName(folderName);
      const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
      const base64Data = data.comprovanteBase64.split("base64,")[1];
      const mimeMatch = data.comprovanteBase64.match(/data:(.*);base64/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
      const fileName = (data.presente || "presente") + " - " + (data.comprovanteNome || "comprovante");
      const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      comprovanteLink = file.getUrl();
    }

    const mensagem = data.mensagem || data.recado || "";

    appendRowByHeaders(sheet, {
      "Data": data.dataEnvio,
      "Presente": data.presente,
      "Valor": data.valor,
      "Presenteado por|Quem deu": data.presenteadoPor || "",
      "Mensagem|Recado": mensagem,
      "Comprovante": comprovanteLink,
      "Origem": data.origem || "Pix"
    });
  }

  return jsonResponse({ status: "ok" });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

## Outras abas

| Aba | Cabeçalho linha 1 |
|-----|-------------------|
| **RSVP** | `Data \| Nome` |
| **Catálogo Presentes** | `ID \| Categoria \| Nome \| Valor \| Ícone` |
| **Convidados** | `Nome` |

---

## Conferir se a mensagem está indo para a coluna errada

Abra a aba **Presentes** e veja:

- Se o recado aparece em **Presenteado por** → script antigo, republique o código acima
- Se **Mensagem** está vazia mas **Comprovante** tem texto → falta coluna **Presenteado por** ou script desatualizado
- Se a coluna se chama **Recado** em vez de **Mensagem** → o script novo aceita os dois nomes

## Teste rápido

Depois de republicar, faça um presente teste com recado **"teste 123"** e procure esse texto em **qualquer coluna** da aba Presentes.
