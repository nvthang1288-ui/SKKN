import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { InitiativeData } from "../types";

const getAIClient = (customApiKey?: string) => {
  return new GoogleGenAI({ apiKey: customApiKey || process.env.GEMINI_API_KEY });
};

export const suggestSolutions = async (title: string, field: string, customApiKey?: string, modelName: string = "gemini-3.1-pro-preview") => {
  const ai = getAIClient(customApiKey);
  const model = modelName;
  const prompt = `
    Dựa trên tên sáng kiến: "${title}" thuộc lĩnh vực "${field}", hãy đề xuất 10 giải pháp mới, có tính ứng dụng cao, thực tế và mang tính sư phạm.
    Mỗi giải pháp chỉ cần một tiêu đề ngắn gọn (khoảng 10-20 từ).
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  let text = response.text;
  if (text.startsWith("```json")) {
    text = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");
  } else if (text.startsWith("```")) {
    text = text.replace(/^```\n?/, "").replace(/\n?```$/, "");
  }

  return JSON.parse(text.trim());
};

export const generateInitiativeContent = async (data: InitiativeData, selectedSolutions: string[], customApiKey?: string, modelName: string = "gemini-3.1-pro-preview") => {
  const ai = getAIClient(customApiKey);
  const model = modelName;
  
  const prompt = `
    Bạn là một chuyên gia tư vấn giáo dục và hành chính tại Việt Nam, chuyên viết Sáng kiến kinh nghiệm (SKKN) cho giáo viên và cán bộ công chức.
    Hãy viết nội dung chi tiết cho một bản Sáng kiến kinh nghiệm với tiêu đề: "${data.title}".
    
    Thông tin tác giả:
    - Họ tên: ${data.author.name}
    - Đơn vị công tác: ${data.author.workplace}
    - Chức danh: ${data.author.position}
    - Trình độ chuyên môn: ${data.author.qualification}
    - Lĩnh vực áp dụng: ${data.field}
    
    Các giải pháp đã lựa chọn để triển khai:
    ${selectedSolutions.map((s, i) => `${i + 1}. ${s}`).join("\n")}

    Yêu cầu:
    1. Ngôn ngữ: Trang trọng nhưng gần gũi, dễ hiểu, mang tính sư phạm cao, không dùng thuật ngữ nước ngoài khó hiểu.
    2. Độ dài: Mục tiêu là viết nội dung đủ dài và chi tiết để khi xuất ra file Word sẽ đạt khoảng ${data.desiredPages || 15} trang (tương đương khoảng ${(data.desiredPages || 15) * 450} từ).
       ĐỂ ĐẠT ĐƯỢC ĐỘ DÀI NÀY:
       - Phần "Mô tả giải pháp sau khi có sáng kiến" phải ĐẶC BIỆT CHI TIẾT. Khai triển từng bước nhỏ, giải thích cặn kẽ cách làm, đưa ra nhiều ví dụ minh họa, tình huống thực tế, đoạn hội thoại hoặc trích dẫn (nếu có).
       - Phần "Hiệu quả đạt được" của từng giải pháp phải có số liệu chi tiết, phân tích phần trăm, so sánh trước và sau rõ ràng.
    3. Cấu trúc: Phải bám sát các mục sau:
       - Sự cần thiết: Phân tích thực trạng giáo dục hiện nay, những khó khăn thực tế tại trường, tại lớp một cách tỉ mỉ.
       - Mục đích: Nêu rõ mục tiêu cụ thể đối với học sinh, giáo viên và chất lượng giáo dục.
       - Phạm vi triển khai: Đối tượng học sinh, thời gian áp dụng, địa bàn.
       - Giải pháp trước khi có sáng kiến (Ít nhất 2-3 giải pháp): Mô tả chi tiết cách làm cũ, ưu điểm, hạn chế và nguyên nhân hạn chế.
       - Giải pháp sau khi có sáng kiến (Dựa trên các giải pháp đã chọn ở trên): 
         * Mỗi giải pháp phải được khai triển cực kỳ chi tiết (độ dài gấp 4 lần bình thường).
         * Biện pháp thực hiện: Chia nhỏ thành các bước (Bước 1, Bước 2, Bước 3...). Trong mỗi bước, hãy mô tả cách làm cụ thể, ví dụ thực tế.
         * ĐẶC BIỆT: Đề xuất minh chứng cụ thể SONG SONG với các bước thực hiện. Minh chứng phải được viết in đậm, kiểu chữ nghiêng và đặt trong dấu ngoặc đơn ngay sau bước thực hiện đó. Ví dụ: "Bước 1: Thiết kế phiếu học tập... ***(Minh chứng: Bộ phiếu học tập số 1, số 2...)***".
         * Hiệu quả đạt được: Tập trung vào sự tiến bộ vượt bậc của học sinh về kiến thức, kỹ năng và thái độ.
       - Các điều kiện cần thiết để áp dụng: Cơ sở vật chất, sự phối hợp giữa các bên.
       - Đánh giá lợi ích: Phải gắn liền với hoạt động giáo dục trong nhà trường. Hiệu quả xã hội cần nhấn mạnh sự thay đổi về thái độ, kỹ năng và kết quả học tập của học sinh.
       - Bảng số liệu so sánh: Tạo bảng so sánh các tiêu chí (như tỷ lệ học sinh khá giỏi, mức độ hứng thú, kỹ năng thực hành...) trước và sau khi thực hiện sáng kiến.
    
    Hãy tạo nội dung cực kỳ phong phú, thực tế, có số liệu minh họa giả định hợp lý và có chiều sâu chuyên môn sư phạm.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      maxOutputTokens: 16384,
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          necessity: { type: Type.STRING },
          purpose: { type: Type.STRING },
          scope: { type: Type.STRING },
          solutionsBefore: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                content: { type: Type.STRING },
                pros: { type: Type.STRING },
                cons: { type: Type.STRING },
                causes: { type: Type.STRING },
              },
              required: ["name", "content", "pros", "cons", "causes"]
            }
          },
          solutionsAfter: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                novelty: { type: Type.STRING },
                implementation: { type: Type.STRING },
                results: { type: Type.STRING },
              },
              required: ["name", "novelty", "implementation", "results"]
            }
          },
          confidentiality: { type: Type.STRING },
          conditions: { type: Type.STRING },
          economicBenefit: { type: Type.STRING },
          socialBenefit: { type: Type.STRING },
          externalEvaluation: { type: Type.STRING },
          comparisonTable: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                criteria: { type: Type.STRING },
                before: { type: Type.STRING },
                after: { type: Type.STRING },
                note: { type: Type.STRING },
              },
              required: ["criteria", "before", "after", "note"]
            }
          }
        },
        required: [
          "necessity", "purpose", "scope", "solutionsBefore", "solutionsAfter", 
          "confidentiality", "conditions", "economicBenefit", "socialBenefit", "externalEvaluation", "comparisonTable"
        ]
      },
    },
  });

  let text = response.text;
  
  // Clean up the response text in case the model wraps it in markdown code blocks
  if (text.startsWith("```json")) {
    text = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");
  } else if (text.startsWith("```")) {
    text = text.replace(/^```\n?/, "").replace(/\n?```$/, "");
  }

  try {
    return JSON.parse(text.trim());
  } catch (e) {
    console.error("Original JSON Text:", text);
    
    // If it's a truncation error, try a very basic fix by closing brackets
    // This is a last resort and might not work for complex structures
    if (e instanceof Error && e.message.includes("Unterminated string")) {
      // Try to find the last open quote and close it, then close all open brackets
      let fixedText = text.trim();
      if (fixedText.lastIndexOf('"') > fixedText.lastIndexOf(':')) {
        fixedText += '"';
      }
      
      // Count open vs closed brackets
      const openBraces = (fixedText.match(/\{/g) || []).length;
      const closedBraces = (fixedText.match(/\}/g) || []).length;
      const openBrackets = (fixedText.match(/\[/g) || []).length;
      const closedBrackets = (fixedText.match(/\]/g) || []).length;
      
      for (let i = 0; i < openBrackets - closedBrackets; i++) fixedText += ']';
      for (let i = 0; i < openBraces - closedBraces; i++) fixedText += '}';
      
      try {
        return JSON.parse(fixedText);
      } catch (innerError) {
        throw e; // Throw original error if fix fails
      }
    }
    throw e;
  }
};
