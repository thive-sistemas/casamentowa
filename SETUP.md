# Como ligar o site à planilha do Google Sheets

Isso leva uns 5 minutos e não precisa saber programar — é só copiar e colar.

## Passo 1 — Crie a planilha
1. Acesse [sheets.google.com](https://sheets.google.com) e crie uma planilha nova.
2. Renomeie para algo como **"Casamento Wdmar e Adylla"**.
3. Renomeie a primeira aba (embaixo) para **RSVP**.
4. Na linha 1 da aba RSVP, cole estes títulos, um por coluna (A e B):
   `Data | Nome`
5. Clique com o botão direito na aba **RSVP** → **Duplicar** → renomeie a cópia para **Presentes**.
6. Na aba **Presentes**, troque o cabeçalho da linha 1 para (A até F):
   `Data | Presente | Valor | Mensagem | Comprovante | Origem`

   Essa aba é só um **registro** (log) de quem confirmou presente — não é onde você edita a lista que aparece no site. Para isso, crie mais duas abas:

7. Crie uma aba nova chamada **Catálogo Presentes**, com estes cabeçalhos na linha 1 (A até E):
   `ID | Categoria | Nome | Valor | Ícone`

   Preencha uma linha por presente, por exemplo:

   | ID | Categoria | Nome | Valor | Ícone |
   |----|-----------|------|-------|-------|
   | g1 | Cozinha | Panela Queridinha do Chef | 350 | pan |
   | g2 | Cozinha | Vitamina Todo Dia de Amor | 420 | blender |
   | g3 | Lua de mel | Cota Passagem - Lua de Mel | 900 | plane |

   - **ID**: um código curto único pra cada linha (g1, g2, g3...). Não repita.
   - **Ícone**: use uma destas palavras (sem acento, minúsculo): `pan`, `blender`, `coffee`, `towel`, `bed`, `vacuum`, `bbq`, `dinner`, `candle`, `plane`, `beach`, `toast`. Se deixar em branco ou escrever algo inválido, o site usa um ícone padrão.
   - O presente com ID `g1` continua mostrando a foto de vocês na cozinha (isso é fixo no site) — as outras colunas dele (nome, valor, categoria) você pode editar à vontade.
   - Para adicionar, editar ou remover um presente, é só mexer nessa aba — o site atualiza sozinho (sem precisar editar código).

8. Crie outra aba chamada **Convidados**, com cabeçalho na linha 1 (A):
   `Nome`

   E uma linha por convidado, por exemplo:

   | Nome |
   |------|
   | Ana Paula Silva |
   | Carlos Eduardo Santos |

   Essa é a lista usada na sugestão do campo de nome do RSVP — edite direto aqui, sem precisar mexer no código do site.

## Passo 2 — Cole o código do robô (Apps Script)
1. Na planilha, vá em **Extensões → Apps Script**.
2. Apague qualquer código que já esteja lá e cole exatamente isto:

```javascript
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tipo = e.parameter.tipo;

  if (tipo === "config") {
    const giftsSheet = ss.getSheetByName("Catálogo Presentes");
    const giftsData = giftsSheet ? giftsSheet.getDataRange().getValues() : [];
    const gifts = [];
    for (let i = 1; i < giftsData.length; i++) {
      const row = giftsData[i];
      if (!row[0] || !row[2]) continue;
      gifts.push({
        id: String(row[0]).trim(),
        tag: row[1],
        name: row[2],
        price: row[3],
        icon: String(row[4] || "").trim().toLowerCase()
      });
    }

    const guestSheet = ss.getSheetByName("Convidados");
    const guestData = guestSheet ? guestSheet.getDataRange().getValues() : [];
    const guestList = [];
    for (let i = 1; i < guestData.length; i++) {
      if (guestData[i][0]) guestList.push(String(guestData[i][0]).trim());
    }

    return ContentService.createTextOutput(JSON.stringify({ gifts, guestList }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ error: "tipo inválido" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (data.tipo === "rsvp") {
    const sheet = ss.getSheetByName("RSVP");
    sheet.appendRow([
      data.dataEnvio,
      data.nome
    ]);

  } else if (data.tipo === "presente") {
    const sheet = ss.getSheetByName("Presentes");
    let comprovanteLink = "";

    // Se veio um comprovante (imagem/PDF em base64), salva no Google Drive
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

    sheet.appendRow([
      data.dataEnvio,
      data.presente,
      data.valor,
      data.mensagem,
      comprovanteLink,
      data.origem || "Pix"
    ]);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ status: "ok" })
  ).setMimeType(ContentService.MimeType.JSON);
}
```

3. Clique no ícone de salvar (💾).

## Passo 3 — Publique como Web App
1. No canto superior direito, clique em **Implantar → Nova implantação**.
2. No ícone de engrenagem, escolha o tipo **App da Web**.
3. Configure:
   - **Executar como:** Eu (seu e-mail)
   - **Quem pode acessar:** Qualquer pessoa
4. Clique em **Implantar**.
5. O Google vai pedir para autorizar o acesso — clique em **Autorizar acesso**, escolha sua conta e depois em **Avançado → Acessar [nome do projeto] (não seguro)** (é normal, é só o próprio Google avisando que é um script seu). Como o script agora também salva arquivos no Drive, ele vai pedir permissão de acesso ao Google Drive também — autorize normalmente.
6. Copie a **URL do app da Web** que aparece (algo como `https://script.google.com/macros/s/AKfycb.../exec`).

## Passo 4 — Cole a URL no site
1. Abra o arquivo `index.html` em qualquer editor de texto (ou peça pra mim editar).
2. Procure esta linha, perto do topo do `<script>`:
   ```javascript
   webhookUrl: "COLOQUE_AQUI_A_URL_DO_SEU_APPS_SCRIPT",
   ```
3. Troque pelo link que você copiou, entre aspas:
   ```javascript
   webhookUrl: "https://script.google.com/macros/s/AKfycb.../exec",
   ```
4. Salve o arquivo.

Pronto — a partir de agora:
- Toda confirmação de presença cai na aba **RSVP** (incluindo se o nome bateu com a lista de convidados).
- Todo aviso de "já fiz o Pix" cai na aba **Presentes**, com o recado da pessoa e um **link direto para o comprovante**, que fica salvo automaticamente numa pasta no seu Google Drive chamada "Comprovantes Pix - Casamento Wdmar e Adylla". 💜
- A lista de presentes que aparece no site e a lista de nomes sugeridos no RSVP passam a vir das abas **Catálogo Presentes** e **Convidados** — edite lá, sem precisar mexer no código.

---

### Outras coisas para revisar antes de publicar o site
- **Lista de presentes:** agora vem da aba **Catálogo Presentes** da planilha (veja o Passo 1.7). Se a planilha não estiver configurada ainda, ou o site não conseguir acessá-la, ele usa uma lista padrão salva no próprio código como reserva.
- **Lista de convidados (seleção obrigatória no RSVP):** agora vem da aba **Convidados** da planilha (veja o Passo 1.8). Enquanto a pessoa digita, aparecem sugestões discretas da lista — ela precisa clicar em um nome da lista para o botão "Confirmar presença" funcionar (evita nomes errados ou de gente não convidada). Sem a planilha configurada, o site usa uma lista de exemplo salva no código.
- **Pix automático com QR code:** o site agora gera um QR code Pix (padrão oficial do Banco Central) já com o valor exato de cada presente preenchido, e um botão para copiar o código "Pix Copia e Cola". Isso funciona 100% no site, sem precisar de nenhuma integração bancária — é só a pessoa escanear ou colar no app do banco dela. Se quiser trocar o nome que aparece no Pix (hoje está "ADYLLA SOUZA" / "CUPIRA"), procure `pixMerchantName` e `pixMerchantCity` no `CONFIG` do `index.html`.
- **Endereço em Cupira:** já preenchido com os dados do convite (Igreja Nossa Senhora Auxiliadora, Centro, Cupira – PE, e recepção no La Bele Recepções). Se algo mudar, é só editar a seção "Local" no `index.html`.
- **Chave Pix:** o site está usando `ester.adyla@outlook.com` como chave Pix. Se não for essa a chave certa, me avise e eu troco.
- **Data limite de RSVP:** está configurada como 30 de setembro de 2026 — troque se quiser outra data.
- **Hospedagem:** o site está configurado para ser hospedado na **Vercel** (junto com o pagamento por cartão via Stripe) — veja o passo a passo completo no `STRIPE_SETUP.md`. Se quiser usar só o Pix (sem cartão), também dá pra hospedar de forma ainda mais simples em **Netlify Drop** ou **GitHub Pages**, arrastando só o `index.html`.

