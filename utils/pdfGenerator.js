
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