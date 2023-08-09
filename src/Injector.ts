import 'reflect-metadata'
import { Class, InjectableKey, LifecycleHooks, RegisterOptions, Registration } from './type'
import { MetadataKeys } from './metadataKeys'
import Joi from 'joi'

export default class Injector {

    private static registry: Map<InjectableKey, Registration> = new Map()

    public static register<T>(key: InjectableKey, value: T, options?: RegisterOptions<T>, ...args: Array<any>): void {
        const registration: Registration = {
            value: value,
            ...Injector.validateOptions<T>(options)
        }

        if (registration.validate && !registration.validate(value)) {
            throw new Error(`Invalid value for ${key}`)
        }

        if (Injector.isClass(registration.value) && registration.singleton && !registration.lazy) {
            if (registration.factory) {
                registration.instance = registration.factory()
            } else {
                registration.instance = Injector.instantiatedWithDependencies(registration, args)
            }
        }

        this.registry.set(key, registration)
    }

    private static validateOptions<T>(options: RegisterOptions<T> | undefined): RegisterOptions<any> {
        const schema = Joi.object({
            singleton: Joi.boolean(),
            lazy: Joi.boolean().optional().when('singleton', {is: false, then: Joi.forbidden()}),
            factory: Joi.function().optional(),
            hooks: Joi.object({
                onCreate: Joi.function().optional(),
                onDestroy: Joi.function().optional()
            }).optional(),
            validate: Joi.function().optional()
        })

        const {error, value} = schema.validate(options)
        if (error) throw error

        return value
    }

    public static resolve<T>(key: InjectableKey, ...args: Array<any>): T {
        const registration = Injector.registry.get(key)

        if (!registration && Injector.isClass(key)) {
            return Injector.instantiatedWithDependencies({value: key}, args)
        }

        if (!registration) {
            throw new Error(`No registration found for key: ${key}`)
        }

        if (!Injector.isClass(registration.value)) {
            return registration.value
        }

        if (registration.singleton && registration.lazy && !registration.instance) {
            if (registration.factory) {
                registration.instance = registration.factory()
            } else {
                registration.instance = Injector.instantiatedWithDependencies(registration, args)
            }
            Injector.registry.set(key, registration)
        }

        if (registration.instance) {
            return registration.instance
        }

        if (registration.factory) {
            return registration.factory()
        }

        return Injector.instantiatedWithDependencies(registration, args)
    }

    private static isClass(value: any): value is Class {
        return typeof value === 'function' && /^\s*class\s+/.test(value.toString())
    }

    private static instantiatedWithDependencies(registration: Registration, args: Array<any>): any {
        const dependencies = Injector.buildMethodDependencies(registration.value, 'constructor', args)
        const propertiesTypes = Reflect.getMetadata(MetadataKeys.InjectorPropertiesTypes, registration.value) || {}

        Injector.callHook(registration, 'onCreate')
        const instance = new registration.value(...dependencies)
        Object.keys(propertiesTypes).forEach(k => instance[k] = Injector.resolve(propertiesTypes[k]))
        return instance
    }

    public static call(target: any, methodName: string, ...args: Array<any>): () => any {
        if (!(methodName in target)) {
            throw new Error(`The method "${methodName}" does not exist on the provided target.`)
        }

        if (typeof target[methodName] !== 'function') {
            throw new Error(`The property "${methodName}" on the provided target is not a function.`)
        }

        const method = target[methodName]
        const preparedArgs = Injector.buildMethodDependencies(target.constructor, methodName, args)

        return method.apply(target, preparedArgs)
    }

    private static buildMethodDependencies(target: any, property: string, args: Array<any>): Array<any> {
        const dependencies: Array<any> = []
        const methodParameters = (property === 'constructor'
            ? Reflect.getMetadata(MetadataKeys.InjectorMethodsTypes, target)
            : Reflect.getMetadata(MetadataKeys.InjectorMethodsTypes, target, property)) || []
        const listParameters = Reflect.getMetadata(MetadataKeys.InjectorParametersTypes, target, property) || {}

        if (methodParameters.length > 0) {
            methodParameters.map((value: any) => {
                if (Injector.isClass(value)) return dependencies.push(Injector.resolve(value))

                return dependencies.push(args.shift())
            })
        }

        if (Object.keys(listParameters).length > 0) {
            const length = Reflect.getMetadata(MetadataKeys.InjectorParametersNumber, target, property)
            if ((Object.keys(listParameters).length + args.length) !== length)
                throw new Error('The number of arguments provided does not match the number of parameters of the constructor.')

            for (let i = 0; i < length; i++) {
                if (listParameters[i]) {
                    dependencies.push(Injector.resolve(listParameters[i]))
                    continue
                }

                dependencies.push(Injector.resolve(args.shift()))
            }
        }

        return dependencies
    }

    public static unregister(key: InjectableKey): void {
        const registration = Injector.registry.get(key)
        if (!registration) return
        Injector.callHook(registration, 'onDestroy')
        Injector.registry.delete(key)
    }

    private static callHook(registration: Registration, hook: keyof LifecycleHooks): void {
        if (!('hooks' in registration) || !registration.hooks) return

        const {value, instance} = registration
        const hookFn = registration.hooks[hook]
        if (!hookFn) return

        hookFn.call(null, instance || value)
    }

    public static detroy(): void {
        this.registry.forEach((_, key) => Injector.unregister(key))
    }

    public static Injectable(options?: RegisterOptions<Class>, ...args: Array<any>) {
        return (target: Class) => Injector.register(target, target, options, ...args)
    }

    public static Inject(key?: InjectableKey): (...args: Array<any>) => void {
        return (...args: Array<any>): void => {
            const params = args.filter(arg => arg !== undefined)

            if (params.length === 1)
                return Injector.classDecorator.apply(Injector, [key, params[0]])

            if (params.length === 2) {
                if (Injector.isClass(params[0]) && typeof params[1] === 'number')
                    return Injector.parameterDecorator.apply(Injector, [key, params[0], 'constructor', params[1]])

                return Injector.propertyDecorator.apply(Injector, [key, params[0], params[1]])
            }

            if (params.length === 3) {
                if (typeof params[2] !== 'number')
                    return Injector.methodDecorator.apply(Injector, [key, params[0], params[1], params[2]])
                return Injector.parameterDecorator.apply(Injector, [key, params[0], params[1], params[2]])
            }

            throw new Error('Decorators are not valid here!')
        }
    }

    private static classDecorator(key: InjectableKey | undefined, target: Class): void {
        if (key) throw new Error('The Inject decorator cannot be used with a key when applied to a class!')
        if (Reflect.getMetadata(MetadataKeys.InjectorParametersTypes, target, 'constructor'))
            throw new Error('The Inject decorator cannot be used on both parameters and the class itself!')

        const paramtypes = Reflect.getMetadata('design:paramtypes', target) || []

        Reflect.defineMetadata(MetadataKeys.InjectorMethodsTypes, paramtypes, target)
    }

    private static propertyDecorator(key: InjectableKey | undefined, target: Class, propertyKey: string): void {
        const type = Reflect.getMetadata('design:type', target, propertyKey)

        if (!Injector.isClass(type) && !key) throw new Error('The Inject decorator must be used with a key when applied to a property that is not of type class!')
        if (Injector.isClass(type) && key) throw new Error('The Inject decorator cannot be used with a key when applied to a property of type class!')

        const data = Reflect.getMetadata(MetadataKeys.InjectorPropertiesTypes, target.constructor) || {}

        data[propertyKey] = key || type

        Reflect.defineMetadata(MetadataKeys.InjectorPropertiesTypes, data, target.constructor)
    }

    private static methodDecorator(key: InjectableKey | undefined, target: Class, propertyKey: string, descriptor: TypedPropertyDescriptor<any>): void {
        if (key) throw new Error('The Inject decorator cannot be used with a key when applied to a method!')
        if (Reflect.getMetadata(MetadataKeys.InjectorParametersTypes, target.constructor, propertyKey))
            throw new Error('The Inject decorator cannot be used on both parameters and the function itself!')

        const paramtypes = Reflect.getMetadata('design:paramtypes', target, propertyKey) || []

        Reflect.defineMetadata(
            MetadataKeys.InjectorMethodsTypes,
            paramtypes,
            target.constructor,
            propertyKey
        )
    }

    private static parameterDecorator(key: InjectableKey | undefined, target: Class, propertyKey: string, parameterIndex: number): void {
        const paramtypes = propertyKey === 'constructor'
            ? Reflect.getMetadata('design:paramtypes', target) || []
            : Reflect.getMetadata('design:paramtypes', target, propertyKey) || []
        const type = paramtypes[parameterIndex]

        if (!Injector.isClass(type) && !key) throw new Error('The Inject decorator must be used with a key when applied to a parameter that is not of type class!')
        if (Injector.isClass(type) && key) throw new Error('The Inject decorator cannot be used with a key when applied to a parameter of type class!')

        const data = Reflect.getMetadata(
            MetadataKeys.InjectorParametersTypes,
            propertyKey === 'constructor' ? target : target.constructor,
            propertyKey
        ) || {}

        data[parameterIndex] = key || type

        Reflect.defineMetadata(
            MetadataKeys.InjectorParametersTypes,
            data,
            propertyKey === 'constructor' ? target : target.constructor,
            propertyKey
        )
        Reflect.defineMetadata(
            MetadataKeys.InjectorParametersNumber,
            paramtypes.length,
            propertyKey === 'constructor' ? target : target.constructor,
            propertyKey
        )
    }

}
