import React, { useState, useEffect } from 'react';
import { Download, RotateCcw, Sparkles, TrendingUp, BarChart3, Eye, Brain, BookOpen, Target, AlertCircle, CheckCircle, XCircle, Shield, Save, Upload, Edit, ThumbsUp, ThumbsDown } from 'lucide-react';

const SmartClaimsAnalyzer = () => {
  // 使用内存存储替代 localStorage
  const loadInitialData = () => {
    return {
      corrections: [],
      newKeywords: {
        功效: {},
        类型: {},
        持续性: {}
      },
      confidence: {},
      userFeedback: {},
      keywordScores: {},
      conflictLog: [],
      removedKeywords: {},
      lastUpdated: null,
      version: '2.0',
      userCorrections: [],
      keywordFrequency: {},
      learningStats: {
        totalCorrections: 0,
        accuracyRate: 100,
        lastAccuracyUpdate: null
      }
    };
  };

  const [inputText, setInputText] = useState('');
  const [analysisResults, setAnalysisResults] = useState([]);
  const [learningData, setLearningData] = useState(loadInitialData());
  const [showLearningPanel, setShowLearningPanel] = useState(false);
  const [editingResult, setEditingResult] = useState(null);
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEfficacy, setSelectedEfficacy] = useState('');
  const [validationMessage, setValidationMessage] = useState({ type: '', message: '' });
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [saveQueue, setSaveQueue] = useState([]);
  const [exportData, setExportData] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);

  // 批量保存机制 - 移除成功提示
  useEffect(() => {
    if (autoSaveEnabled && saveQueue.length > 0) {
      const saveTimer = setTimeout(() => {
        saveLearningData();
        setSaveQueue([]);
      }, 2000);

      return () => clearTimeout(saveTimer);
    }
  }, [saveQueue, autoSaveEnabled]);

  // 监听学习数据变化，加入保存队列 - 但不保存分析结果
  useEffect(() => {
    if (autoSaveEnabled) {
      // 只有学习数据变化时才保存，不包括分析结果
      setSaveQueue(prev => [...prev, Date.now()]);
    }
  }, [learningData, autoSaveEnabled]); // 移除 analysisResults 依赖

  // 保存学习数据（内存存储版本）
  const saveLearningData = () => {
    try {
      setLearningData(prev => ({
        ...prev,
        lastUpdated: new Date().toISOString()
      }));
      setLastSaveTime(new Date());
      console.log('Learning data saved to memory');
      // 移除成功提示，只在失败时提示
    } catch (error) {
      console.error('Error saving data:', error);
      setValidationMessage({
        type: 'error',
        message: '保存失败'
      });
      
      setTimeout(() => {
        setValidationMessage({ type: '', message: '' });
      }, 3000);
    }
  };

  // 导出学习数据 - 保留成功提示（这个操作用户需要确认）
  const exportLearningData = () => {
    const dataToExport = {
      ...learningData,
      exportDate: new Date().toISOString(),
      baseKeywordMapping: baseKeywordMapping
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `化妆品宣称分析器学习数据_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    setValidationMessage({
      type: 'success',
      message: '✅ 学习数据已成功导出'
    });
    
    setTimeout(() => {
      setValidationMessage({ type: '', message: '' });
    }, 3000);
  };

  // 导入学习数据
  const importLearningData = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        
        if (imported.newKeywords && typeof imported.newKeywords === 'object') {
          const mergedData = {
            ...loadInitialData(),
            corrections: [...learningData.corrections, ...(imported.corrections || [])],
            newKeywords: mergeKeywords(learningData.newKeywords, imported.newKeywords),
            confidence: { ...learningData.confidence, ...imported.confidence },
            userFeedback: { ...learningData.userFeedback, ...imported.userFeedback },
            keywordScores: { ...learningData.keywordScores, ...imported.keywordScores },
            conflictLog: [...learningData.conflictLog, ...(imported.conflictLog || [])],
            removedKeywords: { ...learningData.removedKeywords, ...imported.removedKeywords },
            userCorrections: [...(learningData.userCorrections || []), ...(imported.userCorrections || [])],
            keywordFrequency: { ...learningData.keywordFrequency, ...imported.keywordFrequency },
            lastUpdated: new Date().toISOString(),
            version: '2.0'
          };
          
          setLearningData(mergedData);
          setValidationMessage({
            type: 'success',
            message: '学习数据导入成功'
          });
          
          setTimeout(() => {
            setValidationMessage({ type: '', message: '' });
          }, 3000);
        } else {
          throw new Error('Invalid data format');
        }
      } catch (error) {
        console.error('Import error:', error);
        setValidationMessage({
          type: 'error',
          message: '导入失败：文件格式不正确'
        });
        
        setTimeout(() => {
          setValidationMessage({ type: '', message: '' });
        }, 3000);
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  // 合并关键词数据
  const mergeKeywords = (existing, imported) => {
    const merged = JSON.parse(JSON.stringify(existing));
    
    Object.entries(imported).forEach(([category, efficacies]) => {
      if (!merged[category]) merged[category] = {};
      
      Object.entries(efficacies).forEach(([efficacy, keywords]) => {
        if (!merged[category][efficacy]) {
          merged[category][efficacy] = [...keywords];
        } else {
          const combinedKeywords = new Set([...merged[category][efficacy], ...keywords]);
          merged[category][efficacy] = Array.from(combinedKeywords);
        }
      });
    });
    
    return merged;
  };

  const clearLearningData = () => {
    // 移除 window.confirm 以适配 Claude Artifacts 环境
    const emptyData = loadInitialData();
    setLearningData(emptyData);
    setValidationMessage({
      type: 'success',
      message: '✅ 学习数据已清空'
    });
    
    setTimeout(() => {
      setValidationMessage({ type: '', message: '' });
    }, 3000);
  };

  const dimension1Options = [
    { value: '染发', code: '01', desc: '以改变头发颜色为目的，使用后即时清洗不能恢复头发原有颜色', color: 'bg-red-100 text-red-800' },
    { value: '烫发', code: '02', desc: '用于改变头发弯曲度（弯曲或拉直），并维持相对稳定', color: 'bg-pink-100 text-pink-800' },
    { value: '祛斑美白', code: '03', desc: '有助于减轻或减缓皮肤色素沉着，达到皮肤美白增白效果', color: 'bg-purple-100 text-purple-800' },
    { value: '防晒', code: '04', desc: '用于保护皮肤、口唇免受特定紫外线所带来的损伤', color: 'bg-orange-100 text-orange-800' },
    { value: '防脱发', code: '05', desc: '有助于改善或减少头发脱落', color: 'bg-yellow-100 text-yellow-800' },
    { value: '祛痘', code: '06', desc: '有助于减少或减缓粉刺的发生；有助于粉刺发生后皮肤的恢复', color: 'bg-green-100 text-green-800' },
    { value: '滋养', code: '07', desc: '有助于为施用部位提供滋养作用', color: 'bg-teal-100 text-teal-800' },
    { value: '修护', code: '08', desc: '有助于维护施用部位保持正常状态', color: 'bg-cyan-100 text-cyan-800' },
    { value: '清洁', code: '09', desc: '用于除去施用部位表面的污垢及附着物', color: 'bg-blue-100 text-blue-800' },
    { value: '卸妆', code: '10', desc: '用于除去施用部位的彩妆等其他化妆品', color: 'bg-indigo-100 text-indigo-800' },
    { value: '保湿', code: '11', desc: '用于补充或增强施用部位水分、油脂等成分含量', color: 'bg-sky-100 text-sky-800' },
    { value: '美容修饰', code: '12', desc: '用于暂时改变施用部位外观状态，达到美化、修饰等作用', color: 'bg-rose-100 text-rose-800' },
    { value: '芳香', code: '13', desc: '具有芳香成分，有助于修饰体味，可增加香味', color: 'bg-violet-100 text-violet-800' },
    { value: '除臭', code: '14', desc: '有助于减轻或遮盖体臭', color: 'bg-fuchsia-100 text-fuchsia-800' },
    { value: '抗皱', code: '15', desc: '有助于减缓皮肤皱纹产生或使皱纹变得不明显', color: 'bg-emerald-100 text-emerald-800' },
    { value: '紧致', code: '16', desc: '有助于保持皮肤的紧实度、弹性', color: 'bg-lime-100 text-lime-800' },
    { value: '舒缓', code: '17', desc: '有助于改善皮肤刺激等状态', color: 'bg-amber-100 text-amber-800' },
    { value: '控油', code: '18', desc: '有助于减缓施用部位皮脂分泌和沉积', color: 'bg-stone-100 text-stone-800' },
    { value: '去角质', code: '19', desc: '有助于促进皮肤角质的脱落或促进角质更新', color: 'bg-zinc-100 text-zinc-800' },
    { value: '爽身', code: '20', desc: '有助于保持皮肤干爽或增强皮肤清凉感', color: 'bg-slate-100 text-slate-800' },
    { value: '护发', code: '21', desc: '有助于改善头发、胡须的梳理性，防止静电，保持或增强毛发的光泽', color: 'bg-gray-100 text-gray-800' },
    { value: '防断发', code: '22', desc: '有助于改善或减少头发断裂、分叉；有助于保持或增强头发韧性', color: 'bg-red-100 text-red-800' },
    { value: '去屑', code: '23', desc: '有助于减缓头屑的产生；有助于减少附着于头皮、头发的头屑', color: 'bg-pink-100 text-pink-800' },
    { value: '发色护理', code: '24', desc: '有助于在染发前后保持头发颜色的稳定', color: 'bg-purple-100 text-purple-800' },
    { value: '脱毛', code: '25', desc: '用于减少或除去体毛', color: 'bg-orange-100 text-orange-800' },
    { value: '辅助剃须剃毛', code: '26', desc: '用于软化、膨胀须发，有助于剃须剃毛时皮肤润滑', color: 'bg-yellow-100 text-yellow-800' },
    { value: '其他', code: 'A', desc: '不符合以上规则的其他功效', color: 'bg-neutral-100 text-neutral-800' }
  ];

  const dimension2Options = [
    { value: '温和宣称', color: 'bg-green-100 text-green-800' },
    { value: '原料功效', color: 'bg-blue-100 text-blue-800' },
    { value: '量化指标', color: 'bg-purple-100 text-purple-800' },
    { value: '喜好度', color: 'bg-pink-100 text-pink-800' },
    { value: '质地', color: 'bg-orange-100 text-orange-800' },
    { value: '使用感受', color: 'bg-cyan-100 text-cyan-800' },
    { value: '使用后体验', color: 'bg-yellow-100 text-yellow-800' }
  ];

  const dimension3Options = [
    { value: '即时', color: 'bg-red-100 text-red-800' },
    { value: '持久', color: 'bg-blue-100 text-blue-800' }
  ];

  // 基础关键词映射
  const baseKeywordMapping = {
    功效: {
      '保湿|滋润|水润|锁水|补水|保水|润泽|湿润|水分|水嫩|玻尿酸|透明质酸|甘油|角鲨烷': '保湿',
      '美白|祛斑|亮白|透亮|去斑|淡斑|提亮|均匀肤色|白皙|净白|烟酰胺|熊果苷|VC': '祛斑美白',
      '抗皱|去皱|除皱|皱纹|纹路|细纹|表情纹|法令纹|鱼尾纹|抬头纹|视黄醇|肽': '抗皱',
      '紧致|紧实|弹性|胶原|胶原蛋白|提拉|lifting|firmness|弹力|塑形': '紧致',
      '滋养|润养|养护|深层滋养|营养|补养|润泽|浸润|渗透|精华': '滋养',
      '修护|修复|屏障|强韧|修复力|愈合|重建|再生|修复因子|神经酰胺': '修护',
      '清洁|洗净|去污|清洗|冲洗|洁净|深层清洁|彻底清洁|温和清洁|泡沫': '清洁',
      '控油|吸油|去油|油腻|油光|T区|出油|皮脂|哑光|清爽|水杨酸': '控油',
      '舒缓|缓解|减轻|改善刺激|温和|安抚|镇静|敏感|刺激|积雪草|洋甘菊': '舒缓',
      '防晒|隔离|防护|阻挡|紫外线|UV|SPF|PA|日晒|阳光|氧化锌|二氧化钛': '防晒',
      '护发|柔顺|丝滑|光泽|shine|顺滑|柔软|梳理|防静电|发膜|护发素|蓬松': '护发',
      '祛痘|痘痘|粉刺|青春痘|暗疮|痤疮|黑头|白头|闭口|茶树|水杨酸': '祛痘',
      '染发|着色|上色|显色|彩色|颜色|发色|调色|漂色|染膏': '染发',
      '烫发|卷发|直发|弯曲|拉直|造型|定型|塑型|波浪|烫发水': '烫发',
      '卸妆|卸除|卸掉|去妆|卸妆水|卸妆油|卸妆乳|卸妆膏|清除彩妆': '卸妆',
      '美容|修饰|妆容|彩妆|化妆|遮瑕|遮盖|掩盖|美化|底妆': '美容修饰',
      '香|香味|香气|留香|体香|香调|香水|芳香|香氛|香精': '芳香',
      '除臭|去味|去异味|抑制异味|防臭|消臭|止汗|腋下|体味': '除臭',
      '去角质|角质|exfoliate|磨砂|剥脱|脱皮|死皮|果酸|酵素': '去角质',
      '爽身|干爽|清凉|凉爽|清爽|舒适|透气|凉感|薄荷': '爽身',
      '防脱|脱发|掉发|固发|育发|生发|发根|发量|浓密|生姜': '防脱发',
      '防断发|断发|分叉|韧性|强韧|坚韧|发丝强度|蛋白质': '防断发',
      '去屑|头屑|dandruff|头皮屑|鳞屑|片状|白屑|吡啶硫酮锌': '去屑',
      '发色护理|护色|锁色|保色|发色|色彩|颜色保持|护色素': '发色护理',
      '脱毛|除毛|去毛|hair removal|腿毛|腋毛|体毛|脱毛膏': '脱毛',
      '剃须|剃毛|shaving|胡须|胡子|刮胡|剃刀|剃须膏': '辅助剃须剃毛'
    },
    
    类型: {
      '温和|无刺激|不刺激|亲肤|gentle|mild|温柔|柔和|低刺激|敏感肌|0刺激': '温和宣称',
      '成分|原料|ingredient|含有|添加|富含|萃取|extract|精华|配方|活性物': '原料功效',
      '24小时|12小时|8小时|持续|%|倍|次|程度|测试|临床|数据|调查|数字': '量化指标',
      '喜欢|喜好|满意|推荐|好评|评价|好用|实用|有效|回购|点赞': '喜好度',
      '质地|texture|丝滑|绵密|轻盈|粘腻|厚重|轻薄|浓稠|延展性|触感': '质地',
      '感觉|感受到|体验|使用时|抹开|涂抹|上脸|第一感觉|瞬间|触碰': '使用感受',
      '使用后|用完|涂完|肌肤.*了|让.*肌|皮肤变得|坚持使用|长期使用|效果': '使用后体验'
    },
    
    持续性: {
      '即刻|立即|瞬间|马上|快速|即时|当下|现在|立竿见影|秒|瞬时|急速': '即时',
      '持久|长效|持续|24小时|12小时|8小时|48小时|72小时|长时间|长期|逐渐|慢慢|天|日|周|月|年|小时|分钟|持续性|耐久|恒久|7天|3天|5天|10天|30天|一周|一月|全天|整夜': '持久'
    }
  };

  // 转义正则表达式特殊字符
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // 简化的动态关键词映射
  const getDynamicKeywordMapping = () => {
    const dynamic = JSON.parse(JSON.stringify(baseKeywordMapping));
    
    if (showLearningPanel && learningData.newKeywords) {
      Object.entries(learningData.newKeywords).forEach(([category, keywords]) => {
        if (!keywords || !dynamic[category]) return;
        
        Object.entries(keywords).forEach(([efficacy, keywordList]) => {
          if (!keywordList || keywordList.length === 0) return;
          
          const removedKey = `${category}-${efficacy}`;
          const removedForEfficacy = (learningData.removedKeywords && learningData.removedKeywords[removedKey]) || [];
          const activeKeywords = keywordList.filter(kw => !removedForEfficacy.includes(kw));
          
          if (activeKeywords.length > 0) {
            dynamic[category][activeKeywords.join('|')] = efficacy;
          }
        });
      });
    }
    
    return dynamic;
  };

  const getEfficacyColor = (efficacy) => {
    const option = dimension1Options.find(opt => opt.value === efficacy);
    return option ? option.color : 'bg-gray-100 text-gray-800';
  };

  const getDimension2Color = (type) => {
    const option = dimension2Options.find(opt => opt.value === type);
    return option ? option.color : 'bg-gray-100 text-gray-800';
  };

  const getDimension3Color = (duration) => {
    const option = dimension3Options.find(opt => opt.value === duration);
    return option ? option.color : 'bg-gray-100 text-gray-800';
  };

  // 智能分析函数
  const analyzeText = (text) => {
    console.log('分析文本:', text);
    
    const result = {
      dimension1: [],
      dimension2: [],
      dimension3: '即时',
      confidence: {
        dimension1: 0,
        dimension2: 0,
        dimension3: 0
      },
      matchedKeywords: []
    };

    const currentMapping = baseKeywordMapping;

    // 分析维度一（功效）
    const efficacyEntries = Object.entries(currentMapping.功效);
    const matchedEfficacies = new Map();
    const matchedKeywordsList = [];
    
    for (const [keywordPattern, category] of efficacyEntries) {
      const keywords = keywordPattern.split('|');
      for (const keyword of keywords) {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          console.log(`匹配到关键词: "${keyword}" -> ${category}`);
          
          if (!matchedEfficacies.has(category)) {
            matchedEfficacies.set(category, []);
          }
          matchedEfficacies.get(category).push(keyword);
          matchedKeywordsList.push({
            category: 'dimension1',
            keyword: keyword,
            result: category,
            score: 1
          });
        }
      }
    }
    
    result.dimension1 = matchedEfficacies.size > 0 ? Array.from(matchedEfficacies.keys()) : ['其他'];
    result.confidence.dimension1 = matchedEfficacies.size > 0 ? 
      Math.min(0.9, 0.5 + (matchedEfficacies.size * 0.2)) : 0.1;

    // 分析维度二（类型）
    const typeEntries = Object.entries(currentMapping.类型);
    const matchedTypes = [];
    
    for (const [keywordPattern, category] of typeEntries) {
      const keywords = keywordPattern.split('|');
      for (const keyword of keywords) {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          if (!matchedTypes.includes(category)) {
            matchedTypes.push(category);
            matchedKeywordsList.push({
              category: 'dimension2',
              keyword: keyword,
              result: category
            });
            console.log(`类型匹配: "${keyword}" -> ${category}`);
          }
        }
      }
    }
    
    result.dimension2 = matchedTypes.length > 0 ? matchedTypes : ['使用感受'];
    result.confidence.dimension2 = matchedTypes.length > 0 ? 0.8 : 0.3;

    // 分析维度三（持续性）
    for (const [keywordPattern, category] of Object.entries(currentMapping.持续性)) {
      const keywords = keywordPattern.split('|');
      let matched = false;
      for (const keyword of keywords) {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          result.dimension3 = category;
          result.confidence.dimension3 = 0.8;
          matchedKeywordsList.push({
            category: 'dimension3',
            keyword: keyword,
            result: category
          });
          console.log(`持续性匹配: "${keyword}" -> ${category}`);
          matched = true;
          break;
        }
      }
      if (matched) break;
    }

    result.matchedKeywords = matchedKeywordsList;
    console.log('最终分析结果:', result);
    return result;
  };

  // 用户确认正确的反馈
  const handleConfirmCorrect = (resultId) => {
    const result = analysisResults.find(r => r.id === resultId);
    if (!result) return;

    setLearningData(prev => {
      const newData = { ...prev };
      
      if (result.matchedKeywords) {
        result.matchedKeywords.forEach(mk => {
          const currentScore = newData.keywordScores[mk.keyword] || 1;
          newData.keywordScores[mk.keyword] = Math.min(1, currentScore + 0.1);
        });
      }
      
      if (!newData.learningStats) {
        newData.learningStats = { totalCorrections: 0, accuracyRate: 100, lastAccuracyUpdate: null };
      }
      newData.learningStats.totalCorrections++;
      
      return newData;
    });

    setValidationMessage({
      type: 'success',
      message: `✅ 已确认分析正确！AI学习了这次成功的匹配模式`
    });

    setTimeout(() => {
      setValidationMessage({ type: '', message: '' });
    }, 3000);
  };

  // 用户纠错功能
  const handleUserCorrection = (resultId, dimension, newValue, userKeyword = '') => {
    const result = analysisResults.find(r => r.id === resultId);
    if (!result) return;

    const oldValue = result[dimension];
    
    const correctionRecord = {
      id: Date.now(),
      resultId,
      text: result.text,
      dimension,
      oldValue: Array.isArray(oldValue) ? oldValue.join(', ') : oldValue,
      newValue: Array.isArray(newValue) ? newValue.join(', ') : newValue,
      userKeyword: userKeyword.trim(),
      timestamp: new Date().toISOString(),
      confidence: result.confidence[dimension],
      correctionType: JSON.stringify(oldValue) === JSON.stringify(newValue) ? 'confirm' : 'modify'
    };

    setLearningData(prev => {
      const newData = { ...prev };
      
      if (!newData.userCorrections) newData.userCorrections = [];
      newData.userCorrections.push(correctionRecord);
      
      if (!newData.learningStats) {
        newData.learningStats = { totalCorrections: 0, accuracyRate: 100, lastAccuracyUpdate: null };
      }
      newData.learningStats.totalCorrections++;
      
      if (result.matchedKeywords) {
        result.matchedKeywords.forEach(mk => {
          if (mk.category === dimension) {
            const isCorrectMatch = (
              (dimension === 'dimension1' && (Array.isArray(newValue) ? newValue.includes(mk.result) : newValue === mk.result)) ||
              (dimension === 'dimension2' && (Array.isArray(newValue) ? newValue.includes(mk.result) : newValue === mk.result)) ||
              (dimension === 'dimension3' && newValue === mk.result)
            );
            
            const currentScore = newData.keywordScores[mk.keyword] || 1;
            if (isCorrectMatch) {
              newData.keywordScores[mk.keyword] = Math.min(1, currentScore + 0.1);
            } else {
              newData.keywordScores[mk.keyword] = Math.max(0.1, currentScore - 0.15);
            }
          }
        });
      }
      
      if (userKeyword.trim()) {
        const category = dimension === 'dimension1' ? '功效' : 
                        dimension === 'dimension2' ? '类型' : '持续性';
        
        const efficacies = Array.isArray(newValue) ? newValue : [newValue];
        efficacies.forEach(efficacy => {
          if (!newData.newKeywords[category][efficacy]) {
            newData.newKeywords[category][efficacy] = [];
          }
          if (!newData.newKeywords[category][efficacy].includes(userKeyword.trim())) {
            newData.newKeywords[category][efficacy].push(userKeyword.trim());
            newData.keywordScores[userKeyword.trim()] = 0.8;
          }
        });
      }
      
      return newData;
    });

    setAnalysisResults(prev => prev.map(result => 
      result.id === resultId ? { ...result, [dimension]: newValue } : result
    ));

    const correctionType = JSON.stringify(oldValue) === JSON.stringify(newValue) ? '确认' : '纠正';
    setValidationMessage({
      type: 'success',
      message: `✅ ${correctionType}成功！AI已学习您的反馈`
    });

    setEditingResult(null);
    
    setTimeout(() => {
      setValidationMessage({ type: '', message: '' });
    }, 3000);
  };

  // 学习新关键词
  const learnNewKeyword = (keyword, category, efficacy) => {
    setLearningData(prev => {
      const newData = { ...prev };
      
      if (!newData.newKeywords) {
        newData.newKeywords = { 功效: {}, 类型: {}, 持续性: {} };
      }
      if (!newData.newKeywords[category]) {
        newData.newKeywords[category] = {};
      }
      if (!newData.newKeywords[category][efficacy]) {
        newData.newKeywords[category][efficacy] = [];
      }
      
      if (!newData.newKeywords[category][efficacy].includes(keyword)) {
        newData.newKeywords[category][efficacy].push(keyword);
        newData.keywordScores[keyword] = 0.7;
      }
      
      return newData;
    });

    setValidationMessage({
      type: 'success',
      message: `成功添加关键词 "${keyword}" 到 ${efficacy}`
    });
    
    setTimeout(() => {
      setValidationMessage({ type: '', message: '' });
    }, 3000);
    
    return true;
  };

  // 移除学习的关键词
  const removeLearnedKeyword = (category, efficacy, keyword) => {
    setLearningData(prev => {
      const newData = { ...prev };
      
      if (newData.newKeywords[category]?.[efficacy]) {
        newData.newKeywords[category][efficacy] = 
          newData.newKeywords[category][efficacy].filter(k => k !== keyword);
      }
      
      const key = `${category}-${efficacy}`;
      if (!newData.removedKeywords[key]) {
        newData.removedKeywords[key] = [];
      }
      newData.removedKeywords[key].push(keyword);
      
      delete newData.keywordScores[keyword];
      
      return newData;
    });
    
    setValidationMessage({
      type: 'success',
      message: `已移除关键词 "${keyword}"`
    });
    
    setTimeout(() => {
      setValidationMessage({ type: '', message: '' });
    }, 3000);
  };

  // 智能建议新关键词
  const suggestKeywords = (text, currentResult) => {
    const suggestions = [];
    const words = text.toLowerCase().split(/[\s,，。！!？?；;：:]+/).filter(w => w.length > 1);
    
    const currentMapping = baseKeywordMapping;
    
    words.forEach(word => {
      let isMatched = false;
      Object.values(currentMapping).forEach(categoryMap => {
        Object.keys(categoryMap).forEach(pattern => {
          if (new RegExp(pattern, 'i').test(word)) {
            isMatched = true;
          }
        });
      });
      
      if (!isMatched && word.length > 2) {
        suggestions.push(word);
      }
    });
    
    return suggestions.slice(0, 5);
  };

  const handleAutoAnalysis = () => {
    if (!inputText.trim()) {
      setValidationMessage({
        type: 'error',
        message: '请输入宣称内容'
      });
      
      setTimeout(() => {
        setValidationMessage({ type: '', message: '' });
      }, 3000);
      return;
    }

    const lines = inputText.split('\n').filter(line => line.trim());
    const results = lines.map((line, index) => {
      const analysis = analyzeText(line.trim());
      return {
        id: Date.now() + index,
        text: line.trim(),
        ...analysis,
        timestamp: new Date().toLocaleString(),
        suggestedKeywords: suggestKeywords(line.trim(), analysis)
      };
    });

    setAnalysisResults(results);
    
    setValidationMessage({
      type: 'success',
      message: `分析完成！共处理 ${results.length} 条宣称`
    });
    
    setTimeout(() => {
      setValidationMessage({ type: '', message: '' });
    }, 3000);
  };

  const clearResults = () => {
    // 移除 window.confirm，直接清空
    console.log('开始清空结果，当前结果数量:', analysisResults.length);
    setAnalysisResults([]);
    setInputText('');
    setEditingResult(null);
    console.log('清空完成');
    setValidationMessage({
      type: 'success',
      message: '✅ 已清空所有结果和输入内容'
    });
    
    // 3秒后清除提示
    setTimeout(() => {
      setValidationMessage({ type: '', message: '' });
    }, 3000);
  };

  // 导出Excel格式文件
  const exportToExcel = () => {
    if (analysisResults.length === 0) {
      setValidationMessage({
        type: 'error',
        message: '没有可导出的数据，请先进行智能分析'
      });
      setTimeout(() => {
        setValidationMessage({ type: '', message: '' });
      }, 3000);
      return;
    }

    try {
      // 创建Excel XML格式内容
      const createExcelXML = () => {
        let xml = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="HeaderStyle">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#4472C4" ss:Pattern="Solid"/>
   <Font ss:Color="#FFFFFF"/>
  </Style>
  <Style ss:ID="SubHeaderStyle">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#70AD47" ss:Pattern="Solid"/>
   <Font ss:Color="#FFFFFF"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="分析报告">
  <Table>`;

        // 表头
        xml += `
   <Row>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">序号</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">宣称内容</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">维度一：功效</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">维度二：类型</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">维度三：持续性</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">置信度</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">分析时间</Data></Cell>
   </Row>`;

        // 数据行
        analysisResults.forEach((result, index) => {
          xml += `
   <Row>
    <Cell><Data ss:Type="Number">${index + 1}</Data></Cell>
    <Cell><Data ss:Type="String">${result.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>
    <Cell><Data ss:Type="String">${result.dimension1.join(', ')}</Data></Cell>
    <Cell><Data ss:Type="String">${Array.isArray(result.dimension2) ? result.dimension2.join(', ') : result.dimension2}</Data></Cell>
    <Cell><Data ss:Type="String">${result.dimension3}</Data></Cell>
    <Cell><Data ss:Type="String">${Math.round(result.confidence.dimension1 * 100)}%</Data></Cell>
    <Cell><Data ss:Type="String">${result.timestamp}</Data></Cell>
   </Row>`;
        });

        // 空行
        xml += `
   <Row></Row>`;

        // 学习统计标题
        xml += `
   <Row>
    <Cell ss:StyleID="SubHeaderStyle" ss:MergeAcross="1"><Data ss:Type="String">学习统计</Data></Cell>
   </Row>`;

        // 学习统计数据
        const stats = [
          ['用户纠正次数', learningData.userCorrections?.length || 0],
          ['新学习关键词', Object.values(learningData.newKeywords).reduce((total, category) => 
            total + Object.values(category).reduce((sum, keywords) => sum + keywords.length, 0), 0
          )],
          ['当前准确率', `${learningData.learningStats?.accuracyRate || 100}%`],
          ['报告生成时间', new Date().toLocaleString()]
        ];

        stats.forEach(([key, value]) => {
          xml += `
   <Row>
    <Cell><Data ss:Type="String">${key}</Data></Cell>
    <Cell><Data ss:Type="String">${value}</Data></Cell>
   </Row>`;
        });

        xml += `
  </Table>
 </Worksheet>
</Workbook>`;
        
        return xml;
      };

      const excelContent = createExcelXML();
      
      // 尝试下载Excel文件
      try {
        const blob = new Blob([excelContent], { 
          type: 'application/vnd.ms-excel' 
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `智能化妆品宣称分析报告_${new Date().toISOString().split('T')[0]}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setValidationMessage({
          type: 'success',
          message: '✅ Excel报告已成功导出！'
        });
      } catch (downloadError) {
        // 下载失败的备用方案
        console.error('Download failed, showing copy option:', downloadError);
        
        // 为复制准备CSV格式数据
        const headers = ['序号', '宣称内容', '维度一：功效', '维度二：类型', '维度三：持续性', '置信度', '分析时间'];
        const csvData = [
          headers,
          ...analysisResults.map((result, index) => [
            index + 1,
            `"${result.text.replace(/"/g, '""')}"`,
            `"${result.dimension1.join(', ')}"`,
            `"${Array.isArray(result.dimension2) ? result.dimension2.join(', ') : result.dimension2}"`,
            result.dimension3,
            `${Math.round(result.confidence.dimension1 * 100)}%`,
            result.timestamp
          ])
        ];

        csvData.push([]);
        csvData.push(['=== 学习统计 ===']);
        csvData.push(['用户纠正次数', learningData.userCorrections?.length || 0]);
        csvData.push(['新学习关键词', Object.values(learningData.newKeywords).reduce((total, category) => 
          total + Object.values(category).reduce((sum, keywords) => sum + keywords.length, 0), 0
        )]);
        csvData.push(['当前准确率', `${learningData.learningStats?.accuracyRate || 100}%`]);

        const csvContent = csvData.map(row => row.join(',')).join('\n');
        
        setExportData(csvContent);
        setShowExportModal(true);
        setValidationMessage({
          type: 'info',
          message: '💡 请从弹窗中复制数据，然后粘贴到Excel中'
        });
      }
      
      setTimeout(() => {
        setValidationMessage({ type: '', message: '' });
      }, 3000);
      
    } catch (error) {
      console.error('Export error:', error);
      setValidationMessage({
        type: 'error',
        message: '❌ 导出失败，请稍后重试'
      });
      
      setTimeout(() => {
        setValidationMessage({ type: '', message: '' });
      }, 3000);
    }
  };

  const getStatistics = () => {
    if (analysisResults.length === 0) return null;
    
    const total = analysisResults.length;
    const dim1Stats = {};
    const dim2Stats = {};
    const dim3Stats = {};

    analysisResults.forEach(result => {
      result.dimension1.forEach(efficacy => {
        dim1Stats[efficacy] = (dim1Stats[efficacy] || 0) + 1;
      });
      const types = Array.isArray(result.dimension2) ? result.dimension2 : [result.dimension2];
      types.forEach(type => {
        dim2Stats[type] = (dim2Stats[type] || 0) + 1;
      });
      dim3Stats[result.dimension3] = (dim3Stats[result.dimension3] || 0) + 1;
    });

    return { total, dim1Stats, dim2Stats, dim3Stats };
  };

  const stats = getStatistics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* 标题区域 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4 flex items-center justify-center gap-3">
              <Brain className="text-blue-600 h-10 w-10" />
              智能学习型化妆品宣称分析器 v2.0
              <Sparkles className="text-purple-600 h-10 w-10" />
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              🧠 AI自我学习优化 | 💡 多功效智能识别 | 📊 置信度评估 | 🎯 用户纠错学习 | 💾 内存存储 | ✨ 用户反馈界面
              <br />
              <span className="text-sm text-blue-600 font-medium">
                💾 数据自动保存到内存中，页面刷新后会重置。建议定期使用"导出数据"功能备份学习成果。
              </span>
            </p>
            {lastSaveTime && (
              <p className="text-sm text-gray-500 mt-2">
                最后保存时间: {lastSaveTime.toLocaleString()}
                {learningData.learningStats && (
                  <span className="ml-4">
                    当前准确率: <span className="font-bold text-green-600">{learningData.learningStats.accuracyRate}%</span>
                  </span>
                )}
              </p>
            )}
          </div>

          {/* 数据管理按钮 */}
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            <button
              onClick={saveLearningData}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Save size={16} />
              手动保存
            </button>
            <button
              onClick={exportLearningData}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Download size={16} />
              导出数据
            </button>
            <label className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm cursor-pointer">
              <Upload size={16} />
              导入数据
              <input
                type="file"
                accept=".json"
                onChange={importLearningData}
                className="hidden"
              />
            </label>
            <button
              onClick={clearLearningData}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <XCircle size={16} />
              清空数据
            </button>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoSaveEnabled}
                onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                className="rounded"
              />
              自动保存
            </label>
          </div>

          {/* 验证消息 */}
          {validationMessage.message && (
            <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
              validationMessage.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {validationMessage.type === 'error' ? <XCircle size={20} /> : <CheckCircle size={20} />}
              {validationMessage.message}
              <button 
                onClick={() => setValidationMessage({ type: '', message: '' })}
                className="ml-auto text-gray-500 hover:text-gray-700"
              >
                <XCircle size={16} />
              </button>
            </div>
          )}

          {/* 输入区域 */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-700 mb-4">
              📝 宣称内容输入 
              <span className="text-red-500 ml-1">*</span>
              <span className="text-gray-500 text-sm font-normal ml-3">（每行一个宣称，AI会持续学习优化）</span>
            </label>
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="请输入宣称内容，每行一个宣称，例如：&#10;&#10;该产品24小时长效保湿，温和不刺激&#10;含有玻尿酸和胶原蛋白，深层滋润紧致肌肤&#10;即刻提亮肌肤，焕发光彩，持久美白&#10;质地丝滑好推开，温和亲肤无刺激&#10;90%用户满意度调查，持续使用效果更佳&#10;美容修饰效果显著，妆容持久不脱妆"
                className="w-full p-6 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 resize-none bg-gray-50/50 backdrop-blur-sm"
                rows="12"
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={handleAutoAnalysis}
              className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold"
            >
              <Sparkles size={24} />
              智能分析
            </button>
            <button
              onClick={clearResults}
              disabled={analysisResults.length === 0}
              className="flex items-center gap-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-8 py-4 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none font-semibold"
            >
              <RotateCcw size={24} />
              清空结果 {analysisResults.length > 0 && `(${analysisResults.length})`}
            </button>
            <button
              onClick={exportToExcel}
              disabled={analysisResults.length === 0}
              className="flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none font-semibold"
            >
              <Download size={24} />
              导出Excel报告
            </button>
            <button
              onClick={() => setShowLearningPanel(!showLearningPanel)}
              className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold"
            >
              <Brain size={24} />
              学习面板
            </button>
          </div>
          
          {/* 功能说明 */}
          <div className="mt-6 text-center">
            <div className="text-sm text-gray-600 max-w-3xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="font-semibold text-blue-600">智能分析</div>
                  <div className="text-xs">分析输入框中的宣称</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-600">清空结果</div>
                  <div className="text-xs">清除所有分析结果</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-green-600">导出报告</div>
                  <div className="text-xs">下载Excel格式报告</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-indigo-600">学习面板</div>
                  <div className="text-xs">查看AI学习进度</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 学习面板 */}
        {showLearningPanel && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Brain className="text-purple-600" />
              AI学习面板 v2.0
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 学习统计 */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  学习统计 v2.0
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">用户纠正次数</span>
                    <span className="font-bold text-purple-600">{learningData.userCorrections?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">新学习关键词</span>
                    <span className="font-bold text-indigo-600">
                      {Object.values(learningData.newKeywords).reduce((total, category) => 
                        total + Object.values(category).reduce((sum, keywords) => sum + keywords.length, 0), 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">冲突记录</span>
                    <span className="font-bold text-orange-600">{learningData.conflictLog?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">已移除关键词</span>
                    <span className="font-bold text-red-600">
                      {Object.values(learningData.removedKeywords || {}).reduce((total, keywords) => total + keywords.length, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">当前准确率</span>
                    <span className="font-bold text-green-600">
                      {learningData.learningStats?.accuracyRate || 100}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">活跃关键词</span>
                    <span className="font-bold text-blue-600">
                      {Object.values(learningData.keywordScores || {}).filter(score => score > 0.3).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* 手动添加关键词 */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  手动添加关键词
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={newKeywordInput}
                    onChange={(e) => setNewKeywordInput(e.target.value)}
                    placeholder="输入新关键词"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">选择类型</option>
                    <option value="功效">功效</option>
                    <option value="类型">类型</option>
                    <option value="持续性">持续性</option>
                  </select>
                  <select 
                    value={selectedEfficacy}
                    onChange={(e) => setSelectedEfficacy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">选择分类</option>
                    {selectedCategory === '功效' && dimension1Options.map(opt => (
                      <option key={opt.code} value={opt.value}>{opt.value}</option>
                    ))}
                    {selectedCategory === '类型' && dimension2Options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.value}</option>
                    ))}
                    {selectedCategory === '持续性' && dimension3Options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.value}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (newKeywordInput.trim() && selectedCategory && selectedEfficacy) {
                        if (learnNewKeyword(newKeywordInput.trim(), selectedCategory, selectedEfficacy)) {
                          setNewKeywordInput('');
                        }
                      } else {
                        setValidationMessage({
                          type: 'error',
                          message: '请填写所有字段'
                        });
                        
                        setTimeout(() => {
                          setValidationMessage({ type: '', message: '' });
                        }, 3000);
                      }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 justify-center"
                  >
                    <Shield size={16} />
                    智能添加
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 统计信息 */}
        {stats && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <BarChart3 className="text-blue-600" />
              智能分析统计
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
                <div className="text-3xl font-bold mb-2">{stats.total}</div>
                <div className="text-blue-100 font-medium">总宣称数</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
                <div className="text-lg font-semibold mb-3">功效分布 TOP5</div>
                <div className="space-y-2 text-sm">
                  {Object.entries(stats.dim1Stats)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="truncate mr-2">{key}</span>
                      <span className="font-bold bg-white/20 px-2 py-1 rounded">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-6 rounded-xl text-white shadow-lg">
                <div className="text-lg font-semibold mb-3">类型分布</div>
                <div className="space-y-2 text-sm">
                  {Object.entries(stats.dim2Stats)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 4)
                    .map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="truncate mr-2">{key}</span>
                      <span className="font-bold bg-white/20 px-2 py-1 rounded">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
                <div className="text-lg font-semibold mb-3">AI学习状态</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span>纠错次数</span>
                    <span className="font-bold bg-white/20 px-2 py-1 rounded">{learningData.userCorrections?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>新关键词</span>
                    <span className="font-bold bg-white/20 px-2 py-1 rounded">
                      {Object.values(learningData.newKeywords).reduce((total, category) => 
                        total + Object.values(category).reduce((sum, keywords) => sum + keywords.length, 0), 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>准确率</span>
                    <span className="font-bold bg-white/20 px-2 py-1 rounded">
                      {learningData.learningStats?.accuracyRate || 100}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 分析结果表格 */}
        {analysisResults.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <TrendingUp className="text-green-600" />
              智能分析结果 v2.0
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-lg font-bold">
                {analysisResults.length}
              </span>
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-lg">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="border-b-2 border-gray-200 px-6 py-4 text-left font-bold text-gray-700">序号</th>
                    <th className="border-b-2 border-gray-200 px-6 py-4 text-left font-bold text-gray-700">宣称内容</th>
                    <th className="border-b-2 border-gray-200 px-6 py-4 text-left font-bold text-gray-700">维度一：功效</th>
                    <th className="border-b-2 border-gray-200 px-6 py-4 text-left font-bold text-gray-700">维度二：类型</th>
                    <th className="border-b-2 border-gray-200 px-6 py-4 text-left font-bold text-gray-700">维度三：持续性</th>
                    <th className="border-b-2 border-gray-200 px-6 py-4 text-left font-bold text-gray-700">置信度</th>
                    <th className="border-b-2 border-gray-200 px-6 py-4 text-left font-bold text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisResults.map((result, index) => (
                    <tr key={result.id} className="hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100">
                      <td className="px-6 py-4 text-sm font-medium text-gray-600">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm max-w-xs">
                        <div className="break-words leading-relaxed text-gray-800">{result.text}</div>
                        {result.matchedKeywords && result.matchedKeywords.length > 0 && (
                          <div className="mt-2 p-2 bg-gray-50 rounded">
                            <span className="text-xs text-gray-600 font-semibold">匹配详情:</span>
                            <div className="mt-1 space-y-1">
                              {result.matchedKeywords.map((mk, idx) => (
                                <div key={idx} className="text-xs flex items-center gap-1">
                                  <span className={`px-1 py-0.5 rounded ${
                                    mk.category === 'dimension1' ? 'bg-blue-50' :
                                    mk.category === 'dimension2' ? 'bg-green-50' :
                                    'bg-purple-50'
                                  }`}>
                                    {mk.category === 'dimension1' ? '功效' :
                                     mk.category === 'dimension2' ? '类型' : '持续性'}
                                  </span>
                                  <span className="text-blue-600 font-medium">"{mk.keyword}"</span>
                                  <span className="text-gray-500">→</span>
                                  <span className={`inline-block px-2 py-0.5 rounded ${
                                    mk.category === 'dimension1' ? getEfficacyColor(mk.result) :
                                    mk.category === 'dimension2' ? getDimension2Color(mk.result) :
                                    getDimension3Color(mk.result)
                                  }`}>
                                    {mk.result}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {editingResult === result.id ? (
                          <div className="space-y-2">
                            <select 
                              multiple
                              className="w-full border rounded p-2 text-xs max-h-20 overflow-y-auto"
                              defaultValue={result.dimension1}
                              onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, option => option.value);
                                setAnalysisResults(prev => prev.map(r => 
                                  r.id === result.id ? { ...r, dimension1: selected } : r
                                ));
                              }}
                            >
                              {dimension1Options.map(opt => (
                                <option key={opt.code} value={opt.value}>{opt.value}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="添加新关键词（可选）"
                              className="w-full border rounded p-1 text-xs"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  const newValues = analysisResults.find(r => r.id === result.id)?.dimension1 || result.dimension1;
                                  handleUserCorrection(result.id, 'dimension1', newValues, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                            />
                            <div className="text-xs text-gray-500">
                              💡 提示：按住Ctrl键可多选功效
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  const currentResult = analysisResults.find(r => r.id === result.id);
                                  if (currentResult) {
                                    handleUserCorrection(result.id, 'dimension1', currentResult.dimension1);
                                    handleUserCorrection(result.id, 'dimension2', currentResult.dimension2);
                                    handleUserCorrection(result.id, 'dimension3', currentResult.dimension3);
                                  }
                                }}
                                className="bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                              >
                                <CheckCircle size={12} />
                                确认修改
                              </button>
                              <button
                                onClick={() => setEditingResult(null)}
                                className="bg-gray-600 text-white px-2 py-1 rounded text-xs"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {result.dimension1.map((efficacy, idx) => (
                              <span
                                key={idx}
                                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getEfficacyColor(efficacy)}`}
                              >
                                {efficacy}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {editingResult === result.id ? (
                          <div className="space-y-2">
                            <select 
                              multiple
                              className="w-full border rounded p-2 text-xs max-h-20 overflow-y-auto"
                              defaultValue={Array.isArray(result.dimension2) ? result.dimension2 : [result.dimension2]}
                              onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, option => option.value);
                                setAnalysisResults(prev => prev.map(r => 
                                  r.id === result.id ? { ...r, dimension2: selected } : r
                                ));
                              }}
                            >
                              {dimension2Options.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.value}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="添加新关键词（可选）"
                              className="w-full border rounded p-1 text-xs"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  const newValue = analysisResults.find(r => r.id === result.id)?.dimension2 || result.dimension2;
                                  handleUserCorrection(result.id, 'dimension2', newValue, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                            />
                            <div className="text-xs text-gray-500">
                              💡 提示：按住Ctrl键可多选类型
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {(Array.isArray(result.dimension2) ? result.dimension2 : [result.dimension2]).map((type, idx) => (
                              <span
                                key={idx}
                                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getDimension2Color(type)}`}
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {editingResult === result.id ? (
                          <div className="space-y-2">
                            <select 
                              className="w-full border rounded p-2 text-xs"
                              defaultValue={result.dimension3}
                              onChange={(e) => {
                                setAnalysisResults(prev => prev.map(r => 
                                  r.id === result.id ? { ...r, dimension3: e.target.value } : r
                                ));
                              }}
                            >
                              {dimension3Options.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.value}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="添加新关键词（可选）"
                              className="w-full border rounded p-1 text-xs"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  const newValue = analysisResults.find(r => r.id === result.id)?.dimension3 || result.dimension3;
                                  handleUserCorrection(result.id, 'dimension3', newValue, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getDimension3Color(result.dimension3)}`}>
                            {result.dimension3}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full" 
                              style={{width: `${result.confidence.dimension1 * 100}%`}}
                            ></div>
                          </div>
                          <span className="text-xs font-medium">
                            {Math.round(result.confidence.dimension1 * 100)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingResult(editingResult === result.id ? null : result.id)}
                            className="bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-blue-700"
                            title="纠错或补充编码"
                          >
                            <Edit size={12} />
                            {editingResult === result.id ? '取消' : '纠错'}
                          </button>
                          <button
                            onClick={() => handleConfirmCorrect(result.id)}
                            className="bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-green-700"
                            title="确认所有维度分析正确"
                          >
                            <ThumbsUp size={12} />
                            全部正确
                          </button>
                        </div>
                        {editingResult === result.id && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                            <div className="font-semibold text-blue-800 mb-1">🔧 纠错指南：</div>
                            <div className="text-blue-700 space-y-1">
                              <div>• <strong>完全错误</strong>：取消选择错误项，选择正确的</div>
                              <div>• <strong>缺漏编码</strong>：保持正确的，再添加遗漏的</div>
                              <div>• <strong>添加关键词</strong>：在输入框中输入新关键词并回车</div>
                              <div>• <strong>多选</strong>：按住Ctrl键可选择多个选项</div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 导出数据模态框 */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl max-h-[80vh] w-full flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Download className="text-green-600" />
                  复制数据到Excel
                </h3>
                <p className="text-gray-600 mt-2">
                  请复制下方数据，然后粘贴到Excel中。数据已按CSV格式整理，Excel会自动识别列格式。
                </p>
              </div>
              <div className="flex-1 p-6 overflow-hidden">
                <textarea
                  value={exportData}
                  readOnly
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none"
                  placeholder="导出数据将显示在这里..."
                />
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-4 justify-end">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(exportData).then(() => {
                      setValidationMessage({
                        type: 'success',
                        message: '✅ 数据已复制到剪贴板！'
                      });
                      setTimeout(() => {
                        setValidationMessage({ type: '', message: '' });
                      }, 3000);
                    }).catch(() => {
                      setValidationMessage({
                        type: 'error',
                        message: '❌ 复制失败，请手动选择复制'
                      });
                    });
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Download size={16} />
                  复制到剪贴板
                </button>
                <button
                  onClick={() => {
                    setShowExportModal(false);
                    setExportData('');
                  }}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 功效类别参考表 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <Eye className="text-indigo-600" />
            功效类别参考表
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-lg">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="border-b-2 border-gray-200 px-4 py-3 text-left font-bold text-gray-700">编号</th>
                  <th className="border-b-2 border-gray-200 px-4 py-3 text-left font-bold text-gray-700">功效类别</th>
                  <th className="border-b-2 border-gray-200 px-4 py-3 text-left font-bold text-gray-700">释义说明</th>
                </tr>
              </thead>
              <tbody>
                {dimension1Options.map((option) => (
                  <tr key={option.code} className="hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-600">{option.code}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${option.color}`}>
                        {option.value}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 leading-relaxed">{option.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartClaimsAnalyzer;