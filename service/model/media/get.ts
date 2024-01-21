import { MEDIA_INCLUDE_QUERY } from '@/service/config'
import db, { ContentStatus, Media, Prisma, User } from '@/service/db'
import { PrettifyPick } from '@/service/utils'
import ReqErr from '@/service/ReqError'
import { MediaWithReactionCountRaw } from '@/service/types'
import { PaginationQueries, paginationQueries } from '@/service/helpers'
import { mediaPermissionFactory, mediaSearchQueryOR } from './helpers'
import { userPermissionFactory } from '../helpers'

export async function getMedia(
  id: string,
  user?: PrettifyPick<User, 'id' | 'role'>
) {
  const media = await db.media.findUnique({
    where: { id },
    include: MEDIA_INCLUDE_QUERY,
  })

  if (media && mediaPermissionFactory(media).view(user)) return media
  throw new ReqErr('Media not found')
}

export async function getRelatedMedia(
  media: PrettifyPick<
    Media,
    'id',
    'title' | 'tags' | 'description' | 'categoryId'
  >,
  take = 9
) {
  const related: MediaWithReactionCountRaw[] = []
  const whereQuery: Prisma.MediaWhereInput[] = []

  if (media.tags?.length) {
    whereQuery.push({ tags: { hasEvery: media.tags } })
  }

  if (media.title) {
    whereQuery.push({
      title: {
        contains: media.title,
        mode: 'insensitive' as const,
      },
    })
  }

  if (media.description) {
    whereQuery.push({
      description: {
        contains: media.description,
        mode: 'insensitive' as const,
      },
    })
  }

  if (media.tags?.length) {
    whereQuery.push({ tags: { hasSome: media.tags } })
  }

  if (media.categoryId) {
    whereQuery.push({ categoryId: media.categoryId })
  }

  for (const where of whereQuery) {
    const remaining = take - related.length
    if (remaining <= 0) break

    const matchedMediaList = await db.media.findMany({
      take: remaining,
      include: MEDIA_INCLUDE_QUERY,
      orderBy: { createdAt: 'desc' },
      where: {
        ...where,
        status: 'APPROVED',
        id: { not: { in: [media.id, ...related.map((media) => media.id)] } },
      },
    })

    related.push(...matchedMediaList)
  }

  return related
}

export type MediaListOptions = PaginationQueries & {
  category?: string
  authorId?: string
  status?: ContentStatus
  search?: string
  updateRequest?: string
}

export async function getLatestMediaList(
  user?: PrettifyPick<User, 'id' | 'role'>,
  options: MediaListOptions = {}
) {
  const isMediaAuthor = Boolean(
    user && options.authorId && options.authorId === user.id
  )

  const isModerator = Boolean(
    user && userPermissionFactory(user).isModeratorLevel
  )

  if (!(isMediaAuthor || isModerator)) {
    options.status = 'APPROVED'
  }

  if (
    options.updateRequest &&
    !(isMediaAuthor || (options.authorId && isModerator))
  ) {
    throw new ReqErr('Permission denied to get pending updates')
  }

  if (!options.authorId) options.status ??= 'APPROVED'

  const orQueries = mediaSearchQueryOR(options.search)
  return db.media.findMany({
    ...paginationQueries({
      orderByKey: 'createdAt',
      orderBy: 'desc',
      ...options,
    }),

    where: {
      status: options.status,
      authorId: options.authorId,
      categoryId: options.category,
      ...(orQueries.length ? { OR: orQueries } : undefined),
    },

    include: {
      ...MEDIA_INCLUDE_QUERY,
      updateRequest: options.updateRequest === 'true',
    },
  })
}

export async function getBackup(cursor?: string, take = 20000) {
  const mediaList = await db.media.findMany({
    take,
    where: {},
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : undefined),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      url_media: true,
    },
  })

  return mediaList
}
