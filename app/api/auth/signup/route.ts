import { NextResponse } from 'next/server'
import { router } from '/server/next/router'
import service from '/service'

export type PostBody = { email: string }
export type PostData = { message: string }
export const POST = router(async (req) => {
  const { email } = (await req.json()) as PostBody
  await service.auth.signup(email)
  return NextResponse.json<PostData>({ message: 'Check your email' })
})
