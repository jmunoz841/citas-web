import { apiRequest, ItemsResponse } from '../../../shared/api/apiClient';

// DTOs de `citas-api/docs/contratos/disponibilidad.md` (HU-010).

export interface Site {
  code: string;
  name: string;
}

export interface ProfessionalProfile {
  id: number;
  firstNames: string;
  lastNames: string;
  active: boolean;
  primarySpecialty: { id: number; name: string; durationMinutes: number } | null;
  sites: Site[];
}

export interface AvailabilityBlock {
  id: number;
  siteCode: string;
  /** `YYYY-MM-DD` */
  date: string;
  /** `HH:mm` */
  startTime: string;
  endTime: string;
  slots: number;
}

export interface BlockInput {
  date: string;
  startTime: string;
  endTime: string;
  siteCode: string;
}

const BLOCKS = '/api/v1/professional/availability-blocks';

export function getMyProfile(): Promise<ProfessionalProfile> {
  return apiRequest<ProfessionalProfile>('/api/v1/professional/me');
}

/** Todos los bloques propios; la semana y la sede se filtran en el cliente. */
export async function listMyBlocks(): Promise<AvailabilityBlock[]> {
  const res = await apiRequest<ItemsResponse<AvailabilityBlock>>(BLOCKS);
  return res.items ?? [];
}

export function createBlock(input: BlockInput): Promise<AvailabilityBlock> {
  return apiRequest<AvailabilityBlock>(BLOCKS, { method: 'POST', body: input });
}

export function updateBlock(id: number, input: BlockInput): Promise<AvailabilityBlock> {
  return apiRequest<AvailabilityBlock>(`${BLOCKS}/${id}`, { method: 'PATCH', body: input });
}

export function deleteBlock(id: number): Promise<void> {
  return apiRequest<void>(`${BLOCKS}/${id}`, { method: 'DELETE' });
}
