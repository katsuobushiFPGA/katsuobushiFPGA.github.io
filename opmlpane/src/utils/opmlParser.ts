import type { OpmlData, OpmlOutline, LinkCategory, LinkItem } from '../types/opml'

/**
 * OPML XMLテキストをパースしてOpmlDataを返す
 */
export function parseOpml(xmlText: string): OpmlData {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'application/xml')

  // パースエラーチェック
  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    throw new Error('OPMLファイルのパースに失敗しました: ' + parseError.textContent)
  }

  const head = doc.querySelector('head')
  const body = doc.querySelector('body')

  if (!body) {
    throw new Error('OPML body要素が見つかりません')
  }

  const title = head?.querySelector('title')?.textContent || 'OPML Links'
  const dateCreated = head?.querySelector('dateCreated')?.textContent || undefined
  const dateModified = head?.querySelector('dateModified')?.textContent || undefined
  const ownerName = head?.querySelector('ownerName')?.textContent || undefined
  const ownerEmail = head?.querySelector('ownerEmail')?.textContent || undefined

  const outlines = parseOutlines(body)

  return {
    title,
    dateCreated,
    dateModified,
    ownerName,
    ownerEmail,
    outlines
  }
}

/**
 * outline要素を再帰的にパース
 */
function parseOutlines(parent: Element): OpmlOutline[] {
  const outlineElements = parent.querySelectorAll(':scope > outline')
  const outlines: OpmlOutline[] = []

  outlineElements.forEach(el => {
    const outline: OpmlOutline = {
      text: el.getAttribute('text') || el.getAttribute('title') || '',
      title: el.getAttribute('title') || undefined,
      type: el.getAttribute('type') || undefined,
      xmlUrl: el.getAttribute('xmlUrl') || undefined,
      htmlUrl: el.getAttribute('htmlUrl') || undefined,
      description: el.getAttribute('description') || undefined,
      children: parseOutlines(el)
    }
    outlines.push(outline)
  })

  return outlines
}

/**
 * OpmlDataをカテゴリ分けされたLinkCategory配列に変換
 * フォルダ構造を持つoutlineをカテゴリとして扱う
 */
export function convertToCategories(opmlData: OpmlData): LinkCategory[] {
  const categories: LinkCategory[] = []

  for (const outline of opmlData.outlines) {
    if (outline.children.length > 0) {
      // 子要素があるものをカテゴリとして扱う
      const links = extractLinks(outline.children)
      if (links.length > 0) {
        categories.push({
          name: outline.text || outline.title || 'Unnamed',
          links
        })
      }
      // ネストされたカテゴリも再帰的に処理
      const nestedCategories = extractNestedCategories(outline.children, outline.text)
      categories.push(...nestedCategories)
    } else if (outline.htmlUrl || outline.xmlUrl) {
      // トップレベルのリンクは「その他」カテゴリへ
      let otherCategory = categories.find(c => c.name === 'その他')
      if (!otherCategory) {
        otherCategory = { name: 'その他', links: [] }
        categories.push(otherCategory)
      }
      otherCategory.links.push(outlineToLink(outline))
    }
  }

  return categories
}

/**
 * ネストされたカテゴリを抽出
 */
function extractNestedCategories(outlines: OpmlOutline[], _parentName?: string): LinkCategory[] {
  const categories: LinkCategory[] = []

  for (const outline of outlines) {
    if (outline.children.length > 0 && !outline.htmlUrl && !outline.xmlUrl) {
      const links = extractLinks(outline.children)
      if (links.length > 0) {
        categories.push({
          name: outline.text || outline.title || 'Unnamed',
          links
        })
      }
      const nested = extractNestedCategories(outline.children, outline.text)
      categories.push(...nested)
    }
  }

  return categories
}

/**
 * outline配列からリンク項目のみを抽出
 */
function extractLinks(outlines: OpmlOutline[]): LinkItem[] {
  const links: LinkItem[] = []

  for (const outline of outlines) {
    if (outline.htmlUrl || outline.xmlUrl) {
      links.push(outlineToLink(outline))
    }
  }

  return links
}

/**
 * OutlineをLinkItemに変換
 */
function outlineToLink(outline: OpmlOutline): LinkItem {
  return {
    title: outline.text || outline.title || 'Untitled',
    url: outline.htmlUrl || outline.xmlUrl || '#',
    description: outline.description,
    feedUrl: outline.xmlUrl
  }
}
