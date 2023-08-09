# `@fca.gg/injector`

## Introduction

L'injection de dépendances est une technique qui permet d'externaliser la responsabilité de la gestion des dépendances d'une classe. `@fca.gg/injector` vous offre un conteneur pour gérer vos dépendances dans une application TypeScript, facilitant la modularité, les tests, et la réutilisation du code.

## Installation

```
npm install @fca.gg/injector
```

## API

### Register

Enregistre une dépendance dans le conteneur d'injection.

```typescript
Injector.register<T>(key: InjectableKey, value: T, options?: RegisterOptions<T>, ...args: Array<any>): void
```

### Resolve

Récupère (ou crée) une instance de la dépendance associée à la clé donnée.

```typescript
Injector.resolve(key: InjectableKey, ...args: Array<any>): any
```

### Call

Appelle une méthode sur une instance tout en injectant les dépendances nécessaires.

```typescript
Injector.call(target: any, methodName: string, ...args: Array<any>): any
```

### Unregister

Supprime un dépendance du conteneur d'injection.

```typescript
Injector.unregister(key: InjectableKey): void
```

### Destroy

Supprime toute les dépendances du conteneur d'injection.

```typescript
Injector.detroy(): void
```

## Décorateurs

### `@Injectable`

Enregistre la classe décorée dans le conteneur d'injection. (Appel Injector.register)

#### Signature :
```typescript
@Injectable(options?: RegisterOptions<Class>, ...args: Array<any>)
```

**Exemple** :
```typescript
@Injectable()
class MyClass {}
```

### `@Inject`

Injectez des dépendances dans des classes, des propriétés, et des méthodes. Peut prendre une clé optionnelle. (Appel Injector.resolve)

#### Signature :
```typescript
@Inject(key?: InjectableKey)
```

#### Exemples :

##### Injection de class :

1. **Avec @Inject sur la classe** :

   *⚠️ Injectera uniquement les paramètres de la méthode dont le type est une classe lorsqu'elle est appelée avec Injector.resolve ⚠️*
   ```typescript
   @Inject()
   class MaClasse {
       constructor(monService: MonService) {}
   }
   ```

2. **Avec @Inject sur les paramètres du constructeur** :
   ```typescript
   class MaClasse {
       constructor(@Inject() monService: MonService) {}
   }
   ```

3. **Avec une clé spécifique** :
   ```typescript
   class MaClasse {
       constructor(@Inject('configToken') config: string) {}
   }
   ```

##### Injection de propriété :

1. **Injection standard** :
   ```typescript
   class MaClasse {
       @Inject() 
       private readonly monService: MonService
   }
   ```

2. **Avec une clé spécifique** :
   ```typescript
   class MaClasse {
       @Inject('configToken') 
       private readonly config: string;
   }
   ```

##### Injection de méthode :

1. **Avec @Inject sur la méthode** :

   *⚠️ Injectera uniquement les paramètres de la méthode dont le type est une classe lorsqu'elle est appelée avec Injector.call ⚠️*
   ```typescript
   class MaClasse {
       @Inject()
       public maMethode(monService: MonService) {}
   }
   ```

2. **Avec @Inject sur les paramètres de la méthode** :
   ```typescript
   class MaClasse {
       public maMethode(@Inject() monService: MonService) {}
   }
   ```

3. **Avec une clé spécifique sur les paramètres de la méthode** :
   ```typescript
   class MaClasse {
       maMethode(@Inject('configToken') config: string) {}
   }
   ```


## Options avancées lors de l'enregistrement

- **Singleton** : Si `true`, une seule instance de la dépendance est créée.
- **Lazy Loading** : Si `true`, retarde la création de l'instance jusqu'à sa première demande.
- **Factory** : Une fonction qui retourne une instance de la dépendance. Utile pour des créations complexes.
- **Hooks de cycle de vie** : Des fonctions appelées lors de la création (`onCreate`) ou de la destruction (`onDestroy`) d'une instance.
- **Validate** : Une fonction pour valider la dépendance avant son enregistrement.

### Exemple complet :

```typescript
const hooks = {
    onCreate: (instance) => console.log('Créé !'),
    onDestroy: (instance) => console.log('Détruit !')
};

const factory = () => new MonService(/* args */);
const validate = (value: any) => value !== null;

Injector.register(MonService, MonService, {
    singleton: true,
    lazy: true,
    factory: factory,
    validate: validate,
    hooks: hooks
}, "arg1", "arg2")
```

## Bonnes pratiques

1. **Clé unique** : Assurez-vous d'utiliser des clés uniques pour éviter les écrasements.
2. **Ordre d'enregistrement** : Enregistrez les dépendances dans le bon ordre, en particulier si l'une dépend de l'autre.
3. **Utilisez les hooks** : Pour gérer des actions spécifiques lors de la création ou de la destruction d'une instance.
4. **Validation** : Utilisez la fonction de validation pour vous assurer que vos dépendances sont correctement formées avant de les enregistrer.

---
