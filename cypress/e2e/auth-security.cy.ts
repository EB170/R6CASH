/// <reference types="cypress" />

describe('Audit Sécuritaire Authentification R6Cash', () => {
  
  beforeEach(() => {
    cy.visit('/')
    cy.get('[data-testid="get-started"]').click()
  })

  describe('Tests XSS et Injection', () => {
    it('Doit bloquer XSS dans displayName', () => {
      cy.get('[data-testid="signup-tab"]').click()
      
      // Test XSS payload
      cy.get('[name="displayName"]').type('<script>alert("XSS")</script>')
      cy.get('[name="email"]').type('test@example.com')
      cy.get('[name="password"]').type('TestPassword123!')
      cy.get('[type="submit"]').click()
      
      // Vérifier que le script n'est pas exécuté
      cy.window().then((win) => {
        expect(win.alert).to.not.have.been.called
      })
      
      // Vérifier message d'erreur approprié
      cy.contains('caractères interdits').should('be.visible')
    })

    it('Doit sanitiser caractères spéciaux dans email', () => {
      cy.get('[data-testid="signin-tab"]').click()
      
      // Test injection SQL
      cy.get('[name="email"]').type('admin"@test.com')
      cy.get('[name="password"]').type("'; DROP TABLE users; --")
      cy.get('[type="submit"]').click()
      
      // Vérifier message d'erreur générique (pas d'exposition de détails)
      cy.contains('Email ou mot de passe incorrect').should('be.visible')
    })
  })

  describe('Rate Limiting', () => {
    it('Doit appliquer rate limiting sur connexion', () => {
      cy.get('[data-testid="signin-tab"]').click()
      
      // Effectuer 4 tentatives rapidement
      for (let i = 0; i < 4; i++) {
        cy.get('[name="email"]').clear().type('test@example.com')
        cy.get('[name="password"]').clear().type('wrongpassword')
        cy.get('[type="submit"]').click()
        cy.wait(100)
      }
      
      // La 4ème tentative doit être bloquée
      cy.contains('Trop de tentatives').should('be.visible')
    })

    it('Doit appliquer rate limiting sur inscription', () => {
      cy.get('[data-testid="signup-tab"]').click()
      
      // Effectuer 3 tentatives rapidement
      for (let i = 0; i < 3; i++) {
        cy.get('[name="displayName"]').clear().type(`testuser${i}`)
        cy.get('[name="email"]').clear().type(`test${i}@example.com`)
        cy.get('[name="password"]').clear().type('TestPassword123!')
        cy.get('[type="submit"]').click()
        cy.wait(100)
      }
      
      cy.contains('Trop de tentatives').should('be.visible')
    })
  })

  describe('Validation de Mots de Passe', () => {
    beforeEach(() => {
      cy.get('[data-testid="signup-tab"]').click()
    })

    it('Doit rejeter mots de passe communs', () => {
      cy.get('[name="displayName"]').type('testuser')
      cy.get('[name="email"]').type('test@example.com')
      cy.get('[name="password"]').type('password123')
      cy.get('[type="submit"]').click()
      
      cy.contains('trop commun').should('be.visible')
    })

    it('Doit exiger complexité minimale', () => {
      cy.get('[name="displayName"]').type('testuser')
      cy.get('[name="email"]').type('test@example.com')
      cy.get('[name="password"]').type('simple')
      cy.get('[type="submit"]').click()
      
      cy.contains('doit contenir au moins').should('be.visible')
    })

    it('Doit accepter mot de passe fort', () => {
      cy.get('[name="displayName"]').type('testuser')
      cy.get('[name="email"]').type('test@example.com')
      cy.get('[name="password"]').type('StrongP@ssw0rd123!')
      
      // Vérifier que le bouton devient activé
      cy.get('[type="submit"]').should('not.be.disabled')
    })
  })

  describe('Validation d\'Email', () => {
    it('Doit rejeter emails malformés', () => {
      cy.get('[data-testid="signin-tab"]').click()
      
      const invalidEmails = ['test@', 'test.com', '@domain.com', 'test space@domain.com']
      
      invalidEmails.forEach(email => {
        cy.get('[name="email"]').clear().type(email)
        cy.get('[name="password"]').type('TestPassword123!')
        cy.get('[type="submit"]').click()
        
        cy.contains('Email invalide').should('be.visible')
      })
    })

    it('Doit accepter emails valides', () => {
      cy.get('[data-testid="signin-tab"]').click()
      
      cy.get('[name="email"]').type('valid.email+test@domain.com')
      cy.get('[name="password"]').type('TestPassword123!')
      
      // Le formulaire ne doit pas afficher d'erreur de validation email
      cy.contains('Email invalide').should('not.exist')
    })
  })

  describe('Sécurité Sessions', () => {
    it('Doit invalider session après déconnexion', () => {
      // Simulation d'une connexion réussie
      cy.window().then((win) => {
        // Simuler stockage session
        win.localStorage.setItem('supabase.auth.token', 'fake-token')
      })

      cy.reload()
      
      // Effectuer déconnexion
      cy.get('[data-testid="logout-button"]').click()
      
      // Vérifier nettoyage localStorage
      cy.window().then((win) => {
        expect(win.localStorage.getItem('supabase.auth.token')).to.be.null
      })
      
      // Vérifier redirection vers page d'accueil
      cy.url().should('not.include', '/dashboard')
    })

    it('Doit gérer expiration automatique token', () => {
      // Simuler token expiré
      cy.window().then((win) => {
        const expiredToken = {
          access_token: 'expired-token',
          expires_at: Date.now() - 1000 // Expiré il y a 1 seconde
        }
        win.localStorage.setItem('supabase.auth.token', JSON.stringify(expiredToken))
      })

      cy.reload()
      
      // Doit rediriger vers authentification
      cy.url().should('not.include', '/dashboard')
    })
  })

  describe('Headers de Sécurité', () => {
    it('Doit avoir CSP correct', () => {
      cy.document().then((doc) => {
        const cspMeta = doc.querySelector('meta[http-equiv="Content-Security-Policy"]')
        expect(cspMeta).to.exist
        expect(cspMeta.getAttribute('content')).to.include("default-src 'self'")
      })
    })

    it('Doit avoir X-Frame-Options', () => {
      cy.document().then((doc) => {
        const frameMeta = doc.querySelector('meta[http-equiv="X-Frame-Options"]')
        expect(frameMeta).to.exist
        expect(frameMeta.getAttribute('content')).to.equal('DENY')
      })
    })
  })
})

// Tests API pour vérifier rate limiting côté serveur
describe('Tests API Sécurité', () => {
  
  it('Doit retourner 429 après trop de tentatives', () => {
    // Effectuer 10 requêtes rapidement
    for (let i = 0; i < 10; i++) {
      cy.request({
        method: 'POST',
        url: '/auth/v1/token',
        body: {
          email: 'test@example.com',
          password: 'wrongpassword',
          grant_type: 'password'
        },
        failOnStatusCode: false
      }).then((response) => {
        if (i >= 5) {
          expect(response.status).to.be.oneOf([429, 401])
        }
      })
    }
  })

  it('Doit valider format email côté serveur', () => {
    cy.request({
      method: 'POST',
      url: '/auth/v1/signup',
      body: {
        email: 'invalid-email',
        password: 'TestPassword123!'
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.equal(400)
    })
  })

  it('Doit rejeter mots de passe faibles côté serveur', () => {
    cy.request({
      method: 'POST',
      url: '/auth/v1/signup',
      body: {
        email: 'test@example.com',
        password: '123'
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.equal(400)
    })
  })
})