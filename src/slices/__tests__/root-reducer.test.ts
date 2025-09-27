import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../../services/store';

describe('rootReducer', () => {
  it('не должен мутировать состояние при неизвестном экшене', () => {
    const store = configureStore({
      reducer: rootReducer,
      preloadedState: {
        builder: {
          constructorItems: {
            bun: null,
            ingredients: []
          }
        },
        feed: {
          items: null,
          loading: false,
          error: null
        },
        ingredients: {
          items: [],
          buns: [],
          mains: [],
          sauces: [],
          isLoading: false,
          error: null
        },
        order: {
          order: [],
          orderRequest: false,
          orderError: null,
          orderModalData: null,
          isLoadingNumber: false,
          isLoadingOrder: false
        },
        user: {
          data: null,
          isAuthenticated: false
        }
      }
    });

    const initialState = store.getState();
    const unknownAction = { type: 'UNKNOWN_ACTION', payload: 'test' };

    store.dispatch(unknownAction);
    const stateAfterUnknownAction = store.getState();

    // Проверяем, что состояние не изменилось
    expect(stateAfterUnknownAction).toEqual(initialState);
  });

  it('должен корректно обрабатывать известные экшены', () => {
    const store = configureStore({
      reducer: rootReducer
    });

    // Сначала добавим данные в конструктор
    const mockBun = {
      _id: 'bun1',
      name: 'Тестовая булка',
      type: 'bun' as const,
      proteins: 1,
      fat: 1,
      carbohydrates: 1,
      calories: 1,
      price: 1,
      image: '',
      image_mobile: '',
      image_large: ''
    };

    const mockIngredient = {
      _id: 'ing1',
      name: 'Тестовый ингредиент',
      type: 'sauce' as const,
      proteins: 1,
      fat: 1,
      carbohydrates: 1,
      calories: 1,
      price: 1,
      image: '',
      image_mobile: '',
      image_large: '',
      id: 'test-id-1'
    };

    // Добавляем булку и ингредиент
    store.dispatch({ type: 'builder/addBunBuilder', payload: mockBun });
    store.dispatch({ type: 'builder/addItemBuilder', payload: mockIngredient });

    const stateWithData = store.getState();
    
    // Проверяем, что данные добавились
    expect(stateWithData.builder.constructorItems.bun).toEqual(mockBun);
    expect(stateWithData.builder.constructorItems.ingredients).toHaveLength(1);
    
    // Теперь очищаем конструктор
    store.dispatch({ type: 'builder/clearBuilder' });
    
    const stateAfterClear = store.getState();
    
    // Проверяем, что состояние изменилось после очистки
    expect(stateAfterClear.builder.constructorItems.bun).toBeNull();
    expect(stateAfterClear.builder.constructorItems.ingredients).toEqual([]);
    
    // Проверяем, что состояние действительно изменилось
    expect(stateAfterClear.builder).not.toEqual(stateWithData.builder);
  });
}); 