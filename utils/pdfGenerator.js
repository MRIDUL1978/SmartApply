
export const generateCoverLetterPDF = async (coverLetterText, resumeName = "User", jobTitle = "Job") => {

  const { jsPDF } = await import('jspdf');
  
  const doc = new jsPDF();

  doc.setFont("times", "normal");
  doc.setFontSize(12);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  let sanitizedLetter = coverLetterText
    .replace(/[\u2018\u2019]/g, "'") 
    .replace(/[\u201C\u201D]/g, '"') 
    .replace(/[\u2013\u2014]/g, "-")  
    .replace(/\u2026/g, "...")       
    .replace(/[^\x00-\x7F]/g, "")    
    .replace(/  +/g, ' ');           

  const textLines = doc.splitTextToSize(sanitizedLetter, contentWidth);

  let cursorY = margin + 5;
  const lineHeight = 7;

  textLines.forEach(line => {
    if(cursorY > pageHeight - margin) {
      doc.addPage();
      cursorY = margin + 5;
    }
    doc.text(line, margin, cursorY);
    cursorY += lineHeight;
  });

  const cleanJobTitle = jobTitle.replace(/\s+/g, '_');
  doc.save(`${resumeName}_${cleanJobTitle}_cover_letter.pdf`);
};

export const generateResumeLetterPDF = async (resume) => {
  const {jsPDF} = await import('jspdf')

  if (!resume) return;

  // Initialize standard A4 PDF (Portrait, Millimeters)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxLineWidth = pageWidth - margin * 2;
  let yPos = 20; // Starting Y coordinate

  // --- Helper: Auto Page Break ---
  const checkPageBreak = (heightRequired = 10) => {
    if (yPos + heightRequired > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      yPos = margin;
    }
  };

  // --- Helper: Draw Section Headers ---
  const drawSectionHeader = (title) => {
    checkPageBreak(15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(title.toUpperCase(), margin, yPos);
    yPos += 2;
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos); // Horizontal line
    yPos += 6;
  };

  // 1. Header (Name & Contact)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  const nameWidth = doc.getTextWidth(resume.name || '');
  doc.text(resume.name || '', (pageWidth - nameWidth) / 2, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const contactInfo = [resume.email, resume.phone, resume.location].filter(Boolean).join('  |  ');
  const contactWidth = doc.getTextWidth(contactInfo);
  doc.text(contactInfo, (pageWidth - contactWidth) / 2, yPos);
  yPos += 12;
  doc.setTextColor(0, 0, 0); // Reset to black

  // 2. Summary
  if (resume.summary) {
    drawSectionHeader('Professional Summary');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(resume.summary, maxLineWidth);
    checkPageBreak(lines.length * 5);
    doc.text(lines, margin, yPos);
    yPos += (lines.length * 5) + 6;
  }

  // 3. Skills
  if (resume.skills && resume.skills.length > 0) {
    drawSectionHeader('Skills');
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(resume.skills.join(', '), maxLineWidth);
    checkPageBreak(lines.length * 5);
    doc.text(lines, margin, yPos);
    yPos += (lines.length * 5) + 6;
  }

  // 4. Experience
  if (resume.experience && resume.experience.length > 0) {
    drawSectionHeader('Experience');
    resume.experience.forEach(exp => {
      checkPageBreak(12);
      
      // Role & Company (Left)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`${exp.role} - ${exp.company}`, margin, yPos);
      
      // Dates (Right Aligned)
      doc.setFont('helvetica', 'normal');
      const dateWidth = doc.getTextWidth(exp.dates || '');
      doc.text(exp.dates || '', pageWidth - margin - dateWidth, yPos);
      yPos += 5;

      // Bullet points
      if (exp.highlights) {
        exp.highlights.forEach(highlight => {
          const lines = doc.splitTextToSize(`• ${highlight}`, maxLineWidth - 5);
          checkPageBreak(lines.length * 5);
          doc.text(lines, margin + 5, yPos);
          yPos += (lines.length * 5);
        });
      }
      yPos += 4;
    });
  }

  // 5. Education
  if (resume.education && resume.education.length > 0) {
    drawSectionHeader('Education');
    resume.education.forEach(edu => {
      checkPageBreak(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${edu.degree} - ${edu.school}`, margin, yPos);
      
      doc.setFont('helvetica', 'normal');
      const dateWidth = doc.getTextWidth(edu.dates || '');
      doc.text(edu.dates || '', pageWidth - margin - dateWidth, yPos);
      yPos += 5;

      if (edu.details) {
        const lines = doc.splitTextToSize(edu.details, maxLineWidth);
        checkPageBreak(lines.length * 5);
        doc.text(lines, margin, yPos);
        yPos += (lines.length * 5);
      }
      yPos += 4;
    });
  }

  // 6. Certifications
  if (resume.certifications && resume.certifications.length > 0) {
    drawSectionHeader('Certifications');
    doc.setFont('helvetica', 'normal');
    resume.certifications.forEach(cert => {
      const lines = doc.splitTextToSize(`• ${cert}`, maxLineWidth - 5);
      checkPageBreak(lines.length * 5);
      doc.text(lines, margin + 5, yPos);
      yPos += (lines.length * 5);
    });
  }

  // Trigger File Download
  const safeName = (resume.name || 'Tailored_Resume').replace(/\s+/g, '_');
  doc.save(`${safeName}.pdf`);
}