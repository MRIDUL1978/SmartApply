import * as pdfjsLib from 'pdfjs-dist';

import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const extractTextFromPdf = async (file) => {
  if(file.size === 0) {
    throw new Error("This file is empty. Please select a valid PDF")
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const typedArray = new Uint8Array(arrayBuffer)

    const pdf = await pdfjsLib.getDocument({data: typedArray}).promise
    let fullText = ""

    for(let i=1; i<= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      const pageText = textContent.items.map(item => item.str).join(" ")
      fullText += pageText + "\n\n"
    }

    return fullText.trim()

  } catch (error) {
    console.error("Core Parsing error")
    throw error
  }
}