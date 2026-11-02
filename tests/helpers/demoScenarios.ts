import type { DemoPanel } from '../components/DemoPanel'
import { demoUsers, type DemoUserKey } from '../data/demoUsers'
import type { LoginPage } from '../pages/LoginPage'

export class DemoScenarios {
  private readonly demoPanel: DemoPanel
  private readonly loginPage: LoginPage

  constructor(
    demoPanel: DemoPanel,
    loginPage: LoginPage,
  ) {
    this.demoPanel = demoPanel
    this.loginPage = loginPage
  }

  async unauthenticated() {
    await this.demoPanel.selectUser(null)
    await this.loginPage.visit()
  }

  async authenticated(user: DemoUserKey = 'rocio') {
    await this.loginPage.visit()
    const userData = demoUsers[user]
    await this.loginPage.signIn(userData.email, userData.password)
  }

  async emptySpace() {
    await this.authenticated('nuevo')
  }

  async spaceWithPartner() {
    await this.authenticated('rocio')
  }
}
