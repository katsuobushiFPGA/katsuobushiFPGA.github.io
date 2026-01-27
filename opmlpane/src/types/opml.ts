// OPML の outline 要素を表す型
export interface OpmlOutline {
  text: string
  title?: string
  type?: string
  xmlUrl?: string
  htmlUrl?: string
  description?: string
  children: OpmlOutline[]
}

// パース済み OPML データ
export interface OpmlData {
  title: string
  dateCreated?: string
  dateModified?: string
  ownerName?: string
  ownerEmail?: string
  outlines: OpmlOutline[]
}

// カテゴリ（フォルダ）として表示するためのグループ
export interface LinkCategory {
  name: string
  links: LinkItem[]
}

// 個別のリンク項目
export interface LinkItem {
  title: string
  url: string
  description?: string
  feedUrl?: string
}
