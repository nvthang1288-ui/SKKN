/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Send, 
  User, 
  Calendar, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Download, 
  Copy, 
  CheckCircle2, 
  Loader2,
  ChevronRight,
  Printer,
  FileEdit,
  Wand2,
  CheckSquare,
  Square,
  FileDown,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { InitiativeData, InitiativeContent } from './types';
import { generateInitiativeContent, suggestSolutions } from './services/aiService';
import { saveAs } from 'file-saver';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  AlignmentType, 
  Table, 
  TableRow, 
  TableCell, 
  BorderStyle, 
  WidthType,
  HeadingLevel,
  UnderlineType
} from 'docx';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<'info' | 'solutions' | 'content'>('info');
  const [suggestedSolutions, setSuggestedSolutions] = useState<string[]>([]);
  const [selectedSolutions, setSelectedSolutions] = useState<string[]>([]);
  const [customApiKey, setCustomApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-pro-preview');
  
  const [initiativeData, setInitiativeData] = useState<InitiativeData>({
    title: '',
    author: {
      name: 'Nguyễn Văn Thắng',
      dob: '12/12/1988',
      workplace: 'Trường THCS Trung Đồng',
      position: 'Giáo viên THCS hạng III',
      qualification: 'Đại học SP Sinh học',
      contribution: '100%'
    },
    recipient: 'UBND xã Tân Uyên - Hội đồng xét công nhận hiệu quả áp dụng và khả năng nhân rộng sáng kiến xã Tân Uyên',
    investor: 'Trường THCS Trung Đồng, xã Tân Uyên, tỉnh Lai Châu',
    field: 'Giáo dục và Đào tạo',
    firstAppliedDate: '10/2026',
    desiredPages: 15
  });

  const [content, setContent] = useState<InitiativeContent | null>(null);
  const documentRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('author.')) {
      const field = name.split('.')[1];
      setInitiativeData(prev => ({
        ...prev,
        author: { ...prev.author, [field]: value }
      }));
    } else if (name === 'desiredPages') {
      setInitiativeData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setInitiativeData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSuggestSolutions = async () => {
    if (!initiativeData.title) {
      alert('Vui lòng nhập tên sáng kiến!');
      return;
    }
    setSuggesting(true);
    try {
      const solutions = await suggestSolutions(initiativeData.title, initiativeData.field, customApiKey, selectedModel);
      setSuggestedSolutions(solutions);
      setStep('solutions');
    } catch (error: any) {
      console.error('Lỗi khi gợi ý giải pháp:', error);
      const errorString = typeof error === 'object' ? JSON.stringify(error) : String(error);
      if (error?.message?.includes('429') || error?.status === 429 || errorString.includes('429') || errorString.includes('quota') || errorString.includes('RESOURCE_EXHAUSTED')) {
        alert('Đã vượt quá giới hạn sử dụng API (Quota Exceeded). Vui lòng nhập Gemini API Key của bạn vào mục "Cấu hình API" ở cuối trang để tiếp tục sử dụng mô hình Pro.');
      } else {
        alert('Đã có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setSuggesting(false);
    }
  };

  const toggleSolution = (sol: string) => {
    setSelectedSolutions(prev => 
      prev.includes(sol) ? prev.filter(s => s !== sol) : [...prev, sol]
    );
  };

  const handleGenerate = async () => {
    if (selectedSolutions.length === 0) {
      alert('Vui lòng chọn ít nhất một giải pháp!');
      return;
    }
    setLoading(true);
    try {
      const result = await generateInitiativeContent(initiativeData, selectedSolutions, customApiKey, selectedModel);
      setContent(result);
      setStep('content');
    } catch (error: any) {
      console.error('Lỗi khi tạo nội dung:', error);
      const errorString = typeof error === 'object' ? JSON.stringify(error) : String(error);
      if (error?.message?.includes('429') || error?.status === 429 || errorString.includes('429') || errorString.includes('quota') || errorString.includes('RESOURCE_EXHAUSTED')) {
        alert('Đã vượt quá giới hạn sử dụng API (Quota Exceeded). Vui lòng nhập Gemini API Key của bạn vào mục "Cấu hình API" ở cuối trang để tiếp tục sử dụng mô hình Pro.');
      } else {
        alert('Đã có lỗi xảy ra khi tạo nội dung. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportWord = async () => {
    if (!content) return;
    
    // Create document with docx library for precise formatting
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1134, // 2cm
              right: 1134,
              bottom: 1134,
              left: 1701, // 3cm for left margin
            },
          },
        },
        children: [
          // Administrative Header
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM", bold: true, size: 28, font: "Times New Roman" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", bold: true, size: 26, font: "Times New Roman" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 400 },
            children: [
              new TextRun({ text: "ĐƠN YÊU CẦU CÔNG NHẬN SÁNG KIẾN", bold: true, size: 32, font: "Times New Roman" }),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "Kính gửi: ", bold: true, italics: true, size: 28, font: "Times New Roman" }),
              new TextRun({ text: initiativeData.recipient, size: 28, font: "Times New Roman" }),
            ],
          }),

          new Paragraph({
            spacing: { before: 200 },
            children: [
              new TextRun({ text: "Chúng tôi ghi tên dưới đây:", size: 28, font: "Times New Roman" }),
            ],
          }),

          // Author Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  "Số TT", "Họ và tên", "Ngày sinh", "Nơi công tác", "Chức danh", "Trình độ", "Đóng góp (%)"
                ].map(text => new TableCell({
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 24, font: "Times New Roman" })] })],
                })),
              }),
              new TableRow({
                children: [
                  "1", initiativeData.author.name, initiativeData.author.dob, initiativeData.author.workplace, 
                  initiativeData.author.position, initiativeData.author.qualification, initiativeData.author.contribution
                ].map(text => new TableCell({
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, size: 24, font: "Times New Roman" })] })],
                })),
              }),
            ],
          }),

          new Paragraph({
            spacing: { before: 400 },
            children: [
              new TextRun({ text: "Là nhóm tác giả đề nghị xét công nhận sáng kiến: ", size: 28, font: "Times New Roman" }),
              new TextRun({ text: `"${initiativeData.title}"`, bold: true, italics: true, size: 28, font: "Times New Roman" }),
            ],
          }),

          new Paragraph({
            spacing: { before: 200 },
            children: [
              new TextRun({ text: "* Chủ đầu tư tạo ra sáng kiến: ", bold: true, size: 28, font: "Times New Roman" }),
              new TextRun({ text: initiativeData.investor, size: 28, font: "Times New Roman" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "* Lĩnh vực áp dụng sáng kiến: ", bold: true, size: 28, font: "Times New Roman" }),
              new TextRun({ text: initiativeData.field, size: 28, font: "Times New Roman" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "* Ngày sáng kiến được áp dụng lần đầu: ", bold: true, size: 28, font: "Times New Roman" }),
              new TextRun({ text: initiativeData.firstAppliedDate, size: 28, font: "Times New Roman" }),
            ],
          }),

          new Paragraph({
            spacing: { before: 400 },
            children: [
              new TextRun({ text: "* MÔ TẢ BẢN CHẤT CỦA SÁNG KIẾN:", bold: true, size: 32, font: "Times New Roman" }),
            ],
          }),

          new Paragraph({
            spacing: { before: 200 },
            children: [
              new TextRun({ text: "1. Sự cần thiết, mục đích của việc thực hiện sáng kiến:", bold: true, size: 28, font: "Times New Roman" }),
            ],
          }),
          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: "1.1. Sự cần thiết:", bold: true, size: 28, font: "Times New Roman" }),
            ],
          }),
          new Paragraph({
            indent: { left: 720 },
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({ text: content.necessity.replace(/[#*]/g, ''), size: 28, font: "Times New Roman" }),
            ],
          }),

          new Paragraph({
            spacing: { before: 200 },
            indent: { left: 720 },
            children: [
              new TextRun({ text: "1.2. Mục đích:", bold: true, size: 28, font: "Times New Roman" }),
            ],
          }),
          new Paragraph({
            indent: { left: 720 },
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({ text: content.purpose.replace(/[#*]/g, ''), size: 28, font: "Times New Roman" }),
            ],
          }),

          new Paragraph({
            spacing: { before: 400 },
            children: [
              new TextRun({ text: "2. Phạm vi triển khai thực hiện:", bold: true, size: 28, font: "Times New Roman" }),
            ],
          }),
          new Paragraph({
            indent: { left: 720 },
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({ text: content.scope.replace(/[#*]/g, ''), size: 28, font: "Times New Roman" }),
            ],
          }),

          new Paragraph({
            spacing: { before: 400 },
            children: [
              new TextRun({ text: "3. Về nội dung của sáng kiến:", bold: true, size: 28, font: "Times New Roman" }),
            ],
          }),

          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: "3.1. Mô tả giải pháp trước khi tạo ra sáng kiến:", bold: true, size: 28, font: "Times New Roman" }),
            ],
          }),
          ...content.solutionsBefore.flatMap((sol, idx) => [
            new Paragraph({
              indent: { left: 1080 },
              children: [new TextRun({ text: `3.1.${idx + 1}. ${sol.name}:`, bold: true, size: 28, font: "Times New Roman" })],
            }),
            new Paragraph({
              indent: { left: 1080 },
              children: [
                new TextRun({ text: "* Nội dung biện pháp: ", bold: true, size: 28, font: "Times New Roman" }),
                new TextRun({ text: sol.content, size: 28, font: "Times New Roman" }),
              ],
            }),
            new Paragraph({
              indent: { left: 1080 },
              children: [
                new TextRun({ text: "* Ưu điểm: ", bold: true, size: 28, font: "Times New Roman" }),
                new TextRun({ text: sol.pros, size: 28, font: "Times New Roman" }),
              ],
            }),
            new Paragraph({
              indent: { left: 1080 },
              children: [
                new TextRun({ text: "* Hạn chế: ", bold: true, size: 28, font: "Times New Roman" }),
                new TextRun({ text: sol.cons, size: 28, font: "Times New Roman" }),
              ],
            }),
            new Paragraph({
              indent: { left: 1080 },
              children: [
                new TextRun({ text: "* Nguyên nhân hạn chế: ", bold: true, size: 28, font: "Times New Roman" }),
                new TextRun({ text: sol.causes, size: 28, font: "Times New Roman" }),
              ],
            }),
          ]),

          new Paragraph({
            spacing: { before: 400 },
            indent: { left: 720 },
            children: [
              new TextRun({ text: "3.2. Mô tả giải pháp sau khi có sáng kiến:", bold: true, size: 28, font: "Times New Roman" }),
            ],
          }),
          ...content.solutionsAfter.flatMap((sol, idx) => [
            new Paragraph({
              indent: { left: 1080 },
              children: [new TextRun({ text: `3.2.${idx + 1}. ${sol.name}:`, bold: true, size: 28, font: "Times New Roman" })],
            }),
            new Paragraph({
              indent: { left: 1080 },
              children: [
                new TextRun({ text: "* Tính mới: ", bold: true, size: 28, font: "Times New Roman" }),
                new TextRun({ text: sol.novelty, size: 28, font: "Times New Roman" }),
              ],
            }),
            new Paragraph({
              indent: { left: 1080 },
              children: [
                new TextRun({ text: "* Biện pháp thực hiện: ", bold: true, size: 28, font: "Times New Roman" }),
              ],
            }),
            new Paragraph({
              indent: { left: 1080 },
              alignment: AlignmentType.JUSTIFIED,
              children: [
                new TextRun({ text: sol.implementation.replace(/[#*]/g, ''), size: 28, font: "Times New Roman" }),
              ],
            }),
            new Paragraph({
              indent: { left: 1080 },
              children: [
                new TextRun({ text: "* Hiệu quả đạt được: ", bold: true, size: 28, font: "Times New Roman" }),
                new TextRun({ text: sol.results, size: 28, font: "Times New Roman" }),
              ],
            }),
          ]),

          new Paragraph({
            spacing: { before: 400 },
            children: [
              new TextRun({ text: "* Đánh giá lợi ích thu được:", bold: true, size: 28, font: "Times New Roman" }),
            ],
          }),
          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: "1. Hiệu quả về kinh tế: ", bold: true, size: 28, font: "Times New Roman" }),
              new TextRun({ text: content.economicBenefit, size: 28, font: "Times New Roman" }),
            ],
          }),
          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: "2. Hiệu quả về xã hội: ", bold: true, size: 28, font: "Times New Roman" }),
              new TextRun({ text: content.socialBenefit, size: 28, font: "Times New Roman" }),
            ],
          }),

          // Comparison Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  "Tiêu chí", "Trước khi thực hiện", "Sau khi thực hiện", "Ghi chú"
                ].map(text => new TableCell({
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 24, font: "Times New Roman" })] })],
                })),
              }),
              ...content.comparisonTable.map(row => new TableRow({
                children: [
                  row.criteria, row.before, row.after, row.note
                ].map(text => new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text, size: 24, font: "Times New Roman" })] })],
                })),
              })),
            ],
          }),

          new Paragraph({
            spacing: { before: 800 },
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `Tân Uyên, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`, italics: true, size: 28, font: "Times New Roman" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: "NGƯỜI NỘP ĐƠN", bold: true, size: 28, font: "Times New Roman" }),
            ],
          }),
          new Paragraph({
            spacing: { before: 1200 },
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: initiativeData.author.name, bold: true, size: 28, font: "Times New Roman" }),
            ],
          }),
        ],
      }],
    });

    try {
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${initiativeData.title || 'Sang_kien_kinh_nghiem'}.docx`);
    } catch (error) {
      console.error('Lỗi khi xuất file Word:', error);
      alert('Có lỗi xảy ra khi xuất file Word.');
    }
  };

  const handleCopy = () => {
    if (!documentRef.current) return;
    const text = documentRef.current.innerText;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <FileEdit size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Trợ Lý Viết Sáng Kiến Kinh Nghiệm</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Soạn thảo văn bản theo mẫu chuẩn</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {content && (
            <>
              <button 
                onClick={() => setStep('info')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <FileEdit size={18} />
                Soạn lại
              </button>
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                {copied ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Copy size={18} />}
                {copied ? 'Đã sao chép' : 'Sao chép'}
              </button>
              <button 
                onClick={handleExportWord}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
              >
                <FileDown size={18} />
                Xuất Word (.docx)
              </button>
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              >
                <Printer size={18} />
                In / Xuất PDF
              </button>
            </>
          )}
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 p-6 lg:p-8">
        {/* Sidebar Inputs */}
        <aside className="space-y-6 print:hidden">
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <User className="text-indigo-600" size={20} />
              <h2 className="font-bold text-slate-800">Thông tin tác giả</h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Họ và tên</label>
                <input 
                  type="text" 
                  name="author.name"
                  value={initiativeData.author.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ngày sinh</label>
                  <input 
                    type="text" 
                    name="author.dob"
                    value={initiativeData.author.dob}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Đóng góp (%)</label>
                  <input 
                    type="text" 
                    name="author.contribution"
                    value={initiativeData.author.contribution}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nơi công tác</label>
                <input 
                  type="text" 
                  name="author.workplace"
                  value={initiativeData.author.workplace}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Chức danh</label>
                <input 
                  type="text" 
                  name="author.position"
                  value={initiativeData.author.position}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Trình độ chuyên môn</label>
                <input 
                  type="text" 
                  name="author.qualification"
                  value={initiativeData.author.qualification}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <FileText className="text-indigo-600" size={20} />
              <h2 className="font-bold text-slate-800">Thông tin sáng kiến</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tên sáng kiến</label>
                <textarea 
                  name="title"
                  value={initiativeData.title}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Một số giải pháp nâng cao chất lượng dạy học môn Sinh học..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Lĩnh vực áp dụng</label>
                <input 
                  type="text" 
                  name="field"
                  value={initiativeData.field}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ngày áp dụng lần đầu</label>
                  <input 
                    type="text" 
                    name="firstAppliedDate"
                    value={initiativeData.firstAppliedDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Số trang Word dự kiến</label>
                  <input 
                    type="number" 
                    name="desiredPages"
                    min="1"
                    max="50"
                    value={initiativeData.desiredPages}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 pb-3">
                <Key className="text-orange-600" size={18} />
                <h3 className="font-bold text-slate-800 text-sm">Cấu hình API (Tùy chọn)</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Mô hình AI</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm"
                  >
                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Chất lượng cao nhất)</option>
                    <option value="gemini-3-flash-preview">Gemini 3.0 Flash (Nhanh, ít lỗi Quota)</option>
                    <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite (Nhanh nhất)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Gemini API Key</label>
                  <input 
                    type="password" 
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="Nhập API Key của bạn (bắt đầu bằng AIza...) để tránh lỗi Quota Exceeded"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            {step === 'info' && (
              <button 
                onClick={handleSuggestSolutions}
                disabled={suggesting || !initiativeData.title}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
              >
                {suggesting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Đang đề xuất giải pháp...
                  </>
                ) : (
                  <>
                    <Wand2 size={20} />
                    Tiếp tục: Chọn giải pháp
                  </>
                )}
              </button>
            )}
          </section>
        </aside>

        {/* Document Preview / Selection Area */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {step === 'info' && !content && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200"
              >
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                  <FileText size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa có nội dung soạn thảo</h3>
                <p className="text-slate-500 max-w-sm">
                  Vui lòng điền đầy đủ thông tin bên trái và nhấn nút "Tiếp tục" để chọn các giải pháp phù hợp.
                </p>
              </motion.div>
            )}

            {step === 'solutions' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 space-y-8"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Đề xuất giải pháp mới</h2>
                    <p className="text-slate-500 mt-1">Chọn từ 3 đến 5 giải pháp bạn muốn triển khai trong sáng kiến này.</p>
                  </div>
                  <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full font-bold text-sm">
                    Đã chọn: {selectedSolutions.length}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {suggestedSolutions.map((sol, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleSolution(sol)}
                      className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left group ${
                        selectedSolutions.includes(sol)
                          ? 'border-indigo-600 bg-indigo-50/50'
                          : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`mt-0.5 transition-colors ${selectedSolutions.includes(sol) ? 'text-indigo-600' : 'text-slate-300 group-hover:text-indigo-300'}`}>
                        {selectedSolutions.includes(sol) ? <CheckSquare size={24} /> : <Square size={24} />}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Giải pháp {idx + 1}</span>
                        <p className={`font-semibold leading-relaxed ${selectedSolutions.includes(sol) ? 'text-indigo-900' : 'text-slate-700'}`}>
                          {sol}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setStep('info')}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
                  >
                    Quay lại
                  </button>
                  <button 
                    onClick={handleGenerate}
                    disabled={loading || selectedSolutions.length < 3}
                    className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Đang tạo nội dung chi tiết...
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        Bắt đầu tạo nội dung ({selectedSolutions.length} giải pháp)
                      </>
                    )}
                  </button>
                </div>
                {selectedSolutions.length < 3 && (
                  <p className="text-center text-sm text-amber-600 font-medium">Vui lòng chọn ít nhất 3 giải pháp để đảm bảo chất lượng sáng kiến.</p>
                )}
              </motion.div>
            )}

            {step === 'content' && content && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
              >
                <div 
                  ref={documentRef}
                  className="p-12 lg:p-16 max-w-[800px] mx-auto text-slate-900 leading-relaxed print:p-0 print:text-black"
                  style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '14pt' }}
                >
                  {/* Administrative Header */}
                  <div className="text-center mb-12 space-y-1">
                    <h2 className="font-bold text-lg uppercase tracking-tight">CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</h2>
                    <h3 className="font-bold text-base underline underline-offset-4">Độc lập - Tự do - Hạnh phúc</h3>
                    <div className="pt-8">
                      <h1 className="font-bold text-xl uppercase">ĐƠN YÊU CẦU CÔNG NHẬN SÁNG KIẾN</h1>
                    </div>
                  </div>

                  {/* Recipient */}
                  <div className="mb-8 space-y-2">
                    <p className="font-bold italic">Kính gửi: <span className="font-normal not-italic">{initiativeData.recipient}</span></p>
                  </div>

                  <p className="mb-4">Chúng tôi ghi tên dưới đây:</p>

                  {/* Author Table */}
                  <table className="w-full border-collapse border border-black mb-8 text-sm">
                    <thead>
                      <tr>
                        <th className="border border-black p-2 w-12">Số TT</th>
                        <th className="border border-black p-2">Họ và tên</th>
                        <th className="border border-black p-2">Ngày tháng năm sinh</th>
                        <th className="border border-black p-2">Nơi công tác</th>
                        <th className="border border-black p-2">Chức danh</th>
                        <th className="border border-black p-2">Trình độ chuyên môn</th>
                        <th className="border border-black p-2">Tỷ lệ (%) đóng góp</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black p-2 text-center">1</td>
                        <td className="border border-black p-2 font-bold">{initiativeData.author.name}</td>
                        <td className="border border-black p-2 text-center">{initiativeData.author.dob}</td>
                        <td className="border border-black p-2">{initiativeData.author.workplace}</td>
                        <td className="border border-black p-2">{initiativeData.author.position}</td>
                        <td className="border border-black p-2">{initiativeData.author.qualification}</td>
                        <td className="border border-black p-2 text-center">{initiativeData.author.contribution}</td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="mb-6">Là nhóm tác giả đề nghị xét công nhận sáng kiến: <span className="font-bold italic">"{initiativeData.title}"</span></p>

                  <div className="space-y-4 mb-8">
                    <p><span className="font-bold">* Chủ đầu tư tạo ra sáng kiến:</span> {initiativeData.investor}</p>
                    <p><span className="font-bold">* Lĩnh vực áp dụng sáng kiến:</span> {initiativeData.field}</p>
                    <p><span className="font-bold">* Ngày sáng kiến được áp dụng lần đầu hoặc áp dụng thử:</span> {initiativeData.firstAppliedDate}</p>
                  </div>

                  <div className="space-y-6">
                    <h2 className="font-bold text-lg uppercase">* Mô tả bản chất của sáng kiến:</h2>
                    
                    <section>
                      <h3 className="font-bold">1. Sự cần thiết, mục đích của việc thực hiện sáng kiến:</h3>
                      <div className="pl-6 space-y-4 mt-2">
                        <div>
                          <p className="font-bold">1.1. Sự cần thiết:</p>
                          <div className="text-justify whitespace-pre-wrap markdown-body">
                            <ReactMarkdown>{content.necessity}</ReactMarkdown>
                          </div>
                        </div>
                        <div>
                          <p className="font-bold">1.2. Mục đích:</p>
                          <div className="text-justify whitespace-pre-wrap markdown-body">
                            <ReactMarkdown>{content.purpose}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="font-bold">2. Phạm vi triển khai thực hiện:</h3>
                      <div className="pl-6 mt-2 text-justify whitespace-pre-wrap markdown-body">
                        <ReactMarkdown>{content.scope}</ReactMarkdown>
                      </div>
                    </section>

                    <section>
                      <h3 className="font-bold">3. Về nội dung của sáng kiến:</h3>
                      
                      <div className="pl-6 mt-2 space-y-6">
                        <div>
                          <p className="font-bold">3.1. Mô tả giải pháp trước khi tạo ra sáng kiến:</p>
                          <div className="pl-4 space-y-6 mt-4">
                            {content.solutionsBefore.map((sol, idx) => (
                              <div key={idx} className="space-y-2">
                                <p className="font-bold">3.1.{idx + 1}. {sol.name}:</p>
                                <p><span className="font-bold">* Nội dung biện pháp:</span> {sol.content}</p>
                                <p><span className="font-bold">* Ưu điểm:</span> {sol.pros}</p>
                                <p><span className="font-bold">* Hạn chế:</span> {sol.cons}</p>
                                <p><span className="font-bold">* Nguyên nhân hạn chế:</span> {sol.causes}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="font-bold">3.2. Mô tả giải pháp sau khi có sáng kiến:</p>
                          <div className="pl-4 space-y-6 mt-4">
                            {content.solutionsAfter.map((sol, idx) => (
                              <div key={idx} className="space-y-2">
                                <p className="font-bold">3.2.{idx + 1}. {sol.name}:</p>
                                <p><span className="font-bold">* Tính mới của giải pháp:</span> {sol.novelty}</p>
                                <div>
                                  <span className="font-bold">* Biện pháp thực hiện:</span>
                                  <div className="markdown-body mt-1">
                                    <ReactMarkdown>{sol.implementation}</ReactMarkdown>
                                  </div>
                                </div>
                                <p><span className="font-bold">* Hiệu quả đạt được:</span> {sol.results}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <p><span className="font-bold">* Những thông tin cần được bảo mật:</span> {content.confidentiality}</p>
                      <p><span className="font-bold">* Các điều kiện cần thiết để áp dụng sáng kiến:</span> {content.conditions}</p>
                    </section>

                    <section>
                      <h3 className="font-bold">* Đánh giá lợi ích thu được hoặc dự kiến có thể thu được do áp dụng sáng kiến theo ý kiến của tác giả:</h3>
                      <div className="pl-6 space-y-4 mt-2">
                        <div>
                          <p className="font-bold">1. Hiệu quả về kinh tế:</p>
                          <p className="text-justify">{content.economicBenefit}</p>
                        </div>
                        <div>
                          <p className="font-bold">2. Hiệu quả về xã hội:</p>
                          <p className="text-justify">{content.socialBenefit}</p>
                        </div>
                        
                        {/* Comparison Table */}
                        <div className="mt-6">
                          <p className="font-bold mb-2 italic text-center">Bảng so sánh kết quả trước và sau khi thực hiện sáng kiến</p>
                          <table className="w-full border-collapse border border-black text-sm">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="border border-black p-2">Tiêu chí đánh giá</th>
                                <th className="border border-black p-2">Trước khi thực hiện</th>
                                <th className="border border-black p-2">Sau khi thực hiện</th>
                                <th className="border border-black p-2">Ghi chú</th>
                              </tr>
                            </thead>
                            <tbody>
                              {content.comparisonTable.map((row, idx) => (
                                <tr key={idx}>
                                  <td className="border border-black p-2 font-medium">{row.criteria}</td>
                                  <td className="border border-black p-2 text-center">{row.before}</td>
                                  <td className="border border-black p-2 text-center font-bold text-indigo-700">{row.after}</td>
                                  <td className="border border-black p-2 italic">{row.note}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="font-bold">* Đánh giá lợi ích thu được hoặc dự kiến có thể thu được do áp dụng sáng kiến theo ý kiến của tổ chức, cá nhân đã tham gia áp dụng sáng kiến lần đầu, kể cả áp dụng thử:</h3>
                      <p className="pl-6 mt-2 text-justify">{content.externalEvaluation}</p>
                    </section>
                  </div>

                  {/* Footer Signature */}
                  <div className="mt-16 flex justify-end">
                    <div className="text-center space-y-1">
                      <p className="italic">Tân Uyên, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
                      <p className="font-bold uppercase">NGƯỜI NỘP ĐƠN</p>
                      <div className="h-24"></div>
                      <p className="font-bold">{initiativeData.author.name}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white; }
          header, aside { display: none !important; }
          main { display: block; padding: 0; margin: 0; max-width: none; }
          .bg-white { box-shadow: none !important; border: none !important; }
          @page { margin: 2cm; }
        }
        .markdown-body p { margin-bottom: 0.5rem; }
        .markdown-body strong em, .markdown-body em strong { font-weight: bold; font-style: italic; }
      `}</style>
    </div>
  );
}
