import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface DataChunk {
  id: string;
  text: string;
  sourceDocument: string;
  chunkIndex: number;
  createdAt: string;
}

export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.docx') || fileType.includes('wordprocessingml')) {
    return await extractTextFromWord(file);
  } else if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
    return await extractTextFromPDF(file);
  } else {
    throw new Error('Unsupported file type. Please upload Word (.docx) or PDF files.');
  }
}

async function extractTextFromWord(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from Word document:', error);
    throw new Error('Failed to extract text from Word document');
  }
}

async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + ' ';
    }

    return fullText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

export function createTextChunks(text: string, sourceDocument: string, chunkSize: number = 1000): DataChunk[] {
  const chunks: DataChunk[] = [];
  const cleanText = text.replace(/\s+/g, ' ').trim();

  for (let i = 0; i < cleanText.length; i += chunkSize) {
    let chunkText = cleanText.slice(i, i + chunkSize);
    
    // Try to break at word boundaries to avoid cutting words in half
    if (i + chunkSize < cleanText.length && chunkText.length === chunkSize) {
      const lastSpaceIndex = chunkText.lastIndexOf(' ');
      if (lastSpaceIndex > chunkSize * 0.8) { // Only break if we don't lose too much text
        chunkText = chunkText.slice(0, lastSpaceIndex);
      }
    }

    chunks.push({
      id: `chunk-${Date.now()}-${i}`,
      text: chunkText.trim(),
      sourceDocument,
      chunkIndex: Math.floor(i / chunkSize),
      createdAt: new Date().toISOString()
    });
  }

  return chunks;
}