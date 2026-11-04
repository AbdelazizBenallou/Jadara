import { getData, postData } from "./http";
import type {
  PdfGenerationResponse,
  PdfStatusResponse,
} from "@/types/cv";

export function getPdfStatus(all = false): Promise<PdfStatusResponse> {
  return getData<PdfStatusResponse>("/cv-pdf/pdf-status", {
    params: all ? { all: true } : undefined,
  });
}

export function generatePdf(): Promise<PdfGenerationResponse> {
  return postData<PdfGenerationResponse>("/cv-pdf/pdf-generate");
}
