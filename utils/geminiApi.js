
export const callGemini = async (resumeText, jobData) => {
  const newResume = (resumeText || "").toString();
  const newTitle = (jobData.title || "").toString();
  const newCompany = (jobData.company || "").toString();
  const newDescription = (jobData.description || "").toString();

  const inValidPage = !newDescription || newDescription === 'Unknown Job description' || newCompany === 'Unknown Company' || newTitle === 'Unknown Job title';

  if (inValidPage) {
    throw new Error('No Job Found on this page');
  }

  const prompt = `
        You are an expert Career Coach and ATS (Applicant Tracking System) Specialist.
        Your goal is to analyze a resume against a job description and generate a highly tailored cover letter.

        RESUME: "${newResume.substring(0, 3000)}"
        JOB TITLE: "${newTitle.substring(0, 100)}"
        JOB COMPANY: "${newCompany.substring(0, 100)}"
        JOB DESCRIPTION: "${newDescription.substring(0, 3000)}"
        
        ### INSTRUCTIONS:
        TASK 1: **Analyze Fit:** meaningful comparison of the resume skills vs job requirements.
        TASK 2: **Identify Gaps:** Find keywords in the job description that are MISSING from the resume.
        TASK 3: **Write Cover Letter:** 
        - Tone: Professional, enthusiastic, yet grounded.
        - Content: Connect specific past achievements (from Resume) to specific requirements (from Job Description).
        - **CRITICAL:** Do NOT invent experiences. Only use facts present in the resume.

        ### OUTPUT FORMAT:
        You must output a SINGLE valid JSON object. Do not include any thinking, preambles, or markdown formatting (like \`\`\`json). Just the raw JSON string.

        JSON STRUCTURE:
        {
          "score": number (0-100 integer),
          "reason": "A concise, objective summary of the match.",
          "missing_keywords": ["skill_1", "skill_2", "skill_3"],
          "cover_letter": "The full cover letter text here. Use \\n for line breaks. Do not include placeholders like '[Your Name]'."
        }
        
        COVER LETTER GENERATION RULES:
        You must generate a professional, highly tailored cover letter. 
        CRITICAL: You must output STRICTLY as plain text. Do NOT use markdown, asterisks (*), bolding, or hash symbols (#). 
        You MUST follow this exact structure and spacing:

        [Extract Applicant Name from Resume]
        [Extract Applicant Phone from Resume]
        [Extract Applicant Email from Resume]
        
        [Extract Company Name from Job Description]
        
        Dear Hiring Team,
        
        [Paragraph 1: 2-3 sentences. State the exact job title being applied for. Hook the reader with a strong opening statement about why the applicant's background makes them a perfect fit.]
        
        [Paragraph 2: 3-4 sentences. Connect 1 or 2 specific achievements or projects from the provided resume directly to the core requirements in the job description. Focus on value and impact.]
        
        [Paragraph 3: 2 sentences. Reiterate enthusiasm for the company and include a professional call to action requesting an interview.]
        
        Sincerely,
        
        [Extract Applicant Name from Resume]`;

  const API_URL = `https://openrouter.ai/api/v1/chat/completions`;

  const modelsToTry = [
    "openai/gpt-oss-120b:free", 
    "nvidia/nemotron-3-super-120b-a12b:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "google/gemma-4-31b-it:free",
    "cognitivecomputations/dolphin-mistral-24b-venice-edition:free"
  ]

  for(let i=0; i<modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];
    console.log(`Attempting with model ${currentModel}`);
    try{
      const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`
      },
      body: JSON.stringify({
        model: currentModel,
        messages: [
          { role: "system", content: "You are a helpful JSON-only API." },
          { role: "user", content: prompt }
        ],
      temperature: 0.7,
      response_format: { type: "json_object" }
      })
    })

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      let resultData = data.choices[0].message.content;
      resultData = resultData.replace(/```json|```/g, "").trim();

      const parsedJSON = JSON.parse(resultData);
      console.log(`Success using model: ${currentModel}`);
      return parsedJSON;
    } catch (err) {
      console.warn(`Model ${currentModel} failed: ${err.message}`);
      if(i === modelsToTry.length - 1) {
        throw new Error("All models are busy currently. Please try again later")
      }
    }
  }
}