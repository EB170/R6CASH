export type Language = 'en' | 'fr'

export interface Translations {
  // Navigation & Header
  getStarted: string
  signOut: string
  refresh: string
  missingFields: string
  
  // Authentication
  signIn: string
  signUp: string
  email: string
  password: string
  displayName: string
  createAccount: string
  connecting: string
  
  // Dashboard
  welcome: string
  readyForAction: string
  balance: string
  yourMatches: string
  victories: string
  active: string
  finished: string
  winRate: string
  noData: string
  
  // Tabs
  overview: string
  games: string
  leaderboard: string
  live: string
  verification: string
  antiCheat: string
  integration: string
  surveillance: string
  settings: string
  
  // Actions
  joinMatch: string
  createMatch: string
  deposit: string
  seeMatches: string
  joinBattle: string
  
  // Hero Section
  heroSubtitle: string
  with: string
  competitiveMatches: string
  realFinancialStakes: string
  
  // Features
  instantMatches: string
  instantMatchesDesc: string
  secured: string
  securedDesc: string
  realGains: string
  realGainsDesc: string
  
  // How it works
  howItWorks: string
  stepSignUp: string
  stepSignUpDesc: string
  stepChooseMatch: string
  stepChooseMatchDesc: string
  stepPlayWin: string
  stepPlayWinDesc: string
  
  // Stats
  activePlayers: string
  gainsDistributed: string
  matchesPlayed: string
  support: string
  
  // Game content
  noMatches: string
  noMatchesDesc: string
  firstToCreate: string
  quickOverview: string
  availableMatches: string
  activeMatches: string
  availableBalance: string
  quickActions: string
  
  // Dashboard title
  dashboardTitle: string
  dashboardDesc: string
  controlCenter: string
  
  // Loading
  loading: string
  loadingData: string
  
  // Messages
  insufficientBalance: string
  matchJoined: string
  matchJoinedDesc: string
  failedToJoin: string
  
  // Security
  tooManyAttempts: string
  invalidEmail: string
  invalidUsername: string
  invalidPassword: string
  passwordTooWeak: string
  connectionFailed: string
  registrationFailed: string
  
  // Auth descriptions
  authSubtitle: string
  signInTab: string
  signUpTab: string
  emailPlaceholder: string
  passwordPlaceholder: string
  usernamePlaceholder: string
  passwordStrengthPlaceholder: string
  
  // Success messages
  connectionSuccess: string
  connectionSuccessDesc: string
  accountCreated: string
  accountCreatedDesc: string
  
  // Game Creation
  createGame: string
  createNewGame: string
  gameMode: string
  selectMode: string
  stake: string
  gameCreated: string
  gameCreatedDesc: string
  creationFailed: string
  invalidAmount: string
  insufficientFunds: string
  cancel: string
  create: string
  creating: string
  
  // Game Card
  waiting: string
  inProgress: string
  createdBy: string
  join: string
  spectate: string
  full: string

  // Email verification
  emailVerificationTitle: string
  emailVerificationDesc: string
  emailVerificationInstructions: string
  resendEmail: string
  
  // Withdrawal
  withdraw: string
  withdrawFunds: string
  withdrawalAmount: string
  minimumWithdrawal: string
  paymentMethod: string
  bankTransfer: string
  paypal: string
  bankDetails: string
  accountHolder: string
  accountNumber: string
  routingNumber: string
  iban: string
  swift: string
  requestWithdrawal: string
  withdrawalRequested: string
  withdrawalRequestedDesc: string
  withdrawalFailed: string
  pendingWithdrawals: string
  
  // Admin
  adminPanel: string
  userManagement: string
  withdrawalRequests: string
  systemStats: string
  approve: string
  reject: string
  process: string
  viewDetails: string
  totalUsers: string
  totalDeposits: string
  totalWithdrawals: string
  platformRevenue: string
  adminNotes: string
  
  // Mobile
  mobileOptimized: string
  touchFriendly: string
  responsiveDesign: string
}

export const translations: Record<Language, Translations> = {
  en: {
    // Navigation & Header
    getStarted: 'GET STARTED',
    signOut: 'SIGN OUT',
    refresh: 'REFRESH',
    missingFields: 'Missing fields',
    
    // Authentication
    signIn: 'SIGN IN',
    signUp: 'SIGN UP',
    email: 'Email',
    password: 'Password',
    displayName: 'Username',
    createAccount: 'CREATE ACCOUNT',
    connecting: 'CONNECTING...',
    
    // Dashboard
    welcome: 'Hey, {name}! 🎮',
    readyForAction: 'Ready for competitive Rainbow Six Siege action?',
    balance: 'YOUR BALANCE',
    yourMatches: 'YOUR MATCHES',
    victories: 'VICTORIES',
    active: 'active',
    finished: 'finished',
    winRate: 'win rate',
    noData: 'No data',
    
    // Tabs
    overview: 'OVERVIEW',
    games: 'GAMES',
    leaderboard: 'LEADERBOARD',
    live: 'LIVE',
    verification: 'VERIFICATION',
    antiCheat: 'ANTI-CHEAT',
    integration: 'INTEGRATION',
    surveillance: 'SURVEILLANCE',
    settings: 'SETTINGS',
    
    // Actions
    joinMatch: 'JOIN MATCH',
    createMatch: 'CREATE MATCH',
    deposit: 'DEPOSIT',
    seeMatches: 'SEE MATCHES',
    joinBattle: 'JOIN THE BATTLE',
    
    // Hero Section
    heroSubtitle: 'The ultimate platform for competitive matches with real financial stakes',
    competitiveMatches: 'competitive matches',
    realFinancialStakes: 'real financial stakes',
    with: 'with',
    
    // Features
    instantMatches: 'Instant Matches',
    instantMatchesDesc: 'Create or join 1v1 and 2v2 matches in seconds',
    secured: '100% Secure',
    securedDesc: 'Secure payment system and advanced anti-cheat protection',
    realGains: 'Real Gains',
    realGainsDesc: 'Win real money by beating your opponents',
    
    // How it works
    howItWorks: 'How does it work?',
    stepSignUp: 'Sign Up',
    stepSignUpDesc: 'Create your account and fund your balance',
    stepChooseMatch: 'Choose a match',
    stepChooseMatchDesc: 'Create or join a match with your chosen stake',
    stepPlayWin: 'Play & Win',
    stepPlayWinDesc: 'Beat your opponents and claim the winnings',
    
    // Stats
    activePlayers: 'Active players',
    gainsDistributed: 'Gains distributed',
    matchesPlayed: 'Matches played',
    support: 'Support',
    
    // Game content
    noMatches: 'No matches available at the moment.',
    noMatchesDesc: 'Be the first to create one!',
    firstToCreate: 'Be the first to create one!',
    quickOverview: 'Quick overview',
    availableMatches: 'Available matches:',
    activeMatches: 'Your active matches:',
    availableBalance: 'Available balance:',
    quickActions: 'Quick actions',
    
    // Dashboard title
    dashboardTitle: 'R6Cash Dashboard',
    dashboardDesc: 'Your control center for competitive matches',
    controlCenter: 'Your control center for competitive matches',
    
    // Loading
    loading: 'Loading R6Cash...',
    loadingData: 'Loading data...',
    
    // Messages
    insufficientBalance: 'Insufficient balance',
    matchJoined: 'Match joined!',
    matchJoinedDesc: 'You have successfully joined the match. Good luck!',
    failedToJoin: 'Failed to join match',
    
    // Security
    tooManyAttempts: 'Too many attempts',
    invalidEmail: 'Invalid email',
    invalidUsername: 'Invalid username',
    invalidPassword: 'Invalid password',
    passwordTooWeak: 'Password too weak',
    connectionFailed: 'Connection failed',
    registrationFailed: 'Registration failed',
    
    // Auth descriptions
    authSubtitle: 'Competitive Rainbow Six Siege matches with real stakes',
    signInTab: 'SIGN IN',
    signUpTab: 'SIGN UP',
    emailPlaceholder: 'your@email.com',
    passwordPlaceholder: 'Your password',
    usernamePlaceholder: 'Your R6 username',
    passwordStrengthPlaceholder: 'Choose a strong password',
    
    // Success messages
    connectionSuccess: 'Connection successful',
    connectionSuccessDesc: 'Welcome to R6Cash.',
    accountCreated: 'Account created successfully',
    accountCreatedDesc: 'Welcome to R6Cash.',
    
    // Game Creation
    createGame: 'CREATE GAME',
    createNewGame: 'CREATE NEW GAME',
    gameMode: 'Game Mode',
    selectMode: 'Select a mode',
    stake: 'Stake',
    gameCreated: 'Game Created!',
    gameCreatedDesc: 'Your game has been created successfully.',
    creationFailed: 'Creation Failed',
    invalidAmount: 'Invalid Amount',
    insufficientFunds: 'Insufficient Funds',
    cancel: 'CANCEL',
    create: 'CREATE',
    creating: 'CREATING...',
    
    // Game Card
    waiting: 'WAITING',
    inProgress: 'IN PROGRESS',
    createdBy: 'Created by',
    join: 'JOIN',
    spectate: 'SPECTATE',
    full: 'FULL',

    // Email verification
    emailVerificationTitle: 'Check your email',
    emailVerificationDesc: 'We sent you a verification email',
    emailVerificationInstructions: 'Please check your inbox and click the verification link to activate your account.',
    resendEmail: 'Resend email',
    
    // Withdrawal
    withdraw: 'WITHDRAW',
    withdrawFunds: 'WITHDRAW FUNDS',
    withdrawalAmount: 'Withdrawal Amount',
    minimumWithdrawal: 'Minimum withdrawal: $10.00',
    paymentMethod: 'Payment Method',
    bankTransfer: 'Bank Transfer',
    paypal: 'PayPal',
    bankDetails: 'Bank Details',
    accountHolder: 'Account Holder Name',
    accountNumber: 'Account Number',
    routingNumber: 'Routing Number',
    iban: 'IBAN',
    swift: 'SWIFT Code',
    requestWithdrawal: 'REQUEST WITHDRAWAL',
    withdrawalRequested: 'Withdrawal Requested',
    withdrawalRequestedDesc: 'Your withdrawal request has been submitted and will be processed within 24-48 hours.',
    withdrawalFailed: 'Withdrawal Failed',
    pendingWithdrawals: 'Pending Withdrawals',
    
    // Admin
    adminPanel: 'Admin Panel',
    userManagement: 'User Management',
    withdrawalRequests: 'Withdrawal Requests',
    systemStats: 'System Statistics',
    approve: 'APPROVE',
    reject: 'REJECT',
    process: 'PROCESS',
    viewDetails: 'View Details',
    totalUsers: 'Total Users',
    totalDeposits: 'Total Deposits',
    totalWithdrawals: 'Total Withdrawals',
    platformRevenue: 'Platform Revenue',
    adminNotes: 'Admin Notes',
    
    // Mobile
    mobileOptimized: 'Mobile Optimized',
    touchFriendly: 'Touch Friendly',
    responsiveDesign: 'Responsive Design',
  },
  
  fr: {
    // Navigation & Header
    getStarted: 'COMMENCER',
    signOut: 'DÉCONNEXION',
    refresh: 'ACTUALISER',
    missingFields: 'Champs manquants',
    
    // Authentication
    signIn: 'CONNEXION',
    signUp: 'INSCRIPTION',
    email: 'Email',
    password: 'Mot de passe',
    displayName: 'Nom d\'utilisateur',
    createAccount: 'CRÉER UN COMPTE',
    connecting: 'CONNEXION...',
    
    // Dashboard
    welcome: 'Salut, {name}! 🎮',
    readyForAction: 'Prêt pour de l\'action Rainbow Six Siege compétitive ?',
    balance: 'VOTRE SOLDE',
    yourMatches: 'VOS MATCHS',
    victories: 'VICTOIRES',
    active: 'actifs',
    finished: 'terminés',
    winRate: 'taux de victoire',
    noData: 'Aucune donnée',
    
    // Tabs
    overview: 'ACCUEIL',
    games: 'PARTIES',
    leaderboard: 'CLASSEMENT',
    live: 'EN DIRECT',
    verification: 'VÉRIFICATION',
    antiCheat: 'ANTI-CHEAT',
    integration: 'INTÉGRATION',
    surveillance: 'SURVEILLANCE',
    settings: 'PARAMÈTRES',
    
    // Actions
    joinMatch: 'REJOINDRE',
    createMatch: 'CRÉER MATCH',
    deposit: 'DÉPÔT',
    seeMatches: 'VOIR LES MATCHS',
    joinBattle: 'REJOINDRE LA BATAILLE',
    
    // Hero Section
    heroSubtitle: 'La plateforme ultime pour les matchs compétitifs avec de vrais enjeux financiers',
    competitiveMatches: 'matchs compétitifs',
    realFinancialStakes: 'vrais enjeux financiers',
    with: 'avec de',
    
    // Features
    instantMatches: 'Matchs Instantanés',
    instantMatchesDesc: 'Créez ou rejoignez des parties 1v1 et 2v2 en quelques secondes',
    secured: '100% Sécurisé',
    securedDesc: 'Système de paiement sécurisé et protection anti-triche avancée',
    realGains: 'Gains Réels',
    realGainsDesc: 'Gagnez de l\'argent réel en battant vos adversaires',
    
    // How it works
    howItWorks: 'Comment ça marche ?',
    stepSignUp: 'Inscrivez-vous',
    stepSignUpDesc: 'Créez votre compte et alimentez votre solde',
    stepChooseMatch: 'Choisissez un match',
    stepChooseMatchDesc: 'Créez ou rejoignez une partie avec la mise de votre choix',
    stepPlayWin: 'Jouez & Gagnez',
    stepPlayWinDesc: 'Battez vos adversaires et remportez les gains',
    
    // Stats
    activePlayers: 'Joueurs actifs',
    gainsDistributed: 'Gains distribués',
    matchesPlayed: 'Matchs joués',
    support: 'Support',
    
    // Game content
    noMatches: 'Aucun match disponible pour le moment.',
    noMatchesDesc: 'Soyez le premier à en créer un !',
    firstToCreate: 'Soyez le premier à en créer un !',
    quickOverview: 'Aperçu rapide',
    availableMatches: 'Matchs disponibles:',
    activeMatches: 'Vos matchs actifs:',
    availableBalance: 'Solde disponible:',
    quickActions: 'Actions rapides',
    
    // Dashboard title
    dashboardTitle: 'Tableau de Bord R6Cash',
    dashboardDesc: 'Votre centre de contrôle pour les matchs compétitifs',
    controlCenter: 'Votre centre de contrôle pour les matchs compétitifs',
    
    // Loading
    loading: 'Chargement de R6Cash...',
    loadingData: 'Chargement des données...',
    
    // Messages
    insufficientBalance: 'Solde insuffisant',
    matchJoined: 'Match rejoint !',
    matchJoinedDesc: 'Vous avez rejoint le match avec succès. Bonne chance !',
    failedToJoin: 'Échec de rejoindre le match',
    
    // Security
    tooManyAttempts: 'Trop de tentatives',
    invalidEmail: 'Email invalide',
    invalidUsername: 'Nom d\'utilisateur invalide',
    invalidPassword: 'Mot de passe invalide',
    passwordTooWeak: 'Mot de passe trop faible',
    connectionFailed: 'Connexion échouée',
    registrationFailed: 'Inscription échouée',
    
    // Auth descriptions
    authSubtitle: 'Matchs compétitifs Rainbow Six Siege avec vrais enjeux',
    signInTab: 'CONNEXION',
    signUpTab: 'INSCRIPTION',
    emailPlaceholder: 'votre@email.com',
    passwordPlaceholder: 'Votre mot de passe',
    usernamePlaceholder: 'Votre pseudo R6',
    passwordStrengthPlaceholder: 'Choisissez un mot de passe fort',
    
    // Success messages
    connectionSuccess: 'Connexion réussie',
    connectionSuccessDesc: 'Bienvenue sur R6Cash.',
    accountCreated: 'Compte créé avec succès',
    accountCreatedDesc: 'Bienvenue sur R6Cash.',
    
    // Game Creation
    createGame: 'CRÉER PARTIE',
    createNewGame: 'CRÉER NOUVELLE PARTIE',
    gameMode: 'Mode de jeu',
    selectMode: 'Sélectionnez un mode',
    stake: 'Mise',
    gameCreated: 'Partie créée !',
    gameCreatedDesc: 'Votre partie a été créée avec succès.',
    creationFailed: 'Échec de la création',
    invalidAmount: 'Montant invalide',
    insufficientFunds: 'Fonds insuffisants',
    cancel: 'ANNULER',
    create: 'CRÉER',
    creating: 'CRÉATION...',
    
    // Game Card
    waiting: 'EN ATTENTE',
    inProgress: 'EN COURS',
    createdBy: 'Créé par',
    join: 'REJOINDRE',
    spectate: 'OBSERVER',
    full: 'COMPLET',

    // Email verification
    emailVerificationTitle: 'Vérifiez votre email',
    emailVerificationDesc: 'Nous vous avons envoyé un email de vérification',
    emailVerificationInstructions: 'Veuillez consulter votre boîte de réception et cliquer sur le lien de vérification pour activer votre compte.',
    resendEmail: 'Renvoyer l\'email',
    
    // Withdrawal
    withdraw: 'RETIRER',
    withdrawFunds: 'RETIRER FONDS',
    withdrawalAmount: 'Montant du retrait',
    minimumWithdrawal: 'Retrait minimum : 10,00$',
    paymentMethod: 'Méthode de paiement',
    bankTransfer: 'Virement bancaire',
    paypal: 'PayPal',
    bankDetails: 'Détails bancaires',
    accountHolder: 'Nom du titulaire du compte',
    accountNumber: 'Numéro de compte',
    routingNumber: 'Numéro de routage',
    iban: 'IBAN',
    swift: 'Code SWIFT',
    requestWithdrawal: 'DEMANDER RETRAIT',
    withdrawalRequested: 'Retrait demandé',
    withdrawalRequestedDesc: 'Votre demande de retrait a été soumise et sera traitée dans les 24-48 heures.',
    withdrawalFailed: 'Échec du retrait',
    pendingWithdrawals: 'Retraits en attente',
    
    // Admin
    adminPanel: 'Panneau Admin',
    userManagement: 'Gestion des utilisateurs',
    withdrawalRequests: 'Demandes de retrait',
    systemStats: 'Statistiques système',
    approve: 'APPROUVER',
    reject: 'REJETER',
    process: 'TRAITER',
    viewDetails: 'Voir détails',
    totalUsers: 'Utilisateurs total',
    totalDeposits: 'Dépôts total',
    totalWithdrawals: 'Retraits total',
    platformRevenue: 'Revenus plateforme',
    adminNotes: 'Notes admin',
    
    // Mobile
    mobileOptimized: 'Optimisé mobile',
    touchFriendly: 'Interface tactile',
    responsiveDesign: 'Design adaptatif',
  }
}

export const formatMessage = (message: string, params: Record<string, string> = {}): string => {
  let formatted = message
  Object.entries(params).forEach(([key, value]) => {
    formatted = formatted.replace(`{${key}}`, value)
  })
  return formatted
}