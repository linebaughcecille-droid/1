
import { GoogleGenAI } from "@google/genai";
import { GenerationConfig, FamilyType } from "../types";

export interface InputImage {
  data: string;
  mimeType: string;
}

export const generateLifestyleImage = async (
  images: InputImage[],
  config: GenerationConfig,
  baseImage?: string, // Optional base image for refinement
  templateImage?: InputImage // Optional A+ template for style guidance
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `你是一名世界级的亚马逊商业摄影师和品牌视觉专家。
你的任务是将产品完美融入生活场景，特别是为亚马逊 A+ 详情页创作高质量的素材。
你非常擅长捕捉不同品牌模版的视觉语言（如构图平衡、留白区域、色调一致性）。`;

  const humanInstruction = config.family === FamilyType.NONE
    ? "场景中不包含任何人物。重点通过环境中的软装、光影和深度感来展示产品的品质感。"
    : `- 人物元素：${config.family}。他们应自然地出现在场景中，穿着和气质需符合欧美中产家庭的审美，风格休闲且高级。`;

  const templateGuidance = templateImage 
    ? "【核心要求：参考 A+ 模版风格】请观察提供的 A+ 模版参考图，确保生成的图片在构图、背景留白位置、光影对比度以及整体色调上与模版保持高度统一，使其能够完美嵌入该详情页模块。" 
    : "";

  let prompt = "";
  if (baseImage) {
    prompt = `【指令：修改并精修图像】
基于提供的这张已生成的图像进行微调。
保持图中产品（帐篷/凉亭）的核心结构、颜色和细节不变。
环境场景：${config.scene}
人物设定：${config.family === FamilyType.NONE ? '移除所有人物' : config.family}
微调建议：${config.additionalPrompt || '无'}
输出比例：${config.aspectRatio}
${templateGuidance}
请直接生成优化后的最终结果图。`;
  } else {
    prompt = `【指令：创作 Amazon A+ 生活场景图】
请结合上传的产品图（白底图）和（可选的）模版参考，生成一张具有强烈代入感的实拍风格照片。

1. 场景设定：${config.scene}（地道的欧美风格环境）。
2. 人物要求：${humanInstruction}
3. 比例要求：${config.aspectRatio}。
4. 艺术风格：高端商业广告级别，强调自然光影（如林间撒落的阳光或室内温馨的暖色光），画面锐利，细节丰富。
5. 产品融合：帐篷/凉亭必须作为画面的主体之一，结构必须准确，阴影和反光需与环境完美匹配。
${templateGuidance}
6. 额外要求：${config.additionalPrompt || '无'}

注意：严禁改变产品的核心外观特征。请直接输出生成的图像。`;
  }

  const parts: any[] = images.map(img => ({
    inlineData: {
      data: img.data.split(',')[1] || img.data,
      mimeType: img.mimeType,
    },
  }));

  if (baseImage) {
    parts.push({
      inlineData: {
        data: baseImage.split(',')[1] || baseImage,
        mimeType: 'image/png',
      }
    });
  }

  if (templateImage) {
    parts.push({
      inlineData: {
        data: templateImage.data.split(',')[1] || templateImage.data,
        mimeType: templateImage.mimeType,
      }
    });
  }

  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts,
      },
      config: {
        systemInstruction,
        imageConfig: {
          aspectRatio: config.aspectRatio as any,
        }
      }
    });

    let imageUrl = '';
    
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("AI 拒绝了生成请求，可能触及了安全过滤策略。请尝试更换场景或简化描述。");
    }

    const candidate = response.candidates[0];
    if (candidate.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      const textResponse = response.text;
      if (textResponse) {
        throw new Error(`AI 未能生成图片。反馈：${textResponse.substring(0, 100)}...`);
      }
      throw new Error("未检测到生成的图像数据，请检查输入或重试。");
    }

    return imageUrl;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("Safety")) {
      throw new Error("请求因内容安全原因被拦截，建议避免敏感词汇或过于复杂的场景。");
    }
    throw error;
  }
};
