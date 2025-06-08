#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// README ファイルのパス
const README_EN = path.join(process.cwd(), 'README.md');
const README_JA = path.join(process.cwd(), 'README.ja.md');
const CACHE_FILE = path.join(process.cwd(), '.readme-cache.json');

// ハッシュを計算する関数
function calculateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// キャッシュファイルを読み込む
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    }
  } catch (error) {
    console.warn('キャッシュファイルの読み込みに失敗:', error.message);
  }
  return { enHash: '', jaHash: '' };
}

// キャッシュファイルを保存する
function saveCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error('キャッシュファイルの保存に失敗:', error.message);
  }
}

// OpenAI APIを使用して翻訳する関数
async function translateWithOpenAI(text, targetLang) {
  const { OpenAI } = require('openai');
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = targetLang === 'ja' 
    ? `Please translate the following README content from English to Japanese. Maintain the markdown formatting, code blocks, and structure exactly. Do not translate code examples, file names, or technical terms that should remain in English. Translate only the descriptive text and comments:\n\n${text}`
    : `Please translate the following README content from Japanese to English. Maintain the markdown formatting, code blocks, and structure exactly. Do not translate code examples, file names, or technical terms. Translate only the descriptive text and comments:\n\n${text}`;

  try {
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
function normalizeReadmeContent(content, lang) {
  const languageLinks = lang === 'ja' 
    ? '[English](README.md) | [日本語](README.ja.md)'
    : '[English](README.md) | [日本語](README.ja.md)';
  
  // 言語選択リンクを統一
  const lines = content.split('\n');
  if (lines.length > 2 && lines[2].includes('[English]') && lines[2].includes('[日本語]')) {
    lines[2] = languageLinks;
  }
  
  return lines.join('\n');
}

// メイン関数
async function syncReadmes() {
  console.log('📖 README 同期を開始します...');

  try {
    // ファイルの存在確認
    if (!fs.existsSync(README_EN)) {
      throw new Error('README.md が見つかりません');
    }
    if (!fs.existsSync(README_JA)) {
      throw new Error('README.ja.md が見つかりません');
    }

    // ファイル内容を読み込み
    const enContent = fs.readFileSync(README_EN, 'utf8');
    const jaContent = fs.readFileSync(README_JA, 'utf8');

    // ハッシュを計算
    const enHash = calculateHash(enContent);
    const jaHash = calculateHash(jaContent);

    // キャッシュを読み込み
    const cache = loadCache();

    // 変更があったファイルを確認
    const enChanged = enHash !== cache.enHash;
    const jaChanged = jaHash !== cache.jaHash;

    if (!enChanged && !jaChanged) {
      console.log('✅ README ファイルに変更はありません');
      return;
    }

    if (enChanged && jaChanged) {
      console.log('⚠️  両方のREADMEファイルが変更されています。手動で確認してください。');
      return;
    }

    // 英語版が変更された場合、日本語版を更新
    if (enChanged) {
      console.log('🔄 英語版READMEの変更を検出しました。日本語版を更新します...');
      
      const translatedContent = await translateWithOpenAI(enContent, 'ja');
      const normalizedContent = normalizeReadmeContent(translatedContent, 'ja');
      
      fs.writeFileSync(README_JA, normalizedContent);
      console.log('✅ README.ja.md を更新しました');
    }

    // 日本語版が変更された場合、英語版を更新
    if (jaChanged) {
      console.log('🔄 日本語版READMEの変更を検出しました。英語版を更新します...');
      
      const translatedContent = await translateWithOpenAI(jaContent, 'en');
      const normalizedContent = normalizeReadmeContent(translatedContent, 'en');
      
      fs.writeFileSync(README_EN, normalizedContent);
      console.log('✅ README.md を更新しました');
    }

    // 新しいハッシュでキャッシュを更新
    const newEnContent = fs.readFileSync(README_EN, 'utf8');
    const newJaContent = fs.readFileSync(README_JA, 'utf8');
    
    saveCache({
      enHash: calculateHash(newEnContent),
      jaHash: calculateHash(newJaContent),
    });

    console.log('🎉 README 同期が完了しました');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合
if (require.main === module) {
  syncReadmes();
}

module.exports = { syncReadmes };