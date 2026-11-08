import { Router } from 'express'
import { requireSession, requireCsrf } from '../middlewares/session.js'
import * as controller from '../controllers/finance.js'

/** Agrupa endpoints financieros: todas las lecturas exigen sesión y las mutaciones también CSRF. */
export const financeRoutes = Router()
financeRoutes.use(requireSession)
financeRoutes.use((request, response, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return requireCsrf(request, response, next)
  next()
})
financeRoutes.route('/spaces').get(controller.listSpaces).post(controller.createSpace)
financeRoutes.route('/spaces/:id').get(controller.getSpace).patch(controller.updateSpace).delete(controller.deleteSpace)
financeRoutes.get('/spaces/:id/members', controller.members)
financeRoutes.post('/spaces/:id/invitations', controller.invite)
financeRoutes.get('/invitations', controller.invitations)
financeRoutes.post('/invitations/:token/accept', controller.respond(true))
financeRoutes.post('/invitations/:token/reject', controller.respond(false))
financeRoutes.route('/categories').get(controller.listCategories).post(controller.createCategory)
financeRoutes.route('/categories/:id').patch(controller.updateCategory).delete(controller.deleteCategory)
financeRoutes.route('/expenses').get(controller.expenses).post(controller.createExpense)
financeRoutes.route('/expenses/:id').get(controller.getExpense).patch(controller.updateExpense).delete(controller.deleteExpense)
financeRoutes.get('/spaces/:id/expenses', controller.expenses)
financeRoutes.route('/incomes').get(controller.incomes).post(controller.createIncome)
financeRoutes.route('/incomes/:id').get(controller.getIncome).patch(controller.updateIncome).delete(controller.deleteIncome)
financeRoutes.get('/spaces/:id/incomes', controller.incomes)
financeRoutes.get('/spaces/:id/balance', controller.balance)
financeRoutes.get('/spaces/:id/summary', controller.summary)
financeRoutes.route('/spaces/:id/settlements').get(controller.settlements).post(controller.createSettlement)
financeRoutes.get('/settlements/:id', controller.getSettlement)
