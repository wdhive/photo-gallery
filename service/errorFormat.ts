import {
  PrismaClientValidationError,
  PrismaClientKnownRequestError,
} from '@prisma/client/runtime/library'
import ReqErr from './ReqError'

export default function errorFormat(err: any): [string, number] {
  try {
    if (process.env.NODE_ENV !== 'production') log(err)
  } catch {}

  if (err instanceof ReqErr) {
    return [err.message, err.statusCode ?? 400]
  }

  if (
    err instanceof PrismaClientKnownRequestError ||
    err instanceof PrismaClientValidationError
  ) {
    const message = err.message.split('\n').pop() ?? err.message

    if ('code' in err)
      switch (err.code) {
        case 'P2002':
          return ['This already exists!', 409]

        case 'P2025':
          return ['This does not exist!', 404]
      }

    return [message, 400]
  }

  log(err)
  return ['Something went wrong!', 500]
}

function log(err: Error) {
  console.log('\n\n\n\n\n', err, '\n\n\n\n\n')
}
