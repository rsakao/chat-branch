#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';

// README ファイルのパス
const README_EN = path.join(process.cwd(), 'README.md');
const README_JA = path.join(process.cwd(), 'README.ja.md');

// OpenAI APIを使用して翻訳する関数
async function translateWithOpenAI(text) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = `Please translate the following README content from English to Japanese. Maintain the markdown formatting, code blocks, and structure exactly. Do not translate code examples, file names, or technical terms that should remain in English. Translate only the descriptive text and comments:\n\n${text}`;

  try {
    console.log('OpenAI APIで翻訳を実行中...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional technical translator. Maintain exact markdown formatting and structure while translating only the descriptive content.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 4000,
      temperature: 0.3,
    });

    return response.choices[0].message.content;
  } catch (error) {
    throw new Error(`翻訳に失敗しました: ${error.message}`);
  }
}

// READMEコンテンツを正規化する（言語選択リンクを標準化）
function normalizeReadmeContent(content) {
  const languageLinks = '[English](README.md) | [日本語](README.ja.md)';
  
  // 言語選択リンクを統一
  const lines = content.split('\n');
  if (lines.length > 2 && lines[2].includes('[English]') && lines[2].includes('[日本語]')) {
    lines[2] = languageLinks;
  }
  
  return lines.join('\n');
}

// メイン関数
async function syncReadme() {
  console.log('📖 README.mdの翻訳を開始します...');

  try {
    // ファイルの存在確認
    if (!fs.existsSync(README_EN)) {
      throw new Error('README.md が見つかりません');
    }

    // README.mdの内容を読み込み
    console.log('📄 README.mdを読み込んでいます...');
    const enContent = fs.readFileSync(README_EN, 'utf8');

    // 英語版を日本語に翻訳
    console.log('🔄 英語版READMEを日本語に翻訳しています...');
    const translatedContent = await translateWithOpenAI(enContent);
    const normalizedContent = normalizeReadmeContent(translatedContent);
    
    // README.ja.mdに書き込み
    fs.writeFileSync(README_JA, normalizedContent);
    console.log('✅ README.ja.md を更新しました');

    console.log('🎉 README翻訳が完了しました');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  syncReadme();
}

export { syncReadme };