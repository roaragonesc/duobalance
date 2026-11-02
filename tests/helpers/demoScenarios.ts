import type { DemoPanel } from '../components/DemoPanel'
import type { Page } from '@playwright/test'
import { demoUsers, type DemoUserKey } from '../data/demoUsers'
import type { LoginPage } from '../pages/LoginPage'

export class DemoScenarios {
  private readonly demoPanel: DemoPanel
  private readonly loginPage: LoginPage
  private readonly page: Page

  constructor(
    demoPanel: DemoPanel,
    loginPage: LoginPage,
    page: Page,
  ) {
    this.demoPanel = demoPanel
    this.loginPage = loginPage
    this.page = page
  }

  async unauthenticated() {
    await this.demoPanel.selectUser(null)
    await this.loginPage.visit()
  }

  async authenticated(user: DemoUserKey = 'rocio') {
    await this.loginPage.visit()
    const userData = demoUsers[user]
    await this.loginPage.signIn(userData.email, userData.password)
    await this.page.waitForURL((url) => url.pathname !== '/login')
  }

  async withoutSpace() {
    await this.authenticated('nuevo')
  }

  async emptySpace() {
    await this.authenticated('solo')
  }

  async spaceWithPartner() {
    await this.authenticated('rocio')
  }
}
