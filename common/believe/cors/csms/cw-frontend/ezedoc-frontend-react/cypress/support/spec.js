// below line adds auto-complete support
/// <reference types="cypress" />

import './commands'
import 'cypress-file-upload'

// eslint-disable-next-line import/no-extraneous-dependencies
import '@cypress/code-coverage/support';

beforeEach(function login() {
    cy.log("I run before each test, to help you with a authenticated session 🤗");
    cy.visit(`${Cypress.env("baseUrl")}`);
    cy.url().should("include", "qa");
    cy.get(".LoginPage_inputField__1orLq").type(Cypress.env("email"));
    cy.get(".LoginPage_buttonNextEnable__CkDz9").click();
    cy.get(".PasswordInput_inputField__b8AYU").type(Cypress.env("password"));
    cy.get(".LoginPage_buttonNextEnable__CkDz9").click();
    cy.get(".ant5-menu-item.ant5-menu-item-only-child:nth-child(4)").click()
  });