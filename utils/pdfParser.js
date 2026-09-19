import * as pdfjsLib from 'pdfjs-dist';

import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const normalizeWhitespace = value => String(value || "").replace(/\s+/g, " ").trim();

const safeAnnotationUrl = annotation => {
  const rawUrl = annotation?.url || annotation?.unsafeUrl || "";
  try {
    const url = new URL(rawUrl);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? rawUrl : "";
  } catch {
    return "";
  }
};

const textBoxForItem = (item, viewport) => {
  const transform = pdfjsLib.Util.transform(viewport.transform, item.transform);
  const height = Math.max(Math.hypot(transform[2], transform[3]), Number(item.height) || 0, 1);
  const width = Math.max((Number(item.width) || 0) * viewport.scale, 1);
  return {
    text: normalizeWhitespace(item.str),
    left: transform[4],
    right: transform[4] + width,
    top: transform[5] - height,
    bottom: transform[5] + 1,
    centerY: transform[5] - height / 2,
    height
  };
};

const annotationBox = (annotation, viewport) => {
  const [a, b, c, d, e, f] = viewport.transform;
  const convertPoint = (x, y) => [x * a + y * c + e, x * b + y * d + f];
  const [x1, y1] = convertPoint(annotation.rect[0], annotation.rect[1]);
  const [x2, y2] = convertPoint(annotation.rect[2], annotation.rect[3]);
  return {
    left: Math.min(x1, x2),
    right: Math.max(x1, x2),
    top: Math.min(y1, y2),
    bottom: Math.max(y1, y2),
    centerY: (y1 + y2) / 2
  };
};

const boxesOverlap = (first, second, padding = 1.5) =>
  first.left <= second.right + padding &&
  first.right >= second.left - padding &&
  first.top <= second.bottom + padding &&
  first.bottom >= second.top - padding;

const fallbackLabel = url => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "mailto:") return parsed.pathname || "Email";
    return parsed.hostname.replace(/^www\./, "") || "Link";
  } catch {
    return "Link";
  }
};

const displayLabelForLink = (url, extractedLabel, context) => {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.startsWith("mailto:")) return "Email";
  if (lowerUrl.includes("linkedin.com")) return "LinkedIn";
  if (lowerUrl.includes("github.com")) return "GitHub";
  if (/\blive\b/i.test(context)) return "Live";

  const cleanedLabel = normalizeWhitespace(extractedLabel).replace(/^[|: -]+|[|: -]+$/g, "");
  if (cleanedLabel && cleanedLabel.length <= 40 && cleanedLabel.split(" ").length <= 4) return cleanedLabel;
  return fallbackLabel(url);
};

const extractPageLinks = (annotations, textBoxes, viewport) => annotations
  .map(annotation => {
    const url = safeAnnotationUrl(annotation);
    if (!url || !Array.isArray(annotation.rect)) return null;

    const linkBox = annotationBox(annotation, viewport);
    const labelItems = textBoxes.filter(item => item.text && boxesOverlap(item, linkBox));
    const referenceHeight = Math.max(linkBox.bottom - linkBox.top, 4);
    const contextItems = textBoxes.filter(item =>
      item.text && Math.abs(item.centerY - linkBox.centerY) <= Math.max(referenceHeight, item.height) * 0.85
    );
    const joinItems = items => items
      .slice()
      .sort((first, second) => first.left - second.left)
      .map(item => item.text)
      .filter(Boolean)
      .join(" ");

    const extractedLabel = normalizeWhitespace(joinItems(labelItems));
    const context = normalizeWhitespace(joinItems(contextItems)).slice(0, 500);
    return { url, label: displayLabelForLink(url, extractedLabel, context), context };
  })
  .filter(Boolean);

export const extractTextFromPdf = async (file) => {
  if(file.size === 0) {
    throw new Error("This file is empty. Please select a valid PDF")
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const typedArray = new Uint8Array(arrayBuffer)

    const pdf = await pdfjsLib.getDocument({data: typedArray}).promise
    let fullText = ""
    const links = [];
    const seenUrls = new Set();

    for(let i=1; i<= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const [textContent, annotations] = await Promise.all([
        page.getTextContent(),
        page.getAnnotations({ intent: "display" })
      ]);

      const pageText = textContent.items.map(item => item.str).join(" ")
      fullText += pageText + "\n\n"

      const viewport = page.getViewport({ scale: 1 });
      const textBoxes = textContent.items
        .filter(item => item.str && item.transform)
        .map(item => textBoxForItem(item, viewport));
      extractPageLinks(annotations, textBoxes, viewport).forEach(link => {
        if (seenUrls.has(link.url)) return;
        seenUrls.add(link.url);
        links.push(link);
      });
    }

    return { text: fullText.trim(), links }

  } catch (error) {
    console.error("Core Parsing error")
    throw error
  }
}
