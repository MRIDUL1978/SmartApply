const normalizeText = (value = "") => String(value)
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/[\u201C\u201D]/g, '"')
  .replace(/[\u2010-\u2015]/g, "-")
  .replace(/\u2026/g, "...")
  .replace(/\u00A0/g, " ")
  .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "")
  .replace(/[ \t]+/g, " ")
  .trim();

const fontFiles = [
  { file: "OpenSans-Regular.ttf", style: "normal", url: new URL("./fonts/OpenSans-Regular.ttf", import.meta.url).href },
  { file: "OpenSans-Bold.ttf", style: "bold", url: new URL("./fonts/OpenSans-Bold.ttf", import.meta.url).href },
  { file: "OpenSans-Italic.ttf", style: "italic", url: new URL("./fonts/OpenSans-Italic.ttf", import.meta.url).href }
];

const arrayBufferToBase64 = arrayBuffer => {
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
};

const registerFonts = async doc => {
  const loadedFonts = await Promise.all(fontFiles.map(async font => {
    const response = await fetch(font.url);
    if (!response.ok) throw new Error(`Could not load resume font: ${font.file}`);
    return { ...font, data: arrayBufferToBase64(await response.arrayBuffer()) };
  }));

  loadedFonts.forEach(font => {
    doc.addFileToVFS(font.file, font.data);
    doc.addFont(font.file, "OpenSans", font.style);
  });
};

export const generateCoverLetterPDF = async (coverLetterText, resumeName = "User", jobTitle = "Job") => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  await registerFonts(doc);
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const paragraphs = normalizeText(coverLetterText).split(/\n\s*\n/);
  let y = margin;

  doc.setFont("OpenSans", "normal");
  doc.setFontSize(11);

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const lines = doc.splitTextToSize(paragraph, contentWidth);
    lines.forEach(line => {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 5.5;
    });
    if (paragraphIndex < paragraphs.length - 1) y += 3;
  });

  const cleanJobTitle = normalizeText(jobTitle || "Job").replace(/[^a-zA-Z0-9_-]+/g, "_");
  const cleanResumeName = normalizeText(resumeName || "User").replace(/[^a-zA-Z0-9_.-]+/g, "_");
  doc.save(`${cleanResumeName}_${cleanJobTitle}_cover_letter.pdf`);
};

export const buildResumePDF = async resume => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  await registerFonts(doc);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = { top: 17, right: 18, bottom: 16, left: 18 };
  const contentWidth = pageWidth - margin.left - margin.right;
  const bottomEdge = pageHeight - margin.bottom;
  const bodySize = 9.7;
  const bodyLeading = 4.25;
  let y = margin.top;

  const setFont = (style = "normal", size = bodySize, color = 0) => {
    doc.setFont("OpenSans", style);
    doc.setFontSize(size);
    doc.setTextColor(color, color, color);
  };

  const addPage = () => {
    doc.addPage();
    y = margin.top;
  };

  const ensureSpace = height => {
    if (y + height > bottomEdge) addPage();
  };

  const getLines = (text, width, style = "normal", size = bodySize) => {
    setFont(style, size);
    return doc.splitTextToSize(normalizeText(text), width);
  };

  const writeLines = (lines, x, leading = bodyLeading) => {
    lines.forEach(line => {
      if (y + leading > bottomEdge) addPage();
      doc.text(line, x, y);
      y += leading;
    });
  };

  const drawSectionHeader = title => {
    const spacing = y > margin.top ? 3 : 0;
    ensureSpace(spacing + 9);
    y += spacing;
    setFont("bold", 10.4);
    doc.text(title.toUpperCase(), margin.left, y);
    y += 1.7;
    doc.setDrawColor(55, 55, 55);
    doc.setLineWidth(0.35);
    doc.line(margin.left, y, pageWidth - margin.right, y);
    y += 5.2;
  };

  const drawParagraph = text => {
    const lines = getLines(text, contentWidth);
    ensureSpace(Math.min(lines.length * bodyLeading, bottomEdge - margin.top));
    setFont();
    writeLines(lines, margin.left);
    y += 1.5;
  };

  const drawBullet = text => {
    const bulletX = margin.left + 1;
    const textX = margin.left + 5;
    const lines = getLines(text, contentWidth - 5);
    ensureSpace(Math.min(lines.length * bodyLeading, bottomEdge - margin.top));
    setFont();
    doc.text("-", bulletX, y);
    writeLines(lines, textX);
  };

  const drawEntryHeader = (leftText, rightText = "", linkStyle = false) => {
    const left = normalizeText(leftText);
    const right = normalizeText(rightText);
    setFont(linkStyle ? "bold" : "bold", bodySize);
    const rightWidth = right ? Math.min(doc.getTextWidth(right), contentWidth * 0.37) : 0;
    const gap = right ? 5 : 0;
    const leftWidth = contentWidth - rightWidth - gap;
    const leftLines = getLines(left, leftWidth, "bold");
    const rightLines = right ? getLines(right, Math.max(rightWidth, contentWidth * 0.25), linkStyle ? "italic" : "normal") : [];
    const lineCount = Math.max(leftLines.length, rightLines.length, 1);
    ensureSpace(lineCount * bodyLeading + 1);

    leftLines.forEach((line, index) => {
      setFont("bold");
      doc.text(line, margin.left, y + index * bodyLeading);
    });
    rightLines.forEach((line, index) => {
      setFont(linkStyle ? "italic" : "normal", right ? 9 : bodySize, 55);
      doc.text(line, pageWidth - margin.right, y + index * bodyLeading, { align: "right" });
    });
    y += lineCount * bodyLeading + 0.7;
  };

  const estimateEntryHeight = (leftText, rightText, highlights = []) => {
    setFont("bold");
    const rightWidth = rightText ? Math.min(doc.getTextWidth(normalizeText(rightText)), contentWidth * 0.37) : 0;
    const headerLines = getLines(leftText, contentWidth - rightWidth - (rightText ? 5 : 0), "bold").length;
    const bulletLines = highlights.reduce((total, item) => total + getLines(item, contentWidth - 5).length, 0);
    return Math.max(headerLines, 1) * bodyLeading + bulletLines * bodyLeading + 4;
  };

  setFont("bold", 18);
  const name = normalizeText(resume?.name || "Tailored Resume");
  const nameLines = doc.splitTextToSize(name, contentWidth);
  nameLines.forEach(line => {
    doc.text(line, pageWidth / 2, y, { align: "center" });
    y += 7;
  });

  const contact = [resume?.email, resume?.phone, resume?.location]
    .map(normalizeText)
    .filter(Boolean)
    .join("  |  ");
  if (contact) {
    setFont("normal", 9.2, 55);
    const contactLines = doc.splitTextToSize(contact, contentWidth);
    contactLines.forEach(line => {
      doc.text(line, pageWidth / 2, y, { align: "center" });
      y += 4.2;
    });
  }
  y += 4;

  if (normalizeText(resume?.summary)) {
    drawSectionHeader("Professional Summary");
    drawParagraph(resume.summary);
  }

  if (Array.isArray(resume?.skills) && resume.skills.length > 0) {
    drawSectionHeader("Skills");
    drawParagraph(resume.skills.map(normalizeText).filter(Boolean).join("  |  "));
  }

  if (Array.isArray(resume?.experience) && resume.experience.length > 0) {
    drawSectionHeader("Experience");
    resume.experience.forEach((experience, index) => {
      const highlights = Array.isArray(experience.highlights) ? experience.highlights.filter(Boolean) : [];
      ensureSpace(Math.min(
        estimateEntryHeight(`${experience.role || ""}${experience.company ? ` | ${experience.company}` : ""}`, experience.dates, highlights),
        bottomEdge - margin.top
      ));
      drawEntryHeader(`${experience.role || ""}${experience.company ? ` | ${experience.company}` : ""}`, experience.dates);
      highlights.forEach(drawBullet);
      if (index < resume.experience.length - 1) y += 2.2;
    });
  }

  if (Array.isArray(resume?.projects) && resume.projects.length > 0) {
    drawSectionHeader("Projects");
    resume.projects.forEach((project, index) => {
      const highlights = Array.isArray(project.highlights) ? project.highlights.filter(Boolean) : [];
      ensureSpace(Math.min(
        estimateEntryHeight(project.title, project.links, highlights),
        bottomEdge - margin.top
      ));
      drawEntryHeader(project.title, project.links, true);
      highlights.forEach(drawBullet);
      if (index < resume.projects.length - 1) y += 2.2;
    });
  }

  if (Array.isArray(resume?.education) && resume.education.length > 0) {
    drawSectionHeader("Education");
    resume.education.forEach((education, index) => {
      const title = `${education.degree || ""}${education.school ? ` | ${education.school}` : ""}`;
      const detailLines = normalizeText(education.details) ? getLines(education.details, contentWidth) : [];
      ensureSpace(Math.min(estimateEntryHeight(title, education.dates) + detailLines.length * bodyLeading, bottomEdge - margin.top));
      drawEntryHeader(title, education.dates);
      if (detailLines.length) {
        setFont();
        writeLines(detailLines, margin.left);
      }
      if (index < resume.education.length - 1) y += 2.2;
    });
  }

  const simpleSections = [
    ["Certifications", resume?.certifications],
    ["Honours and Awards", resume?.honours_and_awards],
    ["Activities", resume?.extra_curricular]
  ];

  simpleSections.forEach(([title, items]) => {
    const values = Array.isArray(items) ? items.map(normalizeText).filter(Boolean) : [];
    if (values.length === 0) return;
    drawSectionHeader(title);
    values.forEach(drawBullet);
  });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    setFont("normal", 8, 105);
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin.right, pageHeight - 7, { align: "right" });
  }

  return doc;
};

export const generateResumeLetterPDF = async resume => {
  if (!resume) return;
  const doc = await buildResumePDF(resume);
  const safeName = normalizeText(resume.name || "Tailored_Resume")
    .replace(/[^a-zA-Z0-9_-]+/g, "_");
  doc.save(`${safeName}_tailored_resume.pdf`);
};
