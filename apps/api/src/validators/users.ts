import { z } from 'zod'

export const inviteUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  role: z.enum(['manager', 'operator', 'accountant']),
})

export const updateUserRoleSchema = z.object({
  role: z.enum(['manager', 'operator', 'accountant']),
})

export type InviteUserInput = z.infer<typeof inviteUserSchema>
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>
