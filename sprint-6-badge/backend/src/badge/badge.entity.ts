export type BadgeTemplateType = 'STANDARD_PASS' | 'VIP_GOLD' | 'EXHIBITOR_MEDIA' | 'SPEAKER_PASS';
export type PrintJobStatus = 'PENDING' | 'PRINTED' | 'FAILED';

export interface BadgePrintJobEntity {
  id: string;
  participantId: string;
  templateType: BadgeTemplateType;
  printerId: string;
  printedBy: string;
  status: PrintJobStatus;
  printAttempts: number;
  failureReason?: string;
  printedAt?: Date;
  createdAt: Date;
}

export interface CreatePrintJobDto {
  participantId: string;
  templateType?: BadgeTemplateType;
  printerId?: string;
}

export interface PrintStatusDto {
  status: PrintJobStatus;
  failureReason?: string;
}
