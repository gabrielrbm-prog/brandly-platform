/**
 * Servico de rastreamento via Correios
 * Usa o proxyapp.correios.com.br (API do app mobile dos Correios)
 * Fallback: scraping do site dos Correios
 *
 * Formato do codigo: 2 letras + 9 digitos + 2 letras  ex: SS987654321BR
 */

import type { TrackingEvent } from '@brandly/core';

// ============================================
// TIPOS
// ============================================

export type ShipmentStatus =
  | 'pending'
  | 'posted'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'returned'
  | 'failed';

export interface TrackingResult {
  trackingCode: string;
  status: ShipmentStatus;
  lastEvent: string | null;
  lastEventDate: Date | null;
  events: TrackingEvent[];
  error?: string;
}

// ============================================
// CONSTANTES
// ============================================

/** Formato padrao Correios: AA123456789BR */
const TRACKING_CODE_REGEX = /^[A-Z]{2}\d{9}[A-Z]{2}$/;

// ============================================
// MAPEAMENTO DE STATUS
// ============================================

function mapCorreiosStatusToEnum(description: string): ShipmentStatus {
  const desc = (description || '').toLowerCase();

  if (desc.includes('entregue') || desc.includes('objeto entregue')) return 'delivered';
  if (desc.includes('saiu para entrega') || desc.includes('saiu para a entrega')) return 'out_for_delivery';
  if (desc.includes('devolvido') || desc.includes('devolucao') || desc.includes('retornado')) return 'returned';
  if (desc.includes('tentativa de entrega') || desc.includes('nao entregue') || desc.includes('falha')) return 'failed';
  if (desc.includes('em transito') || desc.includes('encaminhado') || desc.includes('recebido') || desc.includes('transferencia')) return 'in_transit';
  if (desc.includes('postado') || desc.includes('coletado')) return 'posted';

  return 'in_transit';
}

// ============================================
// VALIDACAO
// ============================================

export function isValidCorreiosCode(code: string): boolean {
  return TRACKING_CODE_REGEX.test(code.toUpperCase().trim());
}

// ============================================
// CONSULTA PRINCIPAL
// ============================================

export async function trackPackage(trackingCode: string): Promise<TrackingResult> {
  const code = trackingCode.toUpperCase().trim();

  if (!isValidCorreiosCode(code)) {
    return {
      trackingCode: code,
      status: 'pending',
      lastEvent: null,
      lastEventDate: null,
      events: [],
      error: `Codigo de rastreamento invalido: ${code}. Formato esperado: AA123456789BR`,
    };
  }

  // Tentar API 1: Correios proxyapp (app mobile)
  const result = await tryCorreiosProxy(code);
  if (result) return result;

  // Tentar API 2: Correios API direta
  const result2 = await tryCorreiosApi(code);
  if (result2) return result2;

  // Nenhuma API retornou dados
  return {
    trackingCode: code,
    status: 'pending',
    lastEvent: 'Objeto ainda nao possui movimentacoes registradas nos Correios',
    lastEventDate: null,
    events: [],
  };
}

// ============================================
// API 1: Correios proxyapp (app mobile)
// ============================================

async function tryCorreiosProxy(code: string): Promise<TrackingResult | null> {
  try {
    const response = await fetch(
      `https://proxyapp.correios.com.br/v1/sro-rastro/${code}`,
      {
        headers: {
          'User-Agent': 'Dart/3.3 (dart:io)',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!response.ok) return null;

    const data = await response.json() as CorreiosProxyResponse;

    // Sem objetos ou sem eventos
    if (!data.objetos || data.objetos.length === 0) return null;

    const objeto = data.objetos[0];
    if (!objeto.eventos || objeto.eventos.length === 0) return null;

    const events: TrackingEvent[] = objeto.eventos.map((ev) => ({
      date: ev.dtHrCriado ? new Date(ev.dtHrCriado).toLocaleDateString('pt-BR') : '',
      time: ev.dtHrCriado ? new Date(ev.dtHrCriado).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
      location: ev.unidade?.endereco
        ? `${ev.unidade.endereco.cidade || ''} - ${ev.unidade.endereco.uf || ''}`
        : ev.unidade?.nome || '',
      status: ev.descricao || '',
      description: ev.detalhe || ev.descricao || '',
    }));

    const mostRecent = objeto.eventos[0];
    const status = mapCorreiosStatusToEnum(mostRecent?.descricao || '');

    return {
      trackingCode: code,
      status,
      lastEvent: mostRecent?.descricao || null,
      lastEventDate: mostRecent?.dtHrCriado ? new Date(mostRecent.dtHrCriado) : null,
      events,
    };
  } catch {
    return null;
  }
}

// ============================================
// API 2: Correios API direta (com HTML parsing)
// ============================================

async function tryCorreiosApi(code: string): Promise<TrackingResult | null> {
  try {
    const response = await fetch(
      'https://www2.correios.com.br/sistemas/rastreamento/ctrl/ctrlRastreamento.cfm',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        },
        body: `objetos=${code}&btnPesq=Buscar`,
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!response.ok) return null;

    const html = await response.text();

    // Parse simples do HTML dos Correios
    const events: TrackingEvent[] = [];
    const eventRegex = /<td[^>]*>\s*(\d{2}\/\d{2}\/\d{4})\s*(\d{2}:\d{2})\s*<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/gi;

    let match;
    while ((match = eventRegex.exec(html)) !== null) {
      events.push({
        date: match[1].trim(),
        time: match[2].trim(),
        location: match[3].replace(/<[^>]*>/g, '').trim(),
        status: match[4].replace(/<[^>]*>/g, '').trim(),
        description: match[4].replace(/<[^>]*>/g, '').trim(),
      });
    }

    if (events.length === 0) return null;

    const mostRecent = events[0];
    const status = mapCorreiosStatusToEnum(mostRecent.status);

    return {
      trackingCode: code,
      status,
      lastEvent: mostRecent.description || null,
      lastEventDate: parseDate(mostRecent.date, mostRecent.time),
      events,
    };
  } catch {
    return null;
  }
}

// ============================================
// HELPERS
// ============================================

function parseDate(date?: string, time?: string): Date | null {
  if (!date) return null;
  try {
    const [day, month, year] = date.split('/');
    const timeStr = time || '00:00';
    const parsed = new Date(`${year}-${month}-${day}T${timeStr}:00`);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

// ============================================
// INTERFACES DA API CORREIOS
// ============================================

interface CorreiosProxyEvento {
  descricao?: string;
  detalhe?: string;
  dtHrCriado?: string;
  tipo?: string;
  unidade?: {
    nome?: string;
    endereco?: {
      cidade?: string;
      uf?: string;
    };
  };
  unidadeDestino?: {
    nome?: string;
    endereco?: {
      cidade?: string;
      uf?: string;
    };
  };
}

interface CorreiosProxyObjeto {
  codObjeto?: string;
  eventos?: CorreiosProxyEvento[];
  dtPrevista?: string;
  tipoPostal?: { categoria?: string; descricao?: string };
}

interface CorreiosProxyResponse {
  objetos?: CorreiosProxyObjeto[];
  quantidade?: number;
  resultado?: string;
}
