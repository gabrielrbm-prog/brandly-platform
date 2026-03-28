/**
 * Servico de rastreamento via Correios (Linketrack API)
 * Utiliza a API publica do Linketrack que encapsula o SRO dos Correios.
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

const LINKETRACK_URL = 'https://api.linketrack.com/track/json';
const LINKETRACK_USER = 'teste';
const LINKETRACK_TOKEN = '1abcd00b2731640e886fb41a8a9671ad1434c599dbaa0a0de9a5aa619f29a83f';

/** Formato padrao Correios: AA123456789BR */
const TRACKING_CODE_REGEX = /^[A-Z]{2}\d{9}[A-Z]{2}$/;

// ============================================
// MAPEAMENTO DE STATUS
// ============================================

/**
 * Mapeia descricoes do Correios para os valores do enum shipment_status.
 * Ordem importa: verificar descricoes mais especificas primeiro.
 */
function mapCorreiosStatusToEnum(description: string): ShipmentStatus {
  const desc = description.toLowerCase();

  if (desc.includes('entregue') || desc.includes('objeto entregue')) {
    return 'delivered';
  }
  if (desc.includes('saiu para entrega') || desc.includes('saiu para a entrega')) {
    return 'out_for_delivery';
  }
  if (
    desc.includes('devolvido') ||
    desc.includes('devolver') ||
    desc.includes('devolucao') ||
    desc.includes('retornado ao remetente')
  ) {
    return 'returned';
  }
  if (
    desc.includes('tentativa de entrega') ||
    desc.includes('nao entregue') ||
    desc.includes('nao foi possivel entregar') ||
    desc.includes('falha')
  ) {
    return 'failed';
  }
  if (
    desc.includes('em transito') ||
    desc.includes('em transite') ||
    desc.includes('encaminhado') ||
    desc.includes('recebido') ||
    desc.includes('em transferencia')
  ) {
    return 'in_transit';
  }
  if (
    desc.includes('postado') ||
    desc.includes('objeto postado') ||
    desc.includes('coletado')
  ) {
    return 'posted';
  }

  // Status desconhecido — manter in_transit como default seguro
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

  try {
    const url = `${LINKETRACK_URL}?user=${LINKETRACK_USER}&token=${LINKETRACK_TOKEN}&objeto=${code}`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Brandly-Platform/1.0',
      },
      signal: AbortSignal.timeout(15_000), // 15s timeout
    });

    if (!response.ok) {
      throw new Error(`Linketrack respondeu com status ${response.status}`);
    }

    const data = await response.json() as LinketrackResponse;

    // Sem eventos registrados
    if (!data.eventos || data.eventos.length === 0) {
      return {
        trackingCode: code,
        status: 'posted',
        lastEvent: 'Objeto nao encontrado ou sem movimentacoes registradas',
        lastEventDate: null,
        events: [],
      };
    }

    // Mapear eventos — Linketrack retorna do mais recente para o mais antigo
    const events: TrackingEvent[] = data.eventos.map((ev) => ({
      date: ev.data ?? '',
      time: ev.hora ?? '',
      location: [ev.cidade, ev.uf].filter(Boolean).join(' - ') || ev.local || '',
      status: ev.status ?? '',
      description: ev.descricao ?? ev.status ?? '',
    }));

    // O primeiro evento e o mais recente
    const mostRecent = data.eventos[0];
    const lastDescription = mostRecent?.descricao ?? mostRecent?.status ?? '';
    const lastEventDate = parseCorreiosDate(mostRecent?.data, mostRecent?.hora);
    const status = mapCorreiosStatusToEnum(lastDescription);

    return {
      trackingCode: code,
      status,
      lastEvent: lastDescription || null,
      lastEventDate,
      events,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';

    // Retornar resultado parcial em vez de lancar erro — o chamador decide o que fazer
    return {
      trackingCode: code,
      status: 'pending',
      lastEvent: null,
      lastEventDate: null,
      events: [],
      error: `Falha ao consultar Correios: ${message}`,
    };
  }
}

// ============================================
// HELPERS INTERNOS
// ============================================

function parseCorreiosDate(date?: string, time?: string): Date | null {
  if (!date) return null;
  try {
    // Correios usa formato DD/MM/YYYY
    const [day, month, year] = date.split('/');
    const timeStr = time ?? '00:00';
    const isoStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timeStr}:00`;
    const parsed = new Date(isoStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

// ============================================
// INTERFACE DA API LINKETRACK
// ============================================

interface LinketrackEvento {
  data?: string;      // DD/MM/YYYY
  hora?: string;      // HH:MM
  local?: string;
  cidade?: string;
  uf?: string;
  status?: string;
  descricao?: string;
  detalhe?: string;
}

interface LinketrackResponse {
  codigo?: string;
  nome?: string;
  sigla?: string;
  categoria?: string;
  eventos?: LinketrackEvento[];
  quantidade?: number;
  erro?: string;
}
