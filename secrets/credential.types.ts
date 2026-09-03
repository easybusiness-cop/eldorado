export interface SecretSecret {
  key: string;
  value: string;
  description?: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  lastRotated?: string;
}
