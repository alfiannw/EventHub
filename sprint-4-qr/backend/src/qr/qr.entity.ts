export type QrStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';
export type QrFormat = 'QR_CODE' | 'BARCODE' | 'DATA_MATRIX';

export interface QrTicketEntity {
  id: string;
  participantId: string;
  qrCodeString: string;
  format: QrFormat;
  status: QrStatus;
  scansCount: number;
  lastScannedAt?: Date;
  generatedAt: Date;
  expiresAt?: Date;
}

export interface GenerateQrDto {
  participantId: string;
  format?: QrFormat;
  expiresInHours?: number;
}

export interface RevokeQrDto {
  status: QrStatus;
}
