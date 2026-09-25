import { AvailabilityBlock } from '../api/agendaApi';
import { formatLongDay, parseIsoDate } from './dates';

/** "Lunes 22 de septiembre, 08:00 a 12:00, sede HIC, 8 espacios" */
export function blockAccessibleName(block: AvailabilityBlock): string {
  const slots = block.slots === 1 ? '1 espacio' : `${block.slots} espacios`;
  return `${formatLongDay(parseIsoDate(block.date))}, ${block.startTime} a ${block.endTime}, sede ${block.siteCode}, ${slots}`;
}

export function blockRange(block: Pick<AvailabilityBlock, 'startTime' | 'endTime'>): string {
  return `${block.startTime} – ${block.endTime}`;
}

export function sortBlocks(blocks: AvailabilityBlock[]): AvailabilityBlock[] {
  return [...blocks].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
}
