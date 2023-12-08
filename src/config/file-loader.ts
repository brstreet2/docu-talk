import { PDFLoader } from "langchain/document_loaders/fs/pdf";

export async function pdfLoader(blob: Blob) {
  const loader = new PDFLoader(blob);

  return await loader.load();
}
