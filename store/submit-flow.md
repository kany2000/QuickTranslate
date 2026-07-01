# QuickTranslate Module Submission Guide

## 两种提交方式

---

## 方式 A：通过 GitHub Issues 提交（推荐）

### 适用人群
有 GitHub 账号的用户。无需编程知识，通过网页表单即可提交。

### 提交步骤

```
1. 准备你的 .qt-module 文件
   ├── 用 CLI 工具生成模板
   │   └── node packages/create-qt-module/index.js
   └── 修改 translate() 方法，实现翻译逻辑
   
2. 打开提交页面
   └── https://github.com/kany2000/QuickTranslate/issues/new
   
3. 填写模板表单
   ├── 模块名称（必填）
   ├── 模块 ID（必填，如 engine-deepl）
   ├── 模块类型（必填：translator/mode/renderer/processor/service/theme）
   ├── 版本号（必填）
   ├── 作者（必填，你的 GitHub 用户名）
   ├── 描述（必填，简短说明功能）
   ├── 下载链接（必填，你的 .qt-module 文件 URL）
   └── 截图/说明（可选）

4. 提交 Issue
   └── 管理员收到通知，开始审核
```

### 审核流程

```
提交 Issue
    ↓
管理员检查 manifest 完整性
    ├── id/name/version/author/type 是否齐全
    ├── minAppVersion 是否兼容
    └── permissions 是否合理
    ↓
管理员测试模块功能
    ├── 导入 QuickTranslate
    ├── 验证 onActivate/onDeactivate
    └── 验证 translate() 正常工作
    ↓
合并到 Store
    ├── 管理员将 .qt-module 放入 store/ 目录
    ├── 更新 store/modules.json
    └── Issue 关闭，模块上线
```

### 审核标准

| 检查项 | 说明 |
|---|---|
| 安全性 | 代码不能包含恶意逻辑（数据窃取、挖矿等） |
| 兼容性 | minAppVersion >= 2.5.3 |
| 完整性 | manifest 所有必填字段齐全 |
| 功能性 | translate() 能正常返回结果 |
| 合规性 | 不侵犯第三方版权 |

### 预计时间

审核通常需要 **1-3 个工作日**。

---

## 方式 B：通过 GitHub OAuth 直接创建 PR（高级）

### 适用人群
熟悉 Git 和 GitHub 的开发者和进阶用户。

### 前置条件

需要先在 GitHub 上授权 QuickTranslate 访问你的仓库权限。

### 提交步骤

```
1. 点击「登录 GitHub」
   ├── 浏览器跳转到 GitHub OAuth 授权页
   └── 授权 QuickTranslate 访问你的公开仓库

2. 上传模块文件
   ├── 选择你本地的 .qt-module 文件
   ├── 系统自动验证 manifest 完整性
   └── 系统自动 fork 仓库并创建新分支

3. 确认提交
   ├── 预览 Pull Request 内容
   ├── 确认无误后点击「提交 PR」
   └── 系统自动创建 Pull Request

4. 等待审核
   └── 管理员审查后合并，模块上线
```

### 优势

- 无需手动填写表单
- 自动验证 manifest 完整性
- 可以直接在 PR 中看到变更内容
- 审核通过后自动合并

### 注意事项

- 需要 GitHub 账号
- OAuth 授权仅用于创建 fork 和 PR，不会修改你的其他仓库
- 如需解除授权，可在 GitHub Settings → Applications 中取消

---

## 两种方式对比

| 对比项 | 方式 A (Issues) | 方式 B (OAuth) |
|---|---|---|
| 操作复杂度 | ⭐ 简单 | ⭐⭐ 中等 |
| GitHub 账号 | 需要 | 需要 |
| OAuth 授权 | 不需要 | 需要 |
| 表单填写 | 手动填写 | 自动生成 |
| 文件上传 | 自行托管 | 直接提交 |
| 审核流程 | 管理员手动 | 管理员手动 |
| 适用人群 | 所有用户 | 开发者 |

---

## 模块文件托管

如果选择方式 A，你的 .qt-module 文件需要托管在可公开访问的 URL 上。推荐方式：

1. **上传到 GitHub Releases**（推荐）
   ```bash
   # 在你的仓库创建 Release
   gh release create v1.0.0 your-module.qt-module
   ```

2. **上传到自己的服务器**
3. **上传到网盘**（提供直接下载链接）
