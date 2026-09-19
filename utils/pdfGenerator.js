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

const safePdfUrl = value => {
  const rawUrl = String(value || "").trim();
  try {
    const url = new URL(rawUrl);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? rawUrl : "";
  } catch {
    return "";
  }
};

const normalizeLinks = value => Array.isArray(value)
  ? value.map(link => ({
      label: normalizeText(link?.label || "Link"),
      url: safePdfUrl(link?.url)
    })).filter(link => link.label && link.url)
  : [];

const canonicalLinkLabel = (url, label = "", context = "") => {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.startsWith("mailto:")) return "Email";
  if (lowerUrl.includes("linkedin.com")) return "LinkedIn";
  if (lowerUrl.includes("github.com")) return "GitHub";
  if (/\blive\b/i.test(`${label} ${context}`)) return "Live";
  return normalizeText(label || "Link");
};

const visibleLinksFromText = value => {
  const text = String(value || "");
  const candidates = [];
  const addCandidate = (rawUrl, index, label = "") => {
    const cleaned = rawUrl.replace(/[),.;\]}]+$/g, "");
    const url = cleaned.includes("@") && !cleaned.includes("/")
      ? `mailto:${cleaned}`
      : /^(?:https?:\/\/|mailto:)/i.test(cleaned)
        ? cleaned
        : `https://${cleaned}`;
    if (!safePdfUrl(url)) return;
    candidates.push({
      url,
      label: canonicalLinkLabel(url, label),
      context: normalizeText(text.slice(Math.max(0, index - 100), index + cleaned.length + 100))
    });
  };

  const urlPattern = /(?:https?:\/\/|www\.|(?:linkedin|github)\.com\/)[^\s|<>]+/gi;
  for (const match of text.matchAll(urlPattern)) addCandidate(match[0], match.index || 0);
  const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  for (const match of text.matchAll(emailPattern)) addCandidate(match[0], match.index || 0, "Email");
  return candidates;
};

const normalizedMatchText = value => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

const profileLinkKind = value => {
  const url = safePdfUrl(value);
  if (!url) return "";
  const parsed = new URL(url);
  if (parsed.protocol === "mailto:") return "email";
  if (parsed.hostname.replace(/^www\./, "") === "linkedin.com") return "linkedin";
  if (parsed.hostname.replace(/^www\./, "") === "github.com" && parsed.pathname.split("/").filter(Boolean).length <= 1) {
    return "github-profile";
  }
  return "";
};

export const enrichResumeLinks = (resume, sourceLinks = [], sourceText = "") => {
  const projects = Array.isArray(resume?.projects)
    ? resume.projects.map(project => ({ ...project, links: normalizeLinks(project?.links) }))
    : [];
  const profileLinks = normalizeLinks(resume?.profile_links);
  const existingUrls = new Set([
    ...profileLinks.map(link => link.url),
    ...projects.flatMap(project => project.links.map(link => link.url))
  ]);
  const annotationLinks = Array.isArray(sourceLinks) ? sourceLinks : [];
  const suppliedProfileKinds = new Set([
    ...profileLinks.map(link => profileLinkKind(link.url)),
    ...annotationLinks.map(link => profileLinkKind(link?.url))
  ].filter(Boolean));
  const recoveredVisibleLinks = visibleLinksFromText(sourceText).filter(link => {
    const kind = profileLinkKind(link.url);
    return !kind || !suppliedProfileKinds.has(kind);
  });
  const verifiedSourceLinks = [...annotationLinks, ...recoveredVisibleLinks];

  verifiedSourceLinks.forEach(link => {
    const url = safePdfUrl(link?.url);
    if (!url || existingUrls.has(url)) return;
    existingUrls.add(url);
    const outputLink = {
      label: canonicalLinkLabel(url, link?.label, link?.context),
      url
    };
    const matchSource = normalizedMatchText(`${link?.context || ""} ${url}`);
    const project = projects.find(item => {
      const title = normalizedMatchText(item?.title);
      return title.length >= 4 && matchSource.includes(title);
    });
    if (project) project.links.push(outputLink);
    else profileLinks.push(outputLink);
  });

  return { ...resume, profile_links: profileLinks, projects };
};

const coverLayoutPresets = [
  { bodySize: 12, leading: 6.35, paragraphGap: 5.2 },
  { bodySize: 11.5, leading: 6, paragraphGap: 4.6 },
  { bodySize: 11, leading: 5.65, paragraphGap: 4 }
];

export const buildCoverLetterPDF = async (coverLetterText, resumeName = "User", jobTitle = "Job") => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  await registerFonts(doc);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = { top: 23, right: 23, bottom: 22, left: 23 };
  const contentWidth = pageWidth - margin.left - margin.right;
  const bottomEdge = pageHeight - margin.bottom;
  const paragraphs = String(coverLetterText || "")
    .replace(/\r/g, "")
    .split(/\n\s*\n/)
    .map(block => block.split("\n").map(normalizeText).filter(Boolean))
    .filter(block => block.length > 0);
  const headerLines = paragraphs[0] || [normalizeText(resumeName || "Applicant")];
  const companyLines = paragraphs[1] || [];
  const salutationLines = paragraphs[2] || ["Dear Hiring Team,"];
  const closingLines = paragraphs.length > 3 ? paragraphs[paragraphs.length - 1] : [];
  const bodyParagraphs = paragraphs.length > 4 ? paragraphs.slice(3, -1) : paragraphs.slice(3);
  const subject = normalizeText(jobTitle && jobTitle !== "Job" ? `Re: Application for ${jobTitle}` : "Application");

  const splitLines = (textLines, width, style, size) => {
    doc.setFont("OpenSans", style);
    doc.setFontSize(size);
    return textLines.flatMap(line => doc.splitTextToSize(line, width));
  };

  const estimateHeight = preset => {
    const nameHeight = splitLines([headerLines[0]], contentWidth, "bold", 15).length * 7;
    const contactHeight = splitLines(headerLines.slice(1), contentWidth, "normal", 10.5).length * 5;
    const companyHeight = splitLines(companyLines, contentWidth, "normal", preset.bodySize).length * preset.leading;
    const subjectHeight = splitLines([subject], contentWidth, "bold", preset.bodySize).length * preset.leading;
    const salutationHeight = splitLines(salutationLines, contentWidth, "normal", preset.bodySize).length * preset.leading;
    const bodyHeight = bodyParagraphs.reduce((height, block) =>
      height + splitLines(block, contentWidth, "normal", preset.bodySize).length * preset.leading + preset.paragraphGap, 0);
    const closingHeight = splitLines(closingLines, contentWidth, "normal", preset.bodySize).length * preset.leading;
    return nameHeight + contactHeight + companyHeight + subjectHeight + salutationHeight + bodyHeight + closingHeight + 29;
  };

  const preset = coverLayoutPresets.find(candidate => estimateHeight(candidate) <= bottomEdge - margin.top)
    || coverLayoutPresets[coverLayoutPresets.length - 1];
  let y = margin.top;

  const ensureSpace = height => {
    if (y + height <= bottomEdge) return;
    doc.addPage();
    y = margin.top;
  };

  const writeBlock = (textLines, { style = "normal", size = preset.bodySize, leading = preset.leading, gap = 0 } = {}) => {
    const lines = splitLines(textLines, contentWidth, style, size);
    ensureSpace(Math.min(lines.length * leading, bottomEdge - margin.top));
    doc.setFont("OpenSans", style);
    doc.setFontSize(size);
    doc.setTextColor(0, 0, 0);
    lines.forEach(line => {
      ensureSpace(leading);
      doc.text(line, margin.left, y);
      y += leading;
    });
    y += gap;
  };

  writeBlock([headerLines[0]], { style: "bold", size: 15, leading: 7, gap: 0.5 });
  if (headerLines.length > 1) writeBlock(headerLines.slice(1), { size: 10.5, leading: 5, gap: 6 });
  else y += 6;
  if (companyLines.length) writeBlock(companyLines, { gap: 5 });
  writeBlock([subject], { style: "bold", gap: 6 });
  writeBlock(salutationLines, { gap: 5 });
  bodyParagraphs.forEach(block => writeBlock(block, { gap: preset.paragraphGap }));
  if (closingLines.length) writeBlock(closingLines);

  return doc;
};

export const generateCoverLetterPDF = async (coverLetterText, resumeName = "User", jobTitle = "Job") => {
  const doc = await buildCoverLetterPDF(coverLetterText, resumeName, jobTitle);
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

  const linkedText = (text, url, x, baseline, { align = "left", underline = true } = {}) => {
    const label = normalizeText(text);
    const safeUrl = safePdfUrl(url);
    const width = doc.getTextWidth(label);
    const startX = align === "right" ? x - width : align === "center" ? x - width / 2 : x;
    doc.text(label, x, baseline, { align });
    if (safeUrl) {
      doc.link(startX, baseline - 3.5, width, 4.6, { url: safeUrl });
      if (underline) {
        doc.setDrawColor(75, 75, 75);
        doc.setLineWidth(0.15);
        doc.line(startX, baseline + 0.6, startX + width, baseline + 0.6);
      }
    }
    return width;
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
    const rightLinks = normalizeLinks(rightText);
    const right = rightLinks.length
      ? rightLinks.map(link => link.label).join(" | ")
      : normalizeText(rightText);
    setFont(linkStyle ? "bold" : "bold", bodySize);
    const rightWidth = right ? Math.min(doc.getTextWidth(right), contentWidth * 0.37) : 0;
    const gap = right ? 5 : 0;
    const leftWidth = contentWidth - rightWidth - gap;
    const leftLines = getLines(left, leftWidth, "bold");
    const rightLines = rightLinks.length
      ? [right]
      : right ? getLines(right, Math.max(rightWidth, contentWidth * 0.25), linkStyle ? "italic" : "normal") : [];
    const lineCount = Math.max(leftLines.length, rightLines.length, 1);
    ensureSpace(lineCount * bodyLeading + 1);

    leftLines.forEach((line, index) => {
      setFont("bold");
      doc.text(line, margin.left, y + index * bodyLeading);
    });
    rightLines.forEach((line, index) => {
      setFont(linkStyle ? "italic" : "normal", right ? 9 : bodySize, 55);
      if (rightLinks.length && index === 0) {
        const separator = " | ";
        const separatorWidth = doc.getTextWidth(separator);
        const totalWidth = rightLinks.reduce((total, link) => total + doc.getTextWidth(link.label), 0) +
          separatorWidth * Math.max(rightLinks.length - 1, 0);
        let linkX = pageWidth - margin.right - totalWidth;
        rightLinks.forEach((link, linkIndex) => {
          const width = linkedText(link.label, link.url, linkX, y + index * bodyLeading);
          linkX += width;
          if (linkIndex < rightLinks.length - 1) {
            doc.text(separator, linkX, y + index * bodyLeading);
            linkX += separatorWidth;
          }
        });
      } else {
        doc.text(line, pageWidth - margin.right, y + index * bodyLeading, { align: "right" });
        const legacyUrl = safePdfUrl(right);
        if (legacyUrl) doc.link(pageWidth - margin.right - doc.getTextWidth(line), y - 3.5, doc.getTextWidth(line), 4.6, { url: legacyUrl });
      }
    });
    y += lineCount * bodyLeading + 0.7;
  };

  const estimateEntryHeight = (leftText, rightText, highlights = []) => {
    setFont("bold");
    const rightValue = Array.isArray(rightText)
      ? normalizeLinks(rightText).map(link => link.label).join(" | ")
      : normalizeText(rightText);
    const rightWidth = rightValue ? Math.min(doc.getTextWidth(rightValue), contentWidth * 0.37) : 0;
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
  const profileLinks = normalizeLinks(resume?.profile_links);
  const mailLink = profileLinks.find(link => link.url.toLowerCase().startsWith("mailto:"));
  if (contact.length > 0) {
    setFont("normal", 9.2, 55);
    const separator = "  |  ";
    const separatorWidth = doc.getTextWidth(separator);
    const totalWidth = contact.reduce((total, item) => total + doc.getTextWidth(item), 0) +
      separatorWidth * Math.max(contact.length - 1, 0);
    let contactX = Math.max(margin.left, (pageWidth - totalWidth) / 2);
    contact.forEach((item, index) => {
      const isEmail = normalizeText(resume?.email) === item;
      const target = isEmail ? (mailLink?.url || `mailto:${item}`) : "";
      let width;
      if (target) width = linkedText(item, target, contactX, y);
      else {
        doc.text(item, contactX, y);
        width = doc.getTextWidth(item);
      }
      contactX += width;
      if (index < contact.length - 1) {
        doc.text(separator, contactX, y);
        contactX += separatorWidth;
      }
    });
    y += 4.8;
  }

  const visibleProfileLinks = profileLinks.filter(link => !link.url.toLowerCase().startsWith("mailto:"));
  if (visibleProfileLinks.length > 0) {
    setFont("normal", 9, 45);
    const separator = "  |  ";
    const separatorWidth = doc.getTextWidth(separator);
    const totalWidth = visibleProfileLinks.reduce((total, link) => total + doc.getTextWidth(link.label), 0) +
      separatorWidth * Math.max(visibleProfileLinks.length - 1, 0);
    let profileX = Math.max(margin.left, (pageWidth - totalWidth) / 2);
    visibleProfileLinks.forEach((link, index) => {
      profileX += linkedText(link.label, link.url, profileX, y);
      if (index < visibleProfileLinks.length - 1) {
        doc.text(separator, profileX, y);
        profileX += separatorWidth;
      }
    });
    y += 4.6;
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

export const generateResumeLetterPDF = async (resume, sourceLinks = [], sourceText = "") => {
  if (!resume) return;
  const linkedResume = enrichResumeLinks(resume, sourceLinks, sourceText);
  const doc = await buildResumePDF(linkedResume);
  const safeName = normalizeText(linkedResume.name || "Tailored_Resume")
    .replace(/[^a-zA-Z0-9_-]+/g, "_");
  doc.save(`${safeName}_tailored_resume.pdf`);
};
