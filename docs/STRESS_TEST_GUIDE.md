# 🔥 DAW 压力测试指南

## 概述

压力测试功能是 DAW 应用中的高级调试工具，用于测试应用在高负载情况下的性能表现。这个功能集成在 Debug 面板中，提供多种测试场景和实时性能监控。

## 🚀 如何访问压力测试

### 1. 打开 Debug 面板
- 点击右上角的 **🐛 Debug Toggle** 按钮
- Debug 面板将在右下角显示

### 2. 启动压力测试
- 在 Debug 面板中点击 **🔥 Show Stress Test** 按钮
- 压力测试面板将出现在 Debug 面板上方

## 🎯 测试类型详解

### 1. **Track Creation Test** (轨道创建测试)
- **目的**: 测试大量轨道创建的性能
- **内容**: 快速创建 5-25 个轨道（MIDI/Audio 交替）
- **适用场景**: 
  - 测试轨道管理性能
  - 验证内存分配效率
  - 检查UI渲染响应速度

```
强度 1: 5 个轨道
强度 2: 10 个轨道  
强度 3: 15 个轨道
强度 4: 20 个轨道
强度 5: 25 个轨道
```

### 2. **Clip Creation Test** (片段创建测试)
- **目的**: 测试大量 MIDI 片段创建的性能
- **内容**: 在随机位置创建 10-50 个 MIDI 片段
- **适用场景**:
  - 测试时间线渲染性能
  - 验证片段管理系统
  - 检查拖拽和选择功能

```
强度 1: 10 个片段
强度 2: 20 个片段
强度 3: 30 个片段
强度 4: 40 个片段
强度 5: 50 个片段
```

### 3. **Note Creation Test** (音符创建测试)
- **目的**: 测试大量 MIDI 音符创建的性能
- **内容**: 在现有片段中添加 20-100 个随机音符
- **适用场景**:
  - 测试 Piano Roll 性能
  - 验证音符渲染效率
  - 检查音频引擎负载

```
强度 1: 20 个音符
强度 2: 40 个音符
强度 3: 60 个音符
强度 4: 80 个音符
强度 5: 100 个音符
```

### 4. **Playback Stress Test** (播放压力测试)
- **目的**: 测试频繁播放/停止操作的稳定性
- **内容**: 执行 2-10 个播放循环，每次随机播放 1-3 秒
- **适用场景**:
  - 测试音频引擎稳定性
  - 验证播放头动画性能
  - 检查状态同步准确性

```
强度 1: 2 个循环
强度 2: 4 个循环
强度 3: 6 个循环
强度 4: 8 个循环
强度 5: 10 个循环
```

### 5. **Scroll Performance Test** (滚动性能测试)
- **目的**: 测试高频滚动和时间线移动的性能
- **内容**: 执行 10-50 次随机滚动和播放头移动
- **适用场景**:
  - 测试PIXI.js渲染性能
  - 验证视口裁剪效果
  - 检查滚动流畅度

```
强度 1: 10 次滚动操作
强度 2: 20 次滚动操作
强度 3: 30 次滚动操作
强度 4: 40 次滚动操作
强度 5: 50 次滚动操作
```

### 6. **Memory Stress Test** (内存压力测试)
- **目的**: 测试内存分配和垃圾回收性能
- **内容**: 快速创建和销毁大量对象，触发垃圾回收
- **适用场景**:
  - 检测内存泄漏
  - 验证对象池效果
  - 测试垃圾回收性能

```
强度 1: 5 次内存操作
强度 2: 10 次内存操作
强度 3: 15 次内存操作
强度 4: 20 次内存操作
强度 5: 25 次内存操作
```

### 7. **🔥 Full Stress Test** (完整压力测试)
- **目的**: 综合测试所有系统的整体性能
- **内容**: 依次执行上述所有测试
- **适用场景**:
  - 全面性能评估
  - 发布前质量检查
  - 硬件兼容性测试

## 📊 性能指标说明

### 实时监控指标

#### **FPS (帧率)**
- **绿色 (>50)**: 性能优秀
- **黄色 (30-50)**: 性能一般
- **红色 (<30)**: 性能问题

#### **Memory (内存使用)**
- 显示当前 JavaScript 堆内存使用量
- 单位：MB
- 监控是否有内存泄漏趋势

#### **Tracks/Clips 计数**
- 实时显示当前轨道和片段数量
- 帮助了解当前项目复杂度

### 测试日志

#### **日志颜色编码**
- **🟢 绿色**: 成功完成的操作
- **🔴 红色**: 错误或失败的操作  
- **🟡 黄色**: 警告或注意事项
- **🟣 紫色**: 重要里程碑事件

#### **日志内容**
- 测试开始/结束时间
- 各个阶段的进度信息
- 错误和异常报告
- 性能警告和建议

## 🎛️ 使用最佳实践

### 测试前准备
1. **清空项目**: 在空项目中测试可获得最准确的基准性能
2. **关闭其他应用**: 确保系统资源充足
3. **检查内存**: 确认当前内存使用处于正常水平

### 测试强度选择
- **强度 1-2**: 日常性能检查
- **强度 3**: 中等负载测试
- **强度 4-5**: 极限性能测试（可能导致暂时卡顿）

### 测试顺序建议
1. 从低强度开始测试
2. 观察性能指标变化
3. 逐步增加强度
4. 在出现性能问题时停止

## 🚨 常见问题与解决方案

### Q: 测试期间界面卡顿怎么办？
**A**: 
- 点击 **⏹️ Stop** 按钮停止测试
- 降低测试强度重新开始
- 检查系统资源使用情况

### Q: FPS 显示 "--" 是什么意思？
**A**: 
- 表示性能监控尚未收集到足够数据
- 等待几秒钟后指标会正常显示
- 确保渲染器已完全初始化

### Q: 内存使用量持续增长怎么办？
**A**: 
- 可能存在内存泄漏
- 运行内存压力测试检查垃圾回收
- 清空项目并重新开始测试

### Q: 测试失败显示错误怎么办？
**A**: 
- 检查浏览器控制台详细错误信息
- 确保项目处于正常状态
- 尝试降低测试强度

## 🔧 高级功能

### 性能数据导出
```typescript
// 在浏览器控制台中运行
import { PerformanceMonitor } from './ui/utils/PerformanceOptimizations';

// 获取详细性能数据
const metrics = PerformanceMonitor.getMetrics();
console.log('Performance Data:', JSON.stringify(metrics, null, 2));

// 导出为文件
const blob = new Blob([JSON.stringify(metrics, null, 2)], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'daw-performance-metrics.json';
a.click();
```

### 自定义压力测试
```typescript
// 创建自定义测试脚本
const customStressTest = async () => {
  const stressTest = document.querySelector('[data-stress-test]');
  if (stressTest) {
    // 自定义测试逻辑
    for (let i = 0; i < 10; i++) {
      await createTrack(`Custom Track ${i}`, 'midi');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
};
```

### 自动化性能回归测试
```typescript
// 性能回归检测脚本
const performanceRegression = {
  baseline: { fps: 60, memory: 50 * 1024 * 1024 }, // 50MB
  
  async runRegressionTest() {
    const beforeMetrics = PerformanceMonitor.getMetrics();
    
    // 运行标准压力测试
    await this.runStandardStressTest();
    
    const afterMetrics = PerformanceMonitor.getMetrics();
    
    // 比较性能差异
    const fpsDropped = beforeMetrics.fps - afterMetrics.fps;
    const memoryIncrease = afterMetrics.memory - beforeMetrics.memory;
    
    return {
      passed: fpsDropped < 10 && memoryIncrease < 20 * 1024 * 1024,
      fpsDropped,
      memoryIncrease
    };
  }
};
```

## 📈 性能优化建议

### 基于测试结果的优化方向

#### **FPS 过低 (<30)**
1. 启用对象池功能
2. 减少渲染对象数量
3. 优化 PIXI.js 渲染管道
4. 实施视口裁剪

#### **内存使用过高**
1. 检查对象生命周期管理
2. 优化缓存策略
3. 手动触发垃圾回收
4. 减少事件监听器数量

#### **音频延迟问题**
1. 优化音频缓冲区大小
2. 减少音频处理复杂度
3. 使用 Web Workers 处理音频
4. 优化 MIDI 事件调度

## 🎉 结语

压力测试功能是确保 DAW 应用性能和稳定性的重要工具。通过定期运行这些测试，你可以：

- **及早发现性能瓶颈**
- **验证优化效果**
- **确保用户体验质量**
- **预防生产环境问题**

建议在每次重大更新后都运行完整的压力测试，确保应用始终保持最佳性能状态。

---

**注意**: 压力测试可能会暂时影响应用性能，建议在开发和测试环境中使用，避免在生产环境中运行高强度测试。 