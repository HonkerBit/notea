import { StorePath } from '../path'

export interface StoreProviderConfig {
  prefix?: string
}

export interface ObjectOptions {
  meta?: Map<string, any>
  contentType?: string
  headers?: {
    cacheControl?: string
    contentDisposition?: string
    contentEncoding?: string
  }
}

export abstract class StoreProvider {
  constructor({ prefix }: StoreProviderConfig) {
    this.prefix = prefix
    this.path = new StorePath(prefix)
  }

  prefix?: string

  path: StorePath

  /**
   * 获取签名 URL
   */
  abstract getSignUrl(path: string): Promise<string | null>

  /**
   * 检测对象是否存在
   */
  abstract hasObject(path: string): Promise<boolean>

  /**
   * 获取对象内容
   * @returns content
   */
  abstract getObject(
    path: string,
    isCompressed?: boolean
  ): Promise<string | undefined>

  /**
   * 获取对象 Meta
   * @returns meta
   */
  abstract getObjectMeta(path: string): Promise<Map<string, string> | undefined>

  /**
   * 获取对象和对象 Meta
   * @returns [content, meta]
   */
  abstract getObjectAndMeta(
    path: string,
    metaKeys: string[],
    isCompressed?: boolean
  ): Promise<{
    content?: string
    meta?: Map<string, string>
  }>

  /**
   * 存储对象
   */
  abstract putObject(
    path: string,
    raw: string | Buffer,
    headers?: ObjectOptions,
    isCompressed?: boolean
  ): Promise<void>

  /**
   * 删除对象
   */
  abstract deleteObject(path: string): Promise<void>

  /**
   * 复制对象，可用于更新 meta
   */
  abstract copyObject(
    fromPath: string,
    toPath: string,
    options: ObjectOptions
  ): Promise<void>

  /**
   * 页面列表
   * - 私有读
   */
  async getList() {
    const content = (await this.getObject(this.path.getPageIndex())) || ''
    const list = content.split(',').filter(Boolean)

    return list
  }

  /**
   * 增加到列表
   */
  async addToList(pageId: string) {
    pageId = pageId.toString()

    const indexPath = this.path.getPageIndex()
    let content = (await this.getObject(indexPath)) || ''
    const ids = content.split(',')

    if (!ids.includes(pageId)) {
      ids.push(pageId)
    }

    content = ids.filter(Boolean).join(',')
    await this.putObject(indexPath, content)
  }

  /**
   * 从列表移除
   */
  async removeFromList(pageId: string) {
    const indexPath = this.path.getPageIndex()
    let content = (await this.getObject(indexPath)) || ''
    const ids = content.split(',')

    content = ids.filter((id) => id !== pageId).join(',')
    await this.putObject(indexPath, content)
  }
}
