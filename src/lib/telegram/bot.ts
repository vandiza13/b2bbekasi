export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7480213564:AAGjXLBTPGOEhJXRWyPbWXsiIa0BzlwYSsA';
export const TELEGRAM_DEFAULT_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1001894196961';

export function escapeMarkdownV2(text: string): string {
  return text
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!');
}

export function getCurrentTimeWIB(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };
  return now.toLocaleDateString('id-ID', options) + ' WIB';
}

export async function sendTelegramMessage(text: string, chatId: string = TELEGRAM_DEFAULT_CHAT_ID): Promise<boolean> {
  const maxLength = 4000;
  const escapedText = escapeMarkdownV2(text);
  const lines = escapedText.split('\n');
  let chunk = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] + '\n';
    if ((chunk + line).length > maxLength) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: chunk,
          parse_mode: 'MarkdownV2',
        }),
      });
      chunk = line;
    } else {
      chunk += line;
    }
  }

  if (chunk.length > 0) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: chunk,
        parse_mode: 'MarkdownV2',
      }),
    });
  }

  return true;
}
