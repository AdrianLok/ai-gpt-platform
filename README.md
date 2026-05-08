# AI GPT Platform MVP

这是一个最小可运行版本：网页输入内容，后端调用 OpenAI GPT，返回结果。

## 运行步骤

```bash
npm install
cp .env.example .env.local
```

把 `.env.local` 里的 `OPENAI_API_KEY` 改成你的 OpenAI API Key。

```bash
npm run dev
```

打开：

```bash
http://localhost:3000
```

## 部署到 Vercel

1. 上传到 GitHub
2. Vercel 导入项目
3. 在 Vercel 项目 Settings → Environment Variables 添加：
   - `OPENAI_API_KEY`
4. 重新部署

## 下一步可扩展

- 用户登录
- 会员套餐
- 积分扣费
- 图片生成
- 生成历史
- 支付系统
- 后台管理
