# `@fca.gg/injector`

## Introduction

Dependency injection is a technique that allows externalizing the responsibility of managing a class's dependencies. `@fca.gg/injector` provides you with a container to manage your dependencies in a TypeScript application, facilitating modularity, testing, and code reusability.

## Installation

```
npm install @fca.gg/injector
```

## API

### Register

Registers a dependency in the injection container.

```typescript
Injector.register<T>(key: InjectableKey, value: T, options?: RegisterOptions<T>, ...args: Array<any>): void
```

### Resolve

Retrieves (or creates) an instance of the dependency associated with the given key.

```typescript
Injector.resolve(key: InjectableKey, ...args: Array<any>): any
```

### Call

Calls a method on an instance while injecting the necessary dependencies.

```typescript
Injector.call(target: any, methodName: string, ...args: Array<any>): any
```

### Unregister

Removes a dependency from the injection container.

```typescript
Injector.unregister(key: InjectableKey): void
```

### Destroy

Removes all dependencies from the injection container.

```typescript
Injector.detroy(): void
```

## Decorators

### `@Injectable`

Registers the decorated class in the injection container. (Calls Injector.register)

#### Signature:
```typescript
@Injectable(options?: RegisterOptions<Class>, ...args: Array<any>)
```

**Example**:
```typescript
@Injectable()
class MyClass {}
```

### `@Inject`

Inject dependencies into classes, properties, and methods. Can take an optional key. (Calls Injector.resolve)

#### Signature:
```typescript
@Inject(key?: InjectableKey)
```

#### Examples:

##### Class injection:

1. **With @Inject on the class**:

   *⚠️ Will only inject method parameters whose type is a class when called with Injector.resolve ⚠️*
   ```typescript
   @Inject()
   class MyClass {
       constructor(myService: MyService) {}
   }
   ```

2. **With @Inject on constructor parameters**:
   ```typescript
   class MyClass {
       constructor(@Inject() myService: MyService) {}
   }
   ```

3. **With a specific key**:
   ```typescript
   class MyClass {
       constructor(@Inject('configToken') config: string) {}
   }
   ```

##### Property injection:

1. **Standard injection**:
   ```typescript
   class MyClass {
       @Inject() 
       private readonly myService: MyService
   }
   ```

2. **With a specific key**:
   ```typescript
   class MyClass {
       @Inject('configToken') 
       private readonly config: string;
   }
   ```

##### Method injection:

1. **With @Inject on the method**:

   *⚠️ Will only inject method parameters whose type is a class when called with Injector.call ⚠️*
   ```typescript
   class MyClass {
       @Inject()
       public myMethod(myService: MyService) {}
   }
   ```

2. **With @Inject on method parameters**:
   ```typescript
   class MyClass {
       public myMethod(@Inject() myService: MyService) {}
   }
   ```

3. **With a specific key on method parameters**:
   ```typescript
   class MyClass {
       myMethod(@Inject('configToken') config: string) {}
   }
   ```


## Advanced options during registration

- **Singleton**: If `true`, only one instance of the dependency is created.
- **Lazy Loading**: If `true`, delays instance creation until its first request.
- **Factory**: A function that returns an instance of the dependency. Useful for complex creations.
- **Lifecycle hooks**: Functions called during instance creation (`onCreate`) or destruction (`onDestroy`).
- **Validate**: A function to validate the dependency before its registration.

### Complete example:

```typescript
const hooks = {
    onCreate: (instance) => console.log('Created!'),
    onDestroy: (instance) => console.log('Destroyed!')
};

const factory = () => new MyService(/* args */);
const validate = (value: any) => value !== null;

Injector.register(MyService, MyService, {
    singleton: true,
    lazy: true,
    factory: factory,
    validate: validate,
    hooks: hooks
}, "arg1", "arg2")
```

## Best practices

1. **Unique key**: Make sure to use unique keys to avoid overwrites.
2. **Registration order**: Register dependencies in the correct order, especially if one depends on another.
3. **Use hooks**: To handle specific actions during instance creation or destruction.
4. **Validation**: Use the validation function to ensure your dependencies are properly formed before registering them.

## License

This project is licensed under the AGPL v3 License - see the [LICENSE](LICENSE) file for details.

> We chose the AGPL to ensure that Injector remains truly open source and contributive.
If you use or adapt Injector, even over a network, you must share your modifications. That's the spirit of the project — building useful tools together, in the open.
