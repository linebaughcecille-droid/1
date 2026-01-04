
import React, { useState, useEffect } from 'react';
import { SceneType, FamilyType, OutputAspectRatio, GenerationConfig, GeneratedImage } from './types';
import { generateLifestyleImage, InputImage } from './services/geminiService';

interface FilePreview {
  id: string;
  file: File;
  preview: string;
}

const App: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);
  const [aplusTemplate, setAplusTemplate] = useState<FilePreview | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [batchSize, setBatchSize] = useState<number>(3);
  const [generatingProgress, setGeneratingProgress] = useState<{current: number, total: number} | null>(null);

  const [config, setConfig] = useState<GenerationConfig>({
    scene: SceneType.LAWN,
    family: FamilyType.CAUCASIAN_FOUR,
    aspectRatio: OutputAspectRatio.SQUARE,
    additionalPrompt: '',
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomImageUrl(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isTemplate: boolean = false) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const previewObj = { id: Math.random().toString(36).substr(2, 9), file, preview: reader.result as string };
        if (isTemplate) {
          setAplusTemplate(previewObj);
        } else {
          setSelectedFiles(prev => [...prev, previewObj]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  const removeTemplate = () => {
    setAplusTemplate(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerate = async (refine: boolean = false) => {
    if (selectedFiles.length === 0) {
      setError("请至少上传一张产品照片。");
      return;
    }

    setIsGenerating(true);
    setError(null);
    const count = refine ? 1 : batchSize;
    setGeneratingProgress({ current: 0, total: count });

    try {
      const inputImages: InputImage[] = await Promise.all(
        selectedFiles.map(async (fp) => ({
          data: await fileToBase64(fp.file),
          mimeType: fp.file.type
        }))
      );

      let templateImage: InputImage | undefined;
      if (aplusTemplate) {
        templateImage = {
          data: await fileToBase64(aplusTemplate.file),
          mimeType: aplusTemplate.file.type
        };
      }

      const baseImageUrl = refine && generatedImages.length > 0 ? generatedImages[0].url : undefined;
      
      const generationTasks = Array.from({ length: count }).map(async (_, index) => {
        const resultUrl = await generateLifestyleImage(inputImages, config, baseImageUrl, templateImage);
        setGeneratingProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null);
        return {
          id: Math.random().toString(36).substr(2, 9),
          url: resultUrl,
          prompt: `${config.scene} - ${config.family}`,
          timestamp: Date.now() + index,
          aspectRatio: config.aspectRatio,
        };
      });

      const newImages = await Promise.all(generationTasks);
      setGeneratedImages(prev => [...newImages.reverse(), ...prev]);
    } catch (err: any) {
      setError(err.message || "生成失败，请重试。");
    } finally {
      setIsGenerating(false);
      setGeneratingProgress(null);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const promoteToMain = (img: GeneratedImage) => {
    setGeneratedImages([img, ...generatedImages.filter(i => i.id !== img.id)]);
  };

  const hasResults = generatedImages.length > 0;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Zoom Modal */}
      {zoomImageUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-200"
          onClick={() => setZoomImageUrl(null)}
        >
          <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm"></div>
          <button 
            className="absolute top-6 right-6 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all"
            onClick={() => setZoomImageUrl(null)}
          >
            <i className="fas fa-times text-xl"></i>
          </button>
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <img 
              src={zoomImageUrl} 
              alt="Zoomed" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl ring-1 ring-white/20 animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-500 p-2.5 rounded-xl shadow-lg shadow-orange-100">
              <i className="fas fa-camera-retro text-white text-xl"></i>
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Amazon 千帆AI作图</h1>
          </div>
          <div className="text-xs text-slate-400 font-medium hidden sm:block bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            赋能跨境电商·A+页面视觉工坊
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          {/* Section 1: Product Photos */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <i className="fas fa-box-open mr-2 text-blue-500"></i>
              1. 上传产品照片
            </h2>
            <div className="space-y-4">
              <div className="relative group border-2 border-dashed border-slate-200 rounded-2xl p-6 transition-all hover:border-blue-400 hover:bg-blue-50/30">
                <input type="file" accept="image/*" multiple onChange={(e) => handleFileChange(e, false)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-2 text-slate-300 group-hover:text-blue-500 transition-colors">
                    <i className="fas fa-plus"></i>
                  </div>
                  <p className="text-slate-600 font-bold text-sm">添加产品白底图</p>
                </div>
              </div>
              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                  {selectedFiles.map((file) => (
                    <div key={file.id} className="relative aspect-square rounded-lg overflow-hidden border border-slate-100 bg-white group shadow-sm">
                      <img src={file.preview} alt="Preview" className="w-full h-full object-contain" />
                      <button onClick={() => removeFile(file.id)} className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <i className="fas fa-times text-[8px]"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Section 2: A+ Template (New) */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 border-l-4 border-l-amber-400">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <i className="fas fa-th-large mr-2 text-amber-500"></i>
              2. (可选) 上传A+页面模版
            </h2>
            <p className="text-xs text-slate-500 mb-4">AI将学习模版的构图、色调与留白，使生成图完美适配您的详情页布局。</p>
            <div className="space-y-4">
              {!aplusTemplate ? (
                <div className="relative group border-2 border-dashed border-slate-200 rounded-2xl p-6 transition-all hover:border-amber-400 hover:bg-amber-50/30">
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, true)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="flex flex-col items-center justify-center py-2 text-center">
                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-2 text-slate-300 group-hover:text-amber-500 transition-colors">
                      <i className="fas fa-layer-group"></i>
                    </div>
                    <p className="text-slate-600 font-bold text-sm">上传排版模版</p>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-amber-200 bg-amber-50/20 p-2 group shadow-sm">
                  <div className="aspect-video rounded-lg overflow-hidden bg-white border border-slate-100 relative">
                    <img src={aplusTemplate.preview} alt="Template" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-xs font-bold">已启用 A+ 风格引导</p>
                    </div>
                  </div>
                  <button onClick={removeTemplate} className="absolute top-4 right-4 bg-slate-800 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-lg hover:bg-red-500 transition-colors">
                    <i className="fas fa-trash-alt text-xs"></i>
                  </button>
                  <div className="mt-2 text-[10px] text-amber-700 font-bold flex items-center">
                    <i className="fas fa-check-circle mr-1"></i> 已关联 A+ 模版
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Configuration */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <i className="fas fa-cog mr-2 text-indigo-500"></i>
              3. 配置生成要求
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">输出比例</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {Object.values(OutputAspectRatio).map(ratio => (
                    <button
                      key={ratio}
                      onClick={() => setConfig({...config, aspectRatio: ratio})}
                      className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${config.aspectRatio === ratio ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">环境场景</label>
                  <select value={config.scene} onChange={(e) => setConfig({...config, scene: e.target.value as SceneType})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 text-sm font-medium bg-white">
                    {Object.values(SceneType).map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">人物元素</label>
                  <select value={config.family} onChange={(e) => setConfig({...config, family: e.target.value as FamilyType})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 text-sm font-medium bg-white">
                    {Object.values(FamilyType).map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">批量生成数量</label>
                <div className="flex items-center space-x-2">
                  {[1, 3, 5, 8].map(num => (
                    <button
                      key={num}
                      onClick={() => setBatchSize(num)}
                      className={`flex-1 py-2.5 rounded-xl border font-bold text-sm transition-all ${batchSize === num ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">微调备注</label>
                <textarea 
                  value={config.additionalPrompt} 
                  onChange={(e) => setConfig({...config, additionalPrompt: e.target.value})} 
                  placeholder="例如：光线偏暖，帐篷旁边放一双登山鞋..." 
                  className="w-full px-3 py-3 rounded-xl border border-slate-200 h-20 resize-none outline-none text-sm focus:ring-2 focus:ring-indigo-500 bg-white" 
                />
              </div>

              {error && <div className="p-3 bg-red-50 text-red-600 text-[10px] rounded-xl flex items-center space-x-2 border border-red-100 font-bold uppercase"><i className="fas fa-exclamation-circle"></i><span>{error}</span></div>}

              <button 
                onClick={() => handleGenerate(false)} 
                disabled={isGenerating || selectedFiles.length === 0} 
                className={`w-full py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center space-x-2 transition-all active:scale-95 ${isGenerating || selectedFiles.length === 0 ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-gradient-to-br from-indigo-600 to-blue-700 hover:shadow-indigo-200'}`}
              >
                {isGenerating ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>制作中 ({generatingProgress?.current}/{generatingProgress?.total})</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-wand-magic-sparkles"></i>
                    <span>开始生成 {batchSize} 张图</span>
                  </>
                )}
              </button>
            </div>
          </section>
        </div>

        {/* Output Section */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[600px] flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center justify-between">
              <span className="flex items-center"><i className="fas fa-image mr-2 text-indigo-500"></i>画布预览</span>
              {hasResults && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-black">BATCH: {batchSize} MODELS</span>}
            </h2>
            
            <div className="flex-1 bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden flex flex-col items-center justify-center relative min-h-[500px]">
              {isGenerating ? (
                <div className="text-center p-8">
                  <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                  <p className="text-slate-700 font-black text-xl">正在渲染视觉场景</p>
                  <p className="text-slate-400 text-sm mt-2">AI 正在根据{aplusTemplate ? '模版' : '描述'}构思最佳角度...</p>
                  <div className="w-64 h-2.5 bg-slate-200 rounded-full mt-8 mx-auto overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-700 ease-out" 
                      style={{ width: `${((generatingProgress?.current || 0) / (generatingProgress?.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ) : generatedImages.length > 0 ? (
                <div className="w-full flex flex-col h-full">
                  <div className={`flex-1 p-6 grid gap-6 ${generatedImages.length > 1 ? (batchSize === 1 ? 'grid-cols-1' : (batchSize <= 3 ? 'grid-cols-1' : 'grid-cols-2')) : 'grid-cols-1'} auto-rows-min overflow-y-auto max-h-[75vh]`}>
                    {generatedImages.slice(0, batchSize).map((img) => (
                      <div key={img.id} className="relative group cursor-zoom-in overflow-hidden rounded-2xl shadow-lg bg-white border border-slate-100" onClick={() => setZoomImageUrl(img.url)}>
                        <img src={img.url} alt="Result" className="w-full h-auto mx-auto transition-transform duration-1000 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute top-4 right-4 flex space-x-2" onClick={e => e.stopPropagation()}>
                          <button onClick={() => downloadImage(img.url, `qianfan-life-${img.id}.png`)} className="bg-white text-slate-800 w-10 h-10 rounded-xl shadow-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all"><i className="fas fa-download"></i></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-6 bg-slate-50/80 border-t border-slate-100">
                    <button 
                      onClick={() => handleGenerate(true)}
                      className="w-full bg-white border border-indigo-200 rounded-2xl py-4 text-indigo-700 font-black hover:bg-indigo-50 transition-all flex items-center justify-center space-x-3 shadow-sm"
                    >
                      <i className="fas fa-wand-sparkles"></i>
                      <span>基于选定图精修细节</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-12">
                  <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 text-slate-100">
                    <i className="fas fa-magic text-5xl"></i>
                  </div>
                  <p className="font-black text-slate-400 text-lg">等待生成您的视觉资产</p>
                  <p className="text-slate-300 text-sm mt-2 max-w-xs mx-auto">上传产品图并选择场景，我们将为您打造世界级的 A+ 页面素材</p>
                </div>
              )}
            </div>
          </section>

          {/* History */}
          {generatedImages.length > batchSize && (
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                <i className="fas fa-history mr-2"></i> 历史资产库
              </h2>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {generatedImages.slice(batchSize).map((img) => (
                  <div 
                    key={img.id} 
                    className="group relative aspect-square rounded-xl overflow-hidden border border-slate-100 cursor-pointer shadow-sm hover:shadow-md transition-all bg-white"
                  >
                    <img 
                      src={img.url} 
                      alt="History" 
                      className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all group-hover:scale-110" 
                      onClick={() => promoteToMain(img)} 
                    />
                    <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <i className="fas fa-arrow-up text-white text-xs"></i>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <div className="flex items-center space-x-6 mb-6">
            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">High End</span>
            <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Commercial</span>
            <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">AI Powered</span>
          </div>
          <p className="text-slate-300 text-[10px] font-bold">PROUDLY SERVING AMAZON SELLERS WORLDWIDE · POWERED BY GEMINI 2.5</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
