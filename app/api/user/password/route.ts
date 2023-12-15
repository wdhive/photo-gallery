import { checkPassword, sendUserAndToken } from '/server/next/middlewares/auth'
import { authRouter } from '/server/next/router'
import service from '/service'

export const PATCH = authRouter(
  checkPassword,
  async (_, ctx, next) => {
    const { newPassword } = ctx.data
    if (!newPassword) throw new Error('New password is required')
    ctx.user = await service.user.changePassword(ctx.user.id, newPassword)
    return next()
  },
  sendUserAndToken
)
