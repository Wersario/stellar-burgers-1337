const SELECTORS = {
  userApi: '/api/auth/user',
  ingredientsApi: '/api/ingredients',
  orderApi: '/api/orders',
  userNameInput: 'input[name="name"]',
  testUserName: 'Test User',
  profileUrlPart: '/profile',
  homeUrl: 'http://localhost:4000/',
  bunName: 'Флюоресцентная булка R2-D3',
  fillingName: 'Биокотлета из марсианской Магнолии',
  bunOption: 'Краторная булка',
  bunPlaceholder: 'Выберите булки',
  fillingPlaceholder: 'Выберите начинку',
  orderButton: 'Оформить заказ',
  orderConfirmationText: 'идентификатор заказа',
  constructorTitle: 'Соберите бургер',
  personalCabinet: 'Личный кабинет',
  constructorArea: '[data-testid="constructor"]',
  ingredientModal: '[data-testid="ingredient-modal"]',
  orderModal: '[data-testid="order-modal"]',
  ingredientDetails: '[data-testid="ingredient-details"]',
  orderNumber: '[data-testid="order-number"]'
};

describe('Авторизация и профиль', () => {
  beforeEach(() => {
    cy.intercept('GET', SELECTORS.userApi, {
      statusCode: 200,
      body: {
        success: true,
        user: {
          email: 'test_user@example.com',
          name: SELECTORS.testUserName,
        }
      }
    }).as('getUser');
  });

  afterEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('Переход в профиль после входа', () => {
    cy.loginByApi();
    cy.visit('/');
    cy.get(`a:contains(${SELECTORS.personalCabinet})`).click();
    cy.wait('@getUser');

    cy.get(`a:contains(${SELECTORS.testUserName})`).click();
    cy.location('pathname').should('include', SELECTORS.profileUrlPart);
    cy.get('form').should('exist');
    cy.get(SELECTORS.userNameInput).should('have.value', SELECTORS.testUserName);
  });
});

describe('Функциональность конструктора бургеров', () => {
  beforeEach(() => {
    cy.fixture('ingredients.json').as('ingredientsData');
    cy.fixture('user.json').as('userData');

    cy.intercept('GET', SELECTORS.ingredientsApi, { fixture: 'ingredients.json' }).as('getIngredients');
    cy.intercept('GET', SELECTORS.userApi, { fixture: 'user.json' }).as('getUser');

    cy.setCookie('accessToken', 'mockToken');
    cy.window().then(win => win.localStorage.setItem('refreshToken', 'mockToken'));

    cy.visit('/');
    cy.wait('@getIngredients');
    cy.contains(SELECTORS.constructorTitle).should('exist');
  });

  afterEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('Нет булки при старте', () => {
    cy.contains(SELECTORS.bunPlaceholder).should('exist');
    cy.contains(SELECTORS.fillingPlaceholder).should('exist');
  });

  it('Добавление булки в конструктор', () => {
    cy.contains(SELECTORS.bunName).parent().find('button').click();
    cy.get(SELECTORS.constructorArea).within(() => {
      cy.contains(SELECTORS.bunName).should('exist');
    });
  });

  it('Добавление начинки в конструктор', () => {
    cy.contains('Начинки').scrollIntoView().click();
    cy.contains(SELECTORS.fillingName).parent().find('button').click();
    cy.get(SELECTORS.constructorArea).within(() => {
      cy.contains(SELECTORS.fillingName).should('exist');
    });
  });

  it('Добавление ингредиентов в заказ и очистка конструктора', () => {
    cy.intercept('POST', SELECTORS.orderApi, {
      fixture: 'makeOrder.json',
      statusCode: 200
    }).as('newOrder');

    cy.contains(SELECTORS.bunName).parent().find('button').click();
    cy.contains('Начинки').scrollIntoView();
    cy.contains(SELECTORS.fillingName).parent().find('button').click();

    cy.get(`button:contains(${SELECTORS.orderButton})`).should('not.be.disabled').click();
    cy.wait('@newOrder').its('response.statusCode').should('eq', 200);

    cy.get(SELECTORS.orderModal).should('be.visible');
    cy.get(SELECTORS.orderNumber).should('contain', '40763');
    cy.contains(SELECTORS.orderConfirmationText).should('be.visible');
    
    cy.get('body').type('{esc}');
    
    cy.get(SELECTORS.constructorArea).within(() => {
      cy.contains(SELECTORS.bunPlaceholder).should('exist');
      cy.contains(SELECTORS.fillingPlaceholder).should('exist');
      cy.contains(SELECTORS.bunName).should('not.exist');
      cy.contains(SELECTORS.fillingName).should('not.exist');
    });
  });

  it('Открытие и закрытие модального окна ингредиента', () => {
    cy.contains(SELECTORS.bunOption).click();
    
    cy.get(SELECTORS.ingredientModal).should('be.visible');
    cy.get(SELECTORS.ingredientDetails).within(() => {
      cy.contains(SELECTORS.bunOption).should('be.visible');
      cy.contains('80').should('be.visible');
      cy.contains('24').should('be.visible');
      cy.contains('53').should('be.visible');
      cy.contains('420').should('be.visible');
    });
    
    cy.get('body').type('{esc}');
    cy.location('href').should('eq', SELECTORS.homeUrl);
  });

  it('Закрытие модального окна через клик на оверлей', () => {
    cy.contains(SELECTORS.bunOption).click();
    cy.get(SELECTORS.ingredientModal).should('be.visible');
    cy.get(SELECTORS.ingredientDetails).within(() => {
      cy.contains(SELECTORS.bunOption).should('be.visible');
    });
    
    cy.go('back');
    cy.url().should('eq', SELECTORS.homeUrl);
  });

  it('Проверка корректного номера заказа в модальном окне', () => {
    cy.intercept('POST', SELECTORS.orderApi, {
      fixture: 'makeOrder.json',
      statusCode: 200
    }).as('newOrder');

    cy.contains(SELECTORS.bunName).parent().find('button').click();
    cy.contains('Начинки').scrollIntoView();
    cy.contains(SELECTORS.fillingName).parent().find('button').click();

    cy.get(`button:contains(${SELECTORS.orderButton})`).should('not.be.disabled').click();
    cy.wait('@newOrder');

    cy.get(SELECTORS.orderModal).should('be.visible');
    cy.get(SELECTORS.orderNumber).should('contain', '40763');
    cy.contains('идентификатор заказа').should('be.visible');
    cy.contains('Ваш заказ начали готовить').should('be.visible');
  });
});