# 🎵 BPM功能测试指南

## 访问测试页面

1. **启动应用**: `npm run dev`
2. **访问测试页面**: 
   - 主页面点击 "🧪 BPM測試" 按钮
   - 或直接访问: `http://localhost:3007/bpm-test`

## 测试功能说明

### 📊 实时状态监控

测试页面顶部显示4个实时状态卡片：

1. **UI BPM**: 当前用户界面中的BPM值
2. **Adapter BPM**: MusicArrangementAdapter中的实际BPM值
3. **Seconds/Beat**: 基于当前BPM计算的每拍秒数
4. **Playback Status**: 播放引擎状态（播放/停止）

> ✅ **正常状态**: UI BPM = Adapter BPM (显示绿色)
> ❌ **异常状态**: UI BPM ≠ Adapter BPM (显示红色)

### 🧪 自动化测试

#### 单独测试功能:

1. **Test BPM Sync**: 测试adapter的setBPM和getBPM方法
2. **Test UI Integration**: 测试UI变更是否正确同步到adapter
3. **Test Timing Calc**: 测试BPM到时间计算的准确性
4. **Test Range Validation**: 测试BPM范围限制（60-200）
5. **Test Playback Integration**: 测试播放引擎BPM集成

#### 完整测试:
- 点击 "🧪 Run All Tests" 运行所有测试
- 测试结果实时显示，绿色✅表示通过，红色❌表示失败

### 🎚️ 手动BPM测试

测试页面提供多种BPM控制方式：

1. **滑块控制**: 拖动滑块设置BPM (60-200)
2. **数字输入**: 直接输入BPM值
3. **预设按钮**: 快速设置常用BPM值 (80, 120, 140, 180)

### 📋 测试结果解读

每个测试结果包含：
- **测试名称**: 具体测试项目
- **Expected**: 期望值
- **Actual**: 实际值
- **状态**: ✅通过 / ❌失败
- **时间戳**: 测试执行时间

## 常见问题排查

### 问题1: Adapter BPM显示"N/A"
**可能原因**: MusicArrangementAdapter未正确初始化
**解决方案**: 
- 检查useMusicArrangement hook是否正常工作
- 确认adapter实例存在

### 问题2: UI BPM与Adapter BPM不同步
**可能原因**: handleTempoChange函数未正确调用adapter.setBPM
**解决方案**:
- 检查DAWInterface.tsx中的handleTempoChange实现
- 确认adapter实例可用

### 问题3: 播放速度与BPM不符
**可能原因**: 播放引擎未使用adapter的BPM值
**解决方案**:
- 检查startPlaybackEngine中的getSecondsPerBeat计算
- 确认播放引擎使用正确的this.bpm值

### 问题4: BPM范围验证失败
**可能原因**: setBPM方法未正确限制范围
**解决方案**:
- 检查MusicArrangementAdapter.setBPM方法的Math.max/Math.min实现

## 调试技巧

1. **开启开发者工具**: F12查看Console日志
2. **观察状态变化**: 测试页面实时显示状态变化
3. **逐项测试**: 先运行单独测试，确定问题范围
4. **手动验证**: 使用滑块和输入框手动测试BPM同步

## 测试场景建议

### 基本功能测试
1. 设置BPM为120，检查所有值是否同步
2. 使用滑块调整BPM，观察实时更新
3. 输入极值（60, 200），验证范围限制

### 边界条件测试
1. 输入小于60的值，应被限制为60
2. 输入大于200的值，应被限制为200
3. 输入非数字值，应有合理处理

### 集成测试
1. 修改BPM后开始播放，验证播放速度
2. 播放过程中修改BPM，验证实时生效
3. 停止播放后修改BPM，验证下次播放使用新值

## 成功标准

✅ **所有自动化测试通过**
✅ **UI与Adapter BPM实时同步**
✅ **播放速度与BPM设置相符**
✅ **BPM范围限制正常工作**
✅ **各种输入方式都能正确设置BPM**

---

如果所有测试都通过，说明BPM功能运作正常！🎉 