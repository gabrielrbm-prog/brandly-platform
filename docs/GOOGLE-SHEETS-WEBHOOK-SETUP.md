# Google Sheets Webhook Setup

Substitui o polling antigo (a cada 3 min) por push direto do Google Sheets → API Brandly.

## 1. Railway — configurar secret

Adicionar env var na Railway:

```
GOOGLE_SHEETS_WEBHOOK_SECRET=ab1383fa7c42c0f4d26a86dae759d524195a2ec9f966ad2ff116f96674539e65
```

## 2. Google Sheets — Apps Script

1. Abrir planilha: https://docs.google.com/spreadsheets/d/19SDQsSIz2GNCqeibXQcetHb-TRIPFQSkBYo5zewmgGw
2. Menu **Extensões → Apps Script**
3. Apagar o código existente e colar:

```javascript
const WEBHOOK_URL = 'https://api.brandlycreator.com.br/api/webhooks/new-buyer';
const WEBHOOK_SECRET = 'ab1383fa7c42c0f4d26a86dae759d524195a2ec9f966ad2ff116f96674539e65';
const EMAIL_COLUMN_INDEX = 4; // coluna D (1-indexed)

function onEdit(e) {
  try {
    const range = e.range;
    const sheet = range.getSheet();
    const row = range.getRow();
    if (row <= 1) return; // skip header

    const email = sheet.getRange(row, EMAIL_COLUMN_INDEX).getValue();
    if (!email || typeof email !== 'string' || !email.includes('@')) return;

    sendToWebhook(email.trim().toLowerCase());
  } catch (err) {
    console.error('onEdit error:', err);
  }
}

function sendToWebhook(email) {
  const response = UrlFetchApp.fetch(WEBHOOK_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'X-Webhook-Secret': WEBHOOK_SECRET },
    payload: JSON.stringify({ email }),
    muteHttpExceptions: true,
  });
  console.log(`[${email}] status=${response.getResponseCode()} body=${response.getContentText()}`);
}

// Manual bulk sync — use once to catch up existing rows
function syncAll() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  const emails = sheet.getRange(2, EMAIL_COLUMN_INDEX, lastRow - 1, 1).getValues();
  emails.forEach(([email]) => {
    if (email && typeof email === 'string' && email.includes('@')) {
      sendToWebhook(email.trim().toLowerCase());
      Utilities.sleep(100);
    }
  });
}
```

4. Salvar (Ctrl+S). Renomear projeto para "Brandly Buyer Webhook".

## 3. Ativar trigger

1. No Apps Script, clicar no ícone de **relógio** (Triggers) no menu lateral esquerdo
2. **+ Add Trigger** (canto inferior direito)
3. Configurar:
   - Function: `onEdit`
   - Deployment: `Head`
   - Event source: `From spreadsheet`
   - Event type: `On change` (ou `On form submit` se os compradores vêm via Google Form)
4. **Save**. Autorizar com a conta Google quando pedir.

## 4. Sincronizar base existente (1x)

Na planilha, Extensões → Apps Script, escolher função `syncAll` no dropdown superior e clicar em **▶ Run**.

Isso dispara o webhook pra cada email existente. Só precisa rodar uma vez.

## 5. Testar

1. Adicionar uma linha de teste na planilha com um email que já exista como user na Brandly
2. Ver os logs no Apps Script (menu Execuções) — deve mostrar status 200
3. Conferir nos logs Railway: `[webhook/new-buyer] xxx@yyy.com marked as buyer`
4. Conferir no admin Brandly que o usuário aparece como "comprou"

## Status codes da API

| Status | Significado |
|---|---|
| 200 `marked` | Usuário existe e foi marcado como comprador |
| 200 `already_marked` | Usuário já era comprador (idempotente) |
| 202 `pending` | Email não cadastrado ainda — sync automático quando criar conta |
| 400 | Email inválido |
| 401 | Secret errado ou ausente |
| 500 | Secret não configurado no servidor |
